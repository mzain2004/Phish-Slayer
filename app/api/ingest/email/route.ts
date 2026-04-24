import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";
import { IngestionPipeline } from "@/lib/ingestion/pipeline";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = await createClient();
    const pipeline = new IngestionPipeline(supabase);
    const count = await pipeline.ingestEmail();

    return NextResponse.json({ processed: count });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
