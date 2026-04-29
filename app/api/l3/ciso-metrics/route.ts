import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";
import { getCISOMetrics } from "@/lib/l3/cisoMetrics";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: Request) {
  const { userId, orgId: authOrgId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const organizationId = searchParams.get("organizationId") || authOrgId;
  const days = parseInt(searchParams.get("days") || "30");

  if (!organizationId) return NextResponse.json({ error: "organizationId required" }, { status: 400 });

  try {
    const supabase = await createClient();
    const metrics = await getCISOMetrics(supabase, organizationId, days);

    return NextResponse.json(metrics);
  } catch (error) {
    console.error("[api] CISO metrics error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
