import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher(["/dashboard(.*)", "/api/(.*)"]);
const isPublicRoute = createRouteMatcher([
  '/', 
  '/sign-in', 
  '/sign-up', 
  '/api/webhooks/clerk', 
  '/api/webhooks/polar', 
  '/api/billing/webhook',
  '/api/connectors/wazuh',
  '/api/ingest', 
  '/api/ingest/batch',
  '/api/health'
]);
const isAuthRoute = createRouteMatcher(['/sign-in(.*)', '/sign-up(.*)']);

export default clerkMiddleware(async (auth, request) => {
  const { userId } = await auth();

  if (userId && isAuthRoute(request)) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  if (isProtectedRoute(request) && !isPublicRoute(request)) {
    await auth.protect({
      unauthenticatedUrl: 'https://phishslayer.tech/sign-in',
    });
  }

  // ── Organization resolution moved to per-request session context only. Do not passthrough headers.
  const { nextUrl } = request;
  // No x-resolved headers added here; routes should resolve from session/auth context only.
  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
