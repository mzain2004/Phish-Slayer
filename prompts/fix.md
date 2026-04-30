@GEMINI.md @graph.md
New session. Read files. State sprint. Audit existing notification tables/code. BUILD MUST PASS.
USE SUPABASE CONNECTOR FOR ALL MIGRATIONS.

Sprint 9: Multi-Channel Notification Engine + On-Call Rotation.

PART 1 — SCHEMA
Check/Create tables:
notification_channels: id, org_id(RLS), name, type('email'|'slack'|'teams'|'pagerduty'|'webhook'), config(JSONB - stores webhook url, email, api key etc), is_active.
notification_rules: id, org_id(RLS), name, channel_id(FK), trigger_conditions(JSONB - {severities:[], event_types:[]}), cooldown_minutes, is_active.
notification_log: id, org_id(RLS), rule_id(FK), channel_id(FK), alert_id(FK), case_id(FK), status('sent'|'failed'|'skipped'), error_message, sent_at.
on_call_rotations: id, org_id(RLS), name, members(JSONB array of {user_id, email, slack_id}), current_index, handoff_time.

PART 2 — DISPATCHER
/lib/notifications/dispatcher.ts
async function notify(orgId: string, event: {severity: string, event_type: string, alert_id?: string, case_id?: string, message: string})
1. Fetch active rules for org matching event severity/type.
2. Check cooldown: has this rule fired for this alert_id in last cooldown_minutes? If yes, skip (dedup).
3. For each matched rule: send to channel.
4. Log result to notification_log.

PART 3 — CHANNEL SENDERS
/lib/notifications/channels/slack.ts: POST to webhook URL. JSON payload {text, blocks}. Catch errors.
/lib/notifications/channels/email.ts: Use Node.js nodemailer (add to package.json if missing). SMTP config from notification_channels.config.
/lib/notifications/channels/pagerduty.ts: POST to PagerDuty Events API v2. Trigger incident.
/lib/notifications/channels/teams.ts: POST to Microsoft Teams webhook. Adaptive card format.

PART 4 — ON-CALL ENGINE
/lib/notifications/on-call.ts
async function getCurrentOnCall(orgId: string, rotationId: string): Promise<Member>
Check handoff_time. If past, increment current_index (mod members.length). Update handoff_time to +24h. Return current member.
Wire into dispatcher: If severity=CRITICAL, also route to current on-call's Slack/Email directly.

PART 5 — ROUTES
POST /api/notifications/test — send test message to a channel (auth+org).
GET /api/notifications/log — paginated log (auth+org).
POST /api/notifications/rules — create rule (auth+org).

WIRE: Update Case lifecycle (Sprint 7) and Playbook executor (Sprint 8) to call notify() on status changes. Read those files, add import, add call. Do not rewrite the files, just inject the function call.

FINAL: npm run build. git commit -m "feat(notifications): Sprint 9 multi-channel engine, on-call, dedup". git push.