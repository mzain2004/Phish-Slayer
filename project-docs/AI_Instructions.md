# AI_Instructions.md — Agent Rules
# Phish-Slayer V3

---

## How to Use These Documents

Before writing a single line of code, read ALL files in this `/project-docs` folder in this order:

1. `PRD.md` — understand the product
2. `Features.md` — understand what's built and what needs building
3. `Architecture.md` — understand where code goes
4. `Database.md` — understand the data model
5. `TechStack.md` — understand the tools
6. `UIUX.md` — understand the design system
7. `API.md` — understand the interfaces
8. `Security.md` — understand the constraints
9. `Deployment.md` — understand the infrastructure
10. This file — understand how to behave

Only after reading all 10 documents should you begin writing code.

---

## Absolute Rules — Never Violate These

### 1. Never Touch Line 1 of server.js
```javascript
require('dotenv').config({ path: '/home/mzain2004/Phish-Slayer/.env.production' });
```
This line is sacred. Never move it, change the path to relative, make it conditional, or add any code above it. This was the root cause of a multi-day debugging session.

### 2. Never Enable perMessageDeflate
Both the WebSocket server (`server.js`) and client (`lib/agent/endpointMonitor.ts`) must always have `perMessageDeflate: false`. Enabling it causes immediate WebSocket connection failure.

### 3. Never Remove Nginx Security Headers
The 5 Nginx proxy headers (`Host`, `X-Real-IP`, `X-Forwarded-For`, `X-Forwarded-Proto`, `Accept-Encoding: ""`) must always be present. Removing any of them breaks authentication.

### 4. Never Disable RLS
Row Level Security is enabled on all Supabase tables. Never disable it, never create tables without RLS policies, never use the service role key in client-side code.

### 5. Never Use localStorage for Auth
Session management is handled entirely by Supabase SSR cookies. Never store session tokens, user data, or anything auth-related in localStorage.

### 6. Never Suggest Architecture Replacements
Do not suggest:
- Replacing Supabase with another database
- Replacing `server.js` with `next start`
- Replacing the `ws` WebSocket with Socket.io
- Replacing Tailwind with CSS modules or styled-components
- Replacing Server Actions with a REST API layer

If you genuinely believe a change is needed, flag it explicitly and explain why. Wait for approval before implementing.

### 7. Always Validate with Zod
Every Server Action and API route handler must validate inputs with a Zod schema before any database operation. Never trust user input.

### 8. Never Use next start
The start command is `node server.js`, not `npm start` or `next start`. Using `next start` would kill the WebSocket server.

---

## Code Quality Rules

### File Placement
- New page? → `app/dashboard/[feature]/page.tsx`
- New mutation? → Add to `lib/supabase/actions.ts`
- New DB query? → Add to `lib/supabase/queries.ts`
- New AI function? → Add to `lib/ai/analyzer.ts`
- New scanner? → Add to `lib/scanners/`
- New UI component? → `components/[ComponentName].tsx`
- New shadcn primitive? → `components/ui/`

Never dump logic in `page.tsx`. Pages should be thin — they fetch data and render components.

### Component Structure
```typescript
// Good: thin page, logic in lib
export default async function IncidentsPage() {
  const incidents = await getUserIncidents()  // from lib/supabase/queries.ts
  return <IncidentTable data={incidents} />
}

// Bad: logic in page
export default async function IncidentsPage() {
  const supabase = createServerClient(...)
  const { data } = await supabase.from('incidents').select('*')...
  // 200 more lines of logic
}
```

### Error Handling
- Never swallow errors silently
- API routes return clean JSON errors — never raw error objects
- Server Actions return typed result objects with `{ success: true/false, error?: string }`
- Always log errors server-side before returning clean response to client

### TypeScript
- Strict mode is enabled — no `any` types
- Define types for all API responses, function parameters, and return values
- Use Zod schemas as the source of truth for types (use `z.infer<typeof schema>`)

---

## Design System Rules

When building any UI component:
- Use CSS variables from `globals.css` for all colors
- Background: `--bg-card` for panels, `--bg-base` for pages, `--bg-elevated` for interactive elements
- Text: `--text-primary` for main content, `--text-secondary` for muted content
- Borders: `border-[--border]` always
- Never use Tailwind's default color palette (slate-800, gray-700, etc.) — use CSS variables
- Max blur: `backdrop-blur-sm` only
- Icons: Lucide React only

---

## Environment Variable Rules

When adding new environment variables:
1. Add to `.env.production` on the server with double quotes if value contains `#`
2. Add to `.env.local` for local development
3. Add to the table in `Deployment.md` > Environment Variables section
4. If it's a public variable (browser-accessible), prefix with `NEXT_PUBLIC_`
5. Never commit environment files to git
6. After modifying `.env.production`, do a full PM2 delete + restart cycle

---

## Testing Changes

Before declaring a feature complete:
1. Verify it works with `npm run build` (no TypeScript errors)
2. Test the specific feature in the browser
3. Check PM2 logs for any errors: `pm2 logs phish-slayer`
4. For WebSocket changes: run the agent and confirm connection

---

## When You're Unsure

If you encounter a situation not covered by these docs:
1. Do NOT make assumptions about production infrastructure
2. Ask for clarification before proceeding
3. For security-sensitive changes, always ask

---

## Common Mistakes to Avoid

| Mistake | Consequence | Correct Action |
|---------|-------------|----------------|
| Changing dotenv path in server.js | AGENT_SECRET undefined | Keep absolute hardcoded path at line 1 |
| Enabling perMessageDeflate | WebSocket disconnects instantly | Always `perMessageDeflate: false` |
| Removing Nginx headers | Auth CSRF failures | Keep all 5 headers |
| `pm2 restart` after env change | Old values still cached | Full `pm2 delete` + restart |
| Single-quoting `.env` values with `#` | Value truncated at `#` | Double-quote values with special chars |
| Using `next start` | WebSocket server doesn't start | Use `node server.js` |
| Writing logic in page.tsx | Unmaintainable spaghetti | Put logic in `lib/` |
| Calling Supabase in client component | Security risk | Use Server Components or Server Actions |

---

## Current Project Status

| Feature | Status |
|---------|--------|
| Auth system | ✅ Complete |
| 3-gate scan pipeline | ✅ Complete |
| God's Eye dashboard | ✅ Complete |
| Incident management | ✅ Complete |
| Threat deep-dive + PDF | ✅ Complete |
| Intel vault management | ✅ Complete |
| Public REST API | ✅ Complete |
| Discord alerts | ✅ Complete |
| Intel sync CRON | ✅ Complete |
| Stripe integration | ✅ Built |
| Plan gating | ✅ Complete |
| RBAC | ✅ Complete |
| Audit logging | ✅ Complete |
| Email notifications (Resend) | ✅ Complete |
| EDR agent (FIM + ProcMon + WS) | 🔄 Built, kill-chain test pending |
| Agent Fleet dashboard | ✅ Built |
| WebSocket C2 server | ✅ Built |

**Next priority:** Confirm EDR WebSocket kill-chain test passes (no `1008 Unauthorized`, agent appears online in `/dashboard/agents`).
