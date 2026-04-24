import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher(["/dashboard(.*)"]);

export default clerkMiddleware(async (auth, request) => {
  if (isProtectedRoute(request)) {
    await auth.protect();
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
