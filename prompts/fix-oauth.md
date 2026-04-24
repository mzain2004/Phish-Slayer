Task: Build landing page and 7 dashboard pages for PhishSlayer

Read ONLY these files:
- app/page.tsx
- app/globals.css
- app/dashboard/page.tsx

---

## LANDING PAGE — app/page.tsx

Complete replacement. Professional dark SaaS aesthetic — not cyberpunk, not generic. Think Vercel meets a real security product.

Design tokens:
- Background: #0a0a0a
- Primary accent: #22d3ee (cyan)
- Secondary: #a78bfa (soft purple)
- Text primary: #f4f4f5
- Text muted: #71717a
- Card surface: #111111
- Border: #27272a
- Font: IBM Plex Mono for logo/IOC/code elements, system sans-serif for body

Import IBM Plex Mono via @import in globals.css or inline <style> in layout.

### Navbar
- Logo: "PhishSlayer" in IBM Plex Mono + inline SVG shield icon, cyan
- Links: Features, How It Works, Pricing (all href="#section-id")
- Right: Sign In (ghost button) → /sign-in, Get Started (cyan filled) → /sign-up
- Sticky top, backdrop-blur on scroll using useEffect + window.scrollY

### Hero Section
- Large headline: "Your SOC, Fully Automated." — white, bold, large
- Subheading: "PhishSlayer autonomously triages, enriches, responds, and closes alerts. No L1. No L2. One manager reviews what AI already handled."
- Two CTA buttons: "Start Free Trial" → /sign-up, "See How It Works" → #how-it-works
- Below CTAs: small trust line — "Used by SOC analysts and MSSPs. Built for real threats."
- Background: subtle grid pattern using CSS (1px lines at 40px intervals, opacity 0.04)

### Stats Bar
- 3 stats inline: "95 Threat Intel Engines", "< 30s Mean Time to Triage", "Zero False Positive Noise"
- Thin top/bottom border, muted background #111111

### Features Section (id="features")
- Section title: "Everything a SOC needs. Nothing it doesn't."
- 6 feature cards in 2x3 grid:
  1. Autonomous Triage — L1/L2/L3 agents handle alerts end-to-end
  2. IOC Enrichment — VirusTotal, AbuseIPDB, Shodan, MalwareBazaar in parallel
  3. MITRE ATT&CK Mapping — Auto-tag every alert with technique and tactic
  4. Wazuh EDR Integration — Active response: isolate, kill process, quarantine
  5. MSSP Multi-Tenant — White-label portal with per-client API keys
  6. Reporting Engine — MTTD/MTTR metrics, compliance reports, executive PDFs
- Each card: dark surface #111111, 1px border #27272a, cyan icon (use simple inline SVG), title, 1-line description

### How It Works (id="how-it-works")
- Section title: "From alert to closure in under 60 seconds."
- 4 steps horizontal on desktop, vertical on mobile:
  1. Alert Fires → Wazuh, email, or API ingestion
  2. AI Triages → L1 agent enriches, deduplicates, scores
  3. Autonomous Response → Isolate, block, escalate via playbook
  4. Case Closed → Full audit trail, report generated
- Each step: number in cyan circle, title, short description, arrow between steps

### Pricing Section (id="pricing")
- 3 tiers side by side:
  - Starter: $99/mo — 1 tenant, 1000 alerts/day, email support
  - Professional: $299/mo — 5 tenants, 10k alerts/day, Slack + email
  - Enterprise: Custom — Unlimited tenants, SLA, dedicated support
- Middle tier highlighted with cyan border
- Each: tier name, price, feature list with checkmarks, CTA button

### CTA Footer Banner
- Dark cyan gradient band: "Ready to automate your SOC?"
- Two buttons: "Get Started Free" → /sign-up, "Talk to Sales" → mailto:sales@phishslayer.tech

### Footer
- Logo + tagline: "Autonomous SOC Intelligence Platform"
- Links: Privacy Policy, Terms of Service, Contact
- Copyright: © 2026 PhishSlayer. All rights reserved.

---

## DASHBOARD PAGES — build all 7 files

Match the existing dashboard style in app/dashboard/page.tsx exactly — same sidebar, same header, same card styles, same color tokens.

---

### 1. app/dashboard/hunting/page.tsx

Title: "Threat Hunting"
Subtitle: "Active hunt missions and findings"

Components:
- Stats row (4 cards): Total Missions, Active Missions, Findings This Week, High Severity Findings
- Hunt Missions Table: columns = Mission Name, Hypothesis, Status (badge: active/completed/failed), Started At, Findings Count, Actions (View button)
- Data fetched from Supabase table: hunt_missions (select id, name, hypothesis, status, started_at, findings_count)
- Findings Panel below table: list of recent hunt_findings (select id, mission_id, title, severity, created_at) with severity badge (critical=red, high=orange, medium=yellow, low=blue)
- Empty states for both table and findings panel

---

### 2. app/dashboard/sigma/page.tsx

