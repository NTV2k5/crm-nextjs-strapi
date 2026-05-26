import { NextResponse } from 'next/server';

const STRAPI_API_URL = process.env.STRAPI_API_URL || 'http://localhost:1337';

export async function POST(request: Request) {
  try {
    const { code, password, passwordConfirmation } = await request.json();

    if (!code || !password || !passwordConfirmation) {
      return NextResponse.json(
        { error: 'Code, password and confirmation are required' },
        { status: 400 }
      );
    }

    const strapiRes = await fetch(`${STRAPI_API_URL}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        password,
        passwordConfirmation,
      }),
    });

    const strapiData = await strapiRes.json();

    if (!strapiRes.ok) {
      return NextResponse.json(
        { error: strapiData.error?.message || 'Password reset failed' },
        { status: strapiRes.status }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
