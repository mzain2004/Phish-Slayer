import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { matchAssetsToVulns } from "@/lib/vuln/assetVulnMatcher";
import { verifyCronAuth, unauthorizedResponse } from "@/lib/security/cronAuth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  if (!verifyCronAuth(req)) {
    return unauthorizedResponse();
  }

  try {
    const supabase = await createClient();
    const { data: orgs } = await supabase.from("organizations").select("id");

    const summary = [];
    for (const org of orgs || []) {
      const matches = await matchAssetsToVulns(org.id);
      summary.push({ org: org.id, found: matches.length });
    }

    return NextResponse.json({ success: true, summary });
  } catch (error) {
    console.error("Vuln cron error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
