import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";
import { AutoCloseEngine } from "@/lib/soc/autoclose";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = await createClient();
    const engine = new AutoCloseEngine(supabase, orgId);
    const stats = await engine.getSuppressionsStats();

    return NextResponse.json(stats);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