Title: "Sigma Rules"
Subtitle: "Auto-generated detection rules"

Components:
- Stats row (3 cards): Total Rules, Deployed Rules, Pending Deploy
- Rules Table: columns = Rule Name, Severity, Status (badge: deployed/pending/failed), Created At, Source Alert ID, Actions (Deploy button + View button)
- Data from Supabase: sigma_rules (select id, name, severity, status, created_at, source_alert_id)
- Deploy button calls POST /api/sigma/deploy with rule id — show loading state
- Rule detail modal or expandable row: show full rule YAML in a <pre> block with monospace font
- Empty state

---

### 3. app/dashboard/intel/page.tsx

Title: "Threat Intelligence"
Subtitle: "Feed sync status and IOC store"

Components:
- Stats row (4 cards): Total IOCs, IOCs Added Today, Active Feeds, Last Sync
- Feed Status Cards (horizontal row): AlienVault OTX, MISP, Internal — each shows feed name, last synced timestamp, IOC count, status badge (active/error/syncing)
- IOC Table: columns = Indicator, Type (ip/domain/hash/url), Source, Severity, First Seen, Last Seen
- Data from Supabase: threat_intel (select id, indicator, type, source, severity, first_seen, last_seen) — paginated, 25 per page
- Filter bar: filter by type and severity
- Empty state

---

### 4. app/dashboard/pipeline/page.tsx

Title: "Autonomous Pipeline"
Subtitle: "Audit trail for all autonomous actions"

Components:
- Stats row (4 cards): Total Pipeline Runs, Successful, Failed, Avg Processing Time
- Pipeline Runs Table: columns = Run ID (truncated), Trigger, Status (badge), Started At, Duration, Actions Taken, View Details button
- Data from Supabase: pipeline_runs (select id, trigger, status, started_at, duration_ms, actions_taken)
- Detail panel: clicking View Details shows a JSON viewer of the full pipeline run log in a side panel or modal — use a <pre> block
- Auto-refresh toggle: poll every 30s when enabled
- Empty state

---

### 5. app/dashboard/connectors/page.tsx

Title: "Integrations"
Subtitle: "External connector status"

Components:
- Grid of connector cards (2 columns): CrowdStrike, Elastic SIEM, ServiceNow, Jira, PagerDuty, Wazuh EDR
- Each card: connector logo placeholder (colored initial circle), connector name, status badge (connected/disconnected/error), last sync time, Configure button
- Wazuh card: show actual Wazuh manager URL (from env WAZUH_API_URL or hardcode 167.172.85.62)
- Configure button: opens a modal with API key input field and Save button — calls POST /api/connectors/configure
- Status data: hardcode initial states but fetch from GET /api/connectors/status if it exists
- Empty state if no connectors configured

---

### 6. app/dashboard/tenants/page.tsx

Title: "Tenant Management"
Subtitle: "MSSP multi-tenant portal"

Components:
- Stats row (3 cards): Total Tenants, Active Tenants, Total API Keys
- Tenants Table: columns = Tenant Name, Slug, Plan, Status badge, Created At, API Keys Count, Actions (Manage + Suspend buttons)
- Data from Supabase: tenants (select id, name, slug, plan, status, created_at) with count of whitelabel_api_keys
- Add Tenant button: opens modal with fields Name, Slug, Plan (select: starter/pro/enterprise) — calls POST /api/tenants
- Manage button: navigates to /dashboard/tenants/[id]
- Suspend button: calls PATCH /api/tenants/[id] with status: suspended — confirm dialog first
- Empty state with "Add your first tenant" CTA

---

### 7. app/dashboard/compliance/page.tsx

Title: "Compliance"
Subtitle: "Framework mapping and audit readiness"

Components:
- Stats row (4 cards): MITRE Techniques Covered, Alerts Mapped, Frameworks Active, Last Report Generated
- Framework Cards (3 cards side by side): MITRE ATT&CK, SOC 2 Type II, ISO 27001 — each shows coverage percentage as a progress bar, technique/control count, last updated
- Technique Coverage Table: columns = Technique ID, Technique Name, Tactic, Alerts Mapped, Coverage badge (covered/partial/gap)
- Data from Supabase: alerts table grouped by mitre_technique — aggregate count
- Generate Report button: calls POST /api/reports/compliance — show loading then download PDF
- Empty state

---

## Rules for all pages

- Use 'use client' directive
- Fetch data with useEffect + supabase client (import from @/lib/supabase)
- Show loading skeleton while fetching (use a simple pulse animation div)
- Show error state if fetch fails
- All tables: zebra striping, hover highlight, responsive with overflow-x-auto wrapper
- All badges: use consistent color coding — critical/high=red, medium=yellow, low=blue, active/success=green, error=red, pending=gray
- All modals: use a simple fixed overlay div, not a library component
- Match sidebar and header from existing dashboard exactly — do not recreate them, just use the existing layout wrapper
- export default function at the end of each file

Run npm run build, fix all errors.
Commit: feat: landing page redesign and 7 dashboard frontend pages, push.