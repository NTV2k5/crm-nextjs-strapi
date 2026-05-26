const STRAPI_API_URL = process.env.STRAPI_API_URL || 'http://localhost:1337';

export async function strapiFetch(path: string, options: RequestInit = {}) {
  const isServer = typeof window === 'undefined';
  let url = '';
  const headers = new Headers(options.headers);

  if (isServer) {
    url = `${STRAPI_API_URL}/api${path}`;
    try {
      // Dynamically import next/headers to prevent bundling issues on the client side
      const { cookies } = await import('next/headers');
      const cookieStore = await cookies();
      const token = cookieStore.get('token')?.value;
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
    } catch (e) {
      // Suppress cookie errors during build-time rendering
    }
  } else {
    url = `/api/strapi${path}`;
  }

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Request failed with status: ${res.status}`);
  }

  return res.json();
}

/**
 * Utility helper to flatten Strapi 5 REST API response data arrays and objects.
 * Since Strapi 5 already flattens attributes, we just strip the "data" wrapper if it is present.
 */
export function unwrap<T>(response: { data: T } | any): T {
  if (response && response.data !== undefined) {
    return response.data;
  }
  return response;
}
