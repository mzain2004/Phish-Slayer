@GEMINI.md @graph.md
New session. Read files. State sprint. BUILD MUST PASS.
USE SUPABASE CONNECTOR FOR ALL MIGRATIONS.

Sprint 13: SOC Performance Metrics + Org Risk Score.

PART 1 — TIME METRICS CALCULATOR
/lib/metrics/calculator.ts
async function calculateMTTD(orgId: string, period: '24h'|'7d'|'30d'): Promise<number>
Query alerts: AVG(extract(epoch from (created_at - timestamp_utc))). Return in seconds.

async function calculateMTTR(orgId: string, period): Promise<number>
Query cases: AVG(extract(epoch from (completed_at - created_at))) WHERE status='CLOSED'.

async function calculateFPRate(orgId: string): Promise<number>
Query detection_rules: SUM(fp_count) / NULLIF(SUM(fp_count + tp_count), 0).

PART 2 — ORG RISK SCORE
/lib/metrics/risk-score.ts
async function calculateOrgRiskScore(orgId: string): Promise<number>
Composite score (0-100, higher = worse risk):
- Open CRITICAL alerts * 5
- Open HIGH alerts * 3
- Unpatched KEV CVEs * 10
- MTTR > 24h ? +15 : 0
- MITRE coverage < 30% ? +20 : 0
- SLA breaches last 7d * 8
Cap at 100. Store in organizations.org_risk_score (add column if missing). Update daily via cron.

PART 3 — METRICS STORAGE
Check/Create metrics_timeseries table:
id, org_id(RLS), metric_name, metric_value, recorded_at.
Insert metrics daily.

PART 4 — CRON
/app/api/cron/metrics/route.ts
CRON_SECRET auth. Calculate all metrics for all orgs. Insert into timeseries. Update org risk score.

PART 5 — ROUTES
GET /api/metrics/summary — MTTD, MTTR, FP Rate, Risk Score (auth+org).
GET /api/metrics/trends?metric=mtrr&period=30d — timeseries data (auth+org).

FINAL: npm run build. git commit -m "feat(metrics): Sprint 13 MTTD/MTTR calculation, org risk score composite". git push.