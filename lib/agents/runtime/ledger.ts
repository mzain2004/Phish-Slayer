import { createClient } from '@supabase/supabase-js';
import { AgentState, AgentFindings } from './types';

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function logAgentSpawn(orgId: string, tier: string, alertId: string, agentId: string): Promise<void> {
  const supabase = getAdminClient();
  const { error } = await supabase.from('agent_runs').insert({
    org_id: orgId,
    tier,
    alert_id: alertId,
    agent_id: agentId,
    status: 'RUNNING',
    started_at: new Date().toISOString()
  });

  if (error) {
    console.error(`[Ledger] Error logging agent spawn: ${error.message}`);
  }
}

export async function logAgentAction(
  orgId: string, 
  agentRunId: string, 
  action: string, 
  target: string, 
  params: any, 
  result: any
): Promise<void> {
  const supabase = getAdminClient();
  const { error } = await supabase.from('agent_actions').insert({
    org_id: orgId,
    agent_run_id: agentRunId,
    action,
    target,
    params,
    result,
    timestamp: new Date().toISOString()
  });

  if (error) {
    console.error(`[Ledger] Error logging agent action: ${error.message}`);
  }
}

export async function logAgentComplete(
  orgId: string, 
  agentRunId: string, 
  findings: AgentFindings, 
  confidence: number
): Promise<void> {
  const supabase = getAdminClient();
  const { error } = await supabase.from('agent_runs')
    .update({
      status: 'COMPLETED',
      findings,
      confidence,
      completed_at: new Date().toISOString()
    })
    .eq('id', agentRunId)
    .eq('org_id', orgId);

  if (error) {
    console.error(`[Ledger] Error logging agent complete: ${error.message}`);
  }
}

export async function logAgentFail(
  orgId: string, 
  agentRunId: string, 
  errorObj: Error | any, 
  state: AgentState
): Promise<void> {
  const supabase = getAdminClient();
  const { error } = await supabase.from('agent_runs')
    .update({
      status: 'FAILED',
      error_details: errorObj instanceof Error ? errorObj.message : String(errorObj),
      last_state: state,
      completed_at: new Date().toISOString()
    })
    .eq('id', agentRunId)
    .eq('org_id', orgId);

  if (error) {
    console.error(`[Ledger] Error logging agent fail: ${error.message}`);
  }
}
