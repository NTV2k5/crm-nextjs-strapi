import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const STRAPI_API_URL = process.env.STRAPI_API_URL || 'http://localhost:1337';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const jwt = cookieStore.get('token')?.value;

    if (!jwt) {
      return NextResponse.json({ user: null });
    }

    // Fetch user details from Strapi
    const res = await fetch(`${STRAPI_API_URL}/api/users/me?populate=role`, {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      // Token is invalid/expired, clear the cookie
      const response = NextResponse.json({ user: null });
      response.cookies.delete('token');
      return response;
    }

    const userData = await res.json();
    const roleType = userData.role?.type || 'sales';

    return NextResponse.json({
      user: {
        id: userData.id,
        username: userData.username,
        email: userData.email,
        name: userData.name || userData.username,
        role: roleType,
      },
    });
  } catch (error) {
    console.error('Check auth session error:', error);
    return NextResponse.json({ user: null });
  }
}
