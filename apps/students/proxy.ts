import { getSessionCookie } from "better-auth/cookies";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const AUTH_ROUTES = new Set([
  "/",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
]);

function isDashboardRoute(pathname: string) {
  return pathname === "/dashboard" || pathname.startsWith("/dashboard/");
}

function getSafeCallbackUrl(request: NextRequest) {
  const callbackUrl = request.nextUrl.searchParams.get("callbackUrl");

  if (!callbackUrl) {
    return null;
  }

  if (!callbackUrl.startsWith("/")) {
    return null;
  }

  if (callbackUrl.startsWith("//")) {
    return null;
  }

  return callbackUrl;
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const hasSession = Boolean(getSessionCookie(request));

  if (pathname === "/") {
    if (hasSession) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", "/dashboard");
    return NextResponse.redirect(loginUrl);
  }

  if (!hasSession && isDashboardRoute(pathname)) {
    const callbackUrl = `${pathname}${request.nextUrl.search}`;
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", callbackUrl);

    return NextResponse.redirect(loginUrl);
  }

  if (hasSession && AUTH_ROUTES.has(pathname)) {
    const callbackUrl = getSafeCallbackUrl(request) ?? "/dashboard";
    return NextResponse.redirect(new URL(callbackUrl, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password",
    "/dashboard/:path*",
  ],
};
