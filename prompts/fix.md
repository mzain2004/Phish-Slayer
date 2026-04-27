Before starting, list every file you will create. 
Create one file at a time. After each file say "FILE DONE" then continue.
Do not stop until all files complete.

You are an expert Next.js 15 + TypeScript engineer working on PhishSlayer,
an Agentic SOC SaaS platform. Stack: Next.js 15, Supabase, Clerk, Groq,
MongoDB Atlas. Never modify server.js or middleware.ts. Never overwrite 
.env files. Always run npm run build before declaring success.

Build 5 remaining platform capabilities.

== PART 1: ALERT CORRELATION ENGINE ==

Create lib/correlation/engine.ts:

- Function correlateNewAlert(alertId: string, orgId: string): 
  Promise<CorrelationResult>
  
  - Fetch new alert from Supabase
  - Search for related alerts in last 24h by org using these rules:
    Rule 1 (IP match): same source_ip AND severity >= 'medium' → weight 0.9
    Rule 2 (User match): same affected_user AND within 1h → weight 0.85
    Rule 3 (Host match): same hostname AND within 2h → weight 0.8
    Rule 4 (IOC match): overlapping ioc_values array → weight 0.95
    Rule 5 (MITRE match): same mitre_techniques overlap → weight 0.7
    Rule 6 (Time cluster): any alert same org within 3min → weight 0.5
  
  - Compute combined correlation score (weighted average of matching rules)
  
  - If score >= 0.7: group into existing incident OR create new incident
  - If score >= 0.5 and < 0.7: suggest grouping (flag for analyst review)
  - If score < 0.5: standalone alert, no grouping
  
  - Return CorrelationResult:
    { alertId, correlationScore, matchedAlerts: string[], 
      incidentId: string | null, action: 'grouped'|'suggested'|'standalone',
      matchedRules: CorrelationRule[] }

- Function buildIncidentFromAlerts(alertIds: string[], orgId: string): 
  Promise<string>
  - Create incident in incidents table
  - Link all alerts via alert_incidents junction table
  - Set incident severity = max severity of member alerts
  - Set incident title using Groq: summarize common theme of alerts
  - Return incidentId

== PART 2: NOTIFICATION SYSTEM ==

Create lib/notifications/dispatcher.ts:

- NotificationChannel type: 'email'|'slack'|'webhook'|'pagerduty'
- NotificationEvent type: 
  { type: 'critical_alert'|'incident_created'|'case_sla_breach'|
    'connector_failure'|'enrichment_complete'|'new_evidence',
    severity, title, description, url, metadata }

- Function dispatchNotification(orgId: string, event: NotificationEvent)
  - Fetch org notification_configs from Supabase
  - For each active channel matching event.type and severity threshold:
    route to correct sender

- Function sendSlackNotification(webhookUrl: string, event: NotificationEvent)
  - POST to Slack webhook URL
  - Format: Block Kit message with colored attachment by severity
    Critical=red, High=orange, Medium=yellow, Low=blue
  - Include: title, description, severity badge, link button

- Function sendEmailNotification(to: string, event: NotificationEvent)
  - Use Resend API (RESEND_API_KEY env var) or fallback to console.log
  - FROM: alerts@phishslayer.tech
  - HTML template: clean, professional, severity-color header bar
  - Include: event title, description, action button linking to platform

- Function sendWebhookNotification(url: string, event: NotificationEvent)
  - POST JSON payload to custom webhook URL
  - Include HMAC-SHA256 signature in X-PhishSlayer-Signature header
    using org's webhook secret
  - 10s timeout

- Function sendPagerDutyAlert(integrationKey: string, event: NotificationEvent)
  - POST to https://events.pagerduty.com/v2/enqueue
  - Only for critical/high severity
  - Include routing_key, event_action='trigger', dedup_key=event.type+orgId

== PART 3: NOTIFICATION CONFIGURATION ==

Create supabase/migrations/20260427500000_notifications_assets_sla.sql:

notification_configs:
- id UUID primary key
- organization_id TEXT NOT NULL
- channel_type TEXT NOT NULL
- channel_name TEXT
- config JSONB (webhookUrl/email/integrationKey stored here)
- severity_threshold TEXT DEFAULT 'medium'
- event_types TEXT[] DEFAULT ARRAY['critical_alert','incident_created']
- is_active BOOLEAN DEFAULT true
- created_at TIMESTAMPTZ DEFAULT now()
RLS: 4 clean org-scoped policies

notification_log:
- id UUID primary key
- organization_id TEXT NOT NULL
- channel_type TEXT
- event_type TEXT
- status TEXT ('sent'|'failed')
- error TEXT
- sent_at TIMESTAMPTZ DEFAULT now()
RLS: SELECT + INSERT only

