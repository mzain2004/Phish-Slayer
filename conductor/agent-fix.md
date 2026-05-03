# Emergency Agent Fix Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the agent LLM pipeline, update the dashboard, and create an agent trigger endpoint.

**Architecture:** We will lazily initialize the Groq client to prevent build crashes, remove the Gemini fallback from `lib/ollama-client.ts`, fix the dashboard crash, redesign the agents page, and add an API route for triggering cron manually.

**Tech Stack:** Next.js 15, TypeScript, Supabase, Groq SDK

---

### Task 1: Fix Groq Lazy Init

**Files:**
- Modify: `lib/ai/groq.ts`
- Modify: `lib/agents/runtime/llm-client.ts`
- Modify: `lib/cases/pir-generator.ts`
- Modify: `lib/hunting/hypothesisBuilder.ts`
- Modify: `lib/l2/attackChain.ts`
- Modify: `lib/l3/detectionCoverage.ts`
- Modify: `lib/mitre/tagger.ts`

- [ ] **Step 1: Modify `lib/ai/groq.ts` to use dynamic import and explicit logging**
Update `groqComplete` and `getGroqClient` to match the exact requirement:
```typescript
let groqClient: any = null;

async function getGroqClient() {
  if (!groqClient) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error("Missing GROQ_API_KEY");
    const { default: Groq } = await import("groq-sdk");
    groqClient = new Groq({ apiKey });
  }
  return groqClient;
}

// Update groqComplete to call await getGroqClient(), and log errors:
// catch (error) {
//   console.error('[GROQ ERROR]', error?.message, error?.status);
//   ...
// }
```

- [ ] **Step 2: Modify `lib/agents/runtime/llm-client.ts`**
Update `getGroq` to be async and use dynamic import:
```typescript
let groq: any = null;
async function getGroq() {
  if (!groq) {
    const { default: Groq } = await import("groq-sdk");
    groq = new Groq({ apiKey: process.env.GROQ_API_KEY || '' });
  }
  return groq;
}
// Update callLLM to await getGroq()
```

- [ ] **Step 3: Remove module-level Groq instantiations in other files**
Check `lib/cases/pir-generator.ts`, `lib/hunting/hypothesisBuilder.ts`, `lib/l2/attackChain.ts`, `lib/l3/detectionCoverage.ts`, `lib/mitre/tagger.ts` and remove `const groq = new Groq(...)` at the top level. Instead, initialize inside the function or use `groqComplete` from `lib/ai/groq.ts`.

### Task 2: Remove Gemini Fallback

**Files:**
- Modify: `lib/ollama-client.ts`

- [ ] **Step 1: Remove `geminiPrompt` parameter and `groqGenerate(geminiPrompt || prompt)` fallback to Gemini**
Change `generateWithFallback` to fall back to Groq if Ollama fails, but NEVER fall back to Gemini. Wait, the prompt says "It's calling Gemini when Groq fails... New fallback order: Groq -> null".
Let's update `lib/ollama-client.ts` to:
```typescript
export async function generateWithFallback(
  prompt: string,
  _geminiPrompt?: string,
): Promise<string> {
  try {
    const groqResult = await groqGenerate(prompt);
    console.info("[llm] provider=groq model=%s", getGroqModel());
    return groqResult;
  } catch (groqError) {
    console.error("[llm] provider=groq failed", groqError);
    return ""; // fail gracefully, return empty string or null depending on signature
  }
}
```

### Task 3: Agent Activity Feed (Command Center)

**Files:**
- Modify: `app/dashboard/page.tsx`

- [ ] **Step 1: Fix dashboard crash (try/catch on all fetches)**
Ensure the whole `DashboardOverviewPage` data fetching logic is wrapped in a try/catch, returning an empty state/fallback on error.

- [ ] **Step 2: Add Agent Activity section**
Fetch from `agent_reasoning` and display as a live feed. Add the 4 KPI cards.

### Task 4: Agent Page Update

**Files:**
- Modify: `app/dashboard/agents/page.tsx`

- [ ] **Step 1: Remove any role-based redirect**
- [ ] **Step 2: Replace content with Agent Status Page**
Create 3 sections: Agent Status Cards (L1, L2, L3), Recent Decisions table (from `agent_reasoning`), and Agent Stats.

### Task 5: Trigger Agents on VM

**Files:**
- Create: `app/api/admin/trigger-agent-run/route.ts`

- [ ] **Step 1: Implement trigger route**
```typescript
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const auth = req.headers.get('authorization');
  if (auth !== \`Bearer \${process.env.CRON_SECRET}\`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const origin = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    await fetch(\`\${origin}/api/cron/l1-triage\`, {
      headers: { Authorization: \`Bearer \${process.env.CRON_SECRET}\` }
    });
    return NextResponse.json({ triggered: true, timestamp: new Date().toISOString() });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to trigger' }, { status: 500 });
  }
}
```

### Final Step: Build and Commit
- [ ] Run `npm run build`
- [ ] Commit with exact message `fix(agents): groq lazy init, remove gemini fallback, agent dashboard, command center feed`
- [ ] Push to `origin main`