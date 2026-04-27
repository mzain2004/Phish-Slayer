import { createClient } from '@/lib/supabase/server';
import { getTimelineEvents } from '@/lib/db';

export interface TimelineEvent {
  id: string;
  timestamp: Date;
  source: string;
  sourceType: string;
  eventType: string;
  actor: string;
  target?: string;
  action?: string;
  outcome?: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  rawData: any;
  enrichments?: any;
}

export interface AttackPhase {
  phase: string;
  killChainStage: string;
  startTime: Date;
  endTime: Date;
  events: TimelineEvent[];
  mitreTechniques: string[];
  summary: string;
}

export interface AttackTimeline {
  caseId: string;
  orgId: string;
  startTime: Date;
  endTime: Date;
  totalEvents: number;
  phases: AttackPhase[];
  timeline: TimelineEvent[];
  attackPath: AttackPhase[];
  involvedIps: string[];
  involvedUsers: string[];
  involvedHosts: string[];
}

export interface CorrelatedGroup {
  id: string;
  key: string;
  events: TimelineEvent[];
  strength: number;
}

export async function buildAttackTimeline(caseId: string, orgId: string): Promise<AttackTimeline> {
  const supabase = await createClient();
  
  // 1. Get Case Details to establish time window
  const { data: caseData } = await supabase
    .from('cases')
    .select('*')
    .eq('id', caseId)
    .single();

  const caseStart = caseData?.created_at ? new Date(new Date(caseData.created_at).getTime() - 2 * 60 * 60 * 1000) : new Date(Date.now() - 24 * 60 * 60 * 1000);
  const caseEnd = caseData?.resolved_at ? new Date(caseData.resolved_at) : new Date();

  // 2. Fetch from Supabase sources
  const [alertsRes, endpointRes, logsRes, connectorRes] = await Promise.all([
    supabase.from('alerts').select('*').eq('organization_id', orgId).gte('created_at', caseStart.toISOString()).lte('created_at', caseEnd.toISOString()),
    supabase.from('endpoint_events').select('*').eq('organization_id', orgId).gte('created_at', caseStart.toISOString()).lte('created_at', caseEnd.toISOString()),
    supabase.from('raw_logs').select('*').eq('organization_id', orgId).gte('created_at', caseStart.toISOString()).lte('created_at', caseEnd.toISOString()),
    supabase.from('connector_events').select('*').eq('organization_id', orgId).gte('ingested_at', caseStart.toISOString()).lte('ingested_at', caseEnd.toISOString()),
  ]);

  // 3. Fetch from MongoDB sources
  const TimelineEventModel = await getTimelineEvents();
  const mongoEvents = TimelineEventModel ? await TimelineEventModel.find({ org_id: orgId, case_id: caseId }).lean() : [];

  // 4. Normalize Events
  const normalized: TimelineEvent[] = [];

  alertsRes.data?.forEach(a => normalized.push({
    id: a.id,
    timestamp: new Date(a.created_at),
    source: a.source || 'alert',
    sourceType: 'alert',
    eventType: a.title,
    actor: a.actor || 'unknown',
    severity: a.severity?.toLowerCase() || 'info',
    rawData: a.raw_data
  }));

  endpointRes.data?.forEach(e => normalized.push({
    id: e.id,
    timestamp: new Date(e.created_at),
    source: 'endpoint_agent',
    sourceType: 'endpoint',
    eventType: e.event_type,
    actor: e.actor_process || e.user_name || 'system',
    target: e.target_path || e.target_ip,
    action: e.action,
    severity: e.severity || 'info',
    rawData: e
  }));

  mongoEvents.forEach((m: any) => normalized.push({
    id: m._id.toString(),
    timestamp: new Date(m.created_at),
    source: 'forensic_investigator',
    sourceType: 'manual',
    eventType: m.event_type,
    actor: m.actor,
    rawData: m.metadata
  } as any));

  connectorRes.data?.forEach(c => normalized.push({
    id: c.id,
    timestamp: new Date(c.ingested_at),
    source: c.event_type || 'connector',
    sourceType: 'external_connector',
    eventType: 'external_log',
    actor: 'external',
    severity: (c.severity?.toLowerCase() as any) || 'info',
    rawData: c.raw_payload
  }));

  // Sort chronologically
  normalized.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  // 5. Correlation & Phasing
  const phases = runCorrelation(normalized);

  const involvedIps = Array.from(new Set(normalized.map(e => e.actor).filter(a => /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(a))));
  const involvedUsers = Array.from(new Set(normalized.map(e => e.actor).filter(a => !/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(a) && a !== 'unknown')));

  return {
    caseId,
    orgId,
    startTime: normalized[0]?.timestamp || caseStart,
    endTime: normalized[normalized.length - 1]?.timestamp || caseEnd,
    totalEvents: normalized.length,
    phases,
    timeline: normalized,
    attackPath: phases,
    involvedIps,
    involvedUsers,
    involvedHosts: [] // Host extraction could be added here
  };
}

function runCorrelation(events: TimelineEvent[]): AttackPhase[] {
  const phases: AttackPhase[] = [];
  if (events.length === 0) return [];

  let currentPhaseEvents: TimelineEvent[] = [events[0]];
  
  for (let i = 1; i < events.length; i++) {
    const prev = events[i - 1];
    const curr = events[i];
    
    // Group events within 5 minutes sharing actor or target
    const timeDiff = (curr.timestamp.getTime() - prev.timestamp.getTime()) / 60000;
    const sharedActor = curr.actor === prev.actor && curr.actor !== 'unknown';
    
    if (timeDiff <= 5 || sharedActor) {
      currentPhaseEvents.push(curr);
    } else {
      phases.push(buildPhase(currentPhaseEvents));
      currentPhaseEvents = [curr];
    }
  }
  
  phases.push(buildPhase(currentPhaseEvents));
  return phases;
}

function buildPhase(events: TimelineEvent[]): AttackPhase {
  const summary = `Detected ${events.length} events starting with ${events[0].eventType}`;
  const stage = identifyKillChainStage(events);
  
  return {
    phase: stage,
    killChainStage: stage,
    startTime: events[0].timestamp,
    endTime: events[events.length - 1].timestamp,
    events,
    mitreTechniques: [], // Would populate from enrichment
    summary
  };
}

function identifyKillChainStage(events: TimelineEvent[]): string {
  const keywords = {
    Reconnaissance: ['scan', 'probe', 'discovery', 'enumeration'],
    Delivery: ['phishing', 'email', 'download', 'attachment'],
    Exploitation: ['exploit', 'vulnerability', 'buffer overflow', 'crash'],
    Installation: ['malware', 'backdoor', 'persistence', 'registry'],
    C2: ['callback', 'beacon', 'cnc', 'command and control'],
    Exfiltration: ['upload', 'transfer', 'data loss', 'leak'],
  };

  for (const event of events) {
    const text = (event.eventType + ' ' + (event.action || '')).toLowerCase();
    for (const [stage, terms] of Object.entries(keywords)) {
      if (terms.some(t => text.includes(t))) return stage;
    }
  }

  return 'Actions on Objectives';
}

export function correlateEvents(events: TimelineEvent[]): CorrelatedGroup[] {
  // Simplified grouping logic
  const groups: Record<string, TimelineEvent[]> = {};
  
  events.forEach(e => {
    const key = e.actor;
    if (!groups[key]) groups[key] = [];
    groups[key].push(e);
  });

  return Object.entries(groups).map(([key, evs]) => ({
    id: Math.random().toString(36).substr(2, 9),
    key,
    events: evs,
    strength: 0.8
  })).sort((a, b) => b.strength - a.strength);
}
