# 🛡️ Phish-Slayer: Project Context

## 1. Project Overview

**Phish-Slayer** is a proactive, enterprise-grade cybersecurity defense platform and automated vulnerability scanner. Designed as a high-scale Blue Team AI SaaS, it provides security analysts (SOC) with a data-dense dashboard to monitor, analyze, and quarantine cyber threats in real-time.

---

## 2. System Architecture

The architecture follows a modern, serverless, event-driven paradigm tailored for high performance and security.

### Frontend

- **Framework:** Next.js 16 (React 18) using the App Router (`app/` directory).
- **Styling & UI:** Tailwind CSS v3.4 combined with `shadcn/ui` (Radix UI primitives) for accessible, customizable components.
- **Visuals:** Lucide React icons, Framer Motion 12 for animations, Recharts for data visualization (God's Eye bar chart).
- **Toast Notifications:** `sonner` for snackbar-style alerts.
- **State Management:** Zustand for client-side state, SWR for server-state caching and revalidation.
- **PDF Generation:** `jspdf` + `jspdf-autotable` for client-side Executive Report PDF export.

### Backend & API

- **Execution:** Next.js Server Actions (`'use server'`) and App Router API routes (`app/api/`), with potential offloading to Google Cloud Functions/n8n webhooks for heavy scanning workloads.
- **Threat Intelligence:** Integration with **VirusTotal** API (`lib/scanners/threatScanner.ts`) for IP/URL scanning (automatic IP vs URL detection, rate-limit handling, `no-store` cache bypass).
- **AI Engine:** Google Gemini AI (`@google/genai`, model `gemini-2.5-flash`) via `lib/ai/analyzer.ts` — provides:
  - `analyzeThreat()` — Full incident analysis returning risk score, threat category, and remediation steps.
  - `scoreCtiFinding()` — Reduced-payload CTI scoring from VirusTotal data, returning risk score, threat category, and an AI-generated summary.
- **Endpoint Agent:** `lib/agent/endpointMonitor.ts` — A lightweight endpoint anomaly detection agent using **osquery** (with netstat fallback) that polls active outbound network connections, filters internal/loopback traffic, and POSTs suspicious connections to the `/api/flag-ioc` route for triage.
- **Public API v1:** `app/api/v1/scan/route.ts` — REST API (GET/POST) secured with `x-api-key` header (checked against `process.env.PHISH_SLAYER_API_KEY`). Runs the full 3-gate scan pipeline and returns JSON results. Fires Discord alerts on malicious findings.
- **Intel Sync CRON:** `app/api/intel/sync/route.ts` — Automated URLhaus threat feed harvester, secured with `CRON_SECRET` bearer token, scheduled via Vercel Cron Jobs every 12 hours.
- **Discord Webhook Sirens:** `fireDiscordAlert()` in `lib/supabase/actions.ts` — Sends red Discord embeds (target, risk score, AI summary) when malicious threats are detected via dashboard scans or API scans.

### Database & Authentication

- **Provider:** Supabase (PostgreSQL).
- **Tables:** `profiles`, `scans`, `incidents`, `whitelist`, `proprietary_intel`.
- **RLS:** Row Level Security enabled on all data tables. Policies restrict all operations (SELECT, INSERT, UPDATE, DELETE) to the `authenticated` role only.
- **Auth Flow:** Supabase SSR authentication via `@supabase/ssr` with specialized client/server/middleware utilities (`lib/supabase/`). Session management and route protection handled by Next.js middleware (`middleware.ts` → `lib/supabase/middleware.ts`).
  - Unauthenticated users at `/`, `/dashboard/*` → redirected to `/auth/login`.
  - Authenticated users at `/`, `/auth/*` → redirected to `/dashboard`.
- **Auth Actions:** `lib/supabase/auth-actions.ts` — `signInWithEmail`, `signUpWithEmail`, `signInWithSocial` (Google/GitHub OAuth), `getUser`, `updateProfile`, `updateSettings`.
- **Auth Pages:** `app/auth/login/`, `app/auth/signup/`, `app/auth/forgot-password/`, `app/auth/reset-password/`, `app/auth/2fa/`, `app/auth/callback/`.
- **Queries:** `lib/supabase/queries.ts` provides server-side data access helpers (e.g. `getUserProfile()`).

### Payments

- **Provider:** Stripe SDK v14 (`lib/stripe.ts`).
- **Webhook:** `app/api/stripe/webhook/route.ts` — Handles `checkout.session.completed` and `invoice.payment_succeeded` events with Zod validation, updating the Supabase `profiles` table with subscription tier info.

---

## 3. Scan Pipeline (3-Gate Architecture)

The `launchScan()` function in `lib/supabase/actions.ts` implements a tiered scan pipeline:

1. **Gate 1 — Whitelist Check:** Queries the `whitelist` table. If the target matches, immediately returns a `clean` verdict (risk score 0) and halts. No external APIs called.
2. **Gate 2 — Proprietary Intel Vault:** Queries the `proprietary_intel` table. If found, immediately returns a `malicious` verdict (risk score 100, category: "Proprietary Local Intel") and fires a Discord webhook alert.
3. **Gate 3 — External Scan (VirusTotal → Gemini):** Calls VirusTotal API for threat intelligence, then sends stripped CTI data to Gemini AI for scoring and summarization. If verdict is `malicious`, fires a Discord webhook alert.

All scan results are recorded to the `scans` table in Supabase.

---

## 4. Directory Structure

```
d:\Phish Slayer\
├── app/
│   ├── layout.tsx                 # Root layout (Inter font, metadata)
│   ├── page.tsx                   # Landing page
│   ├── globals.css                # Global styles & Tailwind directives
│   ├── auth/
│   │   ├── login/page.tsx         # Login (email/password + Google/GitHub OAuth)
│   │   ├── signup/page.tsx        # Registration
│   │   ├── forgot-password/       # Password recovery
│   │   ├── reset-password/        # Password reset
│   │   ├── 2fa/                   # Two-factor auth
│   │   └── callback/route.ts      # OAuth callback handler
│   ├── api/
│   │   ├── flag-ioc/route.ts      # IOC flagging endpoint (agent telemetry)
│   │   ├── intel/sync/route.ts    # URLhaus CRON harvester (CRON_SECRET secured)
│   │   ├── v1/scan/route.ts       # Public API v1 (x-api-key secured)
│   │   └── stripe/webhook/route.ts # Stripe webhook handler
│   └── dashboard/
│       ├── layout.tsx             # Dashboard shell (sidebar + top nav)
│       ├── loading.tsx            # Dashboard skeleton loader
│       ├── page.tsx               # God's Eye Command Center (KPIs + charts)
│       ├── components/
│       │   ├── SidebarNav.tsx     # Collapsible sidebar navigation
│       │   └── TopNav.tsx         # Top navigation bar w/ user avatar
│       ├── incidents/page.tsx     # Incident management (CRUD, resolve, block IP)
│       ├── scans/page.tsx         # Scan manager (launch scans, recent table)
│       ├── threats/page.tsx       # Threat intel deep-dive (sandbox, PDF export)
│       ├── intel/page.tsx         # Intel Vault management + API docs
│       └── settings/             # User/org settings
├── lib/
│   ├── utils.ts                   # Utility helpers (cn() for class merging)
│   ├── stripe.ts                  # Stripe client initialization
│   ├── ai/
│   │   └── analyzer.ts           # Gemini AI threat analysis & CTI scoring
│   ├── scanners/
│   │   └── threatScanner.ts      # VirusTotal IP/URL scanner
│   ├── agent/
│   │   └── endpointMonitor.ts    # Osquery-based endpoint monitor
│   └── supabase/
│       ├── client.ts             # Browser-side Supabase client
│       ├── server.ts             # Server-side Supabase client
│       ├── middleware.ts         # Session refresh + route guard helper
│       ├── auth-actions.ts       # Auth server actions
│       ├── queries.ts            # DB query helpers
│       └── actions.ts            # CRUD server actions (scans, incidents, whitelist, intel, blockIp, launchScan, fireDiscordAlert)
├── middleware.ts                  # Root Next.js middleware (auth guard)
├── vercel.json                    # Vercel Cron config (intel sync every 12h)
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 5. Security Flow

1. **Perimeter Defense:** Next.js middleware asserts valid Supabase sessions before `/dashboard` access. Unauthenticated → `/auth/login`.
2. **Row Level Security:** All data tables (`whitelist`, `proprietary_intel`, `incidents`, `scans`) enforce RLS policies restricted to the `authenticated` role.
3. **API Security:** Public API v1 requires `x-api-key` header. Intel sync CRON requires `Authorization: Bearer CRON_SECRET`.
4. **Data Sanitization:** Zod schemas validate all incoming payloads before DB operations. TypeScript strict typing throughout.
5. **Threat Processing Pipeline:** IOC flagged → Whitelist check → Intel Vault check → VirusTotal scan → Gemini AI analysis → Dashboard rendering → Discord alert (if malicious).

---

## 6. Key Dependencies

| Package                    | Version  | Purpose                        |
| -------------------------- | -------- | ------------------------------ |
| `next`                     | ^16.1.6  | App framework (App Router)     |
| `react` / `react-dom`      | 18.2.0   | UI library                     |
| `@supabase/ssr`            | ^0.8.0   | Supabase SSR auth              |
| `@supabase/supabase-js`    | ^2.39.0  | Supabase client SDK            |
| `stripe`                   | ^14.15.0 | Payment processing             |
| `@google/genai`            | ^1.43.0  | Gemini AI integration          |
| `zustand`                  | ^5.0.11  | Client state management        |
| `swr`                      | ^2.4.0   | Server-state caching           |
| `zod`                      | ^3.22.4  | Schema validation              |
| `framer-motion`            | ^12.34.3 | Animations                     |
| `recharts`                 | ^2.15.4  | Data visualization (bar chart) |
| `jspdf`                    | latest   | PDF generation                 |
| `jspdf-autotable`          | latest   | PDF table plugin               |
| `lucide-react`             | ^0.323.0 | Icon library                   |
| `sonner`                   | ^2.0.7   | Toast notifications            |
| `tailwindcss`              | ^3.4.1   | Utility-first CSS              |
| `class-variance-authority` | ^0.7.1   | Component variant styling      |

---

## 7. Environment Variables

| Variable                             | Purpose                               |
| ------------------------------------ | ------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`           | Supabase project URL                  |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`      | Supabase anon key (browser client)    |
| `SUPABASE_SERVICE_ROLE_KEY`          | Supabase service role key (admin ops) |
| `VIRUS_TOTAL_API_KEY`                | VirusTotal API key                    |
| `GEMINI_API_KEY`                     | Google Gemini AI key                  |
| `DISCORD_WEBHOOK_URL`                | Discord webhook for threat alerts     |
| `PHISH_SLAYER_API_KEY`               | Public API v1 authentication key      |
| `URLHAUS_AUTH_KEY`                   | URLhaus feed auth key                 |
| `CRON_SECRET`                        | Vercel Cron job auth secret           |
| `STRIPE_SECRET_KEY`                  | Stripe server-side key                |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe client-side key                |
| `STRIPE_WEBHOOK_SECRET`              | Stripe webhook signature secret       |
| `NEXT_PUBLIC_SITE_URL`               | Site URL for OAuth redirects          |

---

## 8. Current Development Status

### ✅ Completed (V1 MVP)

- **Authentication System:** Full Supabase SSR auth with email/password, Google/GitHub OAuth, forgot/reset password, 2FA page, middleware route guards.
- **3-Gate Scan Pipeline:** Whitelist → Intel Vault → VirusTotal + Gemini AI with automatic scan recording.
- **God's Eye Dashboard:** KPI cards (Total Scans, Malicious, Active Incidents, Intel Vault), Recharts bar chart (Threats by Category), Activity Feed (last 5 scans), Score Index orb.
- **Incident Management:** Full CRUD — create from threat scanner, resolve, delete, block IP (upserts to intel vault). Dynamic KPIs, search/filter.
- **Threat Intel Deep-Dive:** Live sandbox screenshots (Thum.io), IP detection fallback, scan overlay, source analysis JSON, engine stats.
- **Executive PDF Reports:** Branded PDF generation (jspdf + autotable) with verdict, risk score, AI summary, engine table, confidential badge.
- **Intel Vault Management:** Whitelist table + Proprietary Intel table with deletion, severity badges, KPI strip.
- **Public API v1:** REST endpoint at `/api/v1/scan` (GET/POST), API key auth, full scan pipeline, JSON response.
- **API Documentation UI:** Embedded in Intel Vault page — endpoint, auth, curl examples, response format.
- **Discord Webhook Sirens:** Red embeds fired on malicious findings from both dashboard scans and API scans.
- **Intel Sync CRON:** URLhaus feed harvester with Supabase upsert, secured by CRON_SECRET, scheduled every 12h via Vercel.
- **Stripe Integration:** Webhook handler for subscription events with Zod validation.
- **UI Polish:** ARIA attributes, memoization, lazy loading, keyboard nav, WCAG AA contrast, loading states.

### 🚧 V2 Roadmap

- **URL Normalization:** Strip `http(s)://` and trailing slashes before whitelist/intel vault lookups.
- **DOM Tree & WHOIS tabs:** Data extraction panels on the Threats page.
- **Zustand Stores:** Client-side state for scan filters, dashboard preferences.
- **Automated Workflows:** n8n webhook integration for continuous threat feed ingestion.
- **Full RBAC:** Per-user row-level security policies based on `auth.uid()`.
- **Pricing Page:** Subscription tier selection with Stripe Checkout.

---

_Last updated: 2026-03-06 by Antigravity AI_
