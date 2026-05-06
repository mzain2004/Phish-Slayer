# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Non-Negotiable Rules

- Product name is **PhishSlayer** — never Phish-Slayer
- Never modify `server.js` or `middleware.ts`
- Never overwrite `.env` files — append only, never replace
- Docker always `3000:3000`, never port 80
- All new Next.js API routes must include:
  ```ts
  export const dynamic = 'force-dynamic'
  export const runtime = 'nodejs'
  ```
- Zod validation on all API payloads
- Auth is **Clerk** (not Supabase) — use `auth()` from `@clerk/nextjs/server`
- Database is **Supabase** (DB only) — use `createClient()` from `@/lib/supabase/server`
- Always run `npm run build` after code changes and fix all errors before committing

## Commands

### Frontend (Next.js)
```bash
npm run dev          # Development server
npm run build        # Production build
npm run lint         # ESLint
npm test             # Vitest (single run)
npm run test:watch   # Vitest watch mode
npm run test:coverage
npm run fetch-mitre  # Sync MITRE ATT&CK data
npm run build:agent  # Compile Windows endpoint sensor to .exe
```

### Backend (FastAPI)
```bash
cd phishslayer-api
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Backend linting/formatting:
```bash
black .
flake8 .
mypy .
isort .
pytest
pytest -k "test_name"  # Run single test
```

### Production
```bash
docker-compose up -d   # Uses prebuilt images from ghcr.io
docker-compose build   # Build from source (dev)
```

## Architecture

PhishSlayer is a dual-service SOC automation platform:

**Frontend** — Next.js App Router (TypeScript) at the repo root. Serves the UI and also runs Next.js API routes (`/app/api/`) for lightweight server-side logic. Custom server entry point is `server.js`.

**Backend** — FastAPI (`/phishslayer-api/`) is a separate Python service running on port 8000. Hosts the agentic SOC pipeline, all heavy AI logic, and integration routers. `main.py` is the entry point.

### Agent Tiers (Core Pipeline)
All security events flow through three AI agent tiers:

1. **L1 Triage** (`phishslayer-api/agents/l1_triage.py`) — ingests alerts, applies MITRE ATT&CK tags, severity scoring, initial enrichment
2. **L2 Investigation** (`phishslayer-api/agents/`) — correlates alerts into cases, builds timelines, suggests containment; expects fields: `attacker_intent`, `mitre_techniques`, `confidence`, `verdict`
3. **L3 Hunting** (`phishslayer-api/agents/`) — proactive threat hunting, Sigma rule generation, OSINT/dark web scans, blast radius assessment

Every incident resolves into the sequence: **Who → Device → Auth Context → Privilege → Action → Impact**. Incomplete chains are incomplete incidents.

### FastAPI Router Map
Routers live in `phishslayer-api/routers/` and are mounted in `main.py`:
- `/api/v1/health` — health checks
- `/api/soc` — SOC analytics and metrics
- `/api/alerts` — alert ingest, investigation, hunting endpoints
- `/api/cases` — case management
- `/api/detection-rules`, `/api/sigma` — Sigma rule CRUD
- `/api/tip` — threat intelligence
- `/api/osint` — OSINT scanning
- `/api/playbooks` — automated response playbooks
- `/api/ingest` — data ingestion pipeline
- `/api/mitre` — MITRE ATT&CK mapping
- `/api/wazuh` — Wazuh EDR integration (+ webhook at `routes/wazuh_webhook.py`)
- `/api/cron`, `/api/users`, `/api/incidents`, `/api/connectors`, `/api/assets`, `/api/settings`

### Harness (Backend Infrastructure)
`phishslayer-api/harness/` contains three key abstractions used in alert endpoints:
- `LifecycleHooks` — before/after hooks for agent execution
- `VerifyInterface` — schema validation of agent I/O
- `StateStore` — MongoDB persistence for alert state

### Frontend Key Libraries (`/lib/`)
60+ modules organized by concern. Notable ones:
- `lib/agents/` — Next.js-side L1/L2/L3 agent wrappers
- `lib/ai/` — LLM integration (Groq, Gemini via `@google/genai`)
- `lib/connectors/` — SIEM/tool integrations
- `lib/mitre/` — MITRE ATT&CK correlation utilities
- `lib/microsoft/` — Azure Identity + Microsoft Graph Client
- `lib/tenancy/` — multi-tenant data isolation
- `lib/tier-guard/` — Polar billing/subscription gating
- `lib/wazuh-client/` — Wazuh EDR client
- `lib/supabase/` — Supabase client helpers (server + client)

### Data Layer
- **MongoDB** (via Motor async) — alert states, operational data
- **Supabase (PostgreSQL)** — user data, cases, auth-adjacent data; use server client with RLS
- **SQLAlchemy** — ORM layer for direct Postgres access in backend

### Observability
- **Sentry** — both services; Next.js via `@sentry/nextjs`, FastAPI via `sentry-sdk`
- **AgentOps** — wired at FastAPI startup for agent execution monitoring
- **Prometheus** — metrics endpoint in FastAPI

### CI/CD
GitHub Actions workflows in `.github/workflows/`:
- `deploy.yml` — builds and pushes images to `ghcr.io/mzain2004/phish-slayer` and `ghcr.io/mzain2004/phish-slayer-api`
- `l1-triage.yml`, `l2-respond.yml`, `l3-hunt.yml` — agent pipeline workflows
- `validate-production-chain.yml` — end-to-end chain validation
- `rollback.yml` — production rollback
- `wazuh-health.yml`, `wazuh-update.yml` — EDR monitoring

### Content Security Policy
Next.js CSP is configured in `next.config.js` with strict headers. HSTS max-age is 1 year. Allowed server action origins: `phishslayer.tech`, `www.phishslayer.tech`, `40.123.224.93`, `localhost:3000`.

## Documentation Index

- `docs/ARCHITECTURE.md` — 12-layer SOC autonomy model, full data flow
- `docs/DEPLOYMENT.md` — Azure VM and Docker deployment steps
- `docs/API_QUICK_START.md` — 3-minute developer guide
- `docs/CRON_SETUP.md` — scheduled task configuration
- `docs/SECURITY_AUDIT.md` — security assessment
