import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const STRAPI_API_URL = process.env.STRAPI_API_URL || 'http://localhost:1337';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const accessToken = searchParams.get('access_token');

    if (!accessToken) {
      console.error('No access token in callback URL');
      return NextResponse.redirect(new URL('/login?error=OAuthFailed', request.url));
    }

    // Fetch full user object with populated role to get access control roles
    const userMeRes = await fetch(`${STRAPI_API_URL}/api/users/me?populate=role`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!userMeRes.ok) {
      console.error('Failed to retrieve user profile with Strapi token');
      return NextResponse.redirect(new URL('/login?error=OAuthFailed', request.url));
    }

    const userMeData = await userMeRes.json();

    const cookieStore = await cookies();
    cookieStore.set('token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return NextResponse.redirect(new URL('/', request.url));
  } catch (error) {
    console.error('Google callback error:', error);
    return NextResponse.redirect(new URL('/login?error=OAuthFailed', request.url));
  }
}
