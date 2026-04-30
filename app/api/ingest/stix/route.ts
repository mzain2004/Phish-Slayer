import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const orgId = request.headers.get("x-org-id");
  if (!orgId) {
    return NextResponse.json({ error: "Missing organization context" }, { status: 400 });
  }

  try {
    const bundle = await request.json();
    if (bundle.type !== "bundle" || !Array.isArray(bundle.objects)) {
      return NextResponse.json({ error: "Invalid STIX bundle" }, { status: 400 });
    }

    const supabase = await createClient();
    let imported = 0;

    for (const obj of bundle.objects) {
      if (obj.type === "indicator") {
        // Very simplified extraction for example
        const valueMatch = obj.pattern.match(/'(.*?)'/);
        if (valueMatch) {
          await supabase.from("watchlists").insert({
            org_id: orgId,
            ioc_type: obj.pattern_type || "stix",
            ioc_value: valueMatch[1],
            label: obj.name || "STIX Import",
            source: "taxii"
          });
          imported++;
        }
      }
    }

    return NextResponse.json({ success: true, imported }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
