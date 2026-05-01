@GEMINI.md @graph.md
New session. Read both. Build MUST pass.
Sprint 17: Onboarding Wizard + Empty States + Dashboard Polish.
Sprint 16 complete.

AUDIT: Read app/dashboard/ directory listing.
Check which dashboard pages are stubs vs real content.
THIS IS FRONTEND ONLY. No new API routes. No migrations.

═══ PART 1 — ONBOARDING WIZARD ═══

/app/dashboard/onboarding/page.tsx

5-step wizard. Use React useState for step tracking.
Store progress in localStorage key 'ps_onboarding_step'.

Step 1 — Org Details:
  Form: org name, industry (dropdown), team size
  POST to /api/organizations to update name

Step 2 — Connect First Source:
  3 big cards: Wazuh (recommended), Generic Webhook, Manual Upload
  Wazuh: show command to configure Wazuh to send to phishslayer.tech/api/webhooks/wazuh
  Click "Done" → mark step complete

Step 3 — Set Brand Domains:
  Input: add domain names (company.com)
  POST to /api/organizations with brand_domains array
  Explain: used for OSINT brand monitoring

Step 4 — Configure Notifications:
  Slack webhook URL input
  Email input
  POST to /api/notifications/rules
  Skip button available

Step 5 — Complete:
  Show: "Platform is ready" with confetti animation (CSS only)
  POST to /api/organizations: {setup_complete: true}
  Button: "Go to Dashboard" → /dashboard

Styling: design system colors, glass cards, 4px radius buttons.
Progress bar at top: 5 steps, purple fill.

/app/dashboard/layout.tsx (READ FIRST, modify carefully):
Add check: if org.setup_complete === false AND not on /onboarding:
  redirect('/dashboard/onboarding')
Must not break existing layout.

═══ PART 2 — EMPTY STATE COMPONENT ═══

/components/ui/empty-state.tsx

interface EmptyStateProps {
  icon: string  // emoji or lucide icon name
  title: string
  description: string
  actionLabel?: string
  actionHref?: string
  actionOnClick?: () => void
}

Styling: centered, icon large (48px), title #e2e8f0, 
description #64748b, button primary purple 4px radius.

═══ PART 3 — APPLY EMPTY STATES ═══

Read each file first. Add EmptyState inside {data.length === 0 && <EmptyState .../>}
Do NOT rewrite the page. Surgical addition only.

/app/dashboard/alerts/page.tsx
  "No alerts yet" / "Connect a data source to start receiving alerts." / actionLabel="Connect Source" actionHref="/dashboard/connectors"

/app/dashboard/cases/page.tsx
  "No open cases" / "Alerts escalated by L2 agents appear here as cases."

/app/dashboard/osint/page.tsx
  "No OSINT findings" / "Configure brand monitoring to scan for threats." / actionLabel="Configure" actionHref="/dashboard/settings"

/app/dashboard/intel/page.tsx
  "No threat intel" / "CTI feeds will populate actor profiles and IOCs automatically."

/app/dashboard/hunting/page.tsx
  "No hunt hypotheses" / "L3 agent generates hunt hypotheses from threat intel." / actionLabel="Generate Now" (POST /api/hunting/generate)

/app/dashboard/sigma/page.tsx
  "No detection rules" / "Sigma rules are generated automatically from hunt findings."

/app/dashboard/metrics/page.tsx
  "Collecting metrics" / "MTTD, MTTR, and risk scores populate after 24 hours of activity."

═══ PART 4 — MISSION CONTROL UI PRINCIPLES ═══

Read /app/dashboard/page.tsx (main dashboard).
Apply these 5 enhancements WITHOUT full rewrite:

1. Agent activity badge: find where agents are shown.
   Add small badge on each action: "L1 Agent" | "L2 Agent" | "L3 Agent"
   Colors: L1=#7c6af7, L2=#00d4aa, L3=#f59e0b

2. Confidence display: find where alerts/findings render confidence.
   If confidence >= 0.90: text-green-400
   If confidence >= 0.70: text-yellow-400  
   If confidence < 0.70: text-red-400

3. Blind spot warning: at top of dashboard, check connector health.
   GET /api/orchestrator/stats → if any connector silent > 30min:
   Show red banner: "⚠ BLIND SPOT: {connector_name} not reporting"

4. Risk score prominence: ensure org risk score (0-100) is visible
   Large number top-left, color: <30 green, 30-70 amber, >70 red

5. Active agent count: show "X agents running" live indicator

═══ FINAL ═══
npm run build. Zero errors.
git commit -m "feat(ui): Sprint 17 onboarding wizard, empty states, mission control enhancements"
git push origin main