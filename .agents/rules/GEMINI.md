---
trigger: always_on
---

# PHISHSLAYER — GEMINI AGENT MASTER CONTEXT FILE
# READ THIS ENTIRE FILE BEFORE EXECUTING ANY TASK.
# This file is your persistent memory. You have no other memory between sessions.

---

## CRITICAL OPERATING RULES (NEVER VIOLATE)

1. **AUDIT FIRST**: Before touching any feature, audit the entire codebase for issues related to the new feature. Fix all found issues first.
2. **BUILD MUST PASS**: Run `npm run build` after every change. Fix ALL TypeScript errors, ALL lint errors before committing. Zero tolerance for broken builds.
3. **NEVER COMMIT BROKEN CODE**: If build fails, fix it. Do not move to next step with a broken build.
4. **READ FILES BEFORE EDITING**: Always read the actual file content before editing. Never assume file contents.
5. **NO HALLUCINATION**: If you don't know a value (env var, API endpoint, schema field), say so. Do NOT invent values.
6. **MULTI-TENANT ALWAYS**: Every DB query, every API route, every agent action must be scoped to `org_id`. No exceptions.
7. **RLS ENFORCED**: Supabase Row Level Security is active. Every table has org_id. Never query without org scope.
8. **NO SILENT FAILURES**: Every try/catch must log the error. Agents must never silently drop alerts.
9. **USE NATIVE TOOLS**: Use ReadFile/Edit tools directly. Do NOT use filesystem MCP tool (it only accesses D:\ not C:\).
10. **ONE FEATURE AT A TIME**: Complete current sprint fully. Build passes. Tests pass. Then next sprint.

---

## PLATFORM IDENTITY

**Product**: PhishSlayer — 100% Autonomous Agentic SOC Platform (L1/L2/L3) + OSINT
**Company**: Cygnus Ventures (SMC-Private) Limited — SECP Inc. No. 0333221
**Goal**: Zero human intervention in all SOC operations. Every task that a human SOC analyst does must be handled by an agent.
**Stage**: Active development. Core pipeline working. Hardening + expanding.

---

## TECH STACK

```
Frontend:     Next.js 14 (App Router), TypeScript, Tailwind CSS
Auth:         Supabase Auth (Clerk migration deferred post-revenue)
Database:     Supabase (PostgreSQL) — Project ID: txnkvbddcjdldksdjueu
              18 migrations applied as of 2026-04-27. DB is clean.
ORM:          Supabase client (direct queries, no Prisma)
AI Provider:  Groq llama-3.3-70b-versatile (primary), lazy client initialization
              Fallback chain: Groq → OpenAI → Anthropic → Ollama local
Hosting:      Azure VM (PhishSlayer app), DigitalOcean VM (Wazuh Manager)
Deployment:   Vercel (frontend), Azure (backend agents)
Queue:        Redis (target: Redis Streams for agent bus)
Monitoring:   Wazuh (SIEM source)
```

---

## DESIGN SYSTEM (NEVER DEVIATE)

```
Background:           #0a0a0f
Primary Purple:       #7c6af7
Accent Cyan:          #00d4aa
Glass utility:        .glass class (glassmorphism)
Button border-radius: 4px sharp (NO rounded buttons ever)
Font - UI copy:       Inter
Font - Data/IOCs:     IBM Plex Mono
Star/particle bg:     Landing + auth pages ONLY (never in dashboard)
Animations:           Framer Motion, <150ms for UI transitions
```

---

## DATABASE SCHEMA (CURRENT — 18 MIGRATIONS APPLIED)

```sql
-- Core multi-tenant tables
organizations (id, name, slug, plan, created_at)
organization_members (id, org_id, user_id, role, created_at)
connectors (id, org_id, name, type, config, api_key_hash, status, created_at)

-- Alert pipeline
alerts (id, org_id, connector_id, severity, status, title, description, 
        raw_data, mitre_techniques[], enrichment, created_at, updated_at)
incidents (id, org_id, alert_ids[], severity, status, title, description,
           assigned_to, created_at, updated_at)
endpoint_events (id, org_id, host, user_name, event_type, raw_data, created_at)

-- Agent chain
agent_runs (id, org_id, alert_id, tier, status, confidence, reasoning,
            findings, actions_taken, handoff_context, created_at, completed_at)
agent_actions (id, org_id, agent_run_id, action_type, target, parameters,
               result, status, created_at)

-- SOC metrics
soc_metrics (id, org_id, metric_name, metric_value, period, created_at)
```

**PENDING (not yet built):**
- `lib/mongodb.ts` + `lib/db.ts` — not implemented
- Full org-scoping on orchestrator/autoclose/engine — not complete

---

