import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { listDLQEntries, replayFromDLQ } from "@/lib/agents/runtime/dlq";
import { getProviderHealth } from "@/lib/agents/runtime/llm-client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

function isInternalAgentAuthorized(request: NextRequest): boolean {
  const providedSecret =
    request.headers.get("AGENT_SECRET") ||
    request.headers.get("agent_secret") ||
    request.headers.get("x-agent-secret");

  return Boolean(providedSecret && providedSecret === process.env.AGENT_SECRET);
}

// GET /api/agents/supervisor - agent health status for all orgs
export async function GET(request: NextRequest) {
  if (!isInternalAgentAuthorized(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getAdminClient();
  
  // Get active agents across orgs
  const { data: runs, error } = await supabase.from('agent_runs')
    .select('org_id, tier, status')
    .in('status', ['RUNNING', 'QUEUED']);

  const health = await getProviderHealth();

  return NextResponse.json({
    success: true,
    active_runs: runs?.length || 0,
    provider_health: health,
    error: error?.message
  });
}

// POST routes for restart, dlq list, dlq replay
export async function POST(request: NextRequest) {
  if (!isInternalAgentAuthorized(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const action = url.pathname.split('/').pop();
  
  let body: any = {};
  try {
    body = await request.json();
  } catch (e) {}

  const orgId = body.org_id;

  if (action === 'restart') {
    const agentId = body.agent_id;
    if (!agentId) return NextResponse.json({ error: "Missing agent_id" }, { status: 400 });
    
    // In a real implementation, this would find the stuck agent run and re-queue
    const supabase = getAdminClient();
    const { error } = await supabase.from('agent_runs')
      .update({ status: 'QUEUED', started_at: null })
      .eq('id', agentId)
      .eq('status', 'RUNNING');
      
    return NextResponse.json({ success: !error, error: error?.message });
  } 
  
  if (action === 'dlq') {
    if (!orgId) return NextResponse.json({ error: "Missing org_id" }, { status: 400 });
    const entries = await listDLQEntries(orgId);
    return NextResponse.json({ success: true, entries });
  }

  if (action === 'replay') {
    const dlqId = body.dlq_id;
    if (!orgId || !dlqId) return NextResponse.json({ error: "Missing org_id or dlq_id" }, { status: 400 });
    
    try {
      const handoff = await replayFromDLQ(orgId, dlqId);
      // Here we would push `handoff` into a queue, but for now just return success
      return NextResponse.json({ success: true, replayed_handoff: handoff.alert_id });
    } catch (e: any) {
      return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
