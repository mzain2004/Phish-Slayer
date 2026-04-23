Task: Build complete Alert Deduplication Engine for PhishSlayer SOC platform

Read ONLY these files:
lib/soc/types.ts
lib/soc/deduplication.ts
supabase/migrations/20260424000001_cases.sql

Do not read any other file.

Requirements:

1. Update lib/soc/types.ts to add these types if not already present:
RawAlert with fields: id, rule_id, rule_description, source_ip, destination_ip,
agent_id, agent_name, alert_type, severity_level number 1-15, timestamp, raw_log jsonb

DeduplicatedGroup with fields: group_key string, rule_id, source_ip, alerts RawAlert array,
count number, first_seen Date, last_seen Date, representative_alert RawAlert,
suppressed boolean, suppression_reason string or null

2. Rewrite lib/soc/deduplication.ts with these functions:

Function generateGroupKey taking source_ip and rule_id and timestamp:
Return string combining source_ip and rule_id
Two alerts belong to same group if same source_ip AND same rule_id AND within 15 minute window

Function deduplicateAlerts taking RawAlert array returning DeduplicatedGroup array:
Sort alerts by timestamp ascending
Group by source_ip plus rule_id within 15 minute sliding windows
For each group set count, first_seen, last_seen, representative_alert as highest severity alert

Function applyNoiseFilter taking DeduplicatedGroup array returning DeduplicatedGroup array:
Suppress group if source_ip is in KNOWN_SCANNER_RANGES constant
Suppress group if count is greater than 1000 in under 60 seconds — likely scanner
Suppress group if rule_id is in KNOWN_FP_RULES constant
Set suppressed true and suppression_reason on suppressed groups
Do not delete suppressed groups — keep them with suppressed flag

Define KNOWN_SCANNER_RANGES as string array at top of file:
Include these CIDRs: 45.33.32.0/24, 209.197.3.0/24, 71.6.135.0/24

Define KNOWN_FP_RULES as string array at top of file:
Include: 5706, 5710, 5712 — these are common Wazuh false positive rule IDs

Function getDeduplicationStats taking DeduplicatedGroup array:
Return total_alerts number, unique_groups number, suppressed_groups number,
noise_reduction_percent number, top_talkers array of top 5 source_ips by alert count

3. Create new file supabase/migrations/20260424000002_dedup.sql:
Add table alert_groups: id uuid primary key, group_key text unique, rule_id text,
source_ip text, count integer default 1, first_seen timestamptz, last_seen timestamptz,
suppressed boolean default false, suppression_reason text, representative_alert jsonb,
created_at timestamptz default now(), updated_at timestamptz default now()

Add table suppression_rules: id uuid primary key, rule_type text ip/rule_id/cidr,
value text, reason text, created_by text, created_at timestamptz default now(),
hit_count integer default 0, last_hit timestamptz

Add RLS policies using auth.jwt() ->> sub pattern same as existing tables

Run npm run build, fix all errors.
Commit: feat: complete alert deduplication engine with noise filter, push.