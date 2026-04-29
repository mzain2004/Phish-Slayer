Before starting, list every file you will create. 
Create one file at a time. After each file say "FILE DONE" then continue.
Do not stop until all files complete.

You are building L1 SOC features for PhishSlayer — agentic SOC platform.
Stack: Next.js 15, TypeScript, Supabase, Clerk auth, Groq (llama-3.3-70b-versatile), MongoDB Atlas.
Supabase project: txnkvbddcjdldksdjueu

ANTI-HALLUCINATION RULES (read before touching code):
- Before using ANY npm package, run: cat package.json | grep <pkg>
  If not found, implement manually in TypeScript OR install it. No guessing.
- Before creating any file, run: find . -name "<filename>" 2>/dev/null
  If exists, edit it — never duplicate.
- Before any Supabase query, run: grep -r "supabase.from" lib/ --include="*.ts" -l
  Copy exact client initialization pattern from existing files.
- If ANY subtask hits an error: log the error, skip, continue next subtask.
  Never stop the entire build for one failure.
- After ALL subtasks: run npm run build. Fix EVERY TypeScript error shown.
  Do not commit if build fails.

TASK 1 — Alert Deduplication Engine:
1. Read existing: cat lib/orchestrator.ts (or wherever alerts are processed)
2. Create lib/l1/alertDedup.ts
   - Function: deduplicateAlert(newAlert, orgId) → { isDuplicate, groupId, count }
   - Logic: query alerts table, group by (rule_id OR title, source_ip, org_id)
     within sliding 1-hour window
   - If match exists: increment a dedup_count field, return isDuplicate=true
   - If new: create dedup group, return isDuplicate=false
   - Threshold: same alert fired >3x in 1hr = duplicate group
3. Add columns to alerts table via Supabase client (use execute_sql pattern — check existing migrations first):
   ALTER TABLE alerts ADD COLUMN IF NOT EXISTS dedup_group_id TEXT;
   ALTER TABLE alerts ADD COLUMN IF NOT EXISTS dedup_count INTEGER DEFAULT 1;
   ALTER TABLE alerts ADD COLUMN IF NOT EXISTS is_suppressed BOOLEAN DEFAULT false;
4. Wire into existing alert ingestion: find app/api/wazuh/alert/route.ts or similar
   Run deduplicateAlert before saving — if duplicate, mark suppressed, still save but skip orchestrator

TASK 2 — Alert Suppression Rules:
1. Create lib/l1/suppressionEngine.ts
   - Function: checkSuppression(alert, orgId) → { suppressed: boolean, ruleId?: string }
   - Query suppression_rules table (create if not exist)
   - Rule types: IP-based, domain-based, time-window (e.g. 2am–4am), severity-based
   - Match logic: check all active rules → if any match, return suppressed=true
2. Create Supabase migration file: supabase/migrations/20260429100000_suppression_rules.sql
   CREATE TABLE IF NOT EXISTS suppression_rules (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
     name TEXT NOT NULL,
     rule_type TEXT CHECK (rule_type IN ('ip','domain','time_window','severity','rule_name')),
     match_value TEXT,
     time_start TIME,
     time_end TIME,
     is_active BOOLEAN DEFAULT true,
     created_by TEXT,
     expires_at TIMESTAMPTZ,
     created_at TIMESTAMPTZ DEFAULT NOW()
   );
   ALTER TABLE suppression_rules ENABLE ROW LEVEL SECURITY;
   Add org-scoped RLS policies (SELECT/INSERT/UPDATE/DELETE).
3. Create app/api/suppression-rules/route.ts — GET (list), POST (create)
4. Create app/api/suppression-rules/[id]/route.ts — PUT, DELETE
5. Wire suppressionEngine into alert ingestion (same file as dedup): run check before dedup

TASK 3 — False Positive Engine:
1. Create lib/l1/falsePositiveEngine.ts
   - Function: markFalsePositive(alertId, orgId, analystId) → void
     - Update alert.is_false_positive = true
     - Extract alert fingerprint: { rule_id, source_ip, destination_port, alert_type }
     - Store fingerprint in fp_fingerprints table
   - Function: checkFalsePositive(alert, orgId) → { isFP: boolean, confidence: number }
     - Exact match fingerprint → confidence 1.0
     - Partial match (same rule + same IP range /24) → confidence 0.7
     - Return suppressed if confidence > 0.8
