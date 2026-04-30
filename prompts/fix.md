════════════════════════════════════════════════════════════
SPRINT 0.5 — DATA INGESTION + UDM NORMALIZATION LAYER
Run AFTER Pre-Sprint setup, BEFORE Layer 0
════════════════════════════════════════════════════════════

READ gemini.md and graph.md fully before starting.
VERIFY: Pre-sprint complete, npm run build passes.

You are building Sprint 0.5: Universal Data Ingestion Pipeline
and Unified Data Model normalization layer. This is the
foundation of the entire data pipeline. Every agent downstream
depends on clean, normalized data from this layer.

AUDIT FIRST:
1. Read ALL existing webhook/ingest code in app/api/webhooks/
   and app/api/ingest/
2. Check: is every ingest route scoped to org_id? Fix any missing.
3. Check: any raw Wazuh data passed directly to agents without
   normalization? Fix — all data must pass through UDM first.
4. Fix ALL build errors before adding anything new.
5. List all issues found and fixed.

USE SUPABASE CONNECTOR for all migration steps below.

═══════════════════════════════════════
PART 1 — UNIFIED DATA MODEL (UDM)
═══════════════════════════════════════

1. UDM Type Definitions (/lib/ingestion/udm.ts)

Build the complete Unified Data Model TypeScript interface.
Every event from every source normalizes to this schema:

interface UDMEvent {
  // Identity
  id: string                    // UUID generated at ingest
  org_id: string                // MANDATORY — multi-tenant
  connector_id: string          // which connector sent this
  data_source_type: string      // 'wazuh'|'crowdstrike'|'o365'|'syslog'|etc

  // Timestamps
  timestamp_utc: string         // UTC ISO 8601 — event time
  ingested_at: string           // UTC ISO 8601 — platform receipt time
  clock_skew_ms: number         // delta between event time and ingest time

  // Network
  src_ip?: string               // always CIDR-normalized
  dst_ip?: string
  src_port?: number
  dst_port?: number
  protocol?: string             // tcp|udp|icmp|http|https|dns|smb|rdp|ssh

  // Host
  host_name?: string
  host_fqdn?: string
  host_ip?: string
  host_os?: string              // windows|linux|macos|unknown

  // User
  user_name?: string
  user_domain?: string
  user_upn?: string             // user principal name (email format)

  // Process
  process_name?: string
  process_pid?: number
  process_cmdline?: string
  process_hash_md5?: string
  process_hash_sha256?: string
  parent_process_name?: string
  parent_process_pid?: number

  // File
  file_path?: string
  file_name?: string
  file_hash_md5?: string
  file_hash_sha256?: string
  file_size?: number
  file_extension?: string

  // Network payload
  network_bytes_in?: number
  network_bytes_out?: number
  dns_query?: string
  dns_response?: string
  http_method?: string
  http_url?: string
  http_status?: number
  http_user_agent?: string

  // Event classification
  event_type: string            // 'alert'|'log'|'audit'|'network'|'endpoint'
  event_action?: string         // what happened: 'login'|'file_create'|'network_connect'|etc
  event_outcome?: string        // 'success'|'failure'|'unknown'
  event_category?: string[]     // MITRE-aligned: 'authentication'|'file'|'network'|'process'

  // Alert fields (when event_type = 'alert')
  alert_rule_id?: string
  alert_rule_name?: string
  alert_severity_raw?: string   // original severity from source
  alert_severity_score?: number // normalized 0-100

  // Raw preservation (ALWAYS POPULATED)
  raw_log: string               // original log verbatim — never modify

  // Processing metadata
  normalization_version: string // schema version used
  normalization_warnings?: string[] // fields that couldn't be mapped
}

Also define:
interface UDMBatch {
  events: UDMEvent[]
  batch_id: string
  org_id: string
  connector_id: string
  received_at: string
}


2. UDM Storage Migration

Use Supabase connector to run this migration:

