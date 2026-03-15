# Database.md — Schema and Data Layer
# Phish-Slayer V3

---

## 1. Provider

**Supabase** (PostgreSQL)
- Project URL: `https://txnkvbddcjdldksdjueu.supabase.co`
- RLS is ENABLED on ALL data tables
- Never disable RLS for any reason
- Use service role key ONLY for admin operations in server-side code

---

## 2. Tables

### `profiles`
Extends Supabase `auth.users`. Created automatically on user signup via trigger.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` | FK to `auth.users.id`, PRIMARY KEY |
| `email` | `text` | User email |
| `full_name` | `text` | Display name |
| `avatar_url` | `text` | Profile picture URL |
| `subscription_tier` | `text` | `'free'`, `'pro'`, or `'enterprise'` |
| `role` | `text` | `'super_admin'`, `'admin'`, `'analyst'`, `'viewer'` |
| `api_key` | `text` | Hashed API key for public API access |
| `created_at` | `timestamptz` | Auto-set |
| `updated_at` | `timestamptz` | Auto-updated |

---

### `scans`
Records every scan result from the 3-gate pipeline.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` | PRIMARY KEY, auto-generated |
| `user_id` | `uuid` | FK to `profiles.id` |
| `target` | `text` | IP or URL that was scanned |
| `verdict` | `text` | `'clean'`, `'malicious'`, `'suspicious'`, `'unknown'` |
| `risk_score` | `integer` | 0-100 |
| `threat_category` | `text` | AI-classified category |
| `summary` | `text` | AI-generated summary |
| `source` | `text` | `'whitelist'`, `'intel_vault'`, `'virustotal'` |
| `raw_data` | `jsonb` | Raw VirusTotal response (stripped) |
| `created_at` | `timestamptz` | Auto-set |

**RLS Policy:** Users can only SELECT/INSERT their own scans (`user_id = auth.uid()`)

---

### `incidents`
Security incidents created from scan results or manually.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` | PRIMARY KEY |
| `user_id` | `uuid` | FK to `profiles.id` |
| `title` | `text` | Incident title |
| `target` | `text` | IP or URL |
| `severity` | `text` | `'critical'`, `'high'`, `'medium'`, `'low'` |
| `status` | `text` | `'active'`, `'resolved'`, `'closed'` |
| `risk_score` | `integer` | 0-100 |
| `assignee` | `text` | Assigned analyst name |
| `description` | `text` | Incident details |
| `scan_id` | `uuid` | FK to `scans.id` (optional) |
| `created_at` | `timestamptz` | Auto-set |
| `updated_at` | `timestamptz` | Auto-updated |
| `resolved_at` | `timestamptz` | Set when status = resolved |

**RLS Policy:** Users can SELECT/INSERT/UPDATE/DELETE their own incidents

---

### `whitelist`
Targets that should never be flagged as threats.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` | PRIMARY KEY |
| `user_id` | `uuid` | FK to `profiles.id` |
| `target` | `text` | IP or domain to whitelist |
| `reason` | `text` | Why this target is trusted |
| `added_by` | `text` | Email of user who added it |
| `created_at` | `timestamptz` | Auto-set |

**Unique constraint:** `(user_id, target)` — no duplicate whitelisting

**RLS Policy:** Users can SELECT/INSERT/DELETE their own whitelist entries

---

### `proprietary_intel`
Manually curated threat intelligence — known malicious IPs and domains.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` | PRIMARY KEY |
| `user_id` | `uuid` | FK to `profiles.id` |
| `target` | `text` | Malicious IP or domain |
| `severity` | `text` | `'critical'`, `'high'`, `'medium'`, `'low'` |
| `source` | `text` | Where this intel came from |
| `notes` | `text` | Additional context |
| `added_by` | `text` | Email or system that added it |
| `created_at` | `timestamptz` | Auto-set |

**Unique constraint:** `(user_id, target)` — upsert on conflict

**RLS Policy:** Users can SELECT/INSERT/DELETE their own intel entries

---

### `agents` (EDR Fleet)
Registered endpoint agents.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` | PRIMARY KEY |
| `user_id` | `uuid` | FK to `profiles.id` |
| `hostname` | `text` | Agent machine hostname |
| `ip_address` | `text` | Agent machine IP |
| `os` | `text` | Operating system |
| `status` | `text` | `'online'`, `'offline'`, `'degraded'` |
| `last_seen` | `timestamptz` | Last WebSocket heartbeat |
| `agent_version` | `text` | Agent software version |
| `created_at` | `timestamptz` | Registration time |

---

### `audit_logs`
Immutable audit trail for compliance.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` | PRIMARY KEY |
| `user_id` | `uuid` | FK to `profiles.id` |
| `action` | `text` | Action performed |
| `resource_type` | `text` | `'scan'`, `'incident'`, `'intel'`, `'agent'` |
| `resource_id` | `uuid` | ID of affected resource |
| `metadata` | `jsonb` | Additional context |
| `ip_address` | `text` | User IP at time of action |
| `created_at` | `timestamptz` | Auto-set |

**RLS Policy:** INSERT only — no updates or deletes allowed on audit logs

---

## 3. RLS Policy Summary

All tables have RLS enabled. The universal policy pattern is:

```sql
-- SELECT: own data only
CREATE POLICY "Users can view own [table]"
ON [table] FOR SELECT
USING (auth.uid() = user_id);

-- INSERT: own data only
CREATE POLICY "Users can insert own [table]"
ON [table] FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

**Exception:** Super admins can view all data — implemented via a separate policy checking `profiles.role = 'super_admin'`.

---

## 4. Key Query Patterns

### Get user profile
```typescript
// lib/supabase/queries.ts
const { data } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', userId)
  .single()
```

### Record a scan
```typescript
await supabase.from('scans').insert({
  user_id: userId,
  target,
  verdict,
  risk_score,
  threat_category,
  summary,
  source,
  raw_data
})
```

### Upsert to intel vault
```typescript
await supabase.from('proprietary_intel').upsert(
  { user_id: userId, target, severity, source, added_by },
  { onConflict: 'user_id,target' }
)
```

---

## 5. Client Selection Rules

| Context | Client to Use |
|---------|---------------|
| Server Components | `lib/supabase/server.ts` |
| Server Actions | `lib/supabase/server.ts` |
| API Routes | `lib/supabase/server.ts` |
| Client Components | `lib/supabase/client.ts` |
| Admin operations (bypass RLS) | Service role client (never expose to browser) |
