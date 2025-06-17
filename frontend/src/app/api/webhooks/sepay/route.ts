import { NextResponse } from 'next/server';

const STRAPI_API_URL = process.env.STRAPI_API_URL || 'http://localhost:1337';
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;
const SEPAY_WEBHOOK_KEY = process.env.SEPAY_WEBHOOK_KEY || 'my-webhook-secret-key';

export async function POST(request: Request) {
  try {
    // 1. Authorize webhook caller
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.split(' ')[1];

    if (!token || token !== SEPAY_WEBHOOK_KEY) {
      console.warn('Unauthorized SePay Webhook attempt.');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse request payload
    const payload = await request.json();
    const {
      id: sePayId,
      gateway,
      transferAmount,
      content,
      referenceCode,
      transactionDate,
    } = payload;

    if (!content || !transferAmount) {
      return NextResponse.json({ error: 'Invalid payload structure' }, { status: 400 });
    }

    console.log(`[SePay Webhook] Received transaction: ${sePayId}, Content: "${content}", Amount: ${transferAmount}`);

    // 3. Extract orderCode (e.g. DHxxxxxx) from transfer description
    const match = content.match(/DH[A-Z0-9]+/i);
    const orderCode = match ? match[0].toUpperCase() : null;

    if (!orderCode) {
      console.warn(`[SePay Webhook] No orderCode found in content: "${content}"`);
      return NextResponse.json({ error: 'No order code in content' }, { status: 200 }); // Return 200 to acknowledge SePay
    }

    // 4. Find the Invoice in Strapi using the orderCode
    // We query Strapi with the Admin Token (BFF server privilege)
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (STRAPI_API_TOKEN) {
      headers['Authorization'] = `Bearer ${STRAPI_API_TOKEN}`;
    }

    const invoicesRes = await fetch(
      `${STRAPI_API_URL}/api/invoices?filters[orderCode][$eq]=${orderCode}&populate=*`,
      { headers }
    );

    if (!invoicesRes.ok) {
      console.error(`[SePay Webhook] Failed to fetch invoice from Strapi. Status: ${invoicesRes.status}`);
      return NextResponse.json({ error: 'Strapi connection error' }, { status: 500 });
    }

    const invoicesData = await invoicesRes.json();
    const invoiceList = invoicesData.data || [];

    if (invoiceList.length === 0) {
      console.warn(`[SePay Webhook] No invoice found for orderCode: ${orderCode}`);
      return NextResponse.json({ error: 'Invoice not found' }, { status: 200 });
    }

    const invoice = invoiceList[0];
    const invoiceDocId = invoice.documentId || invoice.id;

    if (invoice.status === 'paid') {
      console.log(`[SePay Webhook] Invoice ${orderCode} was already marked as paid.`);
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

    console.log(`[SePay Webhook] Invoice ${orderCode} successfully marked as PAID.`);

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
      } else {
        console.error(`[SePay Webhook] Failed to update deal ${dealDocId} stage.`);
      }
    }

    return NextResponse.json({ success: true, message: 'Payment processed successfully' });
  } catch (error: any) {
    console.error('[SePay Webhook] Error processing payment:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
function verifySignature(body: string, signature: string, secret: string): boolean {
  const hash = crypto.createHmac("sha256", secret).update(body).digest("hex");
  return hash === signature;
}
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-sepay-signature") ?? "";
  if (!verifySignature(rawBody, signature, process.env.SEPAY_WEBHOOK_SECRET ?? "")) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }
  const payload = JSON.parse(rawBody);
  const { transferAmount, transferContent, id } = payload;
  if (!transferAmount || !transferContent) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  const invoiceCode = (transferContent as string).match(/INV-\d+/)?.[0];
  if (invoiceCode) {
    await fetch(process.env.STRAPI_URL + "/api/invoices/by-code/" + invoiceCode, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + process.env.STRAPI_API_TOKEN },
      body: JSON.stringify({ data: { paidAmount: transferAmount, status: "paid", sepayTransactionId: id } }),
    });
  }
  return NextResponse.json({ success: true });
}

// refactor: signature verification extracted to shared crypto utility
