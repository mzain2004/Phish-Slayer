import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { calculateCoverage } from "@/lib/mitre/coverage-engine";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("Authorization") || request.headers.get("x-cron-secret");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && authHeader !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getAdminClient();

  try {
    // 1. Get all organizations
    const { data: orgs } = await supabase.from('organizations').select('id');
    if (!orgs) return NextResponse.json({ success: true, processed: 0 });

    let processed = 0;

    // 2. Calculate and cache coverage score per org
    for (const org of orgs) {
      const report = await calculateCoverage(org.id);
      
      await supabase.from('organizations')
        .update({ mitre_coverage_score: report })
        .eq('id', org.id);
        
      processed++;
    }

    return NextResponse.json({ success: true, processed });
  } catch (error: any) {
    console.error("[CRON MITRE Coverage] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
