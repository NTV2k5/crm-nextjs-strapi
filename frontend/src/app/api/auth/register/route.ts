import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const STRAPI_API_URL = process.env.STRAPI_API_URL || 'http://localhost:1337';
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;

export async function POST(request: Request) {
  try {
    const { name, email, password, role } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    const targetRole = role || 'sales'; // Default to sales

    // 1. Register with Strapi native API (username maps to email)
    const registerRes = await fetch(`${STRAPI_API_URL}/api/auth/local/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: email,
        email,
        password,
        name, // Custom field if added, otherwise will just register
      }),
    });

    const registerData = await registerRes.json();

    if (!registerRes.ok) {
      return NextResponse.json(
        { error: registerData.error?.message || 'Registration failed' },
        { status: registerRes.status }
      );
    }

    const { jwt, user: registeredUser } = registerData;

    // 2. Assign the requested role in Strapi using the Admin API Token (BFF Server privilege)
    let finalRoleType = 'authenticated';
    if (STRAPI_API_TOKEN) {
      try {
        // Fetch all roles to map role type name (e.g. 'sales') to role ID
        const rolesRes = await fetch(`${STRAPI_API_URL}/api/users-permissions/roles`, {
          headers: {
            Authorization: `Bearer ${STRAPI_API_TOKEN}`,
          },
        });
        
        if (rolesRes.ok) {
          const rolesData = await rolesRes.json();
          // Strapi 5 roles return inside 'roles' array
          const rolesList = rolesData.roles || [];
          const matchedRole = rolesList.find((r: any) => r.type === targetRole);
          
          if (matchedRole) {
            // Update the user's role, name, and confirmed=true
            const updateRes = await fetch(`${STRAPI_API_URL}/api/users/${registeredUser.id}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${STRAPI_API_TOKEN}`,
              },
              body: JSON.stringify({
                role: matchedRole.id,
                name: name,
                confirmed: true, // Auto-confirm so user can log in immediately
              }),
            });

            if (updateRes.ok) {
              finalRoleType = matchedRole.type;
            }
          } else {
            // Even if role not found, still confirm the user
            await fetch(`${STRAPI_API_URL}/api/users/${registeredUser.id}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${STRAPI_API_TOKEN}`,
              },
              body: JSON.stringify({ name, confirmed: true }),
            });
          }
        }
      } catch (roleError) {
        console.error('Error assigning role via Strapi Admin API:', roleError);
      }
    }

    // 3. Set the secure HttpOnly cookie
    const cookieStore = await cookies();
    cookieStore.set('token', jwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return NextResponse.json({
      user: {
        id: registeredUser.id,
        username: registeredUser.username,
        email: registeredUser.email,
        name: name,
        role: finalRoleType,
      },
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
export async function POST(req: NextRequest) {
  const body = await req.json();
  const res = await fetch(process.env.STRAPI_URL + "/api/auth/local/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
