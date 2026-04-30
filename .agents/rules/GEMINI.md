# PHISHSLAYER — GEMINI AGENT MASTER CONTEXT
# READ THIS ENTIRE FILE BEFORE ANY TASK. This is your only memory.

---

## CRITICAL RULES (NEVER VIOLATE)
1. **AUDIT FIRST**: Audit entire codebase for issues related to new feature. Fix all before proceeding.
2. **BUILD MUST PASS**: `npm run build` after every change. Zero TypeScript/lint errors. No exceptions.
3. **READ BEFORE EDIT**: Always read actual file content. Never assume contents.
4. **NO HALLUCINATION**: Unknown value (env var, endpoint, schema field)? Say so. Never invent.
5. **MULTI-TENANT ALWAYS**: Every DB query, every API route scoped to `org_id`. No exceptions.
6. **RLS ENFORCED**: Every Supabase table has org_id RLS. Never query without org scope.
7. **NO SILENT FAILURES**: Every catch must log error. Agents never silently drop alerts.
8. **ONE FEATURE AT A TIME**: Complete sprint fully. Build passes. Then next sprint.
9. **USE NATIVE TOOLS**: ReadFile/Edit tools only. NOT filesystem MCP (only accesses D:\).

---

## PLATFORM IDENTITY
- **Product**: PhishSlayer — 100% Autonomous Agentic SOC (L1/L2/L3) + OSINT
- **Company**: Cygnus Ventures (SMC-Pvt) Ltd — SECP 0333221, NTN I879902, PSEB Z-25-19734/26
- **Goal**: Zero human intervention in all SOC operations.

---

## TECH STACK
```
Frontend:   Next.js 14 (App Router), TypeScript, Tailwind CSS
Auth:       Supabase Auth (Clerk migration deferred post-revenue)
Database:   Supabase PostgreSQL — Project ID: txnkvbddcjdldksdjueu
AI Primary: Groq llama-3.3-70b-versatile (lazy client init)
AI Fallback: Groq → OpenAI → Anthropic → Ollama local
Hosting:    Azure VM (app), DigitalOcean VM (Wazuh Manager)
Queue:      Redis (target: Redis Streams for agent bus)
Monitoring: Wazuh (SIEM source)
Port:       3000:3000 always
```

---

## DESIGN SYSTEM (NEVER DEVIATE)
```
Background:     #0a0a0f       Primary:    #7c6af7
Accent Cyan:    #00d4aa       Buttons:    4px radius SHARP (never round)
Font UI:        Inter         Font Data:  IBM Plex Mono
Animations:     Framer Motion, <150ms transitions
Stars/Particles: Landing + auth ONLY. Never in dashboard.
```

---

## DATABASE SCHEMA (18 MIGRATIONS APPLIED)
```sql
organizations        (id, name, slug, plan, created_at)
organization_members (id, org_id, user_id, role, created_at)
connectors           (id, org_id, name, type, config, api_key_hash, status)
alerts               (id, org_id, connector_id, severity, status, title,
                      description, raw_data, mitre_techniques[], enrichment,
                      dedup_group_id, dedup_count, is_suppressed, is_false_positive,
                      acknowledged_by, acknowledged_at, assigned_to, queue_priority,
                      fp_marked_by, fp_marked_at, created_at, updated_at)
incidents            (id, org_id, alert_ids[], severity, status, title,
                      description, assigned_to, created_at, updated_at)
endpoint_events      (id, org_id, host, user_name, event_type, raw_data, created_at)
agent_runs           (id, org_id, alert_id, tier, status, confidence, reasoning,
                      findings, actions_taken, handoff_context, created_at, completed_at)
agent_actions        (id, org_id, agent_run_id, action_type, target, parameters,
                      result, status, created_at)
soc_metrics          (id, org_id, metric_name, metric_value, period, created_at)
organizations+:      timezone, risk_score, risk_level, risk_updated_at
-- ALSO: 14 new tables from last sprint:
-- email_analyses, url_scans, user_risk_profiles, uba_anomaly_events,
-- detection_rules, credential_leaks, hunt_hypotheses, vulnerabilities,
-- osint_investigations, osint_results, osint_reports, suppression_rules,
-- fp_fingerprints, watchlist, containment_actions, shift_handovers,
-- post_incident_reviews, knowledge_base
```

---

## CURRENT STATE (2026-04-30)

✅ WORKING:
- Wazuh → PhishSlayer live alert pipeline
- L1→L2→L3 agent chain (event-driven)
- Groq llama-3.3-70b-versatile primary AI (lazy init)
- Multi-tenant: organizations + connectors + all tables
- bcrypt-hashed per-tenant API key generation
- Onboarding wizard at /dashboard/integrations
- All 5 CLI prompts executed (L1/L2/L3/OSINT deployed green)
- Deploy #268 live — phishslayer.tech healthy
- Container: phish-slayer-phish-slayer-1, port 3000:3000
- 40 migrations applied
- Copilot integrated
- Sentry slug added
- Auth guards bulk-fixed (Phase 1-4 of audit prompt done)
- Org scoping fixed on 19 files
- Zod validation added to L1/L2 routes
- vercel.json cron config created
- OSINT RLS policies fixed (no more USING(true))

