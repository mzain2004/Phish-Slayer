# API.md — API Contract
# Phish-Slayer V3

---

## 1. Authentication Methods

| Method | Used By | Header |
|--------|---------|--------|
| Supabase Session Cookie | Dashboard (browser) | Automatic via SSR |
| API Key | Public REST API | `x-api-key: [key]` |
| CRON Secret | Intel Sync | `Authorization: Bearer [secret]` |
| Agent Secret | EDR WebSocket | `x-agent-secret: [secret]` in WS headers |

---

## 2. Standard Response Format

All API routes return JSON. Success and error responses follow this pattern:

**Success:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Error:**
```json
{
  "success": false,
  "error": "Human-readable error message",
  "code": "ERROR_CODE"
}
```

**Never return raw error objects or stack traces to the client.**

---

## 3. Public REST API

### `GET /api/v1/scan`

Scan a target via query parameter.

**Auth:** `x-api-key` header required

**Request:**
```
GET /api/v1/scan?target=1.2.3.4
```

**Response:**
```json
{
  "success": true,
  "data": {
    "target": "1.2.3.4",
    "verdict": "malicious",
    "risk_score": 95,
    "threat_category": "Botnet C2",
    "summary": "This IP has been identified as...",
    "source": "virustotal",
    "scanned_at": "2026-03-15T00:00:00.000Z"
  }
}
```

**Error Responses:**
- `401` — Missing or invalid API key
- `400` — Missing `target` parameter
- `422` — Invalid target format
- `500` — Scan pipeline failure

---

### `POST /api/v1/scan`

Scan a target via request body.

**Auth:** `x-api-key` header required

**Request:**
```json
{
  "target": "malicious-site.com"
}
```

**Response:** Same as GET response above.

---

## 4. Intel Sync CRON

### `POST /api/intel/sync`

Trigger URLhaus feed harvest.

**Auth:** `Authorization: Bearer [CRON_SECRET]`

**Request:** No body required

**Response:**
```json
{
  "success": true,
  "data": {
    "new_entries": 42,
    "total_processed": 1000,
    "duration_ms": 3420
  }
}
```

**Error Responses:**
- `401` — Invalid or missing CRON_SECRET
- `500` — Feed fetch failure

---

## 5. IOC Flagging (Agent Telemetry)

### `POST /api/flag-ioc`

Receives suspicious IOC reports from EDR agents.

**Auth:** Supabase session OR `x-agent-secret` header

**Request:**
```json
{
  "ioc": "192.168.1.100",
  "type": "network_connection",
  "severity": "high",
  "process": "suspicious.exe",
  "hostname": "WORKSTATION-01",
  "timestamp": "2026-03-15T00:00:00.000Z"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "flagged": true,
    "scan_id": "uuid-here"
  }
}
```

---

## 6. Stripe Webhook

### `POST /api/stripe/webhook`

Receives Stripe subscription events.

**Auth:** Stripe signature verification via `stripe.webhooks.constructEvent()`
**IMPORTANT:** Raw body required — do NOT parse with `json()` before signature verification

**Handled Events:**
- `checkout.session.completed`
- `invoice.payment_succeeded`

**Response:**
- `200` — Event processed
- `400` — Signature verification failed
- `200` — Unhandled event type (still return 200 to prevent Stripe retries)

---

## 7. WebSocket Endpoint

### `ws://[host]/api/agent/ws`

Persistent WebSocket connection for EDR agent communication.

**Handled in:** `server.js` (NOT a Next.js API route)

**Authentication:** On connection, agent must send:
```
headers: {
  'x-agent-secret': process.env.AGENT_SECRET
}
```

Server validates secret on the `upgrade` event. Invalid secret → close with code `1008` (Policy Violation).

**Message Protocol:**
```json
// Agent → Server (telemetry)
{
  "type": "telemetry",
  "payload": {
    "hostname": "WORKSTATION-01",
    "connections": [...],
    "processes": [...],
    "fim_events": [...]
  }
}

// Server → Agent (command)
{
  "type": "command",
  "action": "kill_process",
  "payload": { "pid": 1234 }
}

// Heartbeat (both directions)
{
  "type": "ping"
}
{
  "type": "pong"
}
```

**perMessageDeflate:** DISABLED on both server and client. This is required — enabling it causes RSV1 WebSocket frame errors.

---

## 8. Next.js Server Actions

Server Actions are NOT REST endpoints but are documented here for reference.

All Server Actions live in `lib/supabase/actions.ts` and follow this pattern:

```typescript
'use server'

export async function actionName(params: ParamsType): Promise<ActionResult> {
  // 1. Validate params with Zod
  // 2. Get authenticated user
  // 3. Perform DB operation
  // 4. Return result
}
```

**Key Server Actions:**
- `launchScan(target)` — runs 3-gate pipeline
- `createIncident(data)` — creates new incident
- `resolveIncident(id)` — marks incident resolved
- `blockIp(target)` — adds target to intel vault
- `fireDiscordAlert(data)` — sends Discord webhook
- `getUserProfile()` — returns current user profile
