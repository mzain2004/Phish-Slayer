import { NextRequest, NextResponse } from "next/server";
import { orchestrateEnrichment } from "@/lib/agents/enrichment/enrichment-orchestrator";
import { calculateSeverity } from "@/lib/agents/l1/severity-scorer";
import { deduplicateAlert, fingerprintAlert } from "@/lib/agents/l1/correlator";
import { matchWatchlist } from "@/lib/agents/l1/watchlist-matcher";
import { createClient } from "@supabase/supabase-js";

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
    rawAlert = await request.json();
  } catch (e) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Acknowledge receipt to Wazuh immediately
  const alertId = `wzh-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  
  // Background processing - do not await
  processAlertAsync({ id: alertId, source: 'wazuh', payload: rawAlert, rule_level: rawAlert.rule?.level }, orgId)
    .catch(console.error);

  return NextResponse.json({ success: true, alert_id: alertId }, { status: 200 });
}

async function processAlertAsync(alert: any, orgId: string) {
  const supabase = getAdminClient();
  
  // 1. Enrich
  const enrichedAlert = await orchestrateEnrichment(alert, orgId);
  
  // 2. Deduplicate
  const { isDuplicate, clusterId } = await deduplicateAlert(enrichedAlert, orgId);
  
  if (isDuplicate) {
    console.log(`[Webhook] Alert ${alert.id} deduplicated into cluster ${clusterId}`);
    return;
  }

  // 3. Severity & Watchlist
  const severityResult = calculateSeverity(enrichedAlert);
  const watchlistResult = await matchWatchlist(enrichedAlert, orgId);

  if (watchlistResult.matched) {
    severityResult.label = 'CRITICAL';
    severityResult.score = 100;
    severityResult.breakdown['Watchlist Match'] = 100;
  }

  // 4. Save to DB
  await supabase.from('alerts').insert({
    id: alert.id,
    org_id: orgId,
    source: 'wazuh',
    status: 'open',
    severity: severityResult.label,
    rule_level: alert.rule_level,
    payload: alert.payload,
    enrichment: enrichedAlert.enrichment,
    fingerprint: fingerprintAlert(enrichedAlert),
    cluster_id: clusterId || alert.id,
    queue_priority: severityResult.score,
    created_at: new Date().toISOString()
  });

  // Here it would pass to the rest of the L1 chain (Triage, etc)
}
