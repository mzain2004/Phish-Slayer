import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { detectBeaconing } from "@/lib/l2/beaconingDetector";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: orgs } = await supabase.from("organizations").select("id");

    if (!orgs) return NextResponse.json({ processed: 0 });

    for (const org of orgs) {
      const results = await detectBeaconing(supabase, org.id);

      for (const res of results) {
        if (res.confidence > 0.8) {
          await supabase.from("alerts").insert({
            org_id: org.id,
            title: `Potential Beaconing: ${res.srcIp} -> ${res.dstIp}`,
            severity_level: 13, // Critical
            alert_type: "beaconing",
            source_ip: res.srcIp,
            raw_log: res,
            status: "open",
          });
        }
      }
    }

    return NextResponse.json({ processed: orgs.length });
  } catch (error) {
    console.error("[cron] Beaconing scan failed:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
