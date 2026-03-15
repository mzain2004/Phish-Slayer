# Architecture.md — System Design
# Phish-Slayer V3

---

## 1. High-Level Architecture

```
Browser Client
     │
     ▼
  Nginx (port 80/443)
  - Reverse proxy
  - Passes security headers
     │
     ▼
  Node.js / server.js (port 3000)
  - Next.js HTTP handler
  - WebSocket server (ws://.../api/agent/ws)
     │
     ├── Next.js App Router
     │   ├── Server Components (data fetching)
     │   ├── Server Actions (mutations)
     │   └── API Routes (webhooks, public API)
     │
     ├── Supabase (PostgreSQL + Auth)
     ├── VirusTotal API
     ├── Google Gemini AI
     ├── Discord Webhooks
     ├── Stripe
     └── Resend (email)

EDR Agents (remote endpoints)
     │
     ▼ WebSocket connection
  server.js WebSocket Server
     │
     ▼
  /api/flag-ioc (Next.js API route)
```

---

## 2. Folder Structure

```
/home/mzain2004/Phish-Slayer/
├── server.js                    ← CUSTOM SERVER - starts Next.js + WebSocket
├── ecosystem.config.js          ← PM2 config
├── .env.production              ← Production environment variables
├── .env.local                   ← Local environment variables
├── next.config.ts               ← Next.js config (includes allowedOrigins)
├── middleware.ts                 ← Root middleware (auth guard)
├── vercel.json                  ← CRON job config
├── package.json
├── tailwind.config.ts
├── tsconfig.json
│
├── app/
│   ├── layout.tsx               ← Root layout (Inter font, metadata)
│   ├── page.tsx                 ← Landing page
│   ├── globals.css              ← Global styles + CSS variables
│   │
│   ├── auth/
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   ├── reset-password/page.tsx
│   │   ├── 2fa/page.tsx
│   │   └── callback/route.ts   ← OAuth callback
│   │
│   ├── api/
│   │   ├── v1/scan/route.ts    ← Public REST API
│   │   ├── intel/sync/route.ts ← URLhaus CRON
│   │   ├── flag-ioc/route.ts   ← Agent IOC reports
│   │   └── stripe/webhook/route.ts
│   │
│   └── dashboard/
│       ├── layout.tsx           ← Dashboard shell (sidebar + topnav)
│       ├── loading.tsx          ← Skeleton loader
│       ├── page.tsx             ← God's Eye (KPIs + charts)
│       ├── components/
│       │   ├── SidebarNav.tsx
│       │   └── TopNav.tsx
│       ├── agents/page.tsx      ← EDR Fleet dashboard
│       ├── incidents/page.tsx
│       ├── scans/page.tsx
│       ├── threats/page.tsx
│       ├── intel/page.tsx
│       └── settings/page.tsx
│
├── lib/
│   ├── utils.ts                 ← cn() class merger
│   ├── stripe.ts                ← Stripe client init
│   │
│   ├── ai/
│   │   └── analyzer.ts         ← Gemini AI (analyzeThreat, scoreCtiFinding)
│   │
│   ├── scanners/
│   │   └── threatScanner.ts    ← VirusTotal integration
│   │
│   ├── agent/
│   │   └── endpointMonitor.ts  ← EDR agent (FIM + ProcMon + WS client)
│   │
│   └── supabase/
│       ├── client.ts            ← Browser Supabase client
│       ├── server.ts            ← Server Supabase client
│       ├── middleware.ts        ← Session refresh helper
│       ├── auth-actions.ts      ← Auth server actions
│       ├── queries.ts           ← DB query helpers
│       └── actions.ts           ← CRUD server actions (launchScan, etc.)
│
└── components/
    ├── ui/                      ← shadcn/ui components (copied, not imported)
    └── [shared components]
```

---

## 3. Data Flow: Scan Pipeline

```
User submits target (IP/URL)
         │
         ▼
launchScan() [lib/supabase/actions.ts]
         │
         ▼
Gate 1: whitelist table lookup
   ├── MATCH → return { verdict: clean, risk_score: 0 } ──► END
   └── NO MATCH → continue
         │
         ▼
Gate 2: proprietary_intel table lookup
   ├── MATCH → fire Discord → return { verdict: malicious, risk_score: 100 } ──► END
   └── NO MATCH → continue
         │
         ▼
Gate 3: VirusTotal scan [lib/scanners/threatScanner.ts]
         │
         ▼
Strip VirusTotal response to minimal CTI payload
         │
         ▼
Gemini AI scoring [lib/ai/analyzer.ts → scoreCtiFinding()]
         │
         ▼
Build final result object
         │
         ├── risk_score >= 70? → fire Discord alert
         │
         ▼
INSERT to scans table
         │
         ▼
Return result to frontend
```

---

## 4. Data Flow: EDR Agent

```
endpointMonitor.ts (running on endpoint machine)
         │
         ▼ WebSocket connect with x-agent-secret header
server.js WebSocket server
         │
         ├── Validate x-agent-secret
         │   └── INVALID → close(1008) ──► END
         │
         ├── Register agent in agents table
         │
         ▼ Bidirectional WebSocket connection established
         │
         ├── Agent sends telemetry → server processes → flags IOCs
         ├── Server sends commands → agent executes
         └── Heartbeat ping/pong every 30s
```

---

## 5. Request Flow: Dashboard Page

```
Browser requests /dashboard/page
         │
         ▼
middleware.ts runs first
         │
         ├── No session? → redirect to /auth/login
         │
         ▼ Session valid
         │
         ▼
dashboard/layout.tsx (Server Component)
   - Renders sidebar + topnav
   - Passes user to children via context
         │
         ▼
dashboard/page.tsx (Server Component)
   - Calls Supabase directly (server-side)
   - No API calls — direct DB access
   - Renders KPI cards, charts, activity feed
```

---

## 6. Key Architectural Decisions

### Why custom server.js?
Next.js does not support native WebSocket servers. The EDR agent system requires a persistent WebSocket connection. `server.js` extends the Next.js HTTP server with a `ws` WebSocket server attached to the same port.

### Why Server Components for dashboard data?
Dashboard data (scans, incidents, stats) is user-specific and sensitive. Server Components fetch data directly from Supabase server-side, bypassing the browser entirely. This means no API routes needed for dashboard data, no client-side data exposure, and faster initial page load.

### Why Server Actions for mutations?
Server Actions provide type-safe mutations without API routes. They run on the server, have access to server-side Supabase client, and can be called directly from Client Components.

### Why Supabase over Prisma/Drizzle?
Supabase provides both the database AND authentication in one service, with built-in RLS, real-time subscriptions, and SSR-compatible auth. Replacing it would require rebuilding the entire auth system.

---

## 7. What Goes Where

| Type of code | Location |
|-------------|----------|
| Page UI | `app/[route]/page.tsx` |
| Layout/shell | `app/[route]/layout.tsx` |
| Data fetching | Inside Server Components (page.tsx) |
| Mutations | `lib/supabase/actions.ts` as Server Actions |
| API endpoints | `app/api/[route]/route.ts` |
| AI logic | `lib/ai/analyzer.ts` |
| Scanner logic | `lib/scanners/threatScanner.ts` |
| Auth logic | `lib/supabase/auth-actions.ts` |
| DB queries (read) | `lib/supabase/queries.ts` |
| DB mutations | `lib/supabase/actions.ts` |
| Shared UI components | `components/` |
| shadcn primitives | `components/ui/` |
| Utility functions | `lib/utils.ts` |
