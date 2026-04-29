import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";
import { generateHandoverReport } from "@/lib/l1/shiftHandover";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const orgId = searchParams.get("organization_id");
  if (!orgId) return NextResponse.json({ error: "organization_id is required" }, { status: 400 });

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("shift_handovers")
    .select("*")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { organization_id } = await req.json();
    if (!organization_id) return NextResponse.json({ error: "organization_id is required" }, { status: 400 });

    const supabase = await createClient();
    const report = await generateHandoverReport(supabase, organization_id, userId);

    return NextResponse.json(report);
  } catch (error) {
    console.error("[api] Handover error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
