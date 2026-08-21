import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "better-auth.session_token";

export function proxy(request: NextRequest) {
  const hasSessionCookie = request.cookies.has(SESSION_COOKIE);
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/account") && !hasSessionCookie) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if ((pathname === "/login" || pathname === "/register") && hasSessionCookie) {
    return NextResponse.redirect(new URL("/account", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/account/:path*", "/languages/:path*", "/learn", "/login", "/register"],
};
