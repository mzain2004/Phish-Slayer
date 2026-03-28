# Security.md — Security Rules and Constraints
# Phish-Slayer V3

---

## CRITICAL: These Rules Must Never Be Broken

The constraints in this document were learned through production failures. Violating them causes 502 Gateway crashes, CSRF authentication failures, and security vulnerabilities. Read every section before touching any auth, middleware, or deployment code.

---

## 1. Nginx Header Requirements — CRITICAL

Nginx is the front-facing reverse proxy. It MUST pass these headers to the Next.js app or authentication breaks:

```nginx
proxy_set_header Host $host;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
proxy_set_header Accept-Encoding "";
```

**Why this matters:** Next.js Server Actions use CSRF protection that checks the `Origin` header against the `Host` header. If `X-Forwarded-Proto` or `X-Real-IP` are missing, Next.js incorrectly identifies requests as cross-site and rejects them with CSRF errors. This causes the entire dashboard to break.

**NEVER:**
- Remove any of these headers from the Nginx config
- Add `proxy_set_header Accept-Encoding "gzip"` — this breaks the WebSocket upgrade
- Modify Nginx config without verifying all 5 headers remain intact

---

## 2. Next.js Server Actions Origin Whitelist — CRITICAL

Because the app is accessed via a direct Azure IP address (not always via the domain), `next.config.ts` MUST whitelist both the domain and the IP:

```typescript
// next.config.ts
experimental: {
  serverActions: {
    allowedOrigins: [
      'phishslayer.tech',
      'www.phishslayer.tech',
      '40.123.224.93',           // Azure VM IP
      'localhost:3000',
    ]
  }
}
```

**Why this matters:** Server Actions validate that requests come from allowed origins. Without whitelisting the Azure IP, any Server Action call (login, scan, incident management) from the IP address returns a CSRF error.

**If you modify next.config.ts, preserve this allowedOrigins config.**

---

## 3. Authentication Flow

**Middleware (`middleware.ts`):**
- Runs on every request to `/`, `/dashboard/*`, and `/auth/*`
- Calls `lib/supabase/middleware.ts` to refresh the session
- Unauthenticated users at `/dashboard/*` → redirect to `/auth/login`
- Authenticated users at `/auth/*` → redirect to `/dashboard`

**Session Storage:** Supabase SSR stores session in HTTP-only cookies (managed by `@supabase/ssr`). Never use `localStorage` for session data.

**Service Role Key:** Only used server-side in `lib/supabase/server.ts` for admin operations. NEVER exposed to the browser. NEVER included in client-side code.

---

## 4. Row Level Security (RLS)

**All tables have RLS enabled.** This is non-negotiable.

The universal rule: users can only access rows where `user_id = auth.uid()`.

**Never:**
- Disable RLS on any table for any reason
- Write queries that bypass RLS (e.g., using service role key in client components)
- Create tables without RLS policies

**Super Admin Exception:** Super admins (`profiles.role = 'super_admin'`) have additional RLS policies allowing them to view all data. The super admin email is `zainrana605890@gmail.com`, UUID `1e4f7048-09e0-4fec-85d8-36d69d48b2ad`.

---

## 5. API Security

**Public REST API (`/api/v1/scan`):**
- Requires `x-api-key` header
- Key checked against `process.env.PHISH_SLAYER_API_KEY`
- Missing or invalid key → `401 Unauthorized`

**Intel Sync CRON (`/api/intel/sync`):**
- Requires `Authorization: Bearer [CRON_SECRET]`
- Missing or invalid → `401 Unauthorized`

**Stripe Webhook (`/api/stripe/webhook`):**
- Requires Stripe signature verification
- Raw body required for signature verification
- Do NOT parse body with `request.json()` before verification

**WebSocket Authentication:**
- Agent must send `x-agent-secret` header on connection
- Server validates against `process.env.AGENT_SECRET`
- Invalid secret → `close(1008)` immediately
- No fallback or retry allowed without correct secret

---

## 6. Input Validation

**All server-side inputs MUST be validated with Zod before any DB operation.**

Never trust:
- Query parameters
- Request bodies
- WebSocket message payloads
- Form data

Validation happens in Server Actions before any Supabase call, and in API route handlers before any processing.

---

## 7. Environment Variable Security

**Never:**
- Commit `.env.production` or `.env.local` to git
- Expose server-side env variables to the browser (no `NEXT_PUBLIC_` prefix on secrets)
- Log environment variable values
- Use single quotes for values containing `#` — use double quotes

**Correct `.env.production` format for values with special characters:**
```
AGENT_SECRET="PhSlyr_Agent_2026!xK9#mZ"   ← Double quotes required
CRON_SECRET='PhSlyr_Cron_2026!xK9#mZ'
```

**Why double quotes matter:** dotenv treats `#` as a comment character. Without quotes, `SECRET=abc#xyz` would load as `abc` only. Double quotes tell dotenv to treat the entire value literally.

---

## 8. WebSocket Security

**perMessageDeflate MUST be disabled** on both server and client:

```javascript
// server.js (WebSocket server)
const wss = new WebSocketServer({ 
  server, 
  path: '/api/agent/ws',
  perMessageDeflate: false  // REQUIRED
})

// endpointMonitor.ts (WebSocket client)
const ws = new WebSocket(url, {
  perMessageDeflate: false  // REQUIRED
})
```

**Why:** Enabling perMessageDeflate causes RSV1 bit conflicts in WebSocket frames, resulting in immediate connection termination with "Invalid WebSocket frame: RSV1 must be clear" errors.

---

## 9. Data Sanitization

- All scan targets are sanitized before DB storage (trim whitespace, normalize URL format)
- All user-generated content is escaped before rendering
- Never use `dangerouslySetInnerHTML` with user data
- SQL injection is prevented by Supabase's parameterized query builder (never use raw SQL with user input)
