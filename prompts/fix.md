@GEMINI.md @graph.md
New session. Read both. Emergency agent fix. Build MUST pass.

CONTEXT: agent_reasoning table has 375 entries from April 19. 
Agents stopped running. Most L2 entries show model_used='gemini-2.5-flash:fallback' 
and reasoning_text='gemini_unavailable'. Groq fails → Gemini fallback → Gemini also fails.
Primary fix: get Groq working. Secondary: make agents visible.

═══ FIX 1 — GROQ LAZY INIT (MOST CRITICAL) ═══

Read ALL files in lib/agents/ and lib/ai/ or wherever Groq is initialized.
Find: where is the Groq client created? Is it created at module level (top of file)?
If it's created at top of file like:
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
That causes build-time crash if env var missing.

Fix — move to lazy init inside every handler function:
  async function callGroq(prompt: string) {
    const { Groq } = await import('groq-sdk')
    const client = new Groq({ apiKey: process.env.GROQ_API_KEY })
    // ...
  }

Also: add explicit error logging so failures are visible:
  try {
    const response = await client.chat.completions.create({...})
    return response
  } catch (err) {
    console.error('[GROQ ERROR]', err.message, err.status)
    throw err  // let fallback handle it
  }

Read .env.production — is GROQ_API_KEY set? If missing, add it.
Read the Groq API key from env and verify it is not empty string.

═══ FIX 2 — REMOVE GEMINI FALLBACK ═══

Find the LLM fallback chain. It's calling Gemini when Groq fails.
Gemini is not configured for this project — remove it from the fallback.
New fallback order: Groq → null (fail gracefully, log error, don't hang for 15s)
Remove all Gemini API calls from the agent pipeline.
DO NOT add Anthropic API either — keep it Groq only for now.

═══ FIX 3 — AGENT ACTIVITY FEED (Command Center) ═══

File: app/dashboard/page.tsx
It renders blank. Read it. Fix the crash (try/catch on all fetches).

After fixing crash, add real agent activity section:
  const recentActivity = await supabase
    .from('agent_reasoning')
    .select('agent_level, decision, confidence_score, reasoning_text, created_at, model_used')
    .order('created_at', { ascending: false })
    .limit(10)
  
  // Note: agent_reasoning has organization_id column — filter by org_id

Render as a live feed list:
  - Each item: colored badge (L1=purple, L2=amber, L3=cyan)
  - Decision badge: ESCALATE (red), MANUAL_REVIEW (amber), CLOSE (green), HALT (gray)
  - Confidence bar
  - Reasoning text preview (first 80 chars)
  - Timestamp "X min ago"

Also add 4 KPI cards at top:
  - Total alerts processed: SELECT COUNT(DISTINCT alert_id) FROM agent_reasoning WHERE organization_id = orgId
  - Active agents: 3 (hardcoded — L1, L2, L3 always active)
  - Last run: MAX(created_at) FROM agent_reasoning WHERE organization_id = orgId
  - Avg confidence: AVG(confidence_score) FROM agent_reasoning WHERE confidence_score > 0

═══ FIX 4 — AGENT PAGE (redirects to dashboard) ═══

Read app/dashboard/agents/page.tsx (or wherever the Agent nav link points).
It's redirecting. Remove the redirect.
Replace with agent status page showing:
  
  SECTION 1 — Agent Status Cards (3 cards)
  L1 Triage: status=ACTIVE, last_run from agent_reasoning MAX(created_at) WHERE agent_level='L1'
  L2 Investigator: same for L2
  L3 Hunter: same for L3
  
  SECTION 2 — Recent Decisions table
  Last 20 entries from agent_reasoning with: Level, Alert ID (first 8 chars), 
  Decision, Confidence, Time, Model used
  
  SECTION 3 — Agent Stats
  Total decisions: COUNT from agent_reasoning
  L1 decisions: COUNT WHERE agent_level='L1'
  L2 decisions: COUNT WHERE agent_level='L2'  
  L3 decisions: COUNT WHERE agent_level='L3'
  Avg execution time: AVG(execution_time_ms)
  
All queries filtered by orgId (use organization_id column).

═══ FIX 5 — TRIGGER AGENTS ON VM ═══

After fixing Groq:
Read /scripts/cron-runner.sh — list all cron endpoints.
Agents have been dead since April 19. Crontab may have dropped.

Create: /app/api/admin/trigger-agent-run/route.ts
CRON_SECRET protected.
POST handler that calls: 
  fetch('/api/cron/l1-triage', { headers: { Authorization: `Bearer ${CRON_SECRET}` }})
Returns: { triggered: true, timestamp: now }

This lets you manually kick agents from browser without SSH.

═══ FINAL ═══
npm run build — zero errors.
git commit -m "fix(agents): groq lazy init, remove gemini fallback, agent dashboard, command center feed"
git push origin main

After push: SSH VM → git pull → docker compose up -d --build
Then hit: POST https://phishslayer.tech/api/admin/trigger-agent-run
Header: Authorization: Bearer PhishSlayerCron@2026!
Watch agent_reasoning table for new entries.