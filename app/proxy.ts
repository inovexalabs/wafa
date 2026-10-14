import { NextResponse, type NextRequest } from "next/server";

// The API sets these httpOnly cookies on this origin (via the /api rewrite).
const SESSION_COOKIES = ["wafa_access_token", "wafa_refresh_token"];

/**
 * Optimistic gate for the role dashboards: a browser with no session cookie
 * is sent to sign-in before any dashboard HTML or JavaScript is served. This
 * is not the authorization check — every API route verifies the session and
 * role itself — it just keeps the private screens hidden from visitors.
 */
export function proxy(request: NextRequest) {
  if (SESSION_COOKIES.some((name) => request.cookies.has(name))) return NextResponse.next();
  return NextResponse.redirect(new URL("/", request.url));
}

export const config = {
  matcher: ["/superadmin/:path*", "/admin/:path*", "/accountant/:path*", "/member/:path*"],
};
