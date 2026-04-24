Task: Build complete Multi-Tenant MSSP Portal for PhishSlayer SOC platform

Read ONLY these files:
lib/soc/types.ts
app/api/alerts/route.ts
app/api/cases/route.ts
middleware.ts

Do not read any other file.

Requirements:

1. Update lib/soc/types.ts to add these types:

Tenant with fields: id string, name string, slug string unique,
plan enum starter or professional or enterprise, status enum active or suspended or trial,
owner_user_id string, sla_config SLAConfig, branding TenantBranding,
created_at Date, trial_ends_at Date or null, alert_quota_monthly number,
alerts_used_this_month number

SLAConfig with fields: p1_response_minutes number default 15,
p2_response_minutes number default 60, p3_response_minutes number default 240,
p4_response_minutes number default 1440, breach_notify_email string or null

TenantBranding with fields: logo_url string or null, primary_color string default #22d3ee,
company_name string, report_footer string or null

TenantUser with fields: id string, tenant_id string, user_id string,
role enum owner or analyst or manager or readonly, invited_at Date,
accepted_at Date or null, active boolean

TenantStats with fields: tenant_id string, alerts_24h number,
open_cases number, mttd_minutes number, mttr_minutes number,
sla_breaches_24h number, top_alert_types string array,
risk_score number 0-100

WhitelabelAPIKey with fields: id string, tenant_id string, key_hash string,
label string, created_at Date, last_used_at Date or null,
permissions string array, active boolean

2. Create lib/tenant/manager.ts with TenantManager class:

Constructor takes supabase client

Method createTenant taking name string and owner_user_id string
and plan string returning Tenant:
Generate slug from name: lowercase, replace spaces with hyphens,
append 4 random chars to ensure uniqueness
Insert into tenants table
Insert into tenant_users table with role owner
Return created Tenant

Method getTenant taking tenant_id string returning Tenant or null:
Query tenants table by id
Return Tenant or null

Method getTenantBySlug taking slug string returning Tenant or null:
Query tenants table where slug equals input
Return Tenant or null

Method getUserTenants taking user_id string returning Tenant array:
Query tenant_users table where user_id equals input and active true
Join with tenants table
Return array of Tenants the user belongs to

Method addUser taking tenant_id string and user_id string
and role string returning TenantUser:
Check if user already in tenant — if yes update role
Otherwise insert new tenant_users row
Return TenantUser

Method removeUser taking tenant_id string and user_id string returning void:
Update tenant_users set active false where tenant_id and user_id match

Method getTenantStats taking tenant_id string returning TenantStats:
Query alerts table where org_id equals tenant_id and created_at last 24h
Count total as alerts_24h
Query cases table where org_id equals tenant_id and status open for open_cases
Calculate MTTD: average of first_enriched_at minus created_at in minutes
Calculate MTTR: average of closed_at minus created_at in minutes for closed cases
Count SLA breaches: cases where updated_at minus created_at exceeds sla_config thresholds
Calculate risk_score: weighted formula
  open P1 cases times 20 plus open P2 cases times 10 plus
  sla_breaches times 15 plus alerts_24h divided by 10
  cap at 100
Return TenantStats

Method checkQuota taking tenant_id string returning boolean:
Query tenants table for alert_quota_monthly and alerts_used_this_month
Return true if alerts_used_this_month less than alert_quota_monthly
Return false if quota exceeded

Method incrementAlertCount taking tenant_id string returning void:
UPDATE tenants SET alerts_used_this_month = alerts_used_this_month + 1
WHERE id = tenant_id

Method resetMonthlyQuotas returning void:
Called by cron on first day of month
UPDATE tenants SET alerts_used_this_month = 0

3. Create lib/tenant/api-keys.ts:

Function generateAPIKey returning string:
Generate cryptographically secure key: ps_ prefix plus 48 random bytes as hex
This is shown ONCE to user — never stored in plain text

Function hashAPIKey taking key string returning string:
Return SHA-256 hash of key using Node crypto module

Function createAPIKey taking tenant_id string and label string
and permissions string array and supabase client returning object
with key string and record WhitelabelAPIKey:
Generate key and hash
Insert into whitelabel_api_keys table with key_hash not the plain key
Return both the plain key for display and the record
Warn in comment: plain key is returned once — not stored — cannot be recovered

