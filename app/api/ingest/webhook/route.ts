import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { IngestionPipeline } from "@/lib/ingestion/pipeline";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const connectorId = request.nextUrl.searchParams.get("connector");
  const orgId = request.headers.get("x-org-id");
  const apiKey = request.headers.get("x-api-key");

  if (!connectorId || !orgId || !apiKey) {
    return NextResponse.json({ error: "Missing authentication or routing params" }, { status: 400 });
  }

  // Typically, we would verify apiKey vs database here...
  
  try {
    const rawBody = await request.text();
    
    const supabase = await createClient();
    const pipeline = new IngestionPipeline(supabase);
    
    try {
      await pipeline.ingestEvent(rawBody, connectorId, orgId);
      return NextResponse.json({ success: true, message: "Accepted" }, { status: 200 });
    } catch (err: any) {
      if (err.message.startsWith('quota_exceeded')) {
        const [_, limit] = err.message.split(':');
        return NextResponse.json({ 
          error: 'quota_exceeded', 
          metric: 'alerts_processed', 
          limit: parseInt(limit) 
        }, { status: 429 });
      }
      throw err;
    }
  } catch (error) {
    console.error("[ingest:webhook] Error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
