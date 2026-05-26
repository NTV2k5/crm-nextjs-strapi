import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const STRAPI_API_URL = process.env.STRAPI_API_URL || 'http://localhost:1337';

async function handleProxy(request: Request) {
  try {
    const url = new URL(request.url);
    const { pathname, search } = url;
    
    // Strip "/api/strapi" prefix
    const strapiPath = pathname.replace(/^\/api\/strapi/, '');
    
    // Build target URL
    const targetUrl = `${STRAPI_API_URL}/api${strapiPath}${search}`;
    
    // Get JWT from HttpOnly cookie
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    const requestHeaders = new Headers();
    
    // Forward relevant headers
    request.headers.forEach((value, key) => {
      // Exclude host and cookies to avoid proxy collision
      if (
        key.toLowerCase() !== 'host' &&
        key.toLowerCase() !== 'cookie' &&
        key.toLowerCase() !== 'connection'
      ) {
        requestHeaders.set(key, value);
      }
    });

    // Inject JWT authorization if present
    if (token) {
      requestHeaders.set('Authorization', `Bearer ${token}`);
    }

    // Determine if request has body
    let body: any = null;
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      try {
        body = await request.blob();
      } catch (e) {
        // No body
      }
    }

    const strapiRes = await fetch(targetUrl, {
      method: request.method,
      headers: requestHeaders,
      body,
      // Disable default next caching to ensure fresh CRM data
      cache: 'no-store',
    });

    const contentType = strapiRes.headers.get('content-type');
    let responseData;
    
    if (contentType && contentType.includes('application/json')) {
      responseData = await strapiRes.json();
      return NextResponse.json(responseData, { status: strapiRes.status });
    } else {
      responseData = await strapiRes.blob();
      const responseHeaders = new Headers();
      if (contentType) responseHeaders.set('Content-Type', contentType);
      return new NextResponse(responseData, {
        status: strapiRes.status,
        headers: responseHeaders,
      });
    }
  } catch (error: any) {
    console.error('API Proxy error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal proxy error' },
      { status: 500 }
    );
  }
}

export {
  handleProxy as GET,
  handleProxy as POST,
  handleProxy as PUT,
  handleProxy as DELETE,
  handleProxy as PATCH,
};
