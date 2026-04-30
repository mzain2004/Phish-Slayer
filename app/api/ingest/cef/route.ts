import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { IngestionPipeline } from "@/lib/ingestion/pipeline";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const orgId = request.headers.get("x-org-id");
  const connectorId = request.headers.get("x-connector-id") || '00000000-0000-0000-0000-000000000000';
  const apiKey = request.headers.get("x-api-key");

  if (!orgId || !apiKey) {
    return NextResponse.json({ error: "Missing authentication" }, { status: 401 });
  }

  try {
    const rawBody = await request.text();
    const events = rawBody.split('\n').filter(Boolean).map(raw => ({ raw, format: 'cef' }));

    const supabase = await createClient();
    const pipeline = new IngestionPipeline(supabase);
    
    // Await batch processing or run async depending on size
    const result = await pipeline.ingestBatch(events, connectorId, orgId);

    return NextResponse.json({ success: true, result }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
