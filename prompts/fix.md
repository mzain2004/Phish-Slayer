@GEMINI.md @graph.md
New session. Read both. Build MUST pass.
Sprint 21: Security Hardening + Pen Test Prep + Load Testing.
Sprint 20 complete.

═══ PART 1 — SECURITY AUDIT ═══

Run: npm audit
If critical/high vulns: npm audit fix
If fix breaks build: document in SECURITY_AUDIT.md, commit file, move on.

Run: npx @next/codemod@latest (check for Next.js security upgrades)

LLM INPUT SANITIZATION:
Read lib/mitre/llm-tagger.ts and lib/detection/sigma-generator.ts.
Find all places where user/log data enters LLM prompt strings.
Add sanitizeForLLM function to each:

function sanitizeForLLM(input: string): string {
  return input
    .replace(/ignore\s+previous\s+instructions?/gi, '[REDACTED]')
    .replace(/system\s*:/gi, '[REDACTED]')
    .replace(/<\|.*?\|>/g, '[REDACTED]')
    .replace(/\[INST\]|\[\/INST\]/g, '[REDACTED]')
    .slice(0, 2000)  // max 2000 chars into any LLM prompt
}

Apply before every .trim() or template literal insert of log data.

═══ PART 2 — LOAD TEST SCRIPT ═══

/scripts/load-test.js (Node.js script, no deps except built-in http)

Simple load test — no k6 needed (no budget):
Test 3 endpoints:
  GET /api/health → expect 200, measure avg response time
  GET /api/alerts (with valid API key) → expect 200
  POST /api/ingest/webhook → send 100 test alerts sequentially

Run 50 sequential requests per endpoint. Measure:
  avg_ms, min_ms, max_ms, p95_ms, error_count

Print results table. Exit 1 if avg_ms > 2000 or error_count > 5.

Usage: node scripts/load-test.js
Add to package.json: "test:perf": "node scripts/load-test.js"

/docs/PERFORMANCE_TARGETS.md
Define targets:
  /api/health: < 100ms
  /api/alerts: < 500ms
  /api/ingest/webhook: < 200ms
  Agent L1 processing: < 30 seconds per alert
  OSINT full scan: < 5 minutes per org

═══ PART 3 — DEPENDENCY HARDENING ═══

Read package.json. Check for:
  Any packages with known CVEs from npm audit
  Any packages not updated in 2+ years (flag only, don't auto-update)
  Ensure no dev dependencies in production bundle

Add to .env.example:
  NODE_ENV=production  (verify set on VM)

Verify in docker-compose.yml:
  NODE_ENV=production is set
  No --inspect flag (debugger port exposure)
  No bind mount of .env files from host (use env_file directive)
  Read docker-compose.yml and report what you find

═══ FINAL ═══
npm run build && npm run test
git commit -m "fix(security): Sprint 21 LLM sanitization, audit fixes, load test script"
git push origin main