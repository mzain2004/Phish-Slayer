@GEMINI.md @graph.md
New session. You are a senior security engineer on PhishSlayer.
Read GEMINI.md and graph.md first. State current sprint.
AUDIT: Read supabase/migrations/20260424000001_cases.sql. Read existing case code. Build ON TOP of existing schema. ALTER only if missing columns.
BUILD: npm run build must pass.

You are building Sprint 7: Case Management Lifecycle + Evidence + Timeline.

USE SUPABASE CONNECTOR for migrations.

PART 1 — EVIDENCE & CHAIN OF CUSTODY
Check/Create case_evidence table:
- id, case_id (FK), alert_id (FK), org_id (RLS)
- evidence_type ('log'|'pcap'|'screenshot'|'malware_sample'|'sandbox_report'|'osint_report')
- file_url (S3 path if file), text_content (if text evidence)
- collected_by ('L1_Agent'|'L2_Agent'|'L3_Agent'|'Manager')
- collected_at, hash_sha256 (integrity verify)

PART 2 — CASE TIMELINE
Check/Create case_timeline table:
- id, case_id (FK), org_id (RLS)
- event_type ('alert_triggered'|'enrichment_complete'|'agent_action'|'containment_executed'|'mitre_tagged'|'note_added'|'status_changed')
- actor (agent tier or user name)
- description (text)
- metadata (JSONB — stores related IOCs, confidence scores, etc)
- timestamp

PART 3 — CASE LIFECYCLE ENGINE
/lib/cases/lifecycle.ts
async function advanceCaseStatus(caseId: string, orgId: string, newStatus: string, reason: string)
Valid transitions:
  OPEN → IN_PROGRESS → CONTAINED → REMEDIATED → CLOSED → ARCHIVED
Reject invalid transitions with 400 error.
On every transition:
  1. Update cases.status
  2. Add entry to case_timeline (type='status_changed')
  3. If CLOSED: run closure checklist validation

PART 4 — CLOSURE CHECKLIST
/lib/cases/checklist.ts
async function validateClosure(caseId: string, orgId: string): Promise<{passed: boolean, failures: string[]}>
Check:
- All related alerts have status != 'OPEN'
- Root cause field is not empty
- At least 1 evidence item attached
- Containment action verified (if any run)
- SLA was not breached (or breach is documented)
Return failures list. If >0, block closure.

PART 5 — PIR GENERATOR
/lib/cases/pir-generator.ts
async function generatePIR(caseId: string, orgId: string): Promise<string>
Use Groq LLM.
Prompt: "Generate a Post-Incident Review document for this security case."
Context: case details, timeline events, evidence summaries, root cause.
Output: Structured markdown with sections: Executive Summary, Timeline, Root Cause, Impact, Lessons Learned, Recommendations.

PART 6 — AUTO-CASE CREATION
Wire into L1/L2 agent flow:
- When L2 escalates an alert to HIGH/CRITICAL → auto-create case
- Link alert to case
- Add initial timeline entry
- Trigger notification engine (if Sprint 4 exists, else stub with console.log)

PART 7 — API ROUTES
GET /api/cases — list cases (paginated, filterable by status)
GET /api/cases/[id] — full case with timeline + evidence
POST /api/cases/[id]/evidence — attach evidence
POST /api/cases/[id]/notes — add timeline note
POST /api/cases/[id]/close — attempt closure (runs checklist)
GET /api/cases/[id]/pir — generate PIR document

All routes: auth + org_id scope.

FINAL: npm run build. git commit -m "feat(cases): Sprint 7 case lifecycle, evidence chain of custody, PIR generator". git push.