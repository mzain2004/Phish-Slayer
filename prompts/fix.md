Before starting, list every file you will create. 
Create one file at a time. After each file say "FILE DONE" then continue.
Do not stop until all files complete.
ANTI-HALLUCINATION RULES:
- Every API call: wrap in try/catch, return { error: string, data: null } on failure — NEVER throw
- Every external API: use process.env.VAR || '' — never crash on missing keys, just skip that collector
- Before creating file: ls -la lib/osint/ 2>/dev/null — check what exists
- Before npm import: grep package.json — if missing, install OR implement logic manually in TS
- Subtask failure = log + skip + continue. Never abort.
- npm run build at end. Zero errors. Then commit.


You are a senior security engineer fixing critical vulnerabilities in PhishSlayer.
Read EVERY file before touching anything. Do NOT hallucinate fixes. Do NOT guess 
imports — read the actual file first, then patch.

Use @supabase extension for any RLS migration changes.
Use @context7 to look up Clerk auth() and Zod APIs if unsure of signatures.
Use @desktop-commander to read/write files on disk.
Use @code-review to validate each fix before committing.

If you are unsure about ANY file — READ IT FIRST. Never assume structure.
After every 10 files fixed, run: npm run build
If build fails — STOP and fix errors before continuing.
Do NOT proceed to next phase if current phase has build errors.

═══════════════════════════════════════════
PHASE 1 — BULK AUTH GUARDS (CRITICAL)
═══════════════════════════════════════════

Add auth() guard to the TOP of every route listed below.
Pattern to add at line 1 of each handler:

  import { auth } from '@clerk/nextjs/server';
  
  export async function GET/POST/PUT/DELETE(req: Request) {
    const { userId, orgId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

READ each file first. If auth() already imported, do not duplicate. Just add the check.

FILES TO FIX:
- app/api/actions/block-ip/route.ts
- app/api/actions/escalate/route.ts
- app/api/actions/escalate/[id]/approve/route.ts
- app/api/actions/escalate/[id]/dismiss/route.ts
- app/api/actions/isolate-identity/route.ts
- app/api/actions/tier0-check/route.ts
- app/api/agent/download/route.ts
- app/api/agent/hunter/hunt/route.ts
- app/api/agent/hunter/reader/route.ts
- app/api/agent/hunter/review/route.ts
- app/api/billing/checkout/route.ts
- app/api/connectors/wazuh/route.ts
- app/api/cve/[cveId]/route.ts
- app/api/darkweb/leaks/route.ts
- app/api/darkweb/scan/route.ts
- app/api/detection-rules/route.ts
- app/api/detection-rules/validate/route.ts
- app/api/detection-rules/[id]/route.ts
- app/api/detection-rules/[id]/test/route.ts
- app/api/digest/weekly/route.ts
- app/api/email/analyze/route.ts
- app/api/flag-ioc/route.ts
- app/api/hunting/generate/route.ts
- app/api/hunting/hypotheses/route.ts
- app/api/hunting/hypotheses/[id]/execute/route.ts
- app/api/ingest/batch/route.ts
- app/api/ingest/route.ts
- app/api/integrations/wazuh/generate-key/route.ts
- app/api/integrations/wazuh/route.ts
- app/api/metrics/network-telemetry/route.ts
- app/api/metrics/route.ts
- app/api/mitre/techniques/route.ts
- app/api/platform/connectors/route.ts
- app/api/platform/metrics/route.ts
- app/api/platform/training-data/route.ts
- app/api/reasoning/route.ts
- app/api/sandbox/email/route.ts
- app/api/sandbox/url/route.ts
- app/api/support/chat/route.ts
- app/api/support/ticket/route.ts
- app/api/tip/feeds/route.ts
- app/api/tip/iocs/lookup/route.ts
- app/api/tip/iocs/route.ts
- app/api/uba/analyze/route.ts
- app/api/uba/profiles/route.ts
- app/api/v1/scan/route.ts
- app/api/vulnerabilities/route.ts
- app/api/vulnerabilities/scan/route.ts

CRON ROUTES — special handling:
These should NOT use Clerk auth(). Instead add this guard:
  const cronSecret = req.headers.get('x-cron-secret');
  if (cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

Apply to ALL files in: app/api/cron/ (read directory first, list all files, fix all)

SKIP (intentionally public):
- app/api/health/route.ts
- app/api/webhooks/clerk/route.ts (uses verifySignature — already handled)
- app/api/sentry-example-api/route.ts

Run: npm run build — must pass before Phase 2.

═══════════════════════════════════════════
PHASE 2 — ORG SCOPING FIXES (CRITICAL)
═══════════════════════════════════════════

Read each file fully. Find every supabase.from() query.
Add .eq('organization_id', orgId) WHERE MISSING.
Get orgId from: const { orgId } = await auth();
If orgId is null — return 401 before any DB query.

FILES TO FIX:
- app/api/cron/org-risk-update/route.ts
- app/api/cron/vuln-scan/route.ts
- app/api/detection-rules/[id]/route.ts
- app/api/detection-rules/[id]/test/route.ts
- app/api/flag-ioc/route.ts
- app/api/osint/[id]/report/route.ts
- app/api/osint/[id]/route.ts
- app/api/response/isolate/route.ts
- app/api/response/kill-process/route.ts
- app/api/response/quarantine/route.ts
- app/api/threat/ai-analysis/route.ts
- lib/audit/auditLogger.ts
- lib/security/audit.ts
- lib/soc/enrichment/domain.ts
- lib/soc/enrichment/email.ts
- lib/soc/enrichment/hash.ts
- lib/soc/enrichment/ip.ts
- lib/soc/playbooks/exfiltration.ts
- lib/soc/playbooks/malware.ts

For lib/ files: these receive orgId as function parameter — 
read the function signature first, then add .eq() to queries that lack it.
Do NOT add auth() to lib files — they are not route handlers.

Run: npm run build — must pass before Phase 3.

═══════════════════════════════════════════
PHASE 3 — ZOD INPUT VALIDATION (HIGH)
═══════════════════════════════════════════

Use @context7 to confirm current Zod v3 API if needed.
For each file: read it, identify what fields req.json() destructures,
wrap with z.object({ ...fields }).parse(body).
On ZodError return 400 with error.errors message.

Pattern:
  import { z } from 'zod';
  const schema = z.object({ field1: z.string(), field2: z.string().optional() });
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors }, { status: 400 });

FILES TO FIX:
- app/api/alerts/[id]/assign/route.ts
- app/api/containment/actions/route.ts
- app/api/detection-rules/validate/route.ts
- app/api/knowledge-base/route.ts
- app/api/knowledge-base/[id]/route.ts
- app/api/l3/org-risk/route.ts
- app/api/mitre/tag/route.ts
- app/api/osint/investigate/route.ts
- app/api/pir/route.ts
- app/api/playbooks/[id]/execute/route.ts
- app/api/shift-handover/route.ts
- app/api/tip/feeds/route.ts
- app/api/tip/iocs/lookup/route.ts

Run: npm run build — must pass before Phase 4.

═══════════════════════════════════════════
PHASE 4 — ERROR HANDLING (HIGH)
═══════════════════════════════════════════

Read each file. Wrap EVERY fetch() call in try/catch.
On catch: log error, return null or empty array (do not crash the caller).

Pattern:
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('[ModuleName] fetch failed:', err);
    return null;
  }

