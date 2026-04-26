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
  '/api/ingest/batch'
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

  // ── Organization Resolution ──
  const { nextUrl } = request;
  const organizationId = request.headers.get("x-organization-id");
  const organizationSlug = nextUrl.pathname.split("/")[1];

  const response = NextResponse.next();

  if (organizationId) {
    response.headers.set("x-resolved-organization", organizationId);
  } else if (organizationSlug && !["api", "dashboard", "auth", "sign-in", "sign-up"].includes(organizationSlug)) {
    response.headers.set("x-resolved-slug", organizationSlug);
  }

  return response;
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
