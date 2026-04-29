export type AgentState = 
  | 'IDLE'
  | 'QUEUED'
  | 'RUNNING'
  | 'BLOCKED'
  | 'ESCALATED'
  | 'COMPLETED'
  | 'FAILED'
  | 'RETRYING'
  | 'ARCHIVED';

export interface AgentAction {
  type: string;
  target: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  result?: any;
  timestamp: string;
}

export interface IPGeoData {
  country?: string;
  city?: string;
  isp?: string;
}

export interface EnrichmentData {
  ip_geo?: IPGeoData;
  domain_age?: number;
  vt_score?: number;
  abuse_score?: number;
  asset_criticality?: 1 | 2 | 3 | 4;
  user_risk_score?: number;
}

export interface IOC {
  type: 'ip' | 'domain' | 'hash' | 'url' | 'email' | 'filename';
  value: string;
  confidence: number;
  source: string;
  threat_score: number;
}

export interface AgentFindings {
  severity_score: number;
  mitre_techniques: string[];
  iocs: IOC[];
  enrichment: EnrichmentData;
  risk_factors: string[];
  recommended_actions: string[];
  raw_llm_reasoning: string;
}

export interface AgentHandoff {
  alert_id: string;
  org_id: string;
  agent_id: string;
  tier: 'L1' | 'L2' | 'L3';
  confidence: number;
  findings: AgentFindings;
  actions_taken: AgentAction[];
  handoff_context: Record<string, any>;
  timestamp: string;
  state: AgentState;
  token_count: number;
  model_used: string;
}

export interface DLQEntry {
  id: string;
  org_id: string;
  agent_run_id: string | null;
  tier: string;
  error_message: string;
  input_payload: any;
  retry_count: number;
  created_at: string;
  expires_at: string;
}

export interface TokenUsageStatus {
  used: number;
  limit: number;
  remaining: number;
  pct: number;
}

export interface LLMResponse {
  content: string;
  tokens_used: number;
  model: string;
  provider: string;
  latency_ms: number;
}

export interface Alert {
  id: string;
  source: string;
  severity?: string;
  rule_level?: number;
  payload?: any;
}