FILES TO FIX:
- lib/ingestion/pipeline.ts (line ~223)
- lib/soc/enrichment/domain.ts (line ~24)
- lib/soc/enrichment/hash.ts (line ~24)
- lib/soc/enrichment/ip.ts (line ~31)
- lib/static-analysis.ts (line ~118)

Also fix these OSINT issues from earlier code-review:
- lib/osint/collectors/ipGeo.ts L16: http://ip-api.com → https://ip-api.com
- lib/osint/collectors/crtsh.ts L15: item.name_value.split → (item.name_value || '').split

Run: npm run build — must pass before Phase 5.

═══════════════════════════════════════════
PHASE 5 — CRON SCHEDULER CONFIG (MEDIUM)
═══════════════════════════════════════════

Read ALL files in app/api/cron/ — list every route.
Create vercel.json in project root with crons block.
Each cron: path = /api/cron/[name], schedule = appropriate interval.

Use these schedules:
- l1-triage → every 5 min: */5 * * * *
- sync-tip-feeds → every 6 hours: 0 */6 * * *
- vuln-scan → daily 2am: 0 2 * * *
- org-risk-update → daily 3am: 0 3 * * *
- weekly-digest → weekly Monday 8am: 0 8 * * 1
- All others → daily midnight: 0 0 * * *

Also add to .env.production (APPEND ONLY — never overwrite):
CRON_SECRET=<generate a random 32-char hex string>

Format vercel.json as:
{
  "crons": [
    { "path": "/api/cron/l1-triage", "schedule": "*/5 * * * *" },
    ...
  ]
}

═══════════════════════════════════════════
PHASE 6 — FINAL BUILD + COMMIT
═══════════════════════════════════════════

Run: npm run build
If ANY errors — fix them before committing. Do NOT commit broken code.

Then run:
  git add -A
  git commit -m "fix: bulk auth guards, org scoping, zod validation, error handling, cron config"
  git push origin main

After push — report:
1. Total files modified
2. Any files you SKIPPED and why
3. Any issues you could NOT fix automatically
4. Confirm build passed ✅