import { NextResponse } from 'next/server';
import crypto from 'crypto';
import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import { InvoicePDF } from '@/components/invoices/InvoicePDF';

const STRAPI_API_URL = process.env.STRAPI_API_URL || 'http://localhost:1337';
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;
const SEPAY_WEBHOOK_KEY = process.env.SEPAY_WEBHOOK_KEY || 'my-webhook-secret-key';

interface SePayPayload {
  id: number;
  gateway: string;
  transferAmount: number;
  content: string;
  referenceCode: string;
  transactionDate: string;
  accountNumber: string;
  subAccount: string;
  code: string;
  transferType: string;
  description: string;
  accumulated: number;
}

export async function POST(request: Request) {
  try {
    // 1. Read the raw body to verify HMAC-SHA256
    const rawBody = await request.text();

    // 2. Verify HMAC-SHA256 signature from SePay
    // SePay signing: HMAC-SHA256(timestamp + '.' + body, secret_key)
    const signatureHeader = request.headers.get('X-SePay-Signature'); // format: sha256=xxxxx
    const timestamp = request.headers.get('X-SePay-Timestamp') || '';

    if (signatureHeader) {
      const signingInput = timestamp + '.' + rawBody;
      const expectedSig = 'sha256=' + crypto
        .createHmac('sha256', SEPAY_WEBHOOK_KEY)
        .update(signingInput)
        .digest('hex');
      if (signatureHeader !== expectedSig) {
        console.warn('[SePay Webhook] Invalid HMAC-SHA256 signature.');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    } else {
      console.warn('[SePay Webhook] Missing X-SePay-Signature header.');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse JSON from rawBody
    let payload: unknown;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    // 3. Extract fields from payload
    const {
      id: sePayId,
      gateway,
      transferAmount,
      content,
      referenceCode,
      transactionDate,
    } = payload as SePayPayload;

    if (!transferAmount) {
      return NextResponse.json({ error: 'Invalid payload structure' }, { status: 400 });
    }

    console.log(`[SePay Webhook] Received: id=${sePayId}, content="${content}", amount=${transferAmount}`);

    // 3. Extract orderCode (e.g. DHxxxxxx) from transfer description
    const match = content.match(/DH[A-Z0-9]+/i);
    const orderCode = match ? match[0].toUpperCase() : null;

    console.log(`[SePay Webhook] Extracted orderCode: ${orderCode || '(none - indirect payment e.g. ZaloPay/Momo)'}`);

    // 4. Find the Invoice in Strapi
    // Query Strapi with the Admin Token (BFF server privilege)
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (STRAPI_API_TOKEN) {
      headers['Authorization'] = `Bearer ${STRAPI_API_TOKEN}`;
    }

    let invoice: any = null;
    let invoiceDocId: string = '';

    // Strategy A: Match by orderCode in content (direct bank transfer)
    if (orderCode) {
      const invoicesRes = await fetch(
        `${STRAPI_API_URL}/api/invoices?filters[orderCode][$eq]=${orderCode}&populate[customer]=*&populate[deal][populate][assignedTo]=*`,
        { headers }
      );

      if (!invoicesRes.ok) {
        console.error(`[SePay Webhook] Failed to fetch invoice from Strapi. Status: ${invoicesRes.status}`);
        return NextResponse.json({ error: 'Strapi connection error' }, { status: 500 });
      }

      const invoicesData = await invoicesRes.json();
      const invoiceList = invoicesData.data || [];
      if (invoiceList.length > 0) {
        invoice = invoiceList[0];
        invoiceDocId = invoice.documentId || invoice.id;
      }
    }

    // Strategy B: Fallback for indirect payments (ZaloPay, Momo, etc.)
    // Match by amount + pending status + created within last 24h
    if (!invoice) {
      console.log(`[SePay Webhook] No direct orderCode match. Trying fallback: amount=${transferAmount}, status=pending`);
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const fallbackUrl = `${STRAPI_API_URL}/api/invoices?filters[status][$eq]=pending&filters[amount][$eq]=${transferAmount}&filters[createdAt][$gte]=${twentyFourHoursAgo}&populate[customer]=*&populate[deal][populate][assignedTo]=*&sort=createdAt:desc&pagination[limit]=1`;
      
      const fallbackRes = await fetch(fallbackUrl, { headers });

      if (!fallbackRes.ok) {
        console.error(`[SePay Webhook] Fallback query failed. Status: ${fallbackRes.status}`);
        return NextResponse.json({ error: 'Strapi connection error' }, { status: 500 });
      }

      const fallbackData = await fallbackRes.json();
      const fallbackList = fallbackData.data || [];
      if (fallbackList.length > 0) {
        invoice = fallbackList[0];
        invoiceDocId = invoice.documentId || invoice.id;
        console.log(`[SePay Webhook] Fallback matched invoice: orderCode=${invoice.orderCode}, amount=${transferAmount}`);
      }
    }

    if (!invoice) {
      console.warn(`[SePay Webhook] No invoice found. content="${content}", amount=${transferAmount}`);
      return NextResponse.json({ error: 'Invoice not found' }, { status: 200 }); // 200 to acknowledge SePay
    }

    if (invoice.status === 'paid') {
      console.log(`[SePay Webhook] Invoice ${invoice.orderCode} was already marked as paid.`);
      return NextResponse.json({ success: true, message: 'Already paid' });
    }

    // 5. Update Invoice status to 'paid' in Strapi
    const updateInvoiceRes = await fetch(`${STRAPI_API_URL}/api/invoices/${invoiceDocId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        data: {
          status: 'paid',
          paidAt: new Date().toISOString(),
          sePayTransactionId: String(sePayId),
          sePayReferenceCode: referenceCode,
          sePayGateway: gateway,
          paidAmount: Number(transferAmount),
        },
      }),
    });

    if (!updateInvoiceRes.ok) {
      console.error(`[SePay Webhook] Failed to update invoice status in Strapi.`);
      return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 });
    }

    console.log(`[SePay Webhook] Invoice ${invoice.orderCode} successfully marked as PAID.`);

    // 6. If invoice has an associated deal, update the deal's stage to 'closed'
    // Since we populated relations, we can check if invoice.deal exists
    const deal = invoice.deal;
    if (deal) {
      const dealDocId = deal.documentId || deal.id;
      const updateDealRes = await fetch(`${STRAPI_API_URL}/api/deals/${dealDocId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          data: {
            stage: 'closed',
          },
        }),
      });

      if (updateDealRes.ok) {
        console.log(`[SePay Webhook] Associated deal ${dealDocId} stage updated to 'closed'.`);

        // Create Contract automatically
        const randStr = Math.random().toString(36).substring(2, 6).toUpperCase();
        const contractNumber = `HĐ-${new Date().getFullYear()}-${randStr}`;
        const contractData = {
          contractNumber,
          customer: deal.customer?.documentId || invoice.customer?.documentId || null,
          deal: dealDocId,
          status: 'draft',
          value: deal.value || invoice.amount || 0,
          content: `Hợp đồng tự động tạo từ thương vụ: ${deal.title || 'Không rõ'}`,
          assignedTo: deal.assignedTo?.documentId || null,
        };

        const createContractRes = await fetch(`${STRAPI_API_URL}/api/contracts`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ data: contractData }),
        });

        if (createContractRes.ok) {
          console.log(`[SePay Webhook] Contract ${contractNumber} created successfully.`);
        } else {
          console.error(`[SePay Webhook] Failed to create contract.`);
        }
      } else {
        console.error(`[SePay Webhook] Failed to update deal ${dealDocId} stage.`);
      }
    }

    // 7. Generate PDF and Send Email
    try {
      if (invoice.customerEmail && process.env.RESEND_API_KEY) {
        const invoiceNumber = `INV-${orderCode}`;
        const now = new Date();
        const date = now.toLocaleDateString('vi-VN');
        const dueDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('vi-VN');
        
        // Parse items from invoice if available, else generic
        let invoiceItems = invoice.items;
        if (!Array.isArray(invoiceItems)) {
          invoiceItems = [{
            description: invoice.description || 'Thanh toán đơn hàng',
            quantity: 1,
            price: invoice.amount || transferAmount,
          }];
        } else {
          invoiceItems = invoiceItems.map((item: any) => ({
            description: item.name || item.description || 'Sản phẩm/Dịch vụ',
            quantity: item.quantity || 1,
            price: item.price || 0,
          }));
        }

        const salespersonName = deal?.assignedTo?.name || deal?.assignedTo?.username || '';

        const pdfBuffer = await renderToBuffer(
          React.createElement(InvoicePDF, {
            invoiceNumber: invoiceNumber,
            date: date,
            dueDate: dueDate,
            customerName: invoice.customerName || 'Khách hàng',
            customerEmail: invoice.customerEmail,
            dealTitle: deal?.title || invoice.description,
            salespersonName: salespersonName,
            items: invoiceItems,
            status: "PAID"
          }) as any
        );

        const base64Pdf = pdfBuffer.toString('base64');
        const emailFrom = process.env.NEXT_PUBLIC_EMAIL_FROM || 'CRM Team <onboarding@resend.dev>';

        const resendRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: emailFrom,
            to: invoice.customerEmail,
            subject: `Hóa đơn thanh toán #${invoiceNumber}`,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #10b981;">Cảm ơn bạn đã thanh toán! 🎉</h2>
                <p>Hóa đơn <strong>#${invoiceNumber}</strong> đã được thanh toán thành công và đính kèm trong email này.</p>
                <div style="background-color: #ecfdf5; padding: 16px; border-radius: 8px; border-left: 4px solid #10b981; margin: 20px 0;">
                  <p style="margin: 0; color: #065f46;">✅ Giao dịch đã được xác nhận tự động qua hệ thống SePay VietQR.</p>
                </div>
                <p>Trân trọng,<br>Đội ngũ CRM</p>
                <hr style="border: none; border-top: 1px solid #eaeaea; margin-top: 40px;">
                <p style="font-size: 12px; color: #888;">Email này được gửi tự động từ hệ thống CRM.</p>
              </div>
            `,
            attachments: [
              {
                filename: `${invoiceNumber}.pdf`,
                content: base64Pdf,
              }
            ]
          })
        });

        if (resendRes.ok) {
          console.log(`[SePay Webhook] Email sent successfully to ${invoice.customerEmail}`);
        } else {
          const errData = await resendRes.text();
          console.error(`[SePay Webhook] Failed to send email via Resend:`, errData);
        }
      }
    } catch (pdfErr) {
      console.error(`[SePay Webhook] Error generating PDF or sending email:`, pdfErr);
    }

    return NextResponse.json({ success: true, message: 'Payment processed successfully' });
  } catch (error: any) {
    console.error('[SePay Webhook] Error processing payment:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
