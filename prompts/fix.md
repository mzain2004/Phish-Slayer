Before starting, list every file you will create. 
Create one file at a time. After each file say "FILE DONE" then continue.
Do not stop until all files complete.

CRITICAL RULES:
- If external APIs are rate-limited or unavailable, implement graceful fallback 
  returning empty results with { error: 'API unavailable', data: [] }
- Never stop mid-task. Skip broken subtask, log it, continue.
- No hallucinated packages. Implement manually if needed.
- npm run build at end. Zero TypeScript errors allowed.

You are integrating newly built backend features into PhishSlayer's frontend.
Stack: Next.js 15, TypeScript, Supabase, Clerk auth, Tailwind CSS.
Auth context: use Clerk's useAuth() + useOrganization() — never hardcode IDs.
DO NOT touch server.js or middleware.ts.
DO NOT overwrite .env files.
Run npm run build after all changes. Fix all TypeScript errors.

NEW APIS BUILT (all need frontend pages):
1. /api/email/analyze — email header analysis
2. /api/sandbox/url — URL detonation
3. /api/sandbox/email — full email analysis (headers + URLs)
4. /api/uba/profiles — user risk profiles
5. /api/detection-rules — Sigma/YARA rule management
6. /api/darkweb/leaks — credential leak monitoring
7. /api/hunting/hypotheses + /generate — hunt hypothesis builder
8. /api/vulnerabilities — vulnerability management
9. /api/tip/iocs — threat intel IOCs

TASK 1 — Wire existing stub pages to new APIs:
Pages that exist but need real data:
- /dashboard/hunt → fetch from /api/hunting/hypotheses, show list + 
  "Generate AI Hypotheses" button calling /api/hunting/generate
- /dashboard/escalations → keep existing, fix was done in DB already
- /dashboard/integrations → already wired in previous session, verify working

TASK 2 — Create new dashboard pages (keep existing nav layout):

a) /dashboard/email-analyzer
   - Textarea for raw email paste (headers or full email)
   - Submit button → POST /api/sandbox/email
   - Show: risk score badge, SPF/DKIM/DMARC status chips,
     URL verdicts table, Groq AI analysis text, suspicious flags list

b) /dashboard/uba
   - Table of user_risk_profiles ordered by risk_score DESC
   - Color coded rows: red=CRITICAL, orange=HIGH, yellow=MEDIUM, green=LOW
   - Click row → expand anomaly details

c) /dashboard/detection-rules
   - List of detection rules (name, type badge, severity, hit_count, is_active toggle)
   - "New Rule" button → modal with textarea for Sigma YAML or YARA
   - "Test Rule" button per row → modal with sample JSON input + result

d) /dashboard/vulnerabilities
   - Stats cards: total open, critical, high, patched
   - Table with CVE ID, severity badge, asset, status dropdown
   - "Run Scan" button → POST /api/vulnerabilities/scan

e) /dashboard/threat-intel
   - IOC search bar → POST /api/tip/iocs/lookup → show threat context card
   - Recent IOCs table (type, value, confidence bar, source tags)

f) /dashboard/darkweb
   - Stats: total leaks, unresolved, exposed emails
   - Leaks table: email, breach source, exposed data chips, severity badge
   - "Run Scan" button

TASK 3 — Add new pages to sidebar nav:
File is likely components/Sidebar.tsx or similar.
Add these nav items in correct L1/L2/L3 grouping:
- Email Analyzer (under Threat Scanner)
- UBA (under Incidents)
- Detection Rules (under Threat Hunt)
- Vulnerabilities (new item)
- Threat Intel (rename or add next to Intel Vault)
- Dark Web (under Intel Vault)

TASK 4 — Git push:
After npm run build succeeds with zero errors:
git add -A
git commit -m "feat: integrate UBA, email analyzer, detection rules, 
vuln scanner, TIP, dark web monitoring, hunt hypothesis builder"
git push origin main