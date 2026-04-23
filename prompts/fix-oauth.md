Task: Build complete Auto-Close Engine for PhishSlayer SOC platform

Read ONLY these files:
lib/soc/types.ts
lib/soc/deduplication.ts
supabase/migrations/20260424000002_dedup.sql

Do not read any other file.

Requirements:

1. Update lib/soc/types.ts to add these types:

SuppressionRule with fields: id string, rule_type enum ip or cidr or rule_id or
hostname or application, value string, reason string, created_by string,
hit_count number, last_hit Date or null, active boolean

AutoCloseResult with fields: case_id string, action enum suppressed or auto_closed
or escalated, reason string, suppression_rule_id string or null,
confidence number 0-100, timestamp Date

FeedbackEntry with fields: id string, case_id string, original_action string,
analyst_decision enum true_positive or false_positive or benign,
analyst_id string, notes string or null, created_at Date,
alert_type string, source_ip string, rule_id string

2. Create lib/soc/autoclose.ts with AutoCloseEngine class:

Constructor takes supabase client

Method evaluateCase taking case_id string and alert RawAlert returning AutoCloseResult:

Step 1 check IP whitelist:
Query suppression_rules table where rule_type is ip and value equals alert source_ip and active is true
If match found: update case status to closed, log to case_timeline with actor system,
increment hit_count on rule, return AutoCloseResult with action suppressed

Step 2 check CIDR ranges:
Query suppression_rules where rule_type is cidr and active is true
Check if alert source_ip falls within any CIDR using simple IP range comparison
Known scanner CIDRs to always include: 45.33.32.0/24, 209.197.3.0/24, 71.6.135.0/24
These are Shodan, Censys, and known research scanners
If match: auto-close case with reason known_scanner

Step 3 check rule_id suppression:
Query suppression_rules where rule_type is rule_id and value equals alert rule_id
Known Wazuh false positive rule IDs to always suppress: 5706, 5710, 5712, 5716, 554
If match: auto-close with reason known_false_positive_rule

Step 4 check application whitelist:
Query suppression_rules where rule_type is application
Check if alert raw_log contains any whitelisted application name
If match: auto-close with reason whitelisted_application

Step 5 check FP feedback loop:
Query feedback_entries table where source_ip equals alert source_ip
and rule_id equals alert rule_id and analyst_decision is false_positive
Count matching entries
If count is greater than or equal to 3: auto-close with reason learned_false_positive
This is the feedback loop — analyst decisions train suppression automatically

If no rule matches: return AutoCloseResult with action escalated meaning needs human review

Method recordFeedback taking FeedbackEntry returning void:
Insert into feedback_entries table
Check if this pushes any source_ip plus rule_id combination to 3 or more false_positive decisions
If threshold reached: automatically insert new suppression_rule with rule_type ip
Log to console: Auto-suppression rule created for {source_ip} based on analyst feedback

Method getSuppressionsStats returning object:
Query suppression_rules count by rule_type
Query feedback_entries count by analyst_decision
Query cases closed in last 24 hours with actor system meaning auto-closed
Return total_suppressions, rules_by_type, fp_rate, auto_close_rate last 24h

Method addSuppressionRule taking SuppressionRule returning void:
Insert into suppression_rules table
Validate no duplicate value plus rule_type combination

3. Create supabase/migrations/20260424000003_autoclose.sql:

Table feedback_entries: id uuid primary key, case_id uuid references cases,
original_action text, analyst_decision text true_positive or false_positive or benign,
analyst_id text, notes text, alert_type text, source_ip text, rule_id text,
created_at timestamptz default now()

Table auto_close_log: id uuid primary key, case_id uuid references cases,
action text, reason text, suppression_rule_id uuid references suppression_rules,
confidence integer, created_at timestamptz default now()

Add index on feedback_entries source_ip and rule_id for fast FP lookup
Add index on suppression_rules value and rule_type for fast matching
Add RLS policies using auth.jwt() ->> sub pattern same as existing tables

4. Create app/api/cases/[id]/feedback/route.ts:
POST endpoint accepting analyst_decision and notes and case_id
Auth: const userId from auth() from @clerk/nextjs/server
Zod validation: analyst_decision must be true_positive or false_positive or benign
Call autoCloseEngine.recordFeedback with validated payload
Return updated case with new suppression rule if auto-created
Add dynamic and runtime exports

5. Create app/api/autoclose/stats/route.ts:
GET endpoint returning suppression statistics
Auth required
Call autoCloseEngine.getSuppressionsStats
Return stats as JSON
Add dynamic and runtime exports

Run npm run build, fix all errors.
Apply migration 20260424000003_autoclose.sql in Supabase Dashboard SQL Editor manually.
Commit: feat: complete auto-close engine with FP feedback loop, push.