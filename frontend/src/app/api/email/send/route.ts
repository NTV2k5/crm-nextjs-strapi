import { NextResponse } from 'next/server';

const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const EMAIL_FROM = process.env.NEXT_PUBLIC_EMAIL_FROM || 'CRM Team <onboarding@resend.dev>';

export async function POST(request: Request) {
  try {
    const { to, subject, html, text, attachments } = await request.json();

    if (!RESEND_API_KEY) {
      console.warn('[Email Webhook] RESEND_API_KEY is not defined.');
      return NextResponse.json({ error: 'Resend API key missing' }, { status: 500 });
    }

    if (!to || !subject) {
      return NextResponse.json({ error: 'Recipient and subject are required' }, { status: 400 });
    }

    const payload = {
      from: EMAIL_FROM,
      to: Array.isArray(to) ? to : [to],
      subject,
      html: html || '',
      text: text || '',
      attachments: attachments || [],
    };

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error('[Email API] Resend API error:', data);
      return NextResponse.json({ error: data }, { status: res.status });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('[Email API] Failed to send email:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
