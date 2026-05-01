@GEMINI.md @graph.md

Emergency hardening. Two fixes. No new features. Keep build green.

═══ FIX 1 — SECURITY HEADERS + RATE LIMITING ═══

Read middleware.ts fully first. DO NOT touch auth logic.
ADD ONLY at the top of the middleware, before auth checks:

Rate limiting: use in-memory Map (no Redis needed).
Max 100 req/min per IP for /api/* routes.
Max 5 req/min for /auth/* routes.
If exceeded: return NextResponse.json({error:'rate_limited'},{status:429})

Security headers: add to every response:
- Strict-Transport-Security: max-age=31536000; includeSubDomains
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block
- Referrer-Policy: strict-origin-when-cross-origin

Pattern: intercept response, clone with headers added, return.
Do NOT break existing Clerk auth logic. Read the file first.

═══ FIX 2 — AZURE CRON SETUP ═══

Platform runs on Azure VM (Docker), NOT Vercel.
vercel.json crons are useless here.

Create: /scripts/cron-runner.sh
A bash script that uses system cron (crontab) to hit each
cron route via curl with the CRON_SECRET header.

Read ALL files in app/api/cron/ — list every route path.
For each route, add a crontab entry:

Format:
*/5 * * * *  curl -s -X POST https://phishslayer.tech/api/cron/l1-triage \
  -H "Authorization: Bearer $CRON_SECRET" > /dev/null 2>&1

Schedules:
- l1-triage: */5 * * * *
- enrich-alerts: */10 * * * *
- cti-feeds: 0 */6 * * *
- osint-brand: 0 */4 * * *
- osint-full: 0 2 * * *
- vuln-scan: 0 3 * * *
- metrics: 0 4 * * *
- org-risk-update: 0 5 * * *
- sla-checker: */15 * * * *
- mitre-tag-alerts: */30 * * * *
- mitre-coverage: 0 6 * * *
- uba-baseline-update: 0 1 * * *
- beaconing-scan: 0 */2 * * *
- darkweb-scan: 0 0 * * *
- l2-respond: */10 * * * *
- l3-hunt: 0 * * * *
- run-detection-rules: */15 * * * *
- sync-connectors: 0 */12 * * *
- sync-tip-feeds: 0 */6 * * *
- auto-playbooks: */10 * * * *

Also create: /docs/CRON_SETUP.md
Instructions to install crontab on Azure VM.

═══ FINAL ═══

npm run build — must pass.
git add -A
git commit -m "fix(security): rate limiting, security headers, azure cron setup"
git push origin main

Report:
1. What you added to middleware.ts
2. List of all cron routes in cron-runner.sh
3. Build result