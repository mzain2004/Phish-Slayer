import { createClient } from '@supabase/supabase-js';

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export interface ConnectorHealthReport {
  connector_id: string;
  status: string;
  last_event_at: string | null;
  events_per_min_current: number;
}

const rollingRates: Record<string, { timestamps: number[] }> = {};

export async function updateConnectorHealth(connectorId: string, orgId: string): Promise<void> {
  const now = Date.now();
  if (!rollingRates[connectorId]) {
    rollingRates[connectorId] = { timestamps: [] };
  }
  
  // Prune older than 5 mins
  const cutoff = now - 5 * 60 * 1000;
  rollingRates[connectorId].timestamps = rollingRates[connectorId].timestamps.filter(t => t > cutoff);
  rollingRates[connectorId].timestamps.push(now);

  const eventsPerMin = rollingRates[connectorId].timestamps.length / 5;

  const supabase = getAdminClient();
  
  // Basic upsert, in reality baseline is calculated asynchronously
  await supabase.from('connector_health').upsert({
    connector_id: connectorId,
    org_id: orgId,
    last_event_at: new Date().toISOString(),
    events_per_min_current: eventsPerMin,
    status: 'healthy',
    updated_at: new Date().toISOString()
  }, { onConflict: 'id' });
}

export async function checkAllConnectors(orgId: string): Promise<ConnectorHealthReport[]> {
  const supabase = getAdminClient();
  const { data } = await supabase.from('connector_health').select('*').eq('org_id', orgId);
  return (data || []).map(row => ({
    connector_id: row.connector_id,
    status: row.status,
    last_event_at: row.last_event_at,
    events_per_min_current: row.events_per_min_current
  }));
}

export async function alertOnSilentConnector(connectorId: string, orgId: string): Promise<void> {
  const supabase = getAdminClient();
  
  await supabase.from('connector_health').update({
    status: 'silent',
    health_notes: 'Data source silent — possible blind spot',
    updated_at: new Date().toISOString()
  }).eq('connector_id', connectorId);

  // Generate critical platform alert
  await supabase.from('alerts').insert({
    org_id: orgId,
    source: 'platform',
    status: 'open',
    severity: 'CRITICAL',
    title: 'Data source silent — possible blind spot',
    raw_log: { error: `Connector ${connectorId} has stopped sending logs.` },
    queue_priority: 100,
    created_at: new Date().toISOString()
  });
}
