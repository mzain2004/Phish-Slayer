import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher(["/dashboard(.*)"]);
const isPublicRoute = createRouteMatcher(['/', '/sign-in', '/sign-up', '/api/webhooks/clerk', '/api/ingest', '/api/ingest/batch']);
const isAuthRoute = createRouteMatcher(['/sign-in(.*)', '/sign-up(.*)']);

export default clerkMiddleware(async (auth, request) => {
  const { userId } = await auth();

  if (userId && isAuthRoute(request)) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  if (isProtectedRoute(request) && !isPublicRoute(request)) {
    await auth.protect({
      unauthenticatedUrl: '/sign-in',
    });
  }

  // ── Tenant Resolution ──
  const { nextUrl } = request;
  const tenantId = request.headers.get("x-tenant-id");
  const tenantSlug = nextUrl.pathname.split("/")[1]; // e.g. /acme-corp/alerts

  const response = NextResponse.next();

  if (tenantId) {
    response.headers.set("x-resolved-tenant", tenantId);
  } else if (tenantSlug && !["api", "dashboard", "auth", "sign-in", "sign-up"].includes(tenantSlug)) {
    response.headers.set("x-resolved-slug", tenantSlug);
  }

  return response;
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
