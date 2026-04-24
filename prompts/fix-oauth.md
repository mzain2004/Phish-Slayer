Task: Build complete Log Ingestion Pipeline for PhishSlayer SOC platform

Read ONLY these files:
lib/soc/types.ts
lib/soc/deduplication.ts
app/api/alerts/route.ts

Do not read any other file.

Requirements:

1. Run this first before writing any code:
npm install node-imap @types/node-imap mailparser @types/mailparser

2. Update lib/soc/types.ts to add these types:

RawLogEntry with fields: id string, source_type enum syslog or cef or leef or
json or email or cloudtrail or azure_activity, source_ip string or null,
raw_content string, parsed_fields jsonb, ingested_at Date,
normalized NormalizedLog or null, org_id string

NormalizedLog with fields: timestamp Date, source_ip string or null,
destination_ip string or null, user string or null, hostname string or null,
action string, outcome enum success or failure or unknown,
severity number 1-15, category string, raw_event_id string or null,
mitre_tactic string or null, mitre_technique string or null,
extra_fields jsonb

LogIngestionStats with fields: total_received number, total_parsed number,
total_failed number, sources_breakdown Record of string to number,
avg_parse_time_ms number, last_ingested_at Date or null

CEFEvent with fields: version string, device_vendor string, device_product string,
device_version string, signature_id string, name string, severity string,
extensions Record of string to string

3. Create lib/ingestion/normalizer.ts:

Function normalizeSyslog taking raw string returning NormalizedLog:
Parse RFC 5424 format: priority facility severity timestamp hostname app_name msg
Extract PRI value: facility = Math.floor(pri/8), severity = pri % 8
Handle both RFC 3164 and RFC 5424 timestamp formats
Map syslog severity 0-7 to 1-15 scale: (severity * 2) + 1
Return NormalizedLog with all extracted fields
Wrap entire function in try-catch — on error return best-effort NormalizedLog with
action: parse_error, outcome: unknown, severity: 5

Function normalizeCEF taking raw string returning NormalizedLog:
Parse CEF:0|vendor|product|version|sig_id|name|severity|extensions format
Split on pipe — first 7 fields are header
Parse extensions as key=value pairs
Map CEF severity 0-10 to 1-15 scale: Math.round((sev / 10) * 14) + 1
Extract src, dst, suser, duser, act from extensions
Wrap in try-catch same as above

Function normalizeLEEF taking raw string returning NormalizedLog:
Parse LEEF:2.0|vendor|product|version|eventid|attrs format
Split on pipe for header, parse tab-separated attributes
Extract src, dst, usrName, proto, devTime
Wrap in try-catch same as above

Function normalizeJSON taking raw string returning NormalizedLog:
Parse JSON with try-catch
Look for timestamp: check fields timestamp, time, @timestamp, eventTime, TimeGenerated
Look for source IP: check src, source, sourceIP, source_ip, remoteIP
Look for user: check user, username, userId, actor
Return NormalizedLog with best-effort field mapping
Never throw — always return something

Function normalizeCloudTrail taking raw string returning NormalizedLog:
Parse AWS CloudTrail event JSON
Extract: eventTime, sourceIPAddress, userIdentity.userName or userIdentity.arn,
eventName, errorCode, awsRegion
Map errorCode present to outcome failure otherwise success
Set category to cloudtrail
Wrap in try-catch

Function normalizeAzureActivity taking raw string returning NormalizedLog:
Parse Azure Activity Log JSON
Extract: eventTimestamp, callerIpAddress, caller, operationName.value,
resultType, resourceType
Map resultType Failed to outcome failure otherwise success
Set category to azure_activity
Wrap in try-catch

Function autoDetectAndNormalize taking raw string returning NormalizedLog:
If starts with CEF:0 — call normalizeCEF
Else if starts with LEEF: — call normalizeLEEF
Else if matches regex ^\<\d+\> — call normalizeSyslog
Else if valid JSON — call normalizeJSON
Else call normalizeSyslog as fallback
Never throw — always return NormalizedLog

4. Create lib/ingestion/pipeline.ts with IngestionPipeline class:

Constructor takes supabase client