== PART 4: ASSET INVENTORY ==

asset_inventory:
- id UUID primary key
- organization_id TEXT NOT NULL
- asset_type TEXT ('endpoint'|'server'|'network_device'|'cloud_resource'|
  'saas_app'|'identity')
- hostname TEXT
- ip_addresses TEXT[]
- mac_address TEXT
- os TEXT
- os_version TEXT
- owner_user_id TEXT
- department TEXT
- criticality TEXT DEFAULT 'medium' ('critical'|'high'|'medium'|'low')
- tags TEXT[]
- connected_connector_ids UUID[]
- last_seen TIMESTAMPTZ
- first_seen TIMESTAMPTZ DEFAULT now()
- metadata JSONB
- is_active BOOLEAN DEFAULT true
- created_at TIMESTAMPTZ DEFAULT now()
RLS: 4 clean org-scoped policies

Create lib/assets/inventory.ts:
- Function upsertAssetFromEvent(event: NormalizedEvent, orgId: string)
  - Extract hostname, IP from event normalizedFields
  - Upsert to asset_inventory (match on hostname OR ip)
  - Update last_seen = now()
  - Skip private IPs that don't match existing assets

- Function getAssetRiskScore(assetId: string, orgId: string): Promise<number>
  - Count alerts in last 7d for this asset's IPs/hostname
  - Factor in asset criticality weight (critical=3x, high=2x, medium=1x)
  - Factor in open cases involving this asset
  - Return 0-100 risk score

app/api/assets/route.ts:
- GET: list assets for org with pagination, filter by type/criticality
- POST: manually add asset
app/api/assets/[id]/route.ts:
- GET, PATCH, DELETE (soft delete)
app/api/assets/[id]/alerts/route.ts:
- GET: alerts associated with this asset (by IP/hostname match)

== PART 5: SLA TRACKING ==

Add to cases table (migration above):
- sla_due_at TIMESTAMPTZ (set on case creation based on severity)
- sla_breached BOOLEAN DEFAULT false
- sla_breached_at TIMESTAMPTZ
- sla_resolved_within_sla BOOLEAN

SLA rules:
- Critical: 4 hours to resolve
- High: 24 hours
- Medium: 72 hours  
- Low: 168 hours (7 days)

Create lib/sla/tracker.ts:
- Function setSlaDeadline(caseId: string, severity: string): Promise<void>
  - Calculate sla_due_at based on severity rules
  - Update case

- Function checkSlaBreach(caseId: string): Promise<boolean>
  - If case open AND now() > sla_due_at AND NOT sla_breached:
    set sla_breached = true, sla_breached_at = now()
    dispatch notification: event type 'case_sla_breach'
    return true
  - Return false otherwise

app/api/cron/sla-checker/route.ts:
- GET with CRON_SECRET safeCompare
- Fetch all open cases where sla_due_at < now() AND sla_breached = false
- Call checkSlaBreach for each
- Log breach count

== PART 6: PLAYBOOK ENGINE WIRE-UP ==

Existing file: playbooks/engine.ts (already exists, has org scoping issues)

Create lib/playbooks/executor.ts:
- Function executePlaybook(playbookId: string, triggerData: object, 
  orgId: string): Promise<PlaybookExecution>
  - Fetch playbook from Supabase playbooks table, verify org ownership
  - Build execution context: { orgId, triggerData, availableActions }
  - availableActions: block_ip (via connector), isolate_host, 
    create_case, add_note, send_notification, enrich_ioc, tag_mitre
  - Execute each step sequentially with 30s timeout per step
  - Log each step result to playbook_executions table
  - On any step failure: log error, continue if step.continueOnError=true,
    else abort and mark execution failed
  - Return PlaybookExecution with all step results

- PlaybookExecution:
  { id, playbookId, orgId, status, steps: StepResult[], 
    startedAt, completedAt, triggeredBy }

- StepResult:
  { stepId, action, input, output, status, error, duration }

app/api/playbooks/[id]/execute/route.ts:
- POST body: { triggerData }
- Clerk auth + org scope
- Call executePlaybook
- Return execution result

app/api/cron/auto-playbooks/route.ts:
- GET with CRON_SECRET
- Fetch critical/high alerts in last 15min with no assigned playbook execution
- Match to auto-trigger playbooks (playbooks with auto_trigger=true, 
  severity_threshold matching)
- Execute matched playbooks
- Log count

After ALL files across all 5 parts, run npm run build.
Fix all TypeScript errors. Show every file created.
Confirm build passes.

Add to .env.production (append only):
RESEND_API_KEY=
CONNECTOR_ENCRYPTION_KEY=