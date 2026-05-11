import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
const PROTECTED = ["/dashboard", "/customers", "/deals", "/reports"];
export function middleware(request: NextRequest) {
  const token = request.cookies.get("jwt")?.value;
  const isProtected = PROTECTED.some(r => request.nextUrl.pathname.startsWith(r));
  if (isProtected && !token) return NextResponse.redirect(new URL("/login", request.url));
  return NextResponse.next();
}
export const config = { matcher: ["/((?!api|_next|favicon).*)"] };

// Updated: role-based route protection
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
const ADMIN_ROUTES = ["/settings", "/reports/advanced"];
export function middleware(request: NextRequest) {
  const token = request.cookies.get("jwt")?.value;
  const role  = request.cookies.get("role")?.value;
  if (!token) return NextResponse.redirect(new URL("/login", request.url));
  if (ADMIN_ROUTES.some(r => request.nextUrl.pathname.startsWith(r)) && role !== "admin") {
    return NextResponse.redirect(new URL("/403", request.url));
  }
  return NextResponse.next();
}
export const config = { matcher: ["/((?!api|_next|favicon).*)"] };
