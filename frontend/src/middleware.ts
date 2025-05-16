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
