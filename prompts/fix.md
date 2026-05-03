@GEMINI.md
Emergency fix pass. Read the full codebase before touching anything. 
npm run build must pass. Fix in this exact order.

════ FIX 1 — COMMAND CENTER BLANK (CRITICAL) ════

File: app/dashboard/page.tsx (or app/dashboard/command-center/page.tsx)
The page renders completely blank. Read the file. Find why.
Most likely: async fetch is throwing, crashing the component silently.
Fix: Wrap every fetch/await in try/catch. Return empty state on error, never crash.
Add a fallback: if no data, show placeholder cards with zeros.
Do NOT redesign — just make it not crash.

════ FIX 2 — ORG AUTO-CREATION ON FIRST LOGIN ════

The platform requires Clerk orgId but new users have none.
Read: app/dashboard/layout.tsx and middleware.ts fully first.

Add to dashboard layout (read file first, add carefully):
1. After auth() — get userId and orgId from Clerk
2. If orgId is null AND userId exists:
   - Check organizations table: SELECT id FROM organizations WHERE owner_id = userId LIMIT 1
   - If found: store that org_id in a cookie/session for this user
   - If not found: INSERT new org with owner_id=userId, name='My Organization', 
     plan='free', setup_complete=false
   - Redirect to /dashboard/onboarding
3. If orgId present: proceed normally

Also update ALL pages showing "Select an organization":
Pattern to find: any page with text "Select an organization to view"
Fix: Replace that check with: 
  const orgId = searchParams.orgId || cookieOrgId || userDefaultOrgId
  Never hard-block on Clerk orgId alone — fall back to DB org lookup by user_id

════ FIX 3 — RLS VIOLATION ON SETTINGS/PROFILE ════

Error: "new row violates row-level security policy"
File: app/dashboard/settings/page.tsx and app/dashboard/profile/page.tsx

Use Supabase connector to check:
SELECT policyname, cmd, qual FROM pg_policies 
WHERE tablename IN ('profiles', 'user_profiles', 'tenant_users');

The policy is checking auth.uid() but Clerk JWT uses 'sub' not 'id'.
Fix the RLS policy:
ALTER POLICY [policy_name] ON [table_name] 
USING ((auth.jwt() ->> 'sub') = user_id::text);

Also fix the profile save: the INSERT is missing user_id field.
Read the settings page component, find the supabase.from('profiles').insert({...})
Add: user_id: userId (from Clerk auth())

════ FIX 4 — INTEGRATIONS MARKETPLACE EMPTY ════

File: app/dashboard/integrations/page.tsx

The page queries DB for integrations but registry was never seeded.
Read lib/integrations/registry.ts — it has a static INTEGRATIONS array.
The fix: DON'T query DB. Just render the static registry array directly.

Change the page to:
import { getAllIntegrations } from '@/lib/integrations/registry'
const integrations = getAllIntegrations() // static, no DB needed
Render all 30 integrations with status badges.
Mark Wazuh as 'connected' if connectors table has a wazuh entry for this org.

════ FIX 5 — IOC TABLE SHOWING ZERO DESPITE FEEDS ACTIVE ════

Intel Vault shows feeds with 45k+ IOCs but indicator table shows 0.
The feeds are registered in cti_feeds but IOCs were never imported to threat_iocs.

Check if threat_iocs table has any rows:
Use Supabase connector: SELECT COUNT(*) FROM threat_iocs;

If 0: The import cron (/api/cron/cti-feeds) never ran or errored.
Fix: Read /app/api/cron/cti-feeds/route.ts — find the import logic.
Add a manual trigger: POST /api/admin/seed-iocs that runs the import once.
OR: Run the import inline when Intel Vault page loads if threat_iocs is empty.

════ FIX 6 — THREAT SCANNER "PROFILE NOT FOUND" ════

File: app/dashboard/scans/page.tsx or similar
Error shown: "Profile not found"
This means the scanner is looking up a user profile that doesn't exist.
Find where "Profile not found" string is returned.
Fix: If profile lookup fails, use the Clerk user object directly as fallback.
const user = await currentUser(); // Clerk
const profile = { id: user.id, name: user.fullName, email: user.emailAddresses[0] }

════ FIX 7 — SCAN RESULTS STUCK AT "PENDING" ════

Scan history shows target-372.internal and target-541.internal as "Pending" forever.
These are internal IPs — VirusTotal can't scan internal addresses.
Fix: Add validation before submitting scan:
If target is RFC1918 IP (10.x, 172.16-31.x, 192.168.x) or .internal domain:
  Return error: "Internal addresses cannot be scanned externally"
  Change status to 'INVALID_TARGET' not 'Pending'

════ FIX 8 — MFA WEBAUTHN DISABLED ════

Error: "MFA enroll is disabled for WebAuthn"
File: app/dashboard/settings/page.tsx — MFA section
Quick fix: Hide the WebAuthn/Passkey option entirely for now.
Replace with: <p className="text-gray-500 text-sm">Passkey support coming soon.</p>
Keep the TOTP authenticator option — that works.

════ FINAL ════
npm run build — zero errors.
git commit -m "fix(critical): org auto-creation, dashboard crash, RLS profile, integrations registry, IOC import"
git push origin main

Report:
1. Command Center — what was causing the blank and how fixed
2. Org creation flow — where it creates org and redirects
3. RLS policy name fixed
4. How many integrations now show in marketplace
5. threat_iocs count after fix
6. Build result