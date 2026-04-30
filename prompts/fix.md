@GEMINI.md @graph.md
New session. Read files. State sprint. Check detection_rules table. BUILD MUST PASS.
USE SUPABASE CONNECTOR FOR ALL MIGRATIONS.

Sprint 12: Detection Engineering + Sigma Lifecycle + AI Rule Generator.

PART 1 — SIGMA LIFECYCLE
Update detection_rules table (ALTER existing):
Ensure columns: status('staging'|'testing'|'active'|'retired'), fp_count, tp_count, last_tested_at, sigma_yaml(TEXT).

PART 2 — AI SIGMA GENERATOR
/lib/detection/sigma-generator.ts
async function generateSigmaRule(huntFinding: string, logSample: string): Promise<string>
Prompt Groq: "Write a Sigma YAML rule for this security finding. Output ONLY valid YAML."
Validate YAML structure (must have title, id, status, description, logsource, detection, level).
If invalid, retry once. If still invalid, return null.

PART 3 — RULE TRANSLATOR
/lib/detection/rule-translator.ts
async function translateSigma(sigmaYaml: string, target: 'splunk'|'kql'|'esql'): Promise<string>
Prompt Groq: "Convert this Sigma YAML to {target} query. Output ONLY the query string."
Return string.

PART 4 — PERFORMANCE TRACKER
/lib/detection/performance.ts
async function updateRulePerformance(ruleId: string, isTruePositive: boolean, orgId: string)
UPDATE detection_rules SET tp_count = tp_count + 1 (or fp_count).
If fp_count > 10 AND (fp_count / (fp_count + tp_count)) > 0.8: auto-set status = 'retired', log reason.

PART 5 — ROUTES
GET /api/detection/rules — list rules with FP/TP stats (auth+org).
POST /api/detection/rules/generate — AI generate from text (auth+org).
POST /api/detection/rules/validate — test YAML syntax (auth+org).
POST /api/detection/rules/[id]/translate — translate to backend query (auth+org).
POST /api/detection/rules/[id]/feedback — submit TP/FP (auth+org).

FINAL: npm run build. git commit -m "feat(detection): Sprint 12 Sigma lifecycle, AI generation, FP/TP tracking". git push.