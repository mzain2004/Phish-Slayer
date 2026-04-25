Read ONLY these files first: next.config.js, middleware.ts, and then scan the entire codebase for references to the patterns listed below before making any changes.
Fix 1 — Security Headers (next.config.js)

Change { key: "X-Frame-Options", value: "DENY" } → "SAMEORIGIN"
Change "frame-ancestors 'none'" → "frame-ancestors 'self' https://phishslayer.tech"

Fix 2 — Remove tenants system, use organizations everywhere
Search entire codebase for any imports, queries, or references to these table names: tenants, tenant_users, whitelabel_api_keys.
Replace all reads/writes to tenants with equivalent queries to organizations.
Replace all reads/writes to tenant_users with equivalent queries to organization_members.
Remove any API routes, server actions, or utility functions exclusively serving the deprecated tenant tables.
Fix 3 — org_id → organization_id column rename
Search entire codebase for Supabase queries referencing .select('org_id'), .eq('org_id',, insert({ org_id:, or any TypeScript types with org_id: string on these tables: cases, hunt_missions, hunt_findings, ueba_profiles, ueba_anomalies, attack_paths, raw_logs, pipeline_runs.
Rename all org_id references to organization_id and change the TypeScript type from string to string (uuid format — no type change needed, just column name).
Fix 4 — incidents.assignee removed
Search entire codebase for any references to incidents.assignee or assignee: in incident insert/update queries.
Replace with assigned_to (uuid). If assigning by name string, look up the user's UUID from profiles first.
Fix 5 — API key verification uses hash
Search entire codebase for any code that reads profiles.api_key to verify API keys.
Update verification logic to instead query profiles.api_key_hash and compare using Supabase's crypt() function:
sqlSELECT id FROM profiles WHERE api_key_hash = crypt($inputKey, api_key_hash)
Do NOT read or write profiles.api_key (plaintext column) anywhere — it is now always NULL.
Fix 6 — Clerk webhook secret mismatch
In deploy.yml heredoc, verify CLERK_WEBHOOK_SECRET is set. The current container value may be stale — after this deploy, the correct secret must be grabbed fresh from Clerk Dashboard → Webhooks → your endpoint → Signing Secret and updated in .env.production on the VM.
After all fixes: audit entire codebase for issues related to all changes above, debug and fix all found issues, run npm run build, fix ALL errors before committing. Never commit broken code.