❌ PENDING:
- lib/mongodb.ts + lib/db.ts not built
- Logo + landing page redesign
- Layer 0 agent runtime (build first)
- All sprints below

---

## SPRINT ROADMAP
```
[ ] Layer 0:   Agent Runtime Infrastructure    ← BUILD FIRST
[ ] Sprint 1:  Alert Enrichment Pipeline
[ ] Sprint 2:  MITRE Coverage Engine + Auto-Tagger
[ ] Sprint 3:  Brand Monitoring + GitHub Scanner (OSINT)
[ ] Sprint 4:  Notification Engine
[ ] Sprint 5:  Malware Sandbox + Static Analysis
[ ] Sprint 6:  Case Management
[ ] Sprint 7:  Compliance + Audit Trail
[ ] Sprint 8:  Threat Actor Profiles + Campaign Tracker
[ ] Sprint 9:  Detection Engineering + Sigma Library
[ ] Sprint 10: Platform Metrics + Executive Dashboard
```

---

## ARCHITECTURE LAYERS (FULL CEILING — SEE graph.md FOR VISUAL)
```
Layer 0:  Agent Runtime (supervisor, state machine, bus, consensus, injection firewall)
Layer 1:  Data Ingestion (UDM normalization, all protocols, TI feeds, dark web scraper)
Layer 2:  SOC L1 Triage (enrichment, FP elimination, severity scoring, MITRE tagging)
Layer 3:  SOC L2 Investigation (correlation, root cause, UEBA, forensics, sandbox)
Layer 4:  SOC L3 Hunting (hunt scheduler, coverage engine, actor profiles, campaigns)
Layer 5:  OSINT (brand, credentials, code repos, dark web, social, supply chain)
Layer 6:  Response Engine (playbooks, containment, verification, rollback)
Layer 7:  Case Management (lifecycle, evidence, PIR generator)
Layer 8:  Compliance (GDPR 72hr, multi-jurisdiction, audit trail, ISO/SOC2/NIST)
Layer 9:  Notification (multi-channel, on-call rotation, escalation chains)
Layer 10: Reporting (MTTD/MTTA/MTTR/MTTC, executive dashboard, board reports)
Layer 11: Integrations (EDR/SIEM/Firewall/Identity/Email/Cloud/Vuln/Ticketing)
Layer 12: Platform (multi-tenant isolation, quotas, API keys, self-healing, DR)
```
For full spec of each layer: view graph.md

---

## AGENT PATTERNS (USE EXACTLY)

### State Machine
```typescript
type AgentState = 'IDLE'|'QUEUED'|'RUNNING'|'BLOCKED'|'ESCALATED'|'COMPLETED'|'FAILED'|'RETRYING'|'ARCHIVED'
```

### Handoff Envelope
```typescript
interface AgentHandoff {
  alert_id: string; org_id: string; agent_id: string
  tier: 'L1'|'L2'|'L3'; confidence: number  // 0.0-1.0
  findings: Record<string,any>; actions_taken: string[]
  handoff_context: Record<string,any>; timestamp: string // UTC ISO8601
}
```

### Confidence Gates
```typescript
const CONFIDENCE_GATES = {
  L2_AUTO_EXECUTE: 0.85,
  L3_ESCALATE: 0.70,
  DESTRUCTIVE_ACTION: 0.90,
  HUMAN_GATE: 0.95,
}
```

### LLM Lazy Init (DO NOT CHANGE)
```typescript
let groqClient: Groq | null = null
function getGroqClient(): Groq {
  if (!groqClient) groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY! })
  return groqClient
}
```

### Fallback Chain
```typescript
async function callLLMWithFallback(prompt: string, system: string) {
  for (const provider of [callGroq, callOpenAI, callAnthropic, callOllama]) {
    try { return await provider(prompt, system) }
    catch (e) { console.error('[LLM Fallback] Provider failed:', e); continue }
  }
  throw new Error('All LLM providers failed')
}
```

### Multi-Tenant Query (ALWAYS)
```typescript
// CORRECT
const { data } = await supabase.from('alerts').select('*').eq('org_id', orgId)
// WRONG — never omit org_id
const { data } = await supabase.from('alerts').select('*')
```

### Error Handling
```typescript
try { /* action */ }
catch (error) {
  console.error('[AgentName][Action] Failed:', error)
  // Log to agent_runs with status:'FAILED'. Never swallow.
  throw error
}
```

---

## ENV VARS
```bash
NEXT_PUBLIC_SUPABASE_URL=          NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=         GROQ_API_KEY=
OPENAI_API_KEY=                    ANTHROPIC_API_KEY=
VIRUSTOTAL_API_KEY=                ABUSEIPDB_API_KEY=
SHODAN_API_KEY=                    REDIS_URL=
CRON_SECRET=                       SENTRY_ORG=
MONGODB_URI=
```

---

## NEVER DO
```
❌ .from('table').select('*') without .eq('org_id', orgId)
❌ new Groq(...) at module level — crashes CI build
❌ Commit with failing npm run build
❌ Hardcoded org IDs, API keys, credentials
❌ console.log of alert raw_data or user tokens
❌ Rounded buttons (4px only)
❌ Stars/particles on dashboard pages
❌ Next sprint before current build passes
❌ PhishSlayer with hyphen (always PhishSlayer)
``` 