CREATE TABLE IF NOT EXISTS udm_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  connector_id UUID REFERENCES connectors(id),
  data_source_type TEXT NOT NULL,
  timestamp_utc TIMESTAMPTZ NOT NULL,
  ingested_at TIMESTAMPTZ DEFAULT now(),
  clock_skew_ms INTEGER DEFAULT 0,
  src_ip INET,
  dst_ip INET,
  src_port INTEGER,
  dst_port INTEGER,
  protocol TEXT,
  host_name TEXT,
  host_fqdn TEXT,
  host_os TEXT,
  user_name TEXT,
  user_domain TEXT,
  process_name TEXT,
  process_pid INTEGER,
  process_cmdline TEXT,
  process_hash_sha256 TEXT,
  file_path TEXT,
  file_hash_sha256 TEXT,
  dns_query TEXT,
  http_url TEXT,
  http_method TEXT,
  event_type TEXT NOT NULL,
  event_action TEXT,
  event_outcome TEXT,
  event_category TEXT[],
  alert_rule_id TEXT,
  alert_rule_name TEXT,
  alert_severity_score INTEGER,
  raw_log TEXT NOT NULL,
  normalization_version TEXT DEFAULT '1.0',
  normalization_warnings TEXT[],
  extra JSONB DEFAULT '{}'  -- overflow for unmapped fields
);

ALTER TABLE udm_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_isolation" ON udm_events
  USING (org_id = current_setting('app.current_org_id')::uuid);

-- Performance indexes
CREATE INDEX idx_udm_org_timestamp
  ON udm_events(org_id, timestamp_utc DESC);
CREATE INDEX idx_udm_src_ip
  ON udm_events(org_id, src_ip);
CREATE INDEX idx_udm_host
  ON udm_events(org_id, host_name);
CREATE INDEX idx_udm_user
  ON udm_events(org_id, user_name);
CREATE INDEX idx_udm_process
  ON udm_events(org_id, process_hash_sha256);

-- Retention: auto-delete events older than 90 days (hot tier)
-- Cold tier archival handled separately


═══════════════════════════════════════
PART 2 — FORMAT PARSERS
═══════════════════════════════════════

3. Parser Library (/lib/ingestion/parsers/)

Build one parser per format. Each parser:
  Input: raw string or Buffer
  Output: Partial<UDMEvent> (fields it can extract)
  Never throw — return partial on error + populate
  normalization_warnings[]

/lib/ingestion/parsers/wazuh.ts
  Parse Wazuh JSON alert format:
  Map: rule.level → alert_severity_score (level*6.25, cap 100)
  Map: rule.id → alert_rule_id
  Map: rule.description → alert_rule_name
  Map: agent.ip → src_ip
  Map: agent.name → host_name
  Map: data.srcip → src_ip (if present, override agent.ip)
  Map: data.dstip → dst_ip
  Map: data.dstport → dst_port
  Map: data.win.system.subjectUserName → user_name (Windows events)
  Map: data.win.eventdata.commandLine → process_cmdline
  Map: data.win.eventdata.hashes → extract SHA256 → process_hash_sha256
  Map: full alert JSON → raw_log (stringify)

/lib/ingestion/parsers/cef.ts
  Parse CEF (Common Event Format — ArcSight):
  Format: CEF:Version|DeviceVendor|Product|Version|SignatureId|Name|Severity|Extension
  Extract all extension key=value pairs
  Map standard CEF fields to UDM fields
  Map: src → src_ip, dst → dst_ip, spt → src_port, dpt → dst_port
  Map: suser → user_name, dhost → host_name
  Map: act → event_action, outcome → event_outcome
  Map: cs1/cs2/cs3 (custom string fields) → extra JSONB

/lib/ingestion/parsers/leef.ts
  Parse LEEF (Log Event Extended Format — QRadar):
  Format: LEEF:Version|Vendor|Product|Version|EventID|delimiter|key=value pairs
  Similar mapping to CEF but LEEF-specific field names

