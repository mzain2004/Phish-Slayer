# Features.md — Feature Specifications
# Phish-Slayer V3

---

## 1. Authentication System ✅ COMPLETE

**What it does:** Full Supabase SSR authentication with multiple providers.

**Providers:** Email/password, Google OAuth, GitHub OAuth

**Pages:** `/auth/login`, `/auth/signup`, `/auth/forgot-password`, `/auth/reset-password`, `/auth/2fa`, `/auth/callback`

**Behavior:**
- Unauthenticated users at `/` or `/dashboard/*` → redirect to `/auth/login`
- Authenticated users at `/auth/*` → redirect to `/dashboard`
- Session managed via Supabase SSR cookies, refreshed in middleware
- OAuth callback handled at `/auth/callback/route.ts`

**Acceptance Criteria:**
- User can sign up with email, receives verification
- User can log in with email/password
- User can log in with Google or GitHub
- User can reset password via email link
- Middleware blocks all `/dashboard` routes without valid session

---

## 2. Three-Gate Scan Pipeline ✅ COMPLETE

**What it does:** Runs every IOC (IP or URL) through a tiered threat intelligence pipeline.

**Function:** `launchScan()` in `lib/supabase/actions.ts`

**Gate 1 — Whitelist Check:**
- Query `whitelist` table for exact match on `target`
- If match: return `{ verdict: 'clean', risk_score: 0, source: 'whitelist' }`
- Halt immediately. No external APIs called.

**Gate 2 — Proprietary Intel Vault:**
- Query `proprietary_intel` table for exact match
- If match: return `{ verdict: 'malicious', risk_score: 100, category: 'Proprietary Local Intel' }`
- Fire Discord webhook alert
- Halt immediately.

**Gate 3 — External Scan:**
- Auto-detect if target is IP or URL (regex)
- Call VirusTotal API via `lib/scanners/threatScanner.ts`
- Strip VirusTotal response to minimal CTI payload
- Send stripped payload to Gemini AI via `lib/ai/analyzer.ts` → `scoreCtiFinding()`
- Gemini returns: `{ risk_score, threat_category, summary }`
- If `risk_score >= 70`: fire Discord webhook alert
- Record result to `scans` table regardless of verdict

**Acceptance Criteria:**
- Gate 1 match never calls VirusTotal
- Gate 2 match fires Discord and returns immediately
- Gate 3 always records to `scans` table
- IP vs URL auto-detection works without user input
- Rate limit errors from VirusTotal return clean JSON error to frontend

---

## 3. God's Eye Dashboard ✅ COMPLETE

**What it does:** Real-time KPI command center at `/dashboard`.

**KPI Cards:**
- Total Scans (count from `scans` table)
- Malicious % (malicious / total × 100)
- Active Incidents (count from `incidents` where status = 'active')
- Intel Vault Size (count from `proprietary_intel`)

**Charts:** Recharts bar chart showing threat count grouped by `threat_category`

**Activity Feed:** Last 5 scans with verdict badges (clean/malicious/suspicious)

**Score Index:** Animated orb showing overall threat level (0-100)

**Acceptance Criteria:**
- All KPIs load from server-side Supabase queries
- Charts update on page refresh
- Activity feed shows real scan data, not mock data

---

## 4. Incident Management ✅ COMPLETE

**What it does:** Full CRUD lifecycle for security incidents at `/dashboard/incidents`.

**Operations:**
- Create incident (from threat scanner result)
- Resolve incident (sets `status = 'resolved'`)
- Delete incident
- Block IP (upserts target to `proprietary_intel` vault)

**Display:** Table with severity badges, risk score progress bars, assignee, created date

**Filters:** Search by target, filter by status (active/resolved), filter by severity

**Export:** Excel (.xlsx) export via SheetJS

**Acceptance Criteria:**
- Blocking an IP from incidents immediately adds it to intel vault
- Resolved incidents remain visible with resolved status
- Search filters work client-side without re-fetching

---

## 5. Threat Intel Deep-Dive ✅ COMPLETE

**What it does:** Detailed threat analysis view at `/dashboard/threats`.

**Features:**
- Live sandbox screenshot via Thum.io (URL targets only)
- IP vs URL auto-detection with appropriate fallback
- Raw VirusTotal engine stats table
- AI summary from Gemini
- Source analysis JSON viewer
- PDF export (CEO-ready branded report)

**PDF Report Contents:**
- Company branding (Phish-Slayer teal/slate)
- Target, verdict, risk score
- AI summary
- Engine results table
- Confidential badge
- Generated via jsPDF + jsPDF-AutoTable

**Acceptance Criteria:**
- PDF generates client-side with no server call
- Thum.io screenshot loads asynchronously, not blocking main content
- IP targets show appropriate message instead of sandbox screenshot

---

## 6. Intel Vault Management ✅ COMPLETE

**What it does:** Manage whitelist and proprietary intel at `/dashboard/intel`.

**Whitelist Tab:**
- Add targets to whitelist (prevents them from triggering alerts)
- Delete whitelist entries
- Display: target, added date, added by

