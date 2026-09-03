import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIES = [
  "better-auth.session_token",
  "__Secure-better-auth.session_token",
];

export function proxy(request: NextRequest) {
  const hasSessionCookie = SESSION_COOKIES.some((name) =>
    request.cookies.has(name),
  );
  const { pathname } = request.nextUrl;

  if (
    (pathname.startsWith("/account") ||
      pathname.startsWith("/admin") ||
      pathname.startsWith("/dashboard") ||
      pathname.startsWith("/notifications")) &&
    !hasSessionCookie
  ) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if ((pathname === "/login" || pathname === "/register") && hasSessionCookie) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/account/:path*",
    "/admin/:path*",
    "/dashboard/:path*",
    "/languages/:path*",
    "/learn",
    "/notifications/:path*",
    "/login",
    "/register",
  ],
};
