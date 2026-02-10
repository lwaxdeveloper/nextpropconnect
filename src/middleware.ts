import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check for the session cookie (Auth.js v5 uses __Secure-authjs.session-token)
  const sessionToken = request.cookies.get("__Secure-authjs.session-token")?.value ||
    request.cookies.get("authjs.session-token")?.value;
  
  const isLoggedIn = !!sessionToken;

  // Protected routes - require login
  const protectedPaths = [
    "/dashboard",
    "/properties/new",
    "/messages",
    "/notifications",
    "/agent",
    "/admin",
  ];

  const isProtected = protectedPaths.some((path) => pathname.startsWith(path)) ||
    pathname.match(/^\/properties\/\d+\/edit$/);

  if (isProtected && !isLoggedIn) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // For role-based checks, we'll let the page components handle it
  // since we can't decode JWT in edge runtime without crypto
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/agent/:path*",
    "/properties/new",
    "/properties/:id/edit",
    "/messages/:path*",
    "/notifications/:path*",
  ],
};