**Proprietary Intel Tab:**
- View all manually blocked IOCs
- Delete entries
- Severity badges (critical/high/medium/low)
- KPI strip showing vault statistics

**API Documentation Tab:**
- Embedded docs for public REST API
- Endpoint, authentication, curl examples, response format

**Acceptance Criteria:**
- Whitelist entries immediately affect next scan (no cache)
- Deleting intel vault entry does not affect historical scan records

---

## 7. Public REST API v1 ✅ COMPLETE

**What it does:** External API for programmatic threat scanning.

**Endpoint:** `GET/POST /api/v1/scan`

**Authentication:** `x-api-key` header checked against `process.env.PHISH_SLAYER_API_KEY`

**Request:** `?target=example.com` or `{ "target": "1.2.3.4" }` in body

**Response:**
```json
{
  "target": "example.com",
  "verdict": "malicious",
  "risk_score": 95,
  "threat_category": "Phishing",
  "summary": "AI-generated summary...",
  "scanned_at": "2026-03-15T00:00:00Z"
}
```

**Behavior:** Runs full 3-gate pipeline. Fires Discord alert if malicious.

**Acceptance Criteria:**
- Missing or invalid API key returns 401
- Full pipeline runs identically to dashboard scan
- Discord alert fires on malicious findings from API scans

---

## 8. Intel Sync CRON ✅ COMPLETE

**What it does:** Automated URLhaus threat feed harvester.

**Endpoint:** `POST /api/intel/sync`

**Authentication:** `Authorization: Bearer CRON_SECRET` header

**Schedule:** Every 12 hours via Vercel Cron (or manual trigger)

**Behavior:**
- Fetch URLhaus malware feed
- Parse and upsert new IOCs to `proprietary_intel` table
- Skip duplicates (upsert on target)
- Return count of new entries added

**Acceptance Criteria:**
- Invalid CRON_SECRET returns 401
- Duplicate entries do not create duplicates in DB
- Feed fetch failure returns clean error response

---

## 9. Discord Webhook Sirens ✅ COMPLETE

**What it does:** Real-time red embed alerts on malicious detections.

**Function:** `fireDiscordAlert()` in `lib/supabase/actions.ts`

**Fires when:**
- Dashboard scan returns malicious verdict
- Public API scan returns malicious verdict
- Admin blocks IP from incident dashboard

**Embed contains:** Target, risk score, threat category, AI summary, timestamp

**Acceptance Criteria:**
- Alert fires asynchronously (does not block scan response)
- Alert does NOT fire for clean or whitelisted targets

---

## 10. EDR Agent System ✅ BUILT, TESTING

**What it does:** Lightweight endpoint monitoring agent that connects via WebSocket.

**Agent file:** `lib/agent/endpointMonitor.ts`

**WebSocket endpoint:** `ws://[host]/api/agent/ws` (handled in `server.js`)

**Authentication:** Agent sends `AGENT_SECRET` in connection headers. Server validates on connect.

**Monitors:**
- File Integrity Monitoring (FIM) via chokidar — watches `/tmp`, `/etc`, `/usr/bin`
- Process Monitor — osquery (with `ss`/`netstat` fallback) for suspicious network connections
- Network Monitor — outbound connections to non-internal IPs

**Telemetry:** POSTs suspicious findings to `/api/flag-ioc` route

**Agent Fleet Dashboard:** `/dashboard/agents` — shows connected agents, last seen, status

**Acceptance Criteria:**
- Agent connects without `1008 Unauthorized` rejection
- Agent appears online in `/dashboard/agents` within 5 seconds of connection
- FIM detects new file creation in watched directories
- Agent reconnects automatically on disconnect

---

## 11. Stripe Integration ✅ BUILT

**What it does:** Handles subscription payments and plan management.

**Webhook:** `POST /api/stripe/webhook`

**Events handled:**
- `checkout.session.completed` → update `profiles.subscription_tier`
- `invoice.payment_succeeded` → confirm subscription renewal

**Validation:** Zod schema on all incoming webhook payloads + Stripe signature verification

**Acceptance Criteria:**
- Webhook signature verification rejects tampered payloads
- Successful payment immediately updates user tier in Supabase

---

## 12. Plan Gating ✅ COMPLETE

**What it does:** Restricts features based on subscription tier.

**Tiers:** `free` (Recon), `pro` (SOC Pro), `enterprise` (Command & Control)

**Gating logic:** Checked server-side via `profiles.subscription_tier`

**Acceptance Criteria:**
- Free tier users see upgrade prompts for pro features
- Tier check happens server-side, not just client-side

---

## 13. RBAC System ✅ COMPLETE

**What it does:** 4-tier role-based access control.

**Roles:** `super_admin`, `admin`, `analyst`, `viewer`

**Enforcement:** Middleware + RLS policies

---

## 14. Audit Logging ✅ COMPLETE

**What it does:** Records all significant actions for compliance.

**Logged events:** Scans, incident changes, vault modifications, login events

---

## 15. Email Notifications ✅ COMPLETE

**Provider:** Resend API

**Triggers:** Critical threat alerts, weekly digest, account events

**From:** `onboarding@resend.dev` (configurable via `RESEND_FROM_EMAIL`)
