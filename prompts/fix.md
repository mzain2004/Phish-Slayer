@GEMINI.md @graph.md
New session. Read both files. Build MUST stay green.

Sprint 14: Hunt Hypothesis Generator + Intel-Driven Detection Pipeline.
Sprints 0-13 complete. Last commit: feat(metrics) Sprint 13.

AUDIT FIRST:
1. Read app/api/hunting/ — list all routes, what they do
2. Read lib/agents/ or lib/soc/ — find existing hunt logic
3. Read app/api/intel/ — find actor/campaign data
4. DO NOT recreate existing logic. Extend it.

USE SUPABASE CONNECTOR for all migrations.

═══ PART 1 — HUNT HYPOTHESIS SCHEMA ═══

Check/Create hunt_hypotheses table (ALTER if exists):
id, org_id(RLS), title, description,
hypothesis_source TEXT -- 'threat_intel'|'anomaly'|'actor_ttp'|'manual'
mitre_techniques TEXT[], -- techniques this hunt covers
hunt_query TEXT, -- generated SPL/KQL/SQL query
hunt_query_type TEXT, -- 'splunk'|'kql'|'elastic'|'sql'
confidence DECIMAL(3,2), -- 0-1 how likely to find something
priority TEXT DEFAULT 'MEDIUM', -- 'CRITICAL'|'HIGH'|'MEDIUM'|'LOW'
status TEXT DEFAULT 'PENDING', -- 'PENDING'|'RUNNING'|'COMPLETED'|'NO_FINDINGS'
result_summary TEXT, -- LLM-written summary of findings
findings_count INTEGER DEFAULT 0,
executed_at TIMESTAMPTZ,
created_at TIMESTAMPTZ DEFAULT now()

RLS: org_id = current_setting('app.current_org_id')::uuid

═══ PART 2 — HYPOTHESIS GENERATOR ═══

/lib/hunting/hypothesis-generator.ts

4 generation sources — implement all:

SOURCE 1 — Threat Intel Driven:
async function generateFromThreatIntel(orgId: string): Promise<HuntHypothesis[]>
1. Query threat_iocs WHERE is_active=true AND threat_score > 70
   ORDER BY threat_score DESC LIMIT 20
2. Query threat_actors table — get actors with match_confidence > 0.5
3. For each high-threat IOC or actor:
   LLM prompt (Groq):
   "Given this threat: {ioc/actor details + TTPs}
    Generate a hunt hypothesis for a security analyst.
    Return JSON: {title, description, mitre_techniques[], hunt_query_sql}"
   Parse response. Validate MITRE IDs against attack-data.ts
4. Insert to hunt_hypotheses with source='threat_intel'

SOURCE 2 — MITRE Gap Driven:
async function generateFromCoverageGaps(orgId: string): Promise<HuntHypothesis[]>
1. Call getCoverageGaps(orgId) from lib/mitre/coverage-engine.ts
2. For top 5 uncovered high-priority techniques:
   LLM prompt: "Technique {T1xxx} has zero detection coverage.
    Generate a hunt hypothesis to find evidence of this technique
    in security logs. Return JSON: {title, description, hunt_query_sql}"
3. Insert with source='actor_ttp'

SOURCE 3 — Anomaly Driven:
async function generateFromAnomalies(orgId: string): Promise<HuntHypothesis[]>
1. Query alerts WHERE severity='CRITICAL' AND created_at > now()-interval'24h'
   AND mitre_tags IS NOT NULL AND mitre_tags != '{}'
2. For each: extract mitre_tags, group by technique
3. Technique appearing in 3+ alerts in 24h = hunt trigger
4. Generate hypothesis targeting that technique cluster
5. Insert with source='anomaly', high priority

SOURCE 4 — Schedule Based:
async function generateWeeklyHunts(orgId: string): Promise<HuntHypothesis[]>
Top 10 most common techniques across all SOC incidents historically:
T1566, T1078, T1059, T1003, T1486, T1047, T1021, T1053, T1071, T1027
Each week: generate fresh hunt query for each via LLM
Insert with source='manual', priority='MEDIUM'

