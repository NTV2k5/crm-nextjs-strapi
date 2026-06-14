import { pdf } from '@react-pdf/renderer';
import React from 'react';
import {
  createSePayPayment,
  generateOrderCode,
  PaymentItem,
} from './sepay';
import { sendPaymentRequestEmail, sendInvoiceEmail } from './email';
import { InvoicePDF } from '../../components/invoices/InvoicePDF';
import { strapiFetch, unwrap } from '../strapi';

export interface BillingDetails {
  customerName: string;
  customerEmail: string;
  dealTitle?: string;
  dealId?: string;
  customerId?: string;
  items: PaymentItem[];
  salespersonName?: string;
}

export interface PaymentSession {
  orderCode: string;
  qrImageUrl: string;
  amount: number;
  description: string;
  emailSent: boolean;
  invoiceId: string; // Strapi documentId or numeric id
}

export interface PollingController {
  stop: () => void;
  isRunning: () => boolean;
}

export const BillingWorkflow = {
  /**
   * BƯỚC 1: Tạo QR và gửi email cho khách.
   * - Lưu invoice vào Strapi với status: 'pending'
   * - Gửi email QR cho khách qua Resend
   */
  async initiatePayment(details: BillingDetails): Promise<PaymentSession> {
    const totalAmount = details.items.reduce(
      (acc, item) => acc + item.price * item.quantity,
      0
    );
    const orderCode = generateOrderCode();

    // Tạo QR với description có cả tên thương vụ
    const qrDescription = details.dealTitle
      ? `TT ${orderCode} ${details.dealTitle}`.substring(0, 50)
      : `Thanh toan don hang ${orderCode}`;
    const sePayResult = createSePayPayment(orderCode, totalAmount, qrDescription);

    // Save invoice to Strapi via proxy
    const invoiceRes = await strapiFetch('/invoices', {
      method: 'POST',
      body: JSON.stringify({
        data: {
          orderCode,
          amount: totalAmount,
          description: sePayResult.description,
          customerName: details.customerName,
          customerEmail: details.customerEmail,
          items: details.items,
          status: 'pending',
          // Link relations if available
          deal: details.dealId || undefined,
          customer: details.customerId || undefined,
        },
      }),
    });

    const invoiceData = unwrap<any>(invoiceRes);
    const invoiceId = invoiceData.documentId || invoiceData.id;

    // Gửi email QR cho khách qua secure server API
    const emailResult = await sendPaymentRequestEmail(
      details.customerEmail,
      details.customerName,
      sePayResult.qrImageUrl,
      totalAmount,
      orderCode
    );

    return {
      orderCode,
      qrImageUrl: sePayResult.qrImageUrl,
      amount: totalAmount,
      description: sePayResult.description,
      emailSent: emailResult.success,
      invoiceId: String(invoiceId),
    };
  },

  /**
   * BƯỚC 2: Chờ thanh toán (polling database thay vì SePay API).
   */
  waitForPayment(
    session: PaymentSession,
    onPaid: (tx: any) => void | Promise<void>,
    onTimeout?: () => void
  ): PollingController {
    let running = true;
    let timerId: ReturnType<typeof setInterval> | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    // 10 minutes timeout
    timeoutId = setTimeout(() => {
      if (!running) return;
      running = false;
      if (timerId) clearInterval(timerId);
      console.warn(`[Payment Poll] Timeout for ${session.orderCode}`);
      onTimeout?.();
    }, 10 * 60 * 1000);

    const checkPayment = async () => {
      if (!running) return;
      try {
        // Add cache-busting param to prevent browser/Next.js from serving stale cached response
        const res = await strapiFetch(`/invoices/${session.invoiceId}?_t=${Date.now()}`);
        const invoice = unwrap<any>(res);

        if (invoice && invoice.status === 'paid') {
          running = false;
          if (timeoutId) clearTimeout(timeoutId);
          if (timerId) clearInterval(timerId);
          
          // Construct fake or partial transaction details for callback compatibility
          const fakeTx = {
            id: invoice.sePayTransactionId,
            transferAmount: invoice.paidAmount || invoice.amount,
            referenceCode: invoice.sePayReferenceCode,
            gateway: invoice.sePayGateway,
          };
          await onPaid(fakeTx);
        }
      } catch (err) {
        console.error('[Payment Poll Error in Workflow]', err);
      }
    };

    // Poll every 5 seconds
    timerId = setInterval(checkPayment, 5000);
    // Initial check after 3s
    setTimeout(checkPayment, 3000);

    return {
      stop: () => {
        running = false;
        if (timerId) clearInterval(timerId);
        if (timeoutId) clearTimeout(timeoutId);
      },
      isRunning: () => running,
    };
  },

  /**
   * BƯỚC 3: Tạo PDF invoice và gửi email sau khi thanh toán xong.
   */
  async finalizeInvoice(orderCode: string, details: BillingDetails, sendEmail = false) {
    const invoiceNumber = `INV-${orderCode}`;
    const now = new Date();
    const date = now.toLocaleDateString('vi-VN');
    const dueDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('vi-VN');

    const invoiceItems = details.items.map(item => ({
      description: item.name,
      quantity: item.quantity,
      price: item.price,
    }));

    const blob = await pdf(
      <InvoicePDF
        invoiceNumber={invoiceNumber}
        date={date}
        dueDate={dueDate}
        customerName={details.customerName}
        customerEmail={details.customerEmail}
        dealTitle={details.dealTitle}
        salespersonName={details.salespersonName}
        items={invoiceItems}
        status="PAID"
      />
    ).toBlob();

    let emailSent = false;
    let emailError: string | null = null;
    if (sendEmail) {
      const emailResult = await sendInvoiceEmail(
        details.customerEmail,
        invoiceNumber,
        blob
      );
      emailSent = emailResult.success;
      if (!emailResult.success) {
        emailError = typeof emailResult.error === 'object' 
          ? JSON.stringify(emailResult.error) 
          : String(emailResult.error || 'Unknown error');
      }
    }

    return {
      success: true,
      invoiceNumber,
      pdfBlob: blob,
      emailSent,
      emailError,
    };
  },
};
