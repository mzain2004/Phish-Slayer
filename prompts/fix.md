Before starting, list every file you will create. 
Create one file at a time. After each file say "FILE DONE" then continue.
Do not stop until all files complete.

You are building L3 executive and compliance features for PhishSlayer — agentic SOC platform.
Stack: Next.js 15, TypeScript, Supabase, Clerk, Groq (llama-3.3-70b-versatile).

ANTI-HALLUCINATION RULES:
- Before touching any table: grep supabase/migrations/ for it. If not found, create migration first.
- Before any npm import: cat package.json | grep <pkg>. Not found = install or implement manually.
- If subtask fails: console.error the failure, skip, continue with next. Never abort all.
- npm run build at end. Fix ALL TypeScript errors. List every file touched.
- DO NOT touch server.js or middleware.ts ever.

TASK 1 — CISO Executive Dashboard:
1. Create lib/l3/cisoMetrics.ts
   - Function: getCISOMetrics(orgId, days=30) → CISOMetrics
   - Pull from Supabase:
     MTTD: avg(acknowledged_at - created_at) WHERE acknowledged_at IS NOT NULL
     MTTR: avg(resolved_at - created_at) FROM incidents WHERE status='resolved'
     Alert volume by day (last 30 days)
     SLA breach rate: alerts where acknowledged_at - created_at > 4hr / total alerts
     Top attack types (COUNT by alert category)
     False positive rate: is_false_positive=true / total alerts
     Escalation rate: escalated / total
     Analyst performance: alerts handled per analyst (grouped by acknowledged_by)
   - Return typed CISOMetrics object
2. Create app/api/l3/ciso-metrics/route.ts — GET { organizationId, days }
3. Create /dashboard/ciso page:
   - Guard: only show if user role = 'admin' or 'owner' (check via get_my_role())
   - Stat cards: MTTD, MTTR, SLA Breach %, FP Rate, Total Incidents this month
   - Line chart: alert volume last 30 days (use recharts — check package.json first)
   - Pie/bar chart: top 5 attack types
   - Analyst leaderboard: alerts handled, avg triage time
   - Keep glassmorphism design

TASK 2 — Risk Score Per Org:
1. Create lib/l3/orgRiskScore.ts
   - Function: calculateOrgRisk(orgId) → { score: number, level: string, factors: RiskFactor[] }
   - Factors (weighted):
     - Open critical alerts: 25pts each, max 40
     - Unresolved credential leaks: 15pts each, max 30
     - High-risk users (UBA score>80): 10pts each, max 20
     - Critical open CVEs: 5pts each, max 20
     - No detections for common MITRE techniques: -10pts penalty per gap (capped at 30)
   - Total 0-100, level: LOW/MEDIUM/HIGH/CRITICAL
2. Store in organizations table:
   ALTER TABLE organizations ADD COLUMN IF NOT EXISTS risk_score INTEGER DEFAULT 0;
   ALTER TABLE organizations ADD COLUMN IF NOT EXISTS risk_level TEXT DEFAULT 'LOW';
   ALTER TABLE organizations ADD COLUMN IF NOT EXISTS risk_updated_at TIMESTAMPTZ;
3. Create app/api/l3/org-risk/route.ts — GET, POST (trigger recalculate)
4. Create app/api/cron/org-risk-update/route.ts — recalculate all orgs daily
5. Show org risk score badge on /dashboard main page header

TASK 3 — Detection Coverage Gap Analysis:
1. Create lib/l3/detectionCoverage.ts
   - MITRE ATT&CK techniques that PhishSlayer should cover (define array of ~40 key techniques):
     T1078 Valid Accounts, T1566 Phishing, T1190 Exploit Public-Facing App,
     T1059 Command Scripting, T1053 Scheduled Task, T1055 Process Injection,
     T1003 OS Credential Dumping, T1021 Remote Services, T1071 App Layer Protocol,
     T1041 Exfil over C2, ... (include all common ones)
   - Function: analyzeCoverage(orgId) → CoverageReport
   - Query detection_rules table: get all mitre_technique values for active rules
   - Query alerts table: get all mitre_tags from recent alerts (last 90 days)
   - Diff: techniques with no rule AND no recent alert = gap
   - Return: { covered[], gaps[], coveragePercent, recommendations[] }
   - Groq: generate 3 specific detection recommendations for top gaps
2. Create app/api/l3/detection-coverage/route.ts — GET { organizationId }
3. Create /dashboard/detection-coverage page:
   - MITRE ATT&CK matrix view (simplified grid)
   - Green = covered, Red = gap, Yellow = partial
   - Coverage % gauge
   - Groq recommendations list
   - "Create Rule" button per gap → opens detection-rules page with pre-filled template

TASK 4 — Compliance Posture Dashboard:
1. Create lib/l3/complianceMapper.ts
   - Map SOC detections + features to compliance controls:
     NIST CSF: Identify/Protect/Detect/Respond/Recover
     ISO 27001: A.12 (Operations), A.16 (Incidents), A.14 (Development)
     SOC 2 Type II: CC6, CC7, CC8
   - Function: getCompliancePosture(orgId) → ComplianceReport
   - For each control: check if PhishSlayer capability covers it
   - Example: CC7.2 (System monitoring) → covered if alerts table has >0 rules firing
   - Return: { framework, controls[], passCount, failCount, evidenceLinks[] }
2. Create app/api/l3/compliance/route.ts — GET { organizationId, framework }
3. Create /dashboard/compliance page:
   - Framework selector: NIST CSF / ISO 27001 / SOC 2
   - Control list with PASS/FAIL/PARTIAL badges
   - Evidence snippets (link to actual data: "47 alerts this month → CC7.2 evidence")
   - Export button: generate PDF evidence package (use existing PDF lib or jsPDF if present)

TASK 5 — Post-Incident Review + Knowledge Base:
1. Create Supabase migration: supabase/migrations/20260429600000_pir_knowledge.sql
   CREATE TABLE IF NOT EXISTS post_incident_reviews (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
     incident_id UUID,
     title TEXT NOT NULL,
     timeline TEXT,
     root_cause TEXT,
     impact TEXT,
     response_actions TEXT,
     lessons_learned TEXT,
     action_items JSONB DEFAULT '[]',
     created_by TEXT,
     created_at TIMESTAMPTZ DEFAULT NOW()
   );
   CREATE TABLE IF NOT EXISTS knowledge_base (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
     title TEXT NOT NULL,
     category TEXT CHECK (category IN ('runbook','playbook','ttp_reference','past_incident','procedure')),
     content TEXT,
     tags TEXT[],
     created_by TEXT,
     updated_at TIMESTAMPTZ DEFAULT NOW(),
     created_at TIMESTAMPTZ DEFAULT NOW()
   );
   RLS on both tables. Org-scoped policies.
2. Create CRUD routes:
   app/api/pir/route.ts — GET (list), POST (create)
   app/api/pir/[id]/route.ts — GET, PUT
   app/api/knowledge-base/route.ts — GET, POST
   app/api/knowledge-base/[id]/route.ts — GET, PUT, DELETE
3. Create /dashboard/knowledge-base page:
   - Search bar + category filter
   - Card grid of articles
   - Click → full article view with markdown render

After all tasks:
npm run build — fix ALL TypeScript errors.
git add -A && git commit -m "feat: L3 CISO dashboard, org risk score, detection coverage, compliance, PIR, KB" && git push origin main
List all files created/modified.