@GEMINI.md @graph.md
New session. Read both. Build MUST pass.
Sprint 16: API Documentation + Webhook Delivery System + OpenAPI.
Sprint 15 complete.

AUDIT: Check lib/webhooks/ if exists. Check app/api-docs/ page.
USE SUPABASE CONNECTOR for migrations.

═══ PART 1 — STANDARD RESPONSE FORMAT ═══

/lib/api/response.ts

function apiSuccess<T>(data: T, meta?: object): NextResponse
  Returns {data, meta:{timestamp:now, ...meta}} status 200

function apiError(code: string, message: string, status: number, details?: any): NextResponse
  Returns {error:{code, message, details}, meta:{timestamp}} status N

Standard codes: UNAUTHORIZED(401), FORBIDDEN(403), NOT_FOUND(404),
VALIDATION_ERROR(400), QUOTA_EXCEEDED(429), INTERNAL_ERROR(500)

function apiPaginated<T>(items: T[], total: number, page: number, limit: number): NextResponse
  Returns {data:items, pagination:{total,page,limit,pages,has_next}}

Retrofit these 5 routes to use helpers (read each first):
app/api/alerts/route.ts
app/api/cases/route.ts
app/api/osint/brand/findings/route.ts
app/api/hunting/hypotheses/route.ts
app/api/health/route.ts

═══ PART 2 — WEBHOOK SYSTEM ═══

USE SUPABASE CONNECTOR:

CREATE TABLE IF NOT EXISTS webhook_endpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  secret TEXT NOT NULL,
  event_types TEXT[] NOT NULL,
  is_active BOOLEAN DEFAULT true,
  failure_count INTEGER DEFAULT 0,
  last_delivery_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE webhook_endpoints ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_isolation" ON webhook_endpoints
  USING (org_id = current_setting('app.current_org_id')::uuid);

CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  endpoint_id UUID NOT NULL REFERENCES webhook_endpoints(id),
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  response_status INTEGER,
  duration_ms INTEGER,
  attempt_count INTEGER DEFAULT 1,
  status TEXT DEFAULT 'pending',
  next_retry_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE webhook_deliveries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_isolation" ON webhook_deliveries
  USING (org_id = current_setting('app.current_org_id')::uuid);

/lib/webhooks/delivery.ts

async function deliverWebhook(orgId: string, eventType: string, payload: any): Promise<void>
  1. Query active webhook_endpoints WHERE org_id AND event_types @> ARRAY[eventType]
  2. For each endpoint:
     Sign: crypto.createHmac('sha256', secret).update(JSON.stringify(payload)).digest('hex')
     POST to endpoint.url with headers:
       X-PhishSlayer-Signature: sha256={hmac}
       X-PhishSlayer-Event: {eventType}
     Timeout: 10 seconds
     Log to webhook_deliveries
  3. On failure: exponential backoff
     Attempt 2: +5min, Attempt 3: +30min, Attempt 4: +2hr, then give up
  4. If failure_count > 5: mark endpoint inactive, notify org

Wire deliverWebhook into:
lib/cases/lifecycle.ts → case.created, case.closed
lib/response/playbook-executor.ts → containment.executed
app/api/osint/brand/scan → osint.finding (if CRITICAL)
app/api/alerts route → alert.created (if severity CRITICAL)
Read each file first. Add 2 lines only (import + call). Don't rewrite.

═══ PART 3 — OPENAPI SPEC ═══

/lib/api/openapi.ts

Build OpenAPI 3.1 JSON spec:
openapi: '3.1.0'
info: {title: 'PhishSlayer API', version: '1.0.0', description: 'Autonomous SOC Platform'}
servers: [{url: 'https://phishslayer.tech/api'}]
security: [{ApiKeyAuth: []}]
components.securitySchemes.ApiKeyAuth: {type: apiKey, in: header, name: X-API-Key}

Document these route groups (read actual route files for accurate schemas):
/health: GET → {status: string}
/alerts: GET (list), params: page,limit,severity
/alerts/{id}: GET
/cases: GET (list), POST
/cases/{id}: GET, PATCH
/osint/brand/findings: GET
/hunting/hypotheses: GET, POST
/playbooks: GET, POST
/playbooks/{id}/execute: POST
/metrics/summary: GET
/ingest/webhook: POST (public with API key)

Export spec as static JSON object.
Route: GET /api/openapi.json → return NextResponse.json(spec) NO AUTH

Swagger UI at /app/api-docs/page.tsx (already exists per build):
Read existing file. If empty/stub, add:
  Iframe or script loading swagger-ui-react
  Point to /api/openapi.json
  Dark theme: background #0a0a0f

═══ PART 4 — WEBHOOK MANAGEMENT ROUTES ═══

POST /api/settings/webhooks — create endpoint (auth+org)
GET /api/settings/webhooks — list endpoints (auth+org)
DELETE /api/settings/webhooks/[id] — remove (auth+org)
GET /api/settings/webhooks/deliveries — delivery log (auth+org)
POST /api/settings/webhooks/[id]/test — send test payload (auth+org)

═══ FINAL ═══
npm run build. Zero errors.
git commit -m "feat(api): Sprint 16 webhooks, OpenAPI spec, standard response format"
git push origin main