/lib/ingestion/parsers/syslog.ts
  Parse RFC 3164 and RFC 5424 syslog:
  RFC 3164: <PRI>TIMESTAMP HOSTNAME TAG: MESSAGE
  RFC 5424: <PRI>VERSION TIMESTAMP HOSTNAME APP PROCID MSGID SD MSG
  Extract: priority → severity mapping, hostname, timestamp, message
  Apply grok-like patterns for common syslog message formats:
    - SSH auth: extract user, src_ip, outcome (accepted/failed)
    - sudo: extract user, command
    - cron: extract user, command
    - kernel: extract subsystem, message

/lib/ingestion/parsers/json-generic.ts
  Parse generic JSON logs with schema inference:
  Auto-detect common field names:
    timestamp variants: timestamp, time, @timestamp, date, created_at, eventTime
    IP variants: src_ip, srcip, source_ip, sourceIp, client_ip, clientIp
    user variants: user, username, user_name, userName, account
    host variants: host, hostname, host_name, hostName, computer, device
  Fall back to extra JSONB for unmapped fields

/lib/ingestion/parsers/cloudtrail.ts
  Parse AWS CloudTrail JSON:
  Map: eventTime → timestamp_utc
  Map: sourceIPAddress → src_ip
  Map: userIdentity.userName → user_name
  Map: eventName → event_action
  Map: errorCode → event_outcome (null=success, error=failure)
  Map: resources[].ARN → extra.aws_resource

/lib/ingestion/parsers/o365.ts
  Parse Microsoft 365 Unified Audit Log:
  Map: CreationTime → timestamp_utc
  Map: UserId → user_upn
  Map: ClientIP → src_ip
  Map: Operation → event_action
  Map: Workload → data_source_type suffix (Exchange/SharePoint/Teams)

/lib/ingestion/parsers/suricata.ts
  Parse Suricata EVE JSON:
  Map: timestamp → timestamp_utc
  Map: src_ip, dest_ip, src_port, dest_port, proto
  Map: alert.signature → alert_rule_name
  Map: alert.signature_id → alert_rule_id
  Map: alert.severity → alert_severity_score (1=high: 75, 2=med: 50, 3=low: 25)
  Map: dns.query → dns_query
  Map: http.url → http_url, http.method → http_method

/lib/ingestion/parsers/zeek.ts
  Parse Zeek/Bro TSV logs:
  Auto-detect log type from #path field (conn, dns, http, files, notice)
  conn.log: map id.orig_h→src_ip, id.resp_h→dst_ip, proto, duration, bytes
  dns.log: map query→dns_query, answers, rcode
  http.log: map host+uri→http_url, method, status_code, user_agent
  files.log: map md5, sha256 → file hashes

Export from /lib/ingestion/parsers/index.ts:
function detectFormat(raw: string | Buffer): string
function parseEvent(raw: string | Buffer, format: string, connectorType: string): Partial<UDMEvent>


═══════════════════════════════════════
PART 3 — DATA QUALITY AGENT
═══════════════════════════════════════

4. Data Quality Agent (/lib/ingestion/data-quality.ts)

Run on every event post-normalization:

CHECKS (run all, collect warnings, never drop event):

Clock skew check:
  If |timestamp_utc - now()| > 300000ms (5 minutes):
    Add warning: "CLOCK_SKEW: event is {delta}ms {ahead|behind} ingest time"
    If delta > 3600000ms (1 hour): flag as STALE
    Correct timestamp_utc to ingested_at for processing purposes
    Preserve original in extra.original_timestamp

Missing critical fields:
  Required: org_id, data_source_type, timestamp_utc, raw_log, event_type
  Important: at least one of src_ip OR host_name OR user_name
  If required field missing: add warning "MISSING_REQUIRED: {field}"
  If no identifying field: add warning "NO_ENTITY_IDENTIFIER"