Master function:
async function generateAllHypotheses(orgId: string): Promise<void>
Run all 4 sources. Deduplicate by title similarity (skip if title exists
with same org_id in last 7 days). Insert new only.

═══ PART 3 — HUNT EXECUTOR ═══

/lib/hunting/executor.ts

async function executeHunt(
  hypothesisId: string,
  orgId: string
): Promise<HuntResult>

1. Fetch hypothesis from DB
2. Set status = 'RUNNING'
3. Translate hunt_query to platform's query format:
   If hunt_query_type = 'sql':
     Execute against Supabase (udm_events + alerts tables)
     Query must have WHERE org_id = orgId (ALWAYS)
     Add LIMIT 100
     Wrap in try/catch — bad LLM-generated SQL must not crash
   If no results: set status='NO_FINDINGS', return
4. If results found:
   LLM prompt: "These are security log entries from a threat hunt.
    Analyze for indicators of: {hypothesis.mitre_techniques}
    Summarize findings in 3 sentences. Are these suspicious? Why?"
   Store LLM summary in result_summary
5. If LLM says suspicious (parse: contains "suspicious"|"malicious"|"threat"):
   Create alert: {
     rule_name: "Hunt Finding: " + hypothesis.title,
     severity: hypothesis.priority,
     description: result_summary,
     mitre_tags: hypothesis.mitre_techniques
   }
6. Set status='COMPLETED', findings_count, executed_at
7. Return result

═══ PART 4 — INTEL-DRIVEN DETECTION PIPELINE ═══

/lib/detection/intel-pipeline.ts

Closes the loop: threat intel → detection rule → deployed to L1.

async function generateDetectionFromIOC(
  ioc: ThreatIOC,
  orgId: string
): Promise<DetectionRule | null>

1. Only process: threat_score > 80, ioc_type IN ('domain','hash_sha256','ip')
2. Check: does a detection rule for this IOC value already exist?
   Query detection_rules WHERE sigma_yaml ILIKE '%{ioc.ioc_value}%'
   If exists: skip
3. Generate Sigma rule via LLM (reuse lib/detection/sigma-generator.ts):
   Prompt: "Write a Sigma rule to detect this IOC: {ioc_type}: {ioc_value}
    Context: {ioc.tags}, malware: {ioc.malware_families}
    Output ONLY valid Sigma YAML"
4. Validate YAML (title, detection, logsource fields present)
5. Insert to detection_rules:
   name: "TI: {ioc_value} ({ioc.malware_families[0]})"
   status: 'staging' -- not active yet, needs review
   threat_score: ioc.threat_score
   source: 'threat_intel_auto'
6. Return rule

async function runIntelPipeline(orgId: string): Promise<void>
1. Fetch top 10 new IOCs (last 24h, threat_score > 80, no rule yet)
2. For each: generateDetectionFromIOC
3. Log: X new detection rules generated from threat intel
4. Notify via notification engine: "X new TI-based detection rules ready for review"

═══ PART 5 — CRON + ROUTES ═══

/app/api/cron/l3-hunt/route.ts (UPDATE existing):
CRON_SECRET auth.
1. Get all orgs
2. For each: generateAllHypotheses(orgId)
3. Execute top 3 PENDING hypotheses per org (priority order)
4. Log results

/app/api/cron/intel-pipeline/route.ts (NEW):
CRON_SECRET auth.
Run runIntelPipeline for all orgs.

Add to cron-runner.sh + CRON_SETUP.md:
intel-pipeline: 0 */3 * * * (every 3 hours)

ROUTES (check existing first, UPDATE or CREATE):
POST /api/hunting/generate — trigger hypothesis generation (auth+org)
GET /api/hunting/hypotheses — list with status + priority (auth+org)
POST /api/hunting/hypotheses/[id]/execute — run a hunt (auth+org)
GET /api/hunting/history — completed hunts with findings (auth+org)
POST /api/detection/rules/generate — already exists, verify wired

═══ FINAL ═══
npm run build — must pass, zero errors.
git add -A
git commit -m "feat(hunting): Sprint 14 hunt hypothesis generator, intel-driven detection pipeline"
git push origin main

Report:
1. New files created
2. Existing files updated
3. Build result
4. Any routes that already existed and were updated vs created fresh