Method ingestLog taking raw_content string and source_type string
and org_id string and source_ip string or null returning RawLogEntry:
Call autoDetectAndNormalize from normalizer.ts
Insert into raw_logs table: org_id, source_type, source_ip,
raw_content, parsed_fields as normalized, normalized as normalized,
processed false, alert_created false
If normalized.severity is above 8:
Insert into alerts table: org_id, alert_type from normalized.category,
severity mapped to p1/p2/p3/p4, source_ip, raw_log as normalized jsonb,
status open
Update raw_logs row: processed true, alert_created true
Return RawLogEntry

Method ingestBatch taking entries array of raw_content plus source_type
plus org_id plus source_ip objects returning LogIngestionStats:
Use Promise.allSettled to process all in parallel
Track fulfilled count as total_parsed, rejected count as total_failed
Record start time and calculate avg_parse_time_ms
Return LogIngestionStats

Method ingestEmail taking supabase client returning number:
Import Imap from node-imap and simpleParser from mailparser
Read config from env: IMAP_HOST, IMAP_PORT, IMAP_USER, IMAP_PASSWORD
If any env var missing: log warning IMAP not configured — skipping and return 0
Connect to IMAP with tls: IMAP_PORT equals 993
Search UNSEEN in INBOX
For each email message:
Use simpleParser to extract subject, from.text, text body, attachments list
Build raw_content string: From: {from} Subject: {subject} Body: {body preview 500 chars}
Call ingestLog with source_type email and org_id system
Mark message as seen with imap.addFlags
Catch all errors per-message and continue to next
On complete return total count processed

Method getStats taking org_id string returning LogIngestionStats:
Query raw_logs table count by source_type for this org_id last 24h
Return LogIngestionStats

5. Create app/api/ingest/route.ts:
POST endpoint for single log entry
Header auth: validate x-api-key header against process.env.INGEST_API_KEY
If INGEST_API_KEY not set in env: return 503 ingestion not configured
Zod body validation: raw_content string, source_type string, org_id string,
source_ip string optional
Call pipeline.ingestLog and return result
Add dynamic export and runtime edge

6. Create app/api/ingest/batch/route.ts:
POST endpoint for batch up to 1000 entries
Same header auth as above
Zod validation: array max 1000 items each with raw_content and source_type
and org_id and source_ip optional
Call pipeline.ingestBatch and return LogIngestionStats
Add dynamic export and runtime edge

7. Create app/api/ingest/email/route.ts:
POST endpoint to trigger IMAP ingestion manually
Clerk auth required
Call pipeline.ingestEmail and return count
Add dynamic export and runtime edge

8. Create supabase/migrations/20260424000009_ingestion.sql:

CREATE TABLE IF NOT EXISTS public.raw_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id TEXT NOT NULL,
  source_type TEXT NOT NULL,
  source_ip TEXT,
  raw_content TEXT NOT NULL,
  parsed_fields JSONB DEFAULT '{}'::jsonb,
  normalized JSONB DEFAULT '{}'::jsonb,
  ingested_at TIMESTAMPTZ DEFAULT now(),
  processed BOOLEAN DEFAULT false,
  alert_created BOOLEAN DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_raw_logs_org_id ON public.raw_logs(org_id);
CREATE INDEX IF NOT EXISTS idx_raw_logs_source_type ON public.raw_logs(source_type);
CREATE INDEX IF NOT EXISTS idx_raw_logs_ingested_at ON public.raw_logs(ingested_at DESC);
CREATE INDEX IF NOT EXISTS idx_raw_logs_processed ON public.raw_logs(processed);

ALTER TABLE public.raw_logs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'raw_logs'
  AND policyname = 'raw_logs_policy') THEN
    CREATE POLICY "raw_logs_policy" ON public.raw_logs
    USING (auth.jwt() IS NOT NULL);
  END IF;
END $$;

9. Add to .env.example if not present:
IMAP_HOST=
IMAP_PORT=993
IMAP_USER=
IMAP_PASSWORD=
INGEST_API_KEY=

10. Update app/api/cron/route.ts:
Add email ingestion trigger at top of cron handler before intel sync
Call pipeline.ingestEmail — log result
Order must be: email ingestion first, then intel sync, then hunts

Run npm run build, fix all errors.
Commit: feat: complete log ingestion pipeline syslog CEF LEEF JSON email, push.
After green run migration 20260424000009 in Supabase SQL Editor.
Ping for P19 — Multi-Tenant MSSP Portal.