You are a senior full-stack security engineer fixing a production Next.js 14 + Supabase + Clerk codebase called PhishSlayer.

CRITICAL RULES:
- Use ONLY your native ReadFile, WriteFile, ListFiles, SearchText, and FindFiles tools
- Do NOT use MCP filesystem tools (project is on C: drive, MCP is limited to D:)
- Read every file BEFORE editing it
- Run npm run build after all fixes and resolve every error before stopping
- Never break existing functionality while fixing issues
- Commit nothing — just fix the files

Fix every issue below in order. Do not skip any. After each fix, confirm what you changed and why.

---

## FIX 1 — CRITICAL: Broken RLS Policies (IDOR / Multi-Tenancy Breach)

Read these migration files first:
- supabase/migrations/20260421_clerk_rls_migration.sql
- supabase/migrations/20260424000010_tenants.sql
- supabase/migrations/20260424000001_cases.sql
- Any other migration files in supabase/migrations/

Find every RLS policy that uses only:
  USING (auth.jwt() IS NOT NULL)

This allows ANY authenticated user to read ALL data across ALL organizations. Fix each one.

For tables that have an organization_id column, replace with:
  USING (
    organization_id IN (
      SELECT organization_id FROM tenant_users
      WHERE user_id = (auth.jwt()->>'sub')
    )
  )

For tables scoped to individual users (like profiles), replace with:
  USING ((auth.jwt()->>'sub') = user_id)

For the cases table specifically:
- SELECT policy: scope by organization_id using the tenant_users membership check above
- INSERT policy: verify the user is a member of the organization_id being inserted before allowing
- UPDATE/DELETE: scope to organization_id membership

Apply these fixes to ALL of the following tables that have broken policies:
- incidents
- tenants
- tenant_users
- whitelabel_api_keys
- cases (if present)

Create a NEW migration file: supabase/migrations/[timestamp]_fix_rls_policies.sql
Write all the DROP POLICY + CREATE POLICY statements into this new migration file.
Do NOT modify the original migration files.

---

## FIX 2 — CRITICAL: Missing AbortController Timeouts on External API Calls

Read these files:
- lib/scanners/threatScanner.ts
- lib/ai/gemini.ts
- app/api/actions/block-ip/route.ts
- lib/wazuh-client.ts
- lib/microsoft/signInIngestion.ts

Find every outbound fetch() call that does NOT have an AbortController or signal.

For each one, wrap it using this exact pattern:

const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 15000);
try {
  const response = await fetch(url, {
    ...existingOptions,
    signal: controller.signal,
  });
  clearTimeout(timeoutId);
  // rest of existing logic
} catch (error) {
  clearTimeout(timeoutId);
  if (error instanceof Error && error.name === 'AbortError') {
    throw new Error(`External API call timed out after 15 seconds: ${url}`);
  }
  throw error;
}

Apply a 15 second timeout for: VirusTotal, Cloudflare, ThreatFox
Apply a 30 second timeout for: Gemini API, Microsoft Graph
Apply a 10 second timeout for: Wazuh API calls

Make sure the timeout is always cleared in both success and error paths.

---

## FIX 3 — CRITICAL: Billing Webhook Email Spoofing + No Idempotency

Read this file: app/api/billing/webhook/route.ts

Issues to fix:

ISSUE A — Email spoofing for privilege escalation:
Find any code that uses customer email as the primary lookup to update subscription plans.
Replace with strict polar_customer_id or metadata.user_id lookup ONLY.
Email fallback should be completely removed for subscription status changes.
If no user_id is found via secure fields, reject the webhook with a 400 error and log it.

ISSUE B — Replay attack / no idempotency:
Add idempotency protection using the webhook event ID.
Before processing any webhook, check if this event ID has already been processed.
Store processed event IDs in Supabase in a table called webhook_events with columns:
  event_id TEXT PRIMARY KEY
  processed_at TIMESTAMPTZ DEFAULT NOW()
  event_type TEXT

If the event_id already exists in webhook_events, return 200 immediately without reprocessing.
If it does not exist, insert it first then process.

Create a migration for the webhook_events table if it does not exist:
supabase/migrations/[timestamp]_webhook_events.sql

---

## FIX 4 — HIGH: Cases API Missing Organization Membership Verification

Read this file: app/api/cases/route.ts

In the POST handler (creating a new case):
- Extract organization_id from the request body
- Before inserting, verify the authenticated user is a member of that organization
- Query tenant_users table: SELECT 1 FROM tenant_users WHERE user_id = [clerkUserId] AND organization_id = [provided_org_id]
- If the user is NOT a member, return 403 Forbidden with message "Not authorized for this organization"
- Only proceed with insert if membership is confirmed

In the GET handler (listing cases):
- Do NOT trust a user-supplied organization_id query param directly
- Instead, look up ALL organizations the user belongs to from tenant_users
- Filter cases by those organization IDs only

---

## FIX 5 — HIGH: N+1 Query Pattern in Weekly Digest

Read this file: app/api/digest/weekly/route.ts

Find the loop that iterates over user profiles and executes multiple DB queries per user inside the loop.

Refactor it to:

STEP 1: Fetch all opted-in user profiles in ONE query
STEP 2: Extract all their user_ids and org_ids into arrays
STEP 3: Run ONE bulk query for scan counts grouped by user_id for the past 7 days
STEP 4: Run ONE bulk query for malicious scan counts grouped by user_id
STEP 5: Run ONE bulk query for incident counts grouped by org_id
STEP 6: Run ONE bulk query for top threats grouped by org_id

