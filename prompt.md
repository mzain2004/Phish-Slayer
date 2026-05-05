PHASE 7 — AZURE VM DEPLOY + DOCKER + WAZUH WEBHOOK
====================================================
You are a senior DevOps engineer. Read files before editing. Verify before assuming.
If a file does not exist, create it. If a command fails, fix and retry once.
After each task print: ✅ TASK N — [result]. Never skip a task. Never assume success.
If stuck or uncertain: STOP. Print: ⛔ BLOCKED ON TASK N — [exact reason]. Do not proceed past a blocker.

## CURRENT STATE (do not re-do these)
- Next.js 15 app: D:\Phish Slayer\ (port 3000)
- FastAPI: D:\Phish Slayer\phishslayer-api\ (port 8001)
- Groq + AgentOps + Clerk JWT + MongoDB StateStore: all wired
- Azure VM: 40.123.224.93, Ubuntu 24.04, SSH access assumed
- DigitalOcean VM: Wazuh Manager (separate box — do NOT touch its config)
- Docker files exist: Dockerfile (Next.js), docker\Dockerfile.api (FastAPI)
- docker-compose.yml exists at root

## GROUND RULES — NEVER VIOLATE
- NEVER modify middleware.ts or server.js
- NEVER overwrite .env.local or .env.production — append only
- NEVER expose stack traces — all errors JSONResponse
- NEVER commit broken code — npm run build MUST pass before any git push
- block_ip ALWAYS requires human approval
- Groq client ALWAYS lazy init (inside functions, never module-scope)
- If any shell command is ambiguous on Windows PowerShell, use PowerShell syntax

---

## TASK 0 — Read existing Docker files first
Read these files before touching anything:
  D:\Phish Slayer\Dockerfile
  D:\Phish Slayer\docker\Dockerfile.api
  D:\Phish Slayer\docker-compose.yml

Print exact content of each. Do not edit yet.
Identify any issues. List them.
✅ TASK 0 — [files read, issues listed]

---

## TASK 1 — Fix Dockerfile (Next.js)
Fix D:\Phish Slayer\Dockerfile based on issues found in TASK 0.
Requirements:
  - Multi-stage build: deps → builder → runner
  - NODE_OPTIONS=--max-old-space-size=3072 in builder stage
  - Copy .env.production in builder stage (NOT .env.local)
  - Expose port 3000
  - ARG for: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, NEXT_PUBLIC_APP_URL
  - Never hardcode secrets — use ARG/ENV only
  - runner stage: node:20-alpine, non-root user

Run local validation (do not build yet):
  Select-String -Path "D:\Phish Slayer\Dockerfile" -Pattern "FROM"
  (should show 3 FROM lines for multi-stage)
✅ TASK 1 — [Dockerfile fixed, FROM count confirmed]

---

## TASK 2 — Fix Dockerfile.api (FastAPI)
Fix D:\Phish Slayer\docker\Dockerfile.api based on issues found in TASK 0.
Requirements:
  - Base: python:3.12-slim
  - Install from phishslayer-api\requirements.txt
  - Copy phishslayer-api\ contents
  - ENV for: PYTHONUNBUFFERED=1, PYTHONDONTWRITEBYTECODE=1
  - ARG for: GROQ_API_KEY, AGENTOPS_API_KEY, MONGODB_URI, CLERK_SECRET_KEY
  - CMD: uvicorn main:app --host 0.0.0.0 --port 8000
  - Expose port 8000 (prod) — NOT 8001
  - Non-root user

Run validation:
  Select-String -Path "D:\Phish Slayer\docker\Dockerfile.api" -Pattern "EXPOSE"
  (should show port 8000)
✅ TASK 2 — [Dockerfile.api fixed, EXPOSE 8000 confirmed]

---

## TASK 3 — Fix docker-compose.yml
Fix D:\Phish Slayer\docker-compose.yml.
Requirements:
  services:
    nextjs:
      build: . (uses root Dockerfile)
      ports: "3000:3000"
      env_file: .env.production
      depends_on: [api]
      restart: unless-stopped
    
    api:
      build:
        context: .
        dockerfile: docker/Dockerfile.api
      ports: "8000:8000"
      env_file: .env.production
      restart: unless-stopped

  No hardcoded secrets in compose file.
  No volumes mounting .env.local (security risk).

✅ TASK 3 — [docker-compose.yml fixed]

---

## TASK 4 — Create Azure deploy script
Create D:\Phish Slayer\scripts\deploy_azure.sh

This script runs ON the Azure VM (40.123.224.93) via SSH.
It must:
  1. cd /opt/phishslayer (create if not exists)
  2. git pull origin main (assumes repo already cloned)
  3. Check .env.production exists — if not: print ERROR and exit 1
  4. docker compose down --remove-orphans
  5. docker compose build --no-cache
  6. docker compose up -d
  7. Sleep 10 seconds
  8. Health check: curl -f http://localhost:3000 || exit 1
  9. Health check: curl -f http://localhost:8000/api/v1/health || exit 1
  10. Print: DEPLOY SUCCESS — $(date)

Script header:
  #!/bin/bash
  set -euo pipefail  (exit on any error)

✅ TASK 4 — [deploy script created]

---

