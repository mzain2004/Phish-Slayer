@GEMINI.md @graph.md

You are building Sprint 2: MITRE ATT&CK Coverage Engine + Auto-Tagger.
Layer 0, Sprint 0.5, and Sprint 1 are COMPLETE and deployed.
Build is currently green. Keep it green.

AUDIT FIRST:
1. Read supabase/migrations/20260424000006_sigma.sql — note existing table structure
2. Read supabase/migrations/20260428400000_detection_rules.sql — note existing table structure
3. Read lib/agents/enrichment/ or lib/soc/enrichment/ — find where alert enrichment happens
4. DO NOT create tables that already exist. ALTER them if needed, CREATE only if missing.
5. Fix any build errors before adding new code.

USE SUPABASE CONNECTOR for all migration steps.

═══════════════════════════════════════
PART 1 — MITRE DATA LAYER
═══════════════════════════════════════

1. MITRE ATT&CK Static Data (/lib/mitre/attack-data.ts)

Build a comprehensive in-file dataset of MITRE ATT&CK Enterprise tactics and techniques.
Do NOT fetch from external API at runtime — embed the data.
Include minimum 150 techniques across all 14 tactics.

Structure:
interface MITRETactic {
  id: string       // e.g., "TA0001"
  name: string     // "Initial Access"
  order: number    // 1-14
}

interface MITRETechnique {
  id: string       // e.g., "T1566"
  name: string     // "Phishing"
  tactic_id: string
  subtechniques: { id: string, name: string }[]  // e.g., T1566.001
  detection_difficulty: 'easy' | 'moderate' | 'hard'
}

Export: tactics[], techniques[], getTechniqueById(), getByTactic()

2. MITRE Coverage Table

Use Supabase connector. Check if mitre_coverage table exists first.
If it exists, ALTER to add missing columns. If not, CREATE:

CREATE TABLE IF NOT EXISTS mitre_coverage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  technique_id TEXT NOT NULL,
  tactic_id TEXT NOT NULL,
  detection_rule_id UUID REFERENCES detection_rules(id),
  coverage_level INTEGER DEFAULT 0,
    -- 0=no coverage, 1=partial(log), 2=good(alert), 3=full(auto-response)
  last_detected_at TIMESTAMPTZ,
  detection_count INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(org_id, technique_id, detection_rule_id)
);
ALTER TABLE mitre_coverage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_isolation" ON mitre_coverage
  USING (org_id = current_setting('app.current_org_id')::uuid);


═══════════════════════════════════════
PART 2 — AUTO-TAGGER AGENT
═══════════════════════════════════════

3. Rule-Based Tagger (/lib/mitre/auto-tagger.ts)

Map alert data to MITRE techniques WITHOUT LLM first.
Build a mapping dictionary: common alert rule names/keywords → technique IDs.

Examples:
  "Brute Force" or "Failed Login" → T1110 (Brute Force)
  "Phishing" or "Suspicious Email" → T1566 (Phishing)
  "PowerShell Execution" → T1059.001 (PowerShell)
  "Mimikatz" or "Credential Dump" → T1003 (OS Credential Dumping)
  "Lateral Movement" or "PsExec" → T1021.002 (SMB/Windows Admin Shares)
  "DNS Tunneling" → T1071.004 (DNS)
  "Scheduled Task" → T1053.005 (Scheduled Task)

Build:
function ruleBasedTag(alert: {rule_name: string, event_category: string, process_name?: string}): MITRETechnique[]

4. LLM Semantic Tagger (/lib/mitre/llm-tagger.ts)

When rule-based returns empty, use LLM as fallback.
Prompt: Given this alert [rule_name, event details], return MITRE ATT&CK technique IDs.
System prompt must include the full tactic/technique list from attack-data.ts.
Parse LLM output: extract Txxxx.xxxx patterns via regex.
Validate: check extracted IDs against attack-data.ts. Discard invalid IDs.
Use Groq for speed. If Groq fails, return empty array (never crash).

5. Tagging Orchestrator

