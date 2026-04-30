import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { IngestionPipeline } from "@/lib/ingestion/pipeline";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function POST(request: NextRequest) {
  // Wazuh sends webhook payloads here
  const providedSecret = request.headers.get("x-wazuh-webhook-secret");
  if (!providedSecret || providedSecret !== process.env.WAZUH_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get orgId from query param or header (assuming multi-tenant webhook setup)
  const orgId = request.nextUrl.searchParams.get("organization_id");
  if (!orgId) {
    return NextResponse.json({ error: "Missing organization_id" }, { status: 400 });
  }

  let rawAlert;
  try {
    rawAlert = await request.text(); // Pipeline parses strings
  } catch (e) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const connectorId = '00000000-0000-0000-0000-000000000000'; // Default wazuh connector ID

  // Background processing - do not await
  const supabase = getAdminClient();
  const pipeline = new IngestionPipeline(supabase);
  
  pipeline.ingestEvent(rawAlert, connectorId, orgId, 'wazuh').catch(console.error);

  return NextResponse.json({ success: true, message: "Accepted" }, { status: 200 });
}
