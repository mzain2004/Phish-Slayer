@GEMINI.md @graph.md
New session. You are a senior security engineer on PhishSlayer.
Read GEMINI.md and graph.md first. State current sprint.
AUDIT: Check existing playbook_executions table (seen in DB). Check containment table. ALTER missing columns.
BUILD: npm run build must pass.

You are building Sprint 8: Response Playbook Builder + Execution Engine.

USE SUPABASE CONNECTOR for migrations.

PART 1 — PLAYBOOK SCHEMA
Check/Create playbooks table:
- id, org_id (RLS, null=platform default), name, description
- trigger_conditions (JSONB: {severity_min, mitre_techniques[], event_types[]})
- steps (JSONB: ordered array of step objects)
- version (integer), status ('DRAFT'|'ACTIVE'|'DISABLED')
- human_approval_required (boolean), approval_timeout_minutes (integer)

Check/Create playbook_runs table:
- id, org_id (RLS), playbook_id (FK), case_id (FK), alert_id (FK)
- status ('RUNNING'|'AWAITING_APPROVAL'|'COMPLETED'|'FAILED'|'ROLLED_BACK')
- current_step_index, results (JSONB), started_at, completed_at

PART 2 — PLAYBOOK STEP TYPES
/lib/response/playbook-types.ts
Define step types: block_ip, isolate_host, disable_account, quarantine_email, revoke_aws_key, notify, create_ticket, human_approval, wait, conditional, run_hunt.
Define rollback mapping: block_ip → unblock_ip, isolate_host → unisolate_host, disable_account → enable_account.

PART 3 — ACTION DISPATCHER
/lib/response/action-dispatcher.ts
async function dispatchStep(step: PlaybookStep, context: any): Promise<ActionResult>
Implement handlers:
- block_ip: Log action. If firewall connector configured later, call it. Else: log "NO_CONNECTOR: block_ip". Do NOT crash.
- isolate_host: Same pattern. Log action, check for EDR connector, graceful fallback.
- notify: Use notification engine if exists, else console.log.
- human_approval: Return special status 'AWAITING_APPROVAL', do not continue.
CRITICAL: Every handler wrapped in try/catch. Never let one step failure crash the whole run.

PART 4 — PLAYBOOK EXECUTOR
/lib/response/playbook-executor.ts
async function executePlaybook(playbookId: string, context: any, simulation?: boolean): Promise<RunResult>
Loop through steps:
1. Check condition (if conditional step).
2. If human_approval: set status AWAITING_APPROVAL, pause.
3. If simulation: log "WOULD_EXECUTE", skip real action.
4. Call dispatchStep.
5. Record result in playbook_runs.results JSONB.
6. On failure: check step.on_failure ('continue'|'stop'|'rollback').
7. If rollback: execute rollback steps in reverse order.

PART 5 — CONTAINMENT VERIFICATION
/lib/response/verifier.ts
async function verifyAction(actionType: string, target: string): Promise<boolean>
Basic verification stubs (expand later with real connector calls):
- block_ip: try fetch to target IP, expect timeout/refused.
- disable_account: log "Verification requires Identity connector".
Store results in containment_verifications table.

PART 6 — SEED DEFAULT PLAYBOOKS
/lib/response/default-playbooks.ts
Seed 3 platform-default playbooks (org_id=null):
1. "Phishing Response": quarantine_email → block_domain → disable_account (conditional) → notify
2. "Ransomware Containment": human_approval → isolate_host → snapshot_host → notify
3. "Credential Compromise": disable_account → force_password_reset → notify → run_hunt

PART 7 — API ROUTES
GET /api/playbooks — list playbooks
POST /api/playbooks — create playbook
PUT /api/playbooks/[id] — update playbook
POST /api/playbooks/[id]/execute — trigger execution (with simulation query param)
GET /api/playbooks/runs — list run history
POST /api/playbooks/runs/[id]/approve — approve human step
POST /api/playbooks/runs/[id]/rollback — trigger rollback

All routes: auth + org_id scope.

FINAL: npm run build. git commit -m "feat(response): Sprint 8 playbook builder, executor, verification, default playbooks". git push.