Function validateAPIKey taking raw_key string and supabase client
returning WhitelabelAPIKey or null:
Hash the raw_key
Query whitelabel_api_keys where key_hash equals hash and active true
If found: update last_used_at to now
Return record or null

4. Create middleware.ts update — add tenant resolution:
In existing middleware.ts after Clerk auth check:
Read x-tenant-id header or tenant slug from URL path if present
If present: attach to request headers for downstream route handlers
Do not block request if tenant header missing — some routes are global

5. Create app/api/tenants/route.ts:
GET: return all tenants for authenticated user via getUserTenants
POST: create new tenant — body requires name string
Zod validation on POST body
Auth required for both
Add dynamic export and runtime edge

6. Create app/api/tenants/[id]/route.ts:
GET: return single tenant with stats via getTenantStats
PATCH: update tenant name or branding — owner role required
Zod validation: name optional string, branding optional TenantBranding
Auth required
Add dynamic export and runtime edge

7. Create app/api/tenants/[id]/users/route.ts:
GET: return all users in tenant with roles
POST: invite user — body requires user_id and role
DELETE: body requires user_id — sets active false
Owner or manager role required for POST and DELETE
Auth required
Add dynamic export and runtime edge

8. Create app/api/tenants/[id]/api-keys/route.ts:
GET: return all API keys for tenant — never return key_hash, show label and created_at only
POST: create new API key — return plain key ONCE in response
Body: label string, permissions string array
Owner role required
Auth required
Add dynamic export and runtime edge

9. Create app/api/tenants/[id]/stats/route.ts:
GET: return TenantStats for this tenant
Auth required — user must belong to this tenant
Call tenantManager.getTenantStats
Add dynamic export and runtime edge

10. Create supabase/migrations/20260424000010_tenants.sql:

CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  plan TEXT DEFAULT 'starter',
  status TEXT DEFAULT 'trial',
  owner_user_id TEXT NOT NULL,
  sla_config JSONB DEFAULT '{"p1_response_minutes":15,"p2_response_minutes":60,"p3_response_minutes":240,"p4_response_minutes":1440}'::jsonb,
  branding JSONB DEFAULT '{}'::jsonb,
  alert_quota_monthly INTEGER DEFAULT 10000,
  alerts_used_this_month INTEGER DEFAULT 0,
  trial_ends_at TIMESTAMPTZ DEFAULT (now() + interval '14 days'),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tenant_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  role TEXT DEFAULT 'analyst',
  invited_at TIMESTAMPTZ DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  active BOOLEAN DEFAULT true,
  UNIQUE(tenant_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.whitelabel_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  key_hash TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  permissions TEXT[] DEFAULT ARRAY[]::TEXT[],
  active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whitelabel_api_keys ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tenants'
  AND policyname = 'tenants_policy') THEN
    CREATE POLICY "tenants_policy" ON public.tenants
    USING (auth.jwt() IS NOT NULL);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tenant_users'
  AND policyname = 'tenant_users_policy') THEN
    CREATE POLICY "tenant_users_policy" ON public.tenant_users
    USING (auth.jwt() IS NOT NULL);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'whitelabel_api_keys'
  AND policyname = 'api_keys_policy') THEN
    CREATE POLICY "api_keys_policy" ON public.whitelabel_api_keys
    USING (auth.jwt() IS NOT NULL);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_tenants_slug ON public.tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenants_owner ON public.tenants(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_tenant_users_user_id ON public.tenant_users(user_id);
CREATE INDEX IF NOT EXISTS idx_tenant_users_tenant_id ON public.tenant_users(tenant_id);

11. Update cron route:
Add quota reset on first day of month:
If new Date().getDate() equals 1: call tenantManager.resetMonthlyQuotas
Add before email ingestion step

Run npm run build, fix all errors.
Commit: feat: complete multi-tenant MSSP portal with API keys and SLA tracking, push.
After green run migration 20260424000010 in Supabase SQL Editor.
Ping for P20 — Reporting: SOC dashboard metrics, executive PDF, compliance mapping.