## TASK 5 — Create Wazuh webhook integration
Create D:\Phish Slayer\phishslayer-api\routes\wazuh_webhook.py

This is the route that receives alerts FROM Wazuh Manager (DigitalOcean VM).
Wazuh will POST alerts to: POST /api/v1/wazuh/alert

Requirements:
  - Route: POST /api/v1/wazuh/alert
  - Auth: verify X-PhishSlayer-Key header against WAZUH_WEBHOOK_SECRET from env
    If missing or wrong → return JSONResponse 401, log attempt, never crash
  - Parse incoming Wazuh alert JSON:
      {
        "id": "...",
        "rule": {"description": "...", "level": 0-15},
        "agent": {"ip": "..."},
        "timestamp": "..."
      }
  - Map rule.level to severity:
      level >= 12 → "critical"
      level >= 8  → "high"
      level >= 4  → "medium"
      else        → "low"
  - Only process if level >= 4 (ignore noise below medium)
  - Call L1TriageAgent directly (import from agents.l1_triage)
  - Pass org_id = "wazuh-default" (placeholder until multi-tenant wired)
  - Return JSONResponse with l1 verdict + alert_id
  - Wrap entire handler in try/except → JSONResponse 500 on failure

Add to main.py:
  from routes.wazuh_webhook import router as wazuh_router
  app.include_router(wazuh_router)

✅ TASK 5 — [wazuh_webhook.py created and wired]

---

## TASK 6 — Create Wazuh shell script (for DigitalOcean VM)
Create D:\Phish Slayer\docs\wazuh_custom_webhook.sh

This script goes on the DigitalOcean VM (Wazuh Manager).
It sends alerts to PhishSlayer Azure VM.
This is documentation only — do NOT run it locally.

Script must:
  #!/bin/bash
  # PhishSlayer Wazuh Custom Webhook
  # Deploy to: /var/ossec/active-response/bin/phishslayer_webhook.sh on Wazuh VM
  # chmod +x and set in ossec.conf

  PHISHSLAYER_URL="https://phishslayer.yourdomain.com/api/v1/wazuh/alert"
  SECRET="your-webhook-secret-here"  # replace with actual WAZUH_WEBHOOK_SECRET

  curl -s -X POST "$PHISHSLAYER_URL" \
    -H "Content-Type: application/json" \
    -H "X-PhishSlayer-Key: $SECRET" \
    -d "{
      \"id\": \"$1\",
      \"rule\": {\"description\": \"$2\", \"level\": $3},
      \"agent\": {\"ip\": \"$4\"},
      \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"
    }"

Add comment block at top explaining ossec.conf integration.
✅ TASK 6 — [wazuh_webhook.sh created in docs\]

---

## TASK 7 — Local Docker build test (Windows)
Run on local machine to verify Docker files are correct before Azure deploy:

  cd "D:\Phish Slayer"
  docker build -t phishslayer-nextjs:test .

If docker not installed locally: SKIP this task, print:
  ⚠️ TASK 7 SKIPPED — Docker not available locally. Azure VM will be first build.

If docker available and build fails: fix Dockerfile issues, retry once.
Do NOT attempt to run the container (no .env.production locally).
✅ TASK 7 — [build result]

---

## TASK 8 — npm run build verification
  cd "D:\Phish Slayer"
  npm run build

Fix ALL TypeScript/build errors before marking done.
If build fails: read the exact error, fix the file, run build again.
Do NOT mark PASS if there are any errors.
✅ TASK 8 — [PASS/FAIL]

---

## TASK 9 — Git commit
Only after TASK 8 passes:

  cd "D:\Phish Slayer"
  git add -A
  git commit -m "Phase 7: Docker + Wazuh webhook integration"
  git push origin main

If git push fails: print exact error. Do NOT force push.
✅ TASK 9 — [committed and pushed / BLOCKED reason]

---

## FINAL REPORT
Print exactly:

  PHASE 7 SUMMARY
  ================
  TASK 0 (Docker files read):          [DONE/FAIL]
  TASK 1 (Dockerfile fixed):           [DONE/FAIL]
  TASK 2 (Dockerfile.api fixed):       [DONE/FAIL]
  TASK 3 (docker-compose fixed):       [DONE/FAIL]
  TASK 4 (deploy script created):      [DONE/FAIL]
  TASK 5 (Wazuh webhook route):        [DONE/FAIL]
  TASK 6 (Wazuh shell script):         [DONE/FAIL]
  TASK 7 (Docker build test):          [PASS/FAIL/SKIPPED]
  TASK 8 (npm run build):              [PASS/FAIL]
  TASK 9 (git push):                   [DONE/FAIL]
  BLOCKERS FOR HUMAN: ...
  NEXT STEP: Azure VM setup (manual SSH required)

## ANTI-HALLUCINATION RULES
- NEVER invent file contents you did not read — always read first
- NEVER assume a command succeeded — check output
- NEVER skip a task silently — print result for every task
- NEVER proceed past a ⛔ BLOCKER — stop and wait
- If a file path does not exist: create it, do not error silently
- If uncertain about Azure VM state: mark as BLOCKED, do not guess
- PowerShell on Windows: use Invoke-RestMethod not curl, use Select-String not grep
- Do NOT run commands that SSH into Azure VM — that is a manual step for human