## CURRENT PLATFORM STATE (2026-04-27)

✅ WORKING:
- Wazuh → PhishSlayer live alert pipeline
- L1 → L2 → L3 agent chain (event-driven, not scheduled)
- Groq llama-3.3-70b-versatile as primary AI (lazy init)
- Multi-tenant architecture (organizations + connectors tables)
- bcrypt-hashed per-tenant API key generation
- Onboarding wizard at /dashboard/integrations
- OWASP Top 10 security pass done
- Build passing, health check green
- Chain duration: under 8 seconds end-to-end

❌ PENDING (this file tracks sprint-by-sprint):
- lib/mongodb.ts + lib/db.ts
- Full org-scoping on all orchestrator/autoclose/engine paths
- Logo + landing page redesign
- Agent runtime infrastructure (Layer 0)
- All sprints below

---

## COMPLETE PLATFORM ARCHITECTURE

This is the full ceiling. Every sprint below is one piece of this.

### LAYER 0 — AGENT RUNTIME INFRASTRUCTURE
Agent supervisor, lifecycle state machine, communication bus, confidence scoring,
multi-model consensus, prompt injection firewall, token budget management,
context window manager, fallback chain, dead letter queue, warm pools, checkpoints.

### LAYER 1 — DATA INGESTION + PARSING
Universal log ingestion (Syslog, Webhook, Kafka, S3, Azure Event Hub, GCP Pub/Sub,
SFTP, REST polling, SMTP, TAXII 2.x, OpenTelemetry, PCAP).
Unified Data Model (UDM) normalization. Data quality agent. Threat intel feed ingestion.
Dark web + paste site continuous scraper.

### LAYER 2 — SOC L1 TRIAGE AGENTS
Asset context enrichment. IP/Domain/Hash/Email/User enrichment. False positive elimination
(rule-based + ML XGBoost). Dynamic severity scoring. MITRE auto-tagger. SLA + auto-escalation.
Watchlist matching. Alert correlation + grouping. Evidence auto-collection. Data source health monitor.

### LAYER 3 — SOC L2 INVESTIGATION AGENTS
Investigation orchestrator. Log correlation (temporal + entity + cross-source). Root cause analysis.
Scope assessment + blast radius. UEBA behavioral analysis. Network forensics + PCAP analysis.
Malware static + sandbox analysis. Memory forensics (Volatility). Lateral movement detection.
Ransomware pre-detonation detection. Credential + identity analysis. Privilege escalation mapper.

### LAYER 4 — SOC L3 HUNTING + INTEL AGENTS
Proactive hunt scheduler. MITRE ATT&CK coverage engine + heatmap. Threat actor profiling (150+ groups).
Campaign tracker. Detection engineering (Sigma rule lifecycle). Threat briefing generator.
Regulatory CVE mapping.

### LAYER 5 — OSINT AGENTS
Domain + brand intelligence. Network footprint (Shodan/Censys/FOFA). Email security posture.
Credential + leak monitor (HIBP/Dehashed). Code repository monitor (GitHub/GitLab/Bitbucket).
Paste site monitor. Dark web intelligence. Social media OSINT. Supply chain intelligence.
Vulnerability intelligence. Infrastructure footprint.

### LAYER 6 — RESPONSE AUTOMATION ENGINE
Visual playbook builder. Response action library (network/endpoint/identity/cloud).
Containment decision engine (risk/benefit, multi-model consensus, human approval gate).
Containment verification agent. Rollback agent. Recovery playbook agent.

### LAYER 7 — CASE MANAGEMENT
Case lifecycle (Open→InProgress→Contained→Remediated→Closed→Archived).
Case merging. Timeline view. Evidence management. Stakeholder notification. Post-incident review generator.

### LAYER 8 — COMPLIANCE + LEGAL
GDPR 72hr deadline agent. Multi-jurisdiction mapping (CCPA, HIPAA, PCI DSS, DORA, NIS2, SEC).
Compliance framework mapping (ISO 27001, SOC 2, NIST CSF). Immutable cryptographic audit trail.
Audit-ready evidence packaging. Regulatory change monitor.

### LAYER 9 — NOTIFICATION + ALERTING ENGINE
Multi-channel (Email/Slack/Teams/PagerDuty/SMS/Webhook). On-call rotation. Escalation chains.
Alert fatigue prevention. Delivery confirmation + retry.

### LAYER 10 — REPORTING + ANALYTICS
All report types: Technical Incident, Executive Summary, Regulatory Breach Notification, PIR, Board Report.
SOC performance metrics (MTTD/MTTA/MTTR/MTTC). Business risk metrics. Executive dashboard.

