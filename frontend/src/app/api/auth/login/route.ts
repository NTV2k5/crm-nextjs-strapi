import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const STRAPI_API_URL = process.env.STRAPI_API_URL || 'http://localhost:1337';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // 1. Authenticate with Strapi native API
    const strapiRes = await fetch(`${STRAPI_API_URL}/api/auth/local`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: email,
        password,
      }),
    });

    const strapiData = await strapiRes.json();

    if (!strapiRes.ok) {
      return NextResponse.json(
        { error: strapiData.error?.message || 'Login failed' },
        { status: strapiRes.status }
      );
    }

    const { jwt, user: rawUser } = strapiData;

    // 2. Fetch full user object with populated role to get access control roles
    const userMeRes = await fetch(`${STRAPI_API_URL}/api/users/me?populate=role`, {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    });

    const userMeData = await userMeRes.json();

    if (!userMeRes.ok) {
      return NextResponse.json(
        { error: 'Failed to retrieve user role information' },
        { status: userMeRes.status }
      );
    }

    // The role type is usually 'admin', 'manager', 'sales' or 'authenticated' in Strapi
    const roleType = userMeData.role?.type || 'sales'; 

    // 3. Set the secure HttpOnly cookie
    const cookieStore = await cookies();
    cookieStore.set('token', jwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    // 4. Return the user metadata with mapped role
    return NextResponse.json({
      user: {
        id: userMeData.id,
        username: userMeData.username,
        email: userMeData.email,
        name: userMeData.name || userMeData.username,
        role: roleType,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
