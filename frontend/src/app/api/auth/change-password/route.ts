import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const STRAPI_API_URL = process.env.STRAPI_API_URL || 'http://localhost:1337';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const jwt = cookieStore.get('token')?.value;

    if (!jwt) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { currentPassword, password, passwordConfirmation } = await request.json();

    if (!currentPassword || !password || !passwordConfirmation) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    const strapiRes = await fetch(`${STRAPI_API_URL}/api/auth/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${jwt}`,
      },
      body: JSON.stringify({
        currentPassword,
        password,
        passwordConfirmation,
      }),
    });

    const strapiData = await strapiRes.json();

    if (!strapiRes.ok) {
      return NextResponse.json(
        { error: strapiData.error?.message || 'Change password failed' },
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