### LAYER 11 — INTEGRATIONS
EDR: CrowdStrike, SentinelOne, Carbon Black, Defender, Cortex XDR
SIEM: Splunk, QRadar, Sentinel, Elastic, LogRhythm
Firewall: Palo Alto, Fortinet, Cisco, pfSense, AWS SG, Azure NSG, GCP Firewall
Identity: AD, Azure AD, Okta, Ping, CyberArk
Email: O365, Google Workspace
Cloud: AWS GuardDuty, Azure Defender, GCP SCC
Vuln: Nessus, Qualys, Rapid7
Ticketing: Jira, ServiceNow, PagerDuty

### LAYER 12 — PLATFORM + MULTI-TENANT INFRASTRUCTURE
Complete tenant isolation. Resource quotas. API key management. Feature flags.
Multi-region. Platform self-healing agent. Disaster recovery.

---

## SPRINT ROADMAP (CURRENT PROGRESS: NOT STARTED)

```
Layer 0:   Agent Runtime Infrastructure         ← BUILD THIS FIRST
Sprint 1:  Alert Enrichment Pipeline            ← L1 killer feature
Sprint 2:  MITRE Coverage Engine + Auto-Tagger
Sprint 3:  Brand Monitoring + GitHub Scanner (OSINT)
Sprint 4:  Notification Engine
Sprint 5:  Malware Sandbox + Static Analysis
Sprint 6:  Case Management
Sprint 7:  Compliance + Audit Trail
Sprint 8:  Threat Actor Profiles + Campaign Tracker
Sprint 9:  Detection Engineering + Sigma Library
Sprint 10: Platform Metrics + Executive Dashboard
```

Mark sprints complete here as you go:
- [ ] Layer 0
- [ ] Sprint 1
- [ ] Sprint 2
- [ ] Sprint 3
- [ ] Sprint 4
- [ ] Sprint 5
- [ ] Sprint 6
- [ ] Sprint 7
- [ ] Sprint 8
- [ ] Sprint 9
- [ ] Sprint 10

---

## AGENT ARCHITECTURE PATTERNS (USE THESE EXACTLY)

### Agent State Machine
```typescript
type AgentState = 
  | 'IDLE' | 'QUEUED' | 'RUNNING' | 'BLOCKED' 
  | 'ESCALATED' | 'COMPLETED' | 'FAILED' | 'RETRYING' | 'ARCHIVED'
```

### Agent Handoff Envelope
```typescript
interface AgentHandoff {
  alert_id: string
  org_id: string           // ALWAYS PRESENT
  agent_id: string
  tier: 'L1' | 'L2' | 'L3'
  confidence: number       // 0.0-1.0
  findings: Record<string, any>
  actions_taken: string[]
  handoff_context: Record<string, any>
  timestamp: string        // UTC ISO 8601
}
```

### Confidence Gates
```typescript
const CONFIDENCE_GATES = {
  L2_AUTO_EXECUTE: 0.85,    // L2 only acts if confidence >= 0.85
  L3_ESCALATE: 0.70,        // L3 triggered if L2 confidence < 0.70
  DESTRUCTIVE_ACTION: 0.90, // Block/isolate/wipe needs >= 0.90
  HUMAN_GATE: 0.95,         // Production server isolation needs human veto window
}
```

### LLM Client Pattern (Lazy Init — DO NOT CHANGE)
```typescript
let groqClient: Groq | null = null
function getGroqClient(): Groq {
  if (!groqClient) {
    groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY! })
  }
  return groqClient
}
```

### Fallback Chain Pattern
```typescript
async function callLLMWithFallback(prompt: string, systemPrompt: string) {
  const providers = [
    () => callGroq(prompt, systemPrompt),
    () => callOpenAI(prompt, systemPrompt),
    () => callAnthropic(prompt, systemPrompt),
    () => callOllama(prompt, systemPrompt),
  ]
  for (const provider of providers) {
    try {
      return await provider()
    } catch (e) {
      console.error('[LLM Fallback] Provider failed, trying next:', e)
      continue
    }
  }
  throw new Error('All LLM providers failed')
}
```

### Multi-Tenant Query Pattern (ALWAYS USE)
```typescript
// CORRECT — always scope to org_id
const { data } = await supabase
  .from('alerts')
  .select('*')
  .eq('org_id', orgId)  // ← NEVER OMIT THIS

// WRONG — never do this
const { data } = await supabase.from('alerts').select('*')
```

### Error Handling Pattern
```typescript
try {
  // action
} catch (error) {
  console.error('[AgentName][ActionName] Failed:', error)
  // Log to agent_runs table with status: 'FAILED'
  // Never silently swallow errors
  throw error // or handle gracefully with fallback
}
```

---

## ENV VARS REFERENCE

```bash
# These exist in .env.production