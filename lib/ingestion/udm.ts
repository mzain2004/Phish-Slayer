export interface UDMEvent {
  // Identity
  id: string;                    // UUID generated at ingest
  org_id: string;                // MANDATORY — multi-tenant
  connector_id: string;          // which connector sent this
  data_source_type: string;      // 'wazuh'|'crowdstrike'|'o365'|'syslog'|etc

  // Timestamps
  timestamp_utc: string;         // UTC ISO 8601 — event time
  ingested_at: string;           // UTC ISO 8601 — platform receipt time
  clock_skew_ms: number;         // delta between event time and ingest time

  // Network
  src_ip?: string;               // always CIDR-normalized
  dst_ip?: string;
  src_port?: number;
  dst_port?: number;
  protocol?: string;             // tcp|udp|icmp|http|https|dns|smb|rdp|ssh

  // Host
  host_name?: string;
  host_fqdn?: string;
  host_ip?: string;
  host_os?: string;              // windows|linux|macos|unknown

  // User
  user_name?: string;
  user_domain?: string;
  user_upn?: string;             // user principal name (email format)

  // Process
  process_name?: string;
  process_pid?: number;
  process_cmdline?: string;
  process_hash_md5?: string;
  process_hash_sha256?: string;
  parent_process_name?: string;
  parent_process_pid?: number;

  // File
  file_path?: string;
  file_name?: string;
  file_hash_md5?: string;
  file_hash_sha256?: string;
  file_size?: number;
  file_extension?: string;

  // Network payload
  network_bytes_in?: number;
  network_bytes_out?: number;
  dns_query?: string;
  dns_response?: string;
  http_method?: string;
  http_url?: string;
  http_status?: number;
  http_user_agent?: string;

  // Event classification
  event_type: string;            // 'alert'|'log'|'audit'|'network'|'endpoint'
  event_action?: string;         // what happened: 'login'|'file_create'|'network_connect'|etc
  event_outcome?: string;        // 'success'|'failure'|'unknown'
  event_category?: string[];     // MITRE-aligned: 'authentication'|'file'|'network'|'process'

  // Alert fields (when event_type = 'alert')
  alert_rule_id?: string;
  alert_rule_name?: string;
  alert_severity_raw?: string;   // original severity from source
  alert_severity_score?: number; // normalized 0-100

  // Raw preservation (ALWAYS POPULATED)
  raw_log: string;               // original log verbatim — never modify

  // Processing metadata
  normalization_version: string; // schema version used
  normalization_warnings?: string[]; // fields that couldn't be mapped
  
  extra?: Record<string, any>;
  is_duplicate?: boolean;
  is_stale?: boolean;
}

export interface UDMBatch {
  events: UDMEvent[];
  batch_id: string;
  org_id: string;
  connector_id: string;
  received_at: string;
}
