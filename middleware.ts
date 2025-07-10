import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export async function middleware(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);
  const { pathname } = request.nextUrl;

  // /api/payments/webhooks is a webhook endpoint that should be accessible without authentication
  if (pathname.startsWith("/api/payments/webhooks")) {
    return NextResponse.next();
  }

  // Redirect old sign-in paths to new login paths
  if (pathname === "/sign-in") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (pathname === "/sign-up") {
    return NextResponse.redirect(new URL("/signup", request.url));
  }

  if (sessionCookie && ["/login", "/signup"].includes(pathname)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (!sessionCookie && (pathname.startsWith("/dashboard") || pathname.startsWith("/admin") || pathname.startsWith("/dashboard/agency") || pathname.startsWith("/dashboard/client"))) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/dashboard/agency/:path*", "/dashboard/client/:path*", "/sign-in", "/sign-up", "/login", "/signup"],
};
