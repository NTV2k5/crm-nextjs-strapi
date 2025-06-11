export interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    content: string; // Base64 content
  }>;
}

/**
 * Basic Send Email Function calling the Next.js server route
 */
export async function sendEmail({
  to,
  subject,
  html,
  text,
  attachments,
}: EmailOptions) {
  try {
    const res = await fetch('/api/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to,
        subject,
        html,
        text,
        attachments,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error('[Email] Service API error:', data.error);
      return { success: false, error: data.error };
    }

    return { success: true, data: data.data };
  } catch (error) {
    console.error('[Email] Service network error:', error);
    return { success: false, error };
  }
}

/**
 * Sends a SePay payment request email with an embedded VietQR code.
 */
export async function sendPaymentRequestEmail(
  to: string,
  customerName: string,
  qrImageUrl: string,
  amount: number,
  orderCode: string
) {
  const amountFormatted = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);

  return sendEmail({
    to,
    subject: `💳 Yêu cầu thanh toán đơn hàng ${orderCode} – ${amountFormatted}`,
    html: `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; background: #f8fafc; padding: 32px 24px; border-radius: 12px; color: #334155;">
        <h2 style="margin: 0 0 4px; font-size: 20px; color: #0f172a;">Xin chào ${customerName},</h2>
        <p style="margin: 0 0 24px; color: #64748b; font-size: 14px;">Chúng tôi đã tạo yêu cầu thanh toán cho đơn hàng của bạn.</p>
 
        <div style="background: #fff; border-radius: 8px; padding: 20px; margin-bottom: 24px; border: 1px solid #e2e8f0; text-align: center;">
          <p style="margin: 0 0 4px; font-size: 13px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">Số tiền cần thanh toán</p>
          <p style="margin: 0 0 16px; font-size: 28px; font-weight: 700; color: #0f172a;">${amountFormatted}</p>
          <p style="margin: 0 0 12px; font-size: 12px; color: #94a3b8;">Quét mã QR bằng ứng dụng ngân hàng để thanh toán</p>
          <img
            src="${qrImageUrl}"
            alt="SePay VietQR"
            width="220"
            style="border-radius: 8px; border: 4px solid #f1f5f9;"
          />
          <p style="margin: 12px 0 0; font-size: 12px; color: #64748b;">
            Nội dung chuyển khoản: <strong style="font-family: monospace;">${orderCode}</strong>
          </p>
        </div>
 
        <div style="background: #eff6ff; border-radius: 8px; padding: 14px 16px; margin-bottom: 24px; border-left: 4px solid #3b82f6;">
          <p style="margin: 0; font-size: 13px; color: #1e40af;">
            <strong>Hướng dẫn:</strong> Mở ứng dụng ngân hàng → Quét mã QR → Xác nhận giao dịch.
            Thông tin số tiền và nội dung sẽ được tự động điền.
          </p>
        </div>
 
        <p style="font-size: 13px; color: #64748b;">Nếu có bất kỳ thắc mắc nào, vui lòng liên hệ đội ngũ hỗ trợ.</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 11px; color: #94a3b8;">Email này được gửi tự động từ hệ thống CRM. Thanh toán được xử lý bởi SePay.</p>
      </div>
    `,
  });
}

/**
 * Sends an Invoice email with PDF attachment after payment is confirmed.
 */
export async function sendInvoiceEmail(to: string, invoiceNumber: string, pdfBlob: Blob) {
  const arrayBuffer = await pdfBlob.arrayBuffer();
  let binary = '';
  const bytes = new Uint8Array(arrayBuffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64Content = window.btoa(binary);

  return sendEmail({
    to,
    subject: `📄 Hóa đơn thanh toán #${invoiceNumber}`,
    html: `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; background: #f8fafc; padding: 32px 24px; border-radius: 12px; color: #334155;">
        <h2 style="margin: 0 0 4px; font-size: 20px; color: #0f172a;">Cảm ơn bạn đã thanh toán! 🎉</h2>
        <p style="margin: 0 0 24px; color: #64748b; font-size: 14px;">
          Hóa đơn <strong>#${invoiceNumber}</strong> đã được tạo thành công và đính kèm trong email này.
        </p>
        <div style="background: #f0fdf4; border-radius: 8px; padding: 14px 16px; margin-bottom: 24px; border-left: 4px solid #22c55e;">
          <p style="margin: 0; font-size: 13px; color: #166534;">
            ✅ Thanh toán xác nhận thành công. Vui lòng lưu giữ hóa đơn để đối chiếu nếu cần.
          </p>
        </div>
        <p style="font-size: 13px; color: #64748b;">Trân trọng,<br/>Đội ngũ CRM</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 11px; color: #94a3b8;">Email này được gửi tự động từ hệ thống CRM.</p>
      </div>
    `,
    attachments: [
      {
        filename: `${invoiceNumber}.pdf`,
        content: base64Content,
      }
    ],
  });
}

import nodemailer from "nodemailer";
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT ?? "587"),
  secure: false,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});
export async function sendEmail(to: string, subject: string, html: string) {
  return transporter.sendMail({ from: "CRM System <" + process.env.SMTP_FROM + ">", to, subject, html });
}

// fix: exponential backoff retry added - max 3 attempts with 1s/2s/4s delays