2. Create Supabase migration: supabase/migrations/20260429200000_fp_engine.sql
   CREATE TABLE IF NOT EXISTS fp_fingerprints (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
     rule_id TEXT,
     source_ip TEXT,
     source_ip_range TEXT,
     destination_port INTEGER,
     alert_type TEXT,
     marked_by TEXT,
     hit_count INTEGER DEFAULT 1,
     last_hit_at TIMESTAMPTZ DEFAULT NOW(),
     created_at TIMESTAMPTZ DEFAULT NOW()
   );
   ALTER TABLE fp_fingerprints ENABLE ROW LEVEL SECURITY;
   Add org-scoped RLS (SELECT/INSERT/UPDATE).
   ALTER TABLE alerts ADD COLUMN IF NOT EXISTS is_false_positive BOOLEAN DEFAULT false;
   ALTER TABLE alerts ADD COLUMN IF NOT EXISTS fp_marked_by TEXT;
   ALTER TABLE alerts ADD COLUMN IF NOT EXISTS fp_marked_at TIMESTAMPTZ;
3. Create app/api/alerts/[id]/false-positive/route.ts
   POST: mark alert as FP, store fingerprint, return updated alert

TASK 4 — Alert Acknowledgment + Triage Timer:
1. Add columns (check if exist first):
   ALTER TABLE alerts ADD COLUMN IF NOT EXISTS acknowledged_by TEXT;
   ALTER TABLE alerts ADD COLUMN IF NOT EXISTS acknowledged_at TIMESTAMPTZ;
   ALTER TABLE alerts ADD COLUMN IF NOT EXISTS assigned_to TEXT;
2. Create app/api/alerts/[id]/acknowledge/route.ts
   POST { analystId } → set acknowledged_by, acknowledged_at
   If already acknowledged by different analyst → return 409 conflict (prevent double-handle)
3. Create app/api/alerts/[id]/assign/route.ts
   POST { analystId } → set assigned_to
4. In alert list query (find existing GET /api/alerts route), add computed field:
   triage_age_seconds: seconds since created_at if not acknowledged

TASK 5 — Watchlist:
1. Create lib/l1/watchlistMatcher.ts
   - On every new alert: extract IPs, domains, emails, users from alert data
   - Query watchlist table for any matches
   - If hit: boost alert severity, add tag "WATCHLIST_HIT", create notification
2. Create Supabase migration: supabase/migrations/20260429300000_watchlist.sql
   CREATE TABLE IF NOT EXISTS watchlist (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
     entity_type TEXT CHECK (entity_type IN ('ip','domain','email','user','hash')),
     entity_value TEXT NOT NULL,
     reason TEXT,
     added_by TEXT,
     expires_at TIMESTAMPTZ,
     hit_count INTEGER DEFAULT 0,
     last_hit_at TIMESTAMPTZ,
     created_at TIMESTAMPTZ DEFAULT NOW(),
     UNIQUE(organization_id, entity_type, entity_value)
   );
   ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;
   Add org-scoped RLS (SELECT/INSERT/DELETE).
3. Create app/api/watchlist/route.ts — GET, POST
4. Create app/api/watchlist/[id]/route.ts — DELETE
5. Wire watchlistMatcher into alert ingestion pipeline

TASK 6 — Frontend pages (glassmorphism, bg #0a0a0f, purple #6366F1, cyan #00d4aa):
a) /dashboard/suppression-rules
   - Table: name, type, match_value, time window, active toggle
   - "Add Rule" modal with form fields per rule_type
b) Wire existing alerts table:
   - Add "ACK" button per row → POST /api/alerts/[id]/acknowledge
   - Add "Assign" dropdown per row
   - Add "Mark FP" button → POST /api/alerts/[id]/false-positive
   - Show dedup_count badge if >1 ("x12 duplicates")
   - Show suppressed alerts as grayed out with "Suppressed" tag

After all tasks:
npm run build
Fix EVERY TypeScript error before finishing.
List all files created/modified.
Do git add -A && git commit -m "feat: L1 alert dedup, suppression, FP engine, ACK, watchlist" && git push origin main