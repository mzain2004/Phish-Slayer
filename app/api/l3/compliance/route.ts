import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";
import { getCompliancePosture } from "@/lib/l3/complianceMapper";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: Request) {
  const { userId, orgId: authOrgId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const organizationId = searchParams.get("organizationId") || authOrgId;
  const framework = searchParams.get("framework") || "NIST CSF";

  if (!organizationId) return NextResponse.json({ error: "organizationId required" }, { status: 400 });

  try {
    const supabase = await createClient();
    const report = await getCompliancePosture(supabase, organizationId, framework);

    return NextResponse.json(report);
  } catch (error) {
    console.error("[api] Compliance error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
