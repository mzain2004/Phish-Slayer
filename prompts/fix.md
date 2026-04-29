READ gemini.md fully before starting.

You are building Layer 0: the Agent Runtime Infrastructure for PhishSlayer.
This is the foundation everything else runs on. Be precise. Be complete.

CONTEXT:
- PhishSlayer is a 100% autonomous agentic SOC platform
- Current state: Wazuh → L1 → L2 → L3 pipeline works but has no formal runtime infrastructure
- Tech stack: Next.js 14, TypeScript, Supabase, Groq (lazy init), Redis target
- Every query MUST be scoped to org_id — multi-tenant, RLS enforced
- Design: #0a0a0f bg, #7c6af7 primary, #00d4aa accent, 4px buttons, Inter + IBM Plex Mono

AUDIT FIRST:
1. Read ALL files in /lib/agents/ 
2. Read ALL files in /app/api/agents/
3. Read ALL agent-related files anywhere in the codebase
4. Identify: missing error handling, missing org_id scoping, broken imports, any Groq client at module level
5. Fix ALL found issues before adding any new code

BUILD THESE (in order):

## 1. Agent State Machine (/lib/agents/runtime/state-machine.ts)
```typescript
// Implement full state machine:
type AgentState = 'IDLE'|'QUEUED'|'RUNNING'|'BLOCKED'|'ESCALATED'|'COMPLETED'|'FAILED'|'RETRYING'|'ARCHIVED'

// State transitions (enforce these — invalid transitions throw errors):
// IDLE → QUEUED (on new alert)
// QUEUED → RUNNING (on agent start)
// RUNNING → BLOCKED (on external API wait)
// RUNNING → ESCALATED (on confidence < gate or explicit escalation)
// RUNNING → COMPLETED (on success)
// RUNNING → FAILED (on unrecoverable error)
// FAILED → RETRYING (on retry attempt, max 3)
// RETRYING → RUNNING (on retry start)
// RETRYING → FAILED (on max retries exceeded)
// Any → ARCHIVED (on case close)

// Include: state validation, transition logging, timestamp tracking per state
```

## 2. Agent Communication Envelope (/lib/agents/runtime/types.ts)
```typescript
// Build complete TypeScript interfaces:
interface AgentHandoff {
  alert_id: string
  org_id: string  // MANDATORY
  agent_id: string
  tier: 'L1' | 'L2' | 'L3'
  confidence: number  // 0.0-1.0
  findings: AgentFindings
  actions_taken: AgentAction[]
  handoff_context: Record<string, any>
  timestamp: string  // UTC ISO 8601
  state: AgentState
  token_count: number
  model_used: string
}

interface AgentFindings {
  severity_score: number
  mitre_techniques: string[]
  iocs: IOC[]
  enrichment: EnrichmentData
  risk_factors: string[]
  recommended_actions: string[]
  raw_llm_reasoning: string
}

interface IOC {
  type: 'ip' | 'domain' | 'hash' | 'url' | 'email' | 'filename'
  value: string
  confidence: number
  source: string
  threat_score: number
}

interface EnrichmentData {
  ip_geo?: IPGeoData
  domain_age?: number
  vt_score?: number
  abuse_score?: number
  asset_criticality?: 1|2|3|4
  user_risk_score?: number
}
```

## 3. Confidence Gate Engine (/lib/agents/runtime/confidence-gates.ts)
```typescript
// Hard-coded gate values (configurable per org via DB in future):
const CONFIDENCE_GATES = {
  L2_AUTO_EXECUTE: 0.85,
  L3_ESCALATE: 0.70,
  DESTRUCTIVE_ACTION: 0.90,
  HUMAN_APPROVAL_GATE: 0.95,
} as const

// Build: shouldExecute(confidence, actionType, orgId) → boolean
// Build: shouldEscalate(confidence, tier) → boolean
// Build: requiresHumanApproval(actionType, assetCriticality) → boolean
// Log every gate decision with reasoning
```

## 4. Agent Execution Ledger (/lib/agents/runtime/ledger.ts)
```typescript
// Every spawn, every action → append-only log to Supabase
// Build: logAgentSpawn(orgId, tier, alertId, agentId) → void
// Build: logAgentAction(orgId, agentRunId, action, target, params, result) → void  
// Build: logAgentComplete(orgId, agentRunId, findings, confidence) → void
// Build: logAgentFail(orgId, agentRunId, error, state) → void
// All logs write to agent_runs and agent_actions tables
// Include timestamp microsecond precision
```

## 5. Dead Letter Queue (/lib/agents/runtime/dlq.ts)
```typescript
// Failed agent runs → stored in Supabase for replay
// Build: pushToDLQ(orgId, agentRun, error, inputPayload) → void
// Build: replayFromDLQ(orgId, dlqEntryId) → AgentHandoff
// Build: listDLQEntries(orgId) → DLQEntry[]
// DLQ entries expire after 7 days (auto-cleanup job)
// Never silently drop failed runs — always push to DLQ
```

## 6. Token Budget Manager (/lib/agents/runtime/token-budget.ts)
```typescript
// Per-investigation token budget
// Default limits per plan: FREE=50K, PRO=200K, ENTERPRISE=1M tokens per investigation
// Build: checkBudget(orgId, alertId, estimatedTokens) → boolean
// Build: recordUsage(orgId, alertId, tokensUsed, model) → void
// Build: getBudgetStatus(orgId, alertId) → {used, limit, remaining, pct}
// Alert when org burns 10x daily normal usage
// Log all usage to soc_metrics table
```

