Task: Fix specific bugs in PhishSlayer SOC platform — Phase 2 features only

Read ONLY these files:
supabase/migrations/20260424000008_attack_paths.sql
lib/soc/attack-path/reconstructor.ts
lib/soc/sigma/generator.ts
.env.example

Do not read any other file.

Fix 1 — Migration syntax bug in attack_paths table:
In 20260424000008_attack_paths.sql find:
kill_chain_stages JSONB DEFAULT array[]::jsonb[]
Replace with:
kill_chain_stages JSONB DEFAULT '[]'::jsonb

Also find:
hardening_recommendations JSONB DEFAULT array[]::jsonb[]
Replace with:
hardening_recommendations JSONB DEFAULT '[]'::jsonb

Fix 2 — Defensive query in reconstructor.ts:
In lib/soc/attack-path/reconstructor.ts in the reconstructFromCase method
the query against case_timeline table may fail if table does not exist.
Wrap the case_timeline query in a try-catch block.
If it throws, log: case_timeline table not found — skipping timeline evidence
and continue with empty timeline array.
Do not throw or break the reconstruction — proceed with alerts and ioc_store only.

Fix 3 — Add missing env vars to .env.example:
Add these lines to .env.example if not already present:
OTX_API_KEY=
MISP_URL=
MISP_API_KEY=
INGEST_API_KEY=

Fix 4 — Wazuh deployment note in sigma/generator.ts:
In the deployToWazuh method add a comment above the POST call:
# Note: Wazuh REST API does not support dynamic rule push via HTTP.
# This stores the rule locally and marks deployed false until manual filesystem deployment.
# Wazuh API call below is for future custom plugin support.
Then ensure the catch block sets deployed to false and does NOT throw.
The method should always return gracefully.

Run npm run build, fix all errors.
Commit: fix: patch attack_paths migration syntax and reconstructor defensive queries, push.
After green re-run migration 20260424000008 in Supabase SQL Editor with the corrected syntax.