Duplicate detection:
  SHA256 of: org_id + timestamp_utc + src_ip + alert_rule_id + raw_log
  Check against last 60 seconds in dedup cache (Redis or Supabase)
  Duplicate found: mark event.is_duplicate = true, still store but skip agent processing

IP validation:
  Validate src_ip and dst_ip are valid IP addresses
  If invalid: clear field, add warning "INVALID_IP: {value}"
  Normalize IPv6: expand compressed notation
  Tag RFC1918: add extra.src_ip_internal = true if private range

Hash validation:
  MD5: must be 32 hex chars
  SHA1: must be 40 hex chars
  SHA256: must be 64 hex chars
  If wrong length: clear field, add warning "INVALID_HASH"
  Always lowercase hashes

Encoding detection + fix:
  Detect: UTF-8, Latin-1, Windows-1252
  Convert to UTF-8
  Replace unparseable bytes with Unicode replacement char

Log volume anomaly:
  Per connector, track rolling 5-min event rate
  Baseline: average events/min over last 7 days for this connector
  If current rate < 10% of baseline: log "SENSOR_SILENT" to connector_health table
  If current rate > 500% of baseline: log "FLOOD_DETECTED", apply rate limiting

Build:
function runQualityChecks(event: UDMEvent): QualityResult
  Returns: {passed: boolean, warnings: string[], is_duplicate: boolean,
            is_stale: boolean, quality_score: number}


5. Connector Health Monitor (/lib/ingestion/connector-health.ts)

Use Supabase connector for migration:

CREATE TABLE IF NOT EXISTS connector_health (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  connector_id UUID NOT NULL REFERENCES connectors(id),
  status TEXT DEFAULT 'healthy',
    -- 'healthy'|'degraded'|'silent'|'flooding'|'unknown'
  last_event_at TIMESTAMPTZ,
  events_per_min_current DECIMAL(10,2),
  events_per_min_baseline DECIMAL(10,2),
  consecutive_silent_checks INTEGER DEFAULT 0,
  last_checked TIMESTAMPTZ DEFAULT now(),
  health_notes TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE connector_health ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_isolation" ON connector_health
  USING (org_id = current_setting('app.current_org_id')::uuid);

Build:
async function updateConnectorHealth(connectorId: string, orgId: string): Promise<void>
async function checkAllConnectors(orgId: string): Promise<ConnectorHealthReport>
async function alertOnSilentConnector(connectorId: string, orgId: string): Promise<void>
  // Creates CRITICAL alert: "Data source silent — possible blind spot"


═══════════════════════════════════════
PART 4 — INGESTION PIPELINE
═══════════════════════════════════════

6. Ingestion Orchestrator (/lib/ingestion/pipeline.ts)

Master pipeline: raw event in → UDM event stored → agent triggered

async function ingestEvent(
  raw: string | Buffer,
  connectorId: string,
  orgId: string,
  format?: string  // if known, skip auto-detect
): Promise<UDMEvent>

Steps:
  1. Auto-detect format if not provided
  2. Parse to partial UDM
  3. Fill mandatory fields (org_id, connector_id, ingested_at, id)
  4. Run data quality checks
  5. If duplicate: store with is_duplicate flag, return, skip agents
  6. Store to udm_events table
  7. Update connector_health last_event_at
  8. If event_type = 'alert': trigger L1 agent pipeline
     Pass UDMEvent to enrichment orchestrator (Sprint 1)
  9. Return UDMEvent

async function ingestBatch(
  events: Array<{raw: string, format?: string}>,
  connectorId: string,
  orgId: string
): Promise<{processed: number, duplicates: number, errors: number}>

  Process in batches of 100
  Promise.allSettled for parallel processing
  Backpressure: if >1000 events queued, return 429 with Retry-After header
  Never lose events — push failures to DLQ


7. Multi-Protocol Receivers

Update existing + add new ingest endpoints:

/app/api/ingest/wazuh/route.ts (UPDATE existing webhook):
  POST: receive Wazuh JSON alert
  Auth: verify connector API key (bcrypt compare against connectors.api_key_hash)
  Call: ingestEvent(body, connectorId, orgId, 'wazuh')
  Return 200 immediately (async processing)

/app/api/ingest/webhook/route.ts (GENERIC — NEW):
  POST /api/ingest/webhook?connector={id}
  Auth: X-API-Key header → connector lookup
  Auto-detect format from Content-Type + body structure
  Call: ingestEvent(body, connectorId, orgId)
  Return 200 immediately

/app/api/ingest/syslog/route.ts (UDP+TCP — NEW):
  Note: Next.js can't receive raw UDP. 
  Build separate Node.js syslog receiver at /lib/ingestion/syslog-server.ts
  UDP port 514, TCP port 601
  On receive: call ingestEvent(message, connectorId, orgId, 'syslog')
  Run as separate process managed by PM2 on Azure VM

/app/api/ingest/batch/route.ts (UPDATE existing):
  POST: receive array of events
  Auth: connector API key
  Call: ingestBatch(events, connectorId, orgId)

/app/api/ingest/cef/route.ts (NEW):
  POST: receive CEF formatted events
  Content-Type: text/plain or application/cef
  Split by newline for multi-event payloads
  Call: ingestBatch with format='cef'

/app/api/ingest/stix/route.ts (NEW — TAXII receiver):
  POST: receive STIX 2.x bundle
  Parse indicators, threat-actors, attack-patterns from bundle
  Import IOCs to watchlists table
  Import TTPs to threat intel tables
  Return 200 + summary of imported objects


8. Log Retention + Archival Policy (/lib/ingestion/retention.ts)

Automated log lifecycle:

async function enforceRetentionPolicy(orgId: string): Promise<void>
  Hot tier (Supabase udm_events): keep 30 days
  Warm tier: events 30-90 days → compress to JSONB + move to udm_events_archive
  Cold tier: events 90 days - 1 year → export to S3 as gzipped NDJSON
  Archive tier: events 1-7 years → move S3 to Glacier
  Delete: events >7 years (configurable, GDPR compliance)

Use Supabase connector for archive table:
CREATE TABLE IF NOT EXISTS udm_events_archive (
  id UUID NOT NULL,
  org_id UUID NOT NULL REFERENCES organizations(id),
  timestamp_utc TIMESTAMPTZ NOT NULL,
  compressed_data JSONB NOT NULL,
  original_count INTEGER DEFAULT 1,
  archived_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE udm_events_archive ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_isolation" ON udm_events_archive
  USING (org_id = current_setting('app.current_org_id')::uuid);

Cron: /app/api/cron/retention/route.ts — run daily 01:00 UTC


9. Historical Log Search (/app/api/search/logs/route.ts)

Full-text search across all stored logs:

GET /api/search/logs?q={query}&start={date}&end={date}&limit=100

Query against udm_events WHERE:
  org_id = orgId (ALWAYS)
  AND timestamp_utc BETWEEN start AND end
  AND (
    raw_log ILIKE '%{query}%'
    OR host_name ILIKE '%{query}%'
    OR user_name ILIKE '%{query}%'
    OR src_ip::text = query (if valid IP)
    OR process_hash_sha256 = query (if 64 chars)
  )

Also search udm_events_archive if date range extends past 30 days
Return: events array, total_count, search_time_ms
Rate limit: max 10 searches/min per org (expensive query)


FINAL STEPS:
1. Update Wazuh webhook to use new pipeline (not bypass it)
2. Verify all existing alerts in DB still work with new schema
3. Use Supabase connector to apply all migrations
4. Run npm run build — fix ALL errors
5. ZERO errors before commit
6. Create SPRINT0_5_COMPLETE.md:
   document supported formats, parser coverage, retention policy  