Build a Map<userId, stats> from these bulk results.

STEP 7: Loop over profiles and use the pre-fetched Map to build each user's digest payload — NO DB calls inside this loop

This reduces N*4 queries down to 5 total queries regardless of user count.

---

## FIX 6 — MEDIUM: Unbounded Result Sets Missing .limit()

Read this file: lib/supabase/actions.ts

Find these functions: getIncidents, getScans, getWhitelist, getIntelIndicators

For each one:
- Add .limit(100) to the Supabase query chain if no limit exists
- Add a range parameter (page: number = 0) to support pagination
- Calculate offset as: page * 100
- Add .range(offset, offset + 99) to the query

Update the function signatures to accept an optional page parameter defaulting to 0.
Make sure existing callers still work without passing page (default 0 = first page).

---

## FIX 7 — MEDIUM: OOM Risk in getEndpointStats

Read this file: lib/supabase/agentQueries.ts

Find getEndpointStats or similar function that fetches ALL rows from endpoint_events into memory to calculate stats in JavaScript.

Replace the in-memory JS aggregation with a Supabase RPC call.

Create a new migration file: supabase/migrations/[timestamp]_endpoint_stats_rpc.sql

Write a Postgres function in it:
CREATE OR REPLACE FUNCTION get_endpoint_stats(p_organization_id UUID)
RETURNS JSON AS $$
BEGIN
  RETURN json_build_object(
    'threat_level_counts', (
      SELECT json_object_agg(threat_level, count)
      FROM (
        SELECT threat_level, COUNT(*) as count
        FROM endpoint_events
        WHERE organization_id = p_organization_id
        GROUP BY threat_level
      ) t
    ),
    'top_remote_addresses', (
      SELECT json_agg(row_to_json(t))
      FROM (
        SELECT remote_address, COUNT(*) as count
        FROM endpoint_events
        WHERE organization_id = p_organization_id
        GROUP BY remote_address
        ORDER BY count DESC
        LIMIT 10
      ) t
    ),
    'top_processes', (
      SELECT json_agg(row_to_json(t))
      FROM (
        SELECT process_name, COUNT(*) as count
        FROM endpoint_events
        WHERE organization_id = p_organization_id
        GROUP BY process_name
        ORDER BY count DESC
        LIMIT 10
      ) t
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

Update getEndpointStats in agentQueries.ts to call this RPC function instead of fetching raw rows.

---

## FIX 8 — MEDIUM: Validate Clerk Webhook Signature (svix)

Read this file: app/api/webhooks/clerk/route.ts

Check if svix signature verification is implemented.

If it is NOT verifying the svix-signature header:
Add this verification at the top of the POST handler BEFORE any processing:

import { Webhook } from 'svix';

const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
if (!webhookSecret) {
  throw new Error('CLERK_WEBHOOK_SECRET is not set');
}

const svixId = headerPayload.get('svix-id');
const svixTimestamp = headerPayload.get('svix-timestamp');
const svixSignature = headerPayload.get('svix-signature');

if (!svixId || !svixTimestamp || !svixSignature) {
  return new Response('Missing svix headers', { status: 400 });
}

const wh = new Webhook(webhookSecret);
let evt;
try {
  evt = wh.verify(body, {
    'svix-id': svixId,
    'svix-timestamp': svixTimestamp,
    'svix-signature': svixSignature,
  });
} catch (err) {
  return new Response('Invalid webhook signature', { status: 401 });
}

If it IS already there, confirm and move on.

---

## FIX 9 — LOW: Gemini Error Message Typo

Read this file: lib/ai/gemini.ts

Find the line that throws an error mentioning "GROQ_API_KEY" when GEMINI_API_KEY is missing.
Replace "GROQ_API_KEY" with "GEMINI_API_KEY" in that error message.

---

## FIX 10 — LOW: Add Centralized API Route Protection in Middleware

Read this file: middleware.ts

Check if /api routes (excluding public webhook endpoints) are centrally protected.

If the middleware only protects /dashboard and relies on individual routes to handle auth:
Add a matcher rule to require Clerk auth for all /api/* routes EXCEPT:
- /api/webhooks/clerk
- /api/webhooks/polar (or billing webhook path)
- /api/connectors/wazuh (Wazuh webhook receiver)
- /api/ingest (if it has its own auth)

Use Clerk's middleware to add this protection layer as a safety net.
This does NOT replace per-route auth checks — it is an additional defense-in-depth layer.

---

## FIX 11 — FINAL: Build Verification

After ALL fixes above are complete:

1. Run: npm run build
2. If there are TypeScript errors, fix them — do not leave the build broken
3. If there are import errors from new code, resolve them
4. If there are type mismatches from refactored functions, fix the types
5. Run npm run build again until it exits with 0 errors
6. Report the final build output

---

## FINAL REPORT

After completing all fixes, provide a summary in this format:

✅ FIXED: [Issue name] — [file(s) changed] — [what you did]
⚠️ PARTIAL: [Issue name] — [what was done] — [what needs manual action]
❌ SKIPPED: [Issue name] — [reason]

Also list:
- Any new migration files created (with full filenames)
- Any new environment variables required (e.g., CLERK_WEBHOOK_SECRET)
- Any manual Supabase steps needed (e.g., running migrations via Supabase CLI or dashboard)