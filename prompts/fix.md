Before starting, list every file you will create. 
Create one file at a time. After each file say "FILE DONE" then continue.
Do not stop until all files complete.

You are building L1 SOC features for PhishSlayer — agentic SOC platform.
Stack: Next.js 15, TypeScript, Supabase, Clerk auth, Groq (llama-3.3-70b-versatile).

ANTI-HALLUCINATION RULES:
- Check package.json before using ANY library: cat package.json | grep <name>
- Check if file exists before creating: ls -la <path> 2>/dev/null
- Never invent Supabase table columns — check schema: grep existing migrations in supabase/migrations/
- If subtask errors: log error to console, skip, continue. Never abort all tasks.
- npm run build at end. Zero TS errors. No commit if build fails.

TASK 1 — Asset Criticality Scoring:
1. Check existing assets table: grep -r "assets" supabase/migrations/ | head -20
2. Add columns if not present:
   ALTER TABLE assets ADD COLUMN IF NOT EXISTS criticality TEXT DEFAULT 'medium'
     CHECK (criticality IN ('low','medium','high','critical'));
   ALTER TABLE assets ADD COLUMN IF NOT EXISTS owner_user_id TEXT;
   ALTER TABLE assets ADD COLUMN IF NOT EXISTS asset_tags TEXT[];
3. Create lib/l1/assetCriticality.ts
   - Function: getAlertCriticality(alert, orgId) → 'low'|'medium'|'high'|'critical'
   - Logic: look up asset by IP/hostname in assets table
   - If asset criticality=critical → auto-elevate alert to critical severity
   - If asset is executive device (tag 'executive') → always critical
   - Return final severity
4. Wire into alert ingestion: after saving alert, call getAlertCriticality, update severity if elevated
5. Create app/api/assets/[id]/criticality/route.ts — PUT { criticality, tags }

TASK 2 — Business Hours Anomaly:
1. Create lib/l1/businessHours.ts
   - Function: isBusinessHours(timestamp, timezone = 'UTC') → boolean
   - Business hours: Mon–Fri 08:00–18:00 org local time
   - Function: flagOutOfHoursLogin(alert) → boolean
   - If alert.type includes 'login'|'authentication'|'access' AND outside business hours
     → add flag 'OUT_OF_HOURS' to alert.tags
2. Wire into alert ingestion after assetCriticality check
3. Add org setting for timezone: ALTER TABLE organizations ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC';

TASK 3 — Bulk Alert Actions:
1. Create app/api/alerts/bulk/route.ts
   POST { alertIds: string[], action: 'close'|'assign'|'escalate'|'suppress'|'mark_fp', payload?: any }
   - Validate all alertIds belong to same org (security check — never skip this)
   - Execute action on all in single DB transaction
   - Return { success: number, failed: number, errors: string[] }
2. In frontend alerts table (find alerts page):
   - Add checkbox per row
   - "Select all" checkbox in header
   - Bulk action bar appears when ≥1 selected: Close, Assign, Escalate, Suppress, Mark FP
   - POST to /api/alerts/bulk with selected IDs

TASK 4 — Shift Handover Report:
1. Create lib/l1/shiftHandover.ts
   - Function: generateHandoverReport(orgId, shiftEndTime) → HandoverReport
   - Pull: open alerts, escalated cases, assigned-but-unresolved alerts, new IOCs added
   - Groq prompt: given this SOC data, write a professional shift handover note
   - Include: critical open items, analyst assignments, recommended next actions
2. Create Supabase migration: supabase/migrations/20260429400000_shift_handover.sql
   CREATE TABLE IF NOT EXISTS shift_handovers (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
     created_by TEXT NOT NULL,
     shift_end TIMESTAMPTZ NOT NULL,
     open_alerts_count INTEGER DEFAULT 0,
     critical_cases JSONB DEFAULT '[]',
     groq_narrative TEXT,
     raw_data JSONB,
     created_at TIMESTAMPTZ DEFAULT NOW()
   );
   ALTER TABLE shift_handovers ENABLE ROW LEVEL SECURITY;
   Org-scoped RLS (SELECT/INSERT).
3. Create app/api/shift-handover/route.ts
   POST { organizationId } → generate report → save → return
   GET → list past handovers for org
4. Create /dashboard/shift-handover page:
   - "Generate Handover" button → POST, show Groq narrative
   - List of past handovers with timestamp + summary

TASK 5 — Priority Queue Rebalancing:
1. Create lib/l1/queueRebalancer.ts
   - Function: rebalanceQueue(orgId) → void
   - Logic: when critical alert arrives, find all 'medium' alerts older than 2hr
     that have no acknowledgment → de-prioritize (update priority field to 'deferred')
   - Ensures critical alerts surface to top
2. Wire: call rebalanceQueue after any new critical alert is saved
3. Add column: ALTER TABLE alerts ADD COLUMN IF NOT EXISTS queue_priority INTEGER DEFAULT 50;
   Critical=100, High=75, Medium=50, Low=25. Deferred=10.
4. Update existing GET /api/alerts to ORDER BY queue_priority DESC, created_at DESC

After all tasks:
npm run build — fix ALL errors.
git add -A && git commit -m "feat: L1 asset criticality, bulk actions, shift handover, queue rebalancer" && git push origin main
List every file created/modified.