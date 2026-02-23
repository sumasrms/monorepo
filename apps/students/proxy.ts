import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function proxy(_request: NextRequest) {
  // In a cross-domain setup (frontend on Vercel, backend on Render),
  // the edge middleware cannot easily read the better-auth session cookie.
  // We delegate the authentication API requests and role-checking
  // to the client-side `useRequireAuth` hook and `RoleGuard` wrapper
  // which can securely read the bearer tokens from local storage.
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
