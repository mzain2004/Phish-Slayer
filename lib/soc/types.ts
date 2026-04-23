export interface RawAlert {
  id: string;
  rule_id: string;
  rule_description: string;
  source_ip: string;
  destination_ip: string;
  agent_id: string;
  agent_name: string;
  alert_type: string;
  severity_level: number; // 1-15
  timestamp: string;
  raw_log: any; // jsonb
  
  // Maintain compatibility with existing code
  title: string;
}

export interface DeduplicatedGroup {
  group_key: string;
  rule_id: string;
  source_ip: string;
  alerts: RawAlert[];
  count: number;
  first_seen: Date;
  last_seen: Date;
  representative_alert: RawAlert;
  suppressed: boolean;
  suppression_reason: string | null;
}

export interface DeduplicatedCase {
  id: string;
  alerts: RawAlert[];
  count: number;
  first_seen: string;
  last_seen: string;
  representative_alert: RawAlert;
}