## 7. Context Window Manager (/lib/agents/runtime/context-manager.ts)
```typescript
// Manage long investigations that exceed LLM context
// Groq llama-3.3-70b: 128K context window
// Trigger at 80% (102K tokens): summarize earlier findings, preserve key IOCs
// Build: summarizeContext(findings: AgentFindings[]) → string (compressed summary)
// Build: extractCriticalIOCs(context: string) → IOC[] (never lose these even when summarizing)
// Build: buildPromptContext(handoff: AgentHandoff, maxTokens: number) → string
// Use tiktoken or character estimate (1 token ≈ 4 chars) for token counting
```

## 8. LLM Fallback Chain (/lib/agents/runtime/llm-client.ts)
```typescript
// Full fallback: Groq → OpenAI → Anthropic → Ollama
// ALL CLIENTS MUST USE LAZY INITIALIZATION — no client at module level
// Circuit breaker: trip after 3 consecutive failures per provider, retry after 60s
// Build: callLLM(prompt, systemPrompt, options) → LLMResponse
// Build: getProviderHealth() → Record<string, boolean>
// Low severity → route to Groq (fast/cheap)
// High severity → route to best available model
// Log provider used + tokens used + latency per call
```

## 9. Parallel Agent Executor (/lib/agents/runtime/executor.ts)
```typescript
// 50 alerts arrive → 50 L1 agents fire simultaneously
// Build: executeParallel(alerts: Alert[], orgId: string) → Promise<AgentHandoff[]>
// Max concurrent per org: configurable, default 20
// Each execution: spawn → run → collect result → push to next tier or DLQ
// Timeout per agent: 30s for L1, 120s for L2, 300s for L3
// Partial results: if agent times out, save what was found, mark as TIMEOUT
```

## 10. Prompt Injection Firewall (/lib/agents/runtime/prompt-firewall.ts)
```typescript
// Sanitize ALL log data before it touches any LLM prompt
// Strip: prompt injection attempts ("Ignore previous instructions", "You are now...")
// Strip: special LLM control tokens
// Encode: characters that break JSON parsing in prompts
// Enforce: max input length per field (IP: 45 chars, hash: 64 chars, domain: 253 chars)
// Validate: extracted IOC formats (IP regex, hash length, domain validity)
// Log: any injection attempt detected → flag alert as suspicious
// Build: sanitizeForLLM(input: string) → string
// Build: validateIOC(value: string, type: IOC['type']) → boolean
// Build: sanitizeHandoff(handoff: Partial<AgentHandoff>) → AgentHandoff
```

## 11. Agent Supervisor API Route (/app/api/agents/supervisor/route.ts)
```typescript
// GET /api/agents/supervisor — agent health status for all orgs (internal only)
// POST /api/agents/supervisor/restart — restart stuck agent
// GET /api/agents/supervisor/dlq — view DLQ entries for org
// POST /api/agents/supervisor/replay — replay DLQ entry
// All routes require service role key auth (not user auth)
// Add rate limiting: max 100 req/min per IP
```

## 12. Graceful Degradation Handler (/lib/agents/runtime/degradation.ts)
```typescript
// All LLM providers down → rule-based triage only, queue for AI when restored
// Rule-based triage: severity from Wazuh rule level, MITRE from static mapping table
// Build: isLLMAvailable() → boolean
// Build: triageWithRules(alert: Alert) → {severity, mitre_tags, disposition}
// Build: queueForAIProcessing(alert: Alert, orgId: string) → void (Redis queue)
// Alert ops team when all providers down via email/Slack webhook
```

## 13. Database Migrations (run in order):
```sql
-- Migration: add Layer 0 tables

-- Agent execution checkpoint (for crash resume)
CREATE TABLE IF NOT EXISTS agent_checkpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  agent_run_id UUID NOT NULL REFERENCES agent_runs(id),
  checkpoint_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE agent_checkpoints ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_isolation" ON agent_checkpoints USING (org_id = current_setting('app.current_org_id')::uuid);

-- Dead letter queue
CREATE TABLE IF NOT EXISTS agent_dlq (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  agent_run_id UUID REFERENCES agent_runs(id),
  tier TEXT NOT NULL,
  error_message TEXT,
  input_payload JSONB,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT now() + INTERVAL '7 days'
);
ALTER TABLE agent_dlq ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_isolation" ON agent_dlq USING (org_id = current_setting('app.current_org_id')::uuid);

-- Token usage tracking
CREATE TABLE IF NOT EXISTS token_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  alert_id UUID,
  agent_run_id UUID,
  model TEXT NOT NULL,
  tokens_used INTEGER NOT NULL,
  provider TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE token_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_isolation" ON token_usage USING (org_id = current_setting('app.current_org_id')::uuid);

-- LLM provider health tracking
CREATE TABLE IF NOT EXISTS llm_provider_health (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  status TEXT NOT NULL, -- 'healthy' | 'degraded' | 'down'
  last_check TIMESTAMPTZ DEFAULT now(),
  failure_count INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

## FINAL STEPS:
1. Export all new types from /lib/agents/runtime/index.ts
2. Update existing L1/L2/L3 agents to use new runtime (state machine, ledger, confidence gates)
3. Run npm run build — fix ALL errors
4. Run npm run build again — must be ZERO errors
5. Create file LAYER0_COMPLETE.md documenting what was built
6. DO NOT COMMIT until build passes completely