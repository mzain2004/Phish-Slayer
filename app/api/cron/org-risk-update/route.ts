import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { calculateOrgRisk } from "@/lib/l3/orgRiskScore";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: orgs } = await supabase.from("organizations").select("id");
    
    if (!orgs) return NextResponse.json({ processed: 0 });

    for (const org of orgs) {
      await calculateOrgRisk(supabase, org.id);
    }

    return NextResponse.json({ processed: orgs.length });
  } catch (error) {
    console.error("[cron] Risk update failed:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