async function tagAlert(alert: any, orgId: string): Promise<string[]>
  1. Try ruleBasedTag first
  2. If empty, try llmTagger
  3. Deduplicate technique IDs
  4. Update alerts table mitre_tags column (check if column exists, add if missing)
  5. Update mitre_coverage table: increment detection_count, update last_detected_at
  6. Return tagged technique IDs

Wire this into Sprint 1 enrichment pipeline:
  Find where enrichment runs. Add tagAlert() call after enrichment completes.
  Store tags in alert record.


═══════════════════════════════════════
PART 3 — COVERAGE ENGINE
═══════════════════════════════════════

6. Coverage Calculator (/lib/mitre/coverage-engine.ts)

async function calculateCoverage(orgId: string): Promise<CoverageReport>
  1. Query mitre_coverage for this org
  2. Compare against full attack-data.ts list
  3. Per tactic: calculate % techniques with coverage_level > 0
  4. Overall score: total covered / total techniques * 100
  5. Return: { overall_score, tactic_scores: {tactic_id, name, coverage_percent, covered_count, total_count}[], gaps: string[] }

7. Gap Prioritizer

async function getCoverageGaps(orgId: string): Promise<Gap[]>
  Gaps = techniques where coverage_level = 0
  Prioritize by:
    1. Technique detection_difficulty = 'easy' (we should definitely have this)
    2. Technique is in top 20 most-attacked (hardcode list: T1566, T1078, T1059, T1003, T1486, T1047, etc)
  Return ordered list: [{ technique_id, name, reason: "High frequency + easy to detect" }]


═══════════════════════════════════════
PART 4 — ADVERSARY SIMULATION SCORER
═══════════════════════════════════════

8. Adversary Profiles (/lib/mitre/adversary-profiles.ts)

Embed TTP profiles for 5 major threat actors:
  - Lazarus Group (DPRK): T1566, T1059, T1003, T1105, T1071, T1486
  - APT28 (Fancy Bear): T1566, T1078, T1059, T1003, T1083
  - FIN7: T1566, T1059, T1003, T1021, T1071
  - LockBit: T1486, T1490, T1021, T1059, T1082
  - Phishing Campaigner: T1566, T1566.001, T1566.002, T1078

Structure:
interface AdversaryProfile {
  id: string
  name: string
  description: string
  techniques: string[]
}

9. Simulation Scorer

async function scoreAdversarySimulation(orgId: string, adversaryId: string): Promise<SimScore>
  1. Get adversary technique list
  2. Query mitre_coverage for those specific techniques
  3. Score: (techniques_detected / techniques_total) * 100
  4. Return: { adversary_name, score, would_detect: string[], would_miss: string[] }


═══════════════════════════════════════
PART 5 — API ROUTES
═══════════════════════════════════════

10. MITRE API Routes

All routes MUST have auth() guard and org_id scoping.

GET /api/mitre/coverage
  Returns: full coverage report for org (tactic scores, overall %, gaps)

GET /api/mitre/heatmap
  Returns: flattened matrix for frontend heatmap viz
  Format: [{ tactic_id, tactic_name, technique_id, technique_name, coverage_level, detection_count }]

GET /api/mitre/gaps
  Returns: prioritized gap list

POST /api/mitre/simulate
  Body: { adversary_id: string }
  Returns: simulation score

GET /api/mitre/techniques
  Query: ?tactic=TA0001
  Returns: full technique list for tactic from attack-data.ts


═══════════════════════════════════════
PART 6 — CRON + UPDATE
═══════════════════════════════════════

11. Coverage Update Cron

/app/api/cron/mitre-coverage/route.ts
  CRON_SECRET auth
  Run calculateCoverage for all orgs
  Cache result in organizations table (add mitre_coverage_score JSONB column if missing)
  Schedule: daily 04:00 UTC

FINAL STEPS:
1. Use Supabase connector for ALL migrations
2. Run npm run build — fix ALL errors
3. ZERO errors before commit
4. git commit -m "feat(mitre): build Sprint 2 MITRE ATT&CK coverage engine + auto-tagger"
5. git push origin main
6. Report: tables created/altered, techniques in dataset, build status