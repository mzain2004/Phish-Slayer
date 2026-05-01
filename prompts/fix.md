@GEMINI.md @graph.md
New session. Read both. Build MUST pass.
Sprint 15: Integration Marketplace + Tenant Quotas + Feature Flags + API Keys.
Sprint 14 complete.

AUDIT: Read lib/integrations/ if exists. Read organizations table columns.
Check for api_keys, feature_flags, quota_usage tables in Supabase.
USE SUPABASE CONNECTOR for all migrations.

═══ PART 1 — INTEGRATION REGISTRY ═══

/lib/integrations/registry.ts
Define 30 integrations as TypeScript const array:

interface Integration {
  id: string
  name: string
  vendor: string
  category: 'edr'|'siem'|'firewall'|'identity'|'email'|'cloud'|'vulnerability'|'ticketing'|'threat_intel'|'network'|'syslog'
  description: string
  required_env_vars: string[]
  required_plan: 'free'|'pro'|'enterprise'
  capabilities: string[]
  status: 'ga'|'beta'|'coming_soon'
  is_bidirectional: boolean
}

Integrations to define:
EDR: crowdstrike, sentinelone, carbon_black, defender_edr
SIEM: splunk, qradar, sentinel, elastic_siem, logrhythm
Firewall: palo_alto, fortinet, cisco_asa, aws_sg, azure_nsg
Identity: active_directory, azure_ad, okta, cyberark
Email: o365, google_workspace
Cloud: aws_guardduty, azure_defender, gcp_scc
Vulnerability: nessus, qualys, rapid7
Ticketing: jira, servicenow, pagerduty, opsgenie
Threat Intel: misp, opencti, threatconnect
Network: darktrace, extrahop, zeek
Syslog: wazuh (ga), generic_syslog (ga)

Export: getAllIntegrations(), getByCategory(), getIntegration(id)

═══ PART 2 — CONNECTION TESTER ═══

/lib/integrations/connection-tester.ts

async function testConnection(
  integrationId: string,
  config: Record<string, any>
): Promise<{success: boolean, message: string}>

Implement for:
wazuh: GET {url}/security/user/authenticate → expect 200
splunk: GET {url}/services/server/info → expect 200
jira: GET {url}/rest/api/3/myself with Basic auth → expect 200
pagerduty: GET https://api.pagerduty.com/users → expect 200
slack: POST https://slack.com/api/auth.test → expect ok:true
o365: validate token format only (can't test without full OAuth)
default: return {success: true, message: 'Manual verification required'}

Never throw. Always return object.

═══ PART 3 — QUOTA SYSTEM ═══

USE SUPABASE CONNECTOR:

ALTER TABLE organizations ADD COLUMN IF NOT EXISTS
  plan TEXT DEFAULT 'free';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS
  plan_limits JSONB DEFAULT '{
    "alerts_per_day":100,
    "agents_concurrent":5,
    "retention_days":30,
    "connectors_max":3,
    "users_max":3,
    "llm_tokens_per_day":50000,
    "osint_scans_per_day":10
  }';

CREATE TABLE IF NOT EXISTS quota_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  metric TEXT NOT NULL,
  count INTEGER DEFAULT 0,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  UNIQUE(org_id, metric, period_start)
);
ALTER TABLE quota_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_isolation" ON quota_usage
  USING (org_id = current_setting('app.current_org_id')::uuid);

/lib/quotas/enforcer.ts

async function checkQuota(orgId: string, metric: string, increment = 1):
Promise<{allowed: boolean, remaining: number, limit: number}>
  Get plan_limits from org. Get today's usage from quota_usage.
  Return allowed if usage + increment <= limit.

async function incrementUsage(orgId: string, metric: string, amount = 1): Promise<void>
  UPSERT quota_usage: ON CONFLICT DO UPDATE SET count = count + amount

Plan limits:
free:       100 alerts/day, 5 agents, 30d retention, 3 connectors
pro:        10000 alerts/day, 20 agents, 90d retention, 10 connectors
enterprise: unlimited alerts, 100 agents, 365d retention, unlimited connectors

Wire checkQuota into:
lib/ingestion/pipeline.ts → before processing: checkQuota('alerts_processed')
If not allowed: return 429 with {error:'quota_exceeded',metric,limit}

═══ PART 4 — FEATURE FLAGS ═══

USE SUPABASE CONNECTOR:

CREATE TABLE IF NOT EXISTS feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id),
  flag_name TEXT NOT NULL,
  is_enabled BOOLEAN DEFAULT false,
  plan_required TEXT,
  UNIQUE(org_id, flag_name)
);
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_isolation" ON feature_flags
  USING (org_id IS NULL OR
         org_id = current_setting('app.current_org_id')::uuid);

/lib/features/flags.ts
const flagCache = new Map<string, {value: boolean, ts: number}>()

async function isEnabled(flag: string, orgId: string): Promise<boolean>
  Cache key: flag+orgId, TTL 5 minutes
  Check org override first, then platform default (org_id IS NULL)
  Check plan_required: does org.plan meet requirement?

Seed these flags via Supabase connector (INSERT if not exists):
osint_brand_monitor: pro required
osint_dark_web: enterprise required
malware_sandbox: pro required
threat_actor_profiles: pro required
compliance_module: pro required
playbook_builder: pro required

═══ PART 5 — API KEYS ═══

USE SUPABASE CONNECTOR:

CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  scopes TEXT[] NOT NULL,
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_isolation" ON api_keys
  USING (org_id = current_setting('app.current_org_id')::uuid);

/lib/api-keys/manager.ts

async function generateAPIKey(orgId, name, scopes, expiresAt?):
Promise<{key: string, prefix: string, id: string}>
  Generate: crypto.randomBytes(32).toString('base64url')
  Prefix: 'ps_' + first 8 chars
  Hash: bcrypt(fullKey, 10)
  Store hash+prefix, return full key ONCE

async function verifyAPIKey(rawKey: string, requiredScope: string):
Promise<{orgId: string, keyId: string} | null>
  Extract prefix (first 11 chars)
  Find api_keys WHERE key_prefix = prefix AND is_active = true
  bcrypt.compare(rawKey, key_hash)
  Check scope + expiry
  Update last_used_at

═══ PART 6 — ROUTES ═══

GET /api/integrations/marketplace — list all 30, mark connected ones (auth)
POST /api/integrations/[id]/test — test connection (auth+org)
GET /api/settings/usage — quota usage vs limits (auth+org)
GET /api/settings/api-keys — list keys (auth+org, show prefix only)
POST /api/settings/api-keys — generate new key (auth+org)
DELETE /api/settings/api-keys/[id] — revoke (auth+org)

Check dashboard pages exist for these — stub if missing:
/app/dashboard/integrations/page.tsx → list marketplace
/app/dashboard/apikeys/page.tsx → already exists per build, verify

═══ FINAL ═══
npm run build. Zero errors.
git commit -m "feat(platform): Sprint 15 integration marketplace, quotas, feature flags, API keys"
git push origin main