# TechStack.md — Technology Decisions
# Phish-Slayer V3

---

## CRITICAL: Do Not Suggest Replacements

The technology choices below are FINAL for V3. Do not suggest replacing any of them with alternatives. Do not suggest migrating to Prisma, Drizzle, tRPC, or any other library not listed here. If a new feature requires a new dependency, flag it explicitly and wait for approval before adding it.

---

## 1. Framework

**Next.js 15** (App Router, `app/` directory)
- Version: `^15.x` (check `package.json` for exact)
- Uses App Router exclusively — no Pages Router code anywhere
- Server Components by default; Client Components only when interactivity required
- Server Actions (`'use server'`) for all mutations

**React 18.2.0** with concurrent features enabled

---

## 2. Runtime & Server

**Custom `server.js`** — CRITICAL ARCHITECTURAL DECISION
- The app does NOT run via `next start`
- It runs via a custom Node.js HTTP server in `server.js` at the project root
- `server.js` also instantiates the WebSocket server (`ws` package) for EDR agent connections
- **Never suggest replacing `server.js` with a standalone Next.js deployment**
- PM2 starts the app via: `node server.js`

**Node.js:** 20.20.1 (pinned on Azure VM)

**WebSocket Library:** `ws` package (not `socket.io`)

---

## 3. Database & Authentication

**Supabase** (PostgreSQL + SSR Auth + RLS)
- `@supabase/ssr` for SSR-compatible auth
- `@supabase/supabase-js` for DB queries
- **Never bypass RLS** — all queries respect row-level security
- Service role key used only for admin operations in server actions
- Browser client uses anon key only

**Auth Utilities:**
- `lib/supabase/client.ts` — browser-side client
- `lib/supabase/server.ts` — server-side client
- `lib/supabase/middleware.ts` — session refresh helper
- `lib/supabase/auth-actions.ts` — auth server actions

---

## 4. AI Engine

**Google Gemini** (`@google/genai`)
- Model: `gemini-2.5-flash`
- Used for: threat analysis, CTI scoring, remediation step generation
- All AI calls in `lib/ai/analyzer.ts`
- Two functions: `analyzeThreat()` (full analysis) and `scoreCtiFinding()` (quick CTI score)

---

## 5. Threat Intelligence

**VirusTotal API**
- IP and URL scanning with auto-detection
- Rate limiting handled with exponential backoff
- `no-store` cache bypass to always get fresh results
- All logic in `lib/scanners/threatScanner.ts`

**URLhaus** (automated feed via CRON)

---

## 6. Styling

**Tailwind CSS v3.4** — utility-first CSS
**shadcn/ui** — component library built on Radix UI primitives
- Components are copied into `components/ui/` — not imported from npm
- Never import from `@shadcn/ui` directly

**Class Variance Authority (CVA)** — for component variant management

---

## 7. State Management

**Zustand** (`^5.0.11`) — client-side global state
**SWR** (`^2.4.0`) — server-state caching and revalidation

---

## 8. Payments

**Stripe SDK v14** (`stripe`)
- Webhook signature verification required on all webhook endpoints
- Zod validation on all webhook payloads

---

## 9. File Generation

**jsPDF + jsPDF-AutoTable** — client-side PDF generation (Executive Reports)
**SheetJS (xlsx)** — client-side Excel export (Incident Reports)

---

## 10. Animations & Visuals

**Framer Motion 12** — page transitions and loading animations only
**Recharts** (`^2.15.4`) — all data charts
**Lucide React** (`^0.323.0`) — all icons

---

## 11. Notifications

**Sonner** (`^2.0.7`) — toast notifications
**Discord Webhooks** — threat alert notifications (server-side only)
**Resend** — transactional email

---

## 12. Validation

**Zod** (`^3.22.4`) — all server-side input validation
- Every server action has a Zod schema
- Never trust client input without Zod validation

---

## 13. Infrastructure

**Azure VM** — Ubuntu 24.04 LTS
- IP: `40.123.224.93`
- Domain: `phishslayer.tech`
- User: `mzain2004`
- App path: `/home/mzain2004/Phish-Slayer`

**Nginx** — reverse proxy (see Deployment.md for config)
**PM2** — process manager
**GitHub** — source control (`mzain2004/Phish-Slayer`)

---

## 14. Environment Management

**dotenv** — loaded in `server.js` ONLY
- Production file: `.env.production`
- Local file: `.env.local`
- See Deployment.md for critical dotenv rules

---

## 15. Key Package Versions (check package.json for exact)

| Package | Approximate Version |
|---------|-------------------|
| next | ^15.x |
| react | 18.2.0 |
| @supabase/ssr | ^0.8.0 |
| @supabase/supabase-js | ^2.39.0 |
| stripe | ^14.15.0 |
| @google/genai | ^1.43.0 |
| zustand | ^5.0.11 |
| swr | ^2.4.0 |
| zod | ^3.22.4 |
| framer-motion | ^12.x |
| recharts | ^2.15.4 |
| lucide-react | ^0.323.0 |
| sonner | ^2.0.7 |
| tailwindcss | ^3.4.1 |
| ws | latest |
