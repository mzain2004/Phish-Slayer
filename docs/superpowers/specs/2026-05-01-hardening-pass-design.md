# Hardening Pass: Final Security & Cleanup Design

**Goal:** Perform a final security hardening pass, clean up debug logs, and ensure robust error handling before demo.

## 1. Cron Security
**Problem:** Multiple cron routes in `app/api/cron/` lack authorization checks, allowing anyone to trigger expensive or sensitive operations.
**Solution:** Implement a consistent authorization check using `CRON_SECRET` in all cron routes.
**Implementation:**
- Create a utility function `verifyCronAuth(req: Request)` or similar, or simply inline the check as seen in `app/api/cron/route.ts`.
- Apply to:
    - `app/api/cron/auto-playbooks/route.ts`
    - `app/api/cron/beaconing-scan/route.ts`
    - `app/api/cron/cti-feeds/route.ts`
    - `app/api/cron/darkweb-scan/route.ts`
    - `app/api/cron/enrich-alerts/route.ts`
    - `app/api/cron/intel-pipeline/route.ts`
    - `app/api/cron/l1-triage/route.ts` (Already has it, verify consistency)
    - `app/api/cron/l2-respond/route.ts`
    - `app/api/cron/l3-hunt/route.ts`
    - `app/api/cron/metrics/route.ts`
    - `app/api/cron/mitre-coverage/route.ts`
    - `app/api/cron/mitre-tag-alerts/route.ts`
    - `app/api/cron/org-risk-update/route.ts`
    - `app/api/cron/osint-brand/route.ts`
    - `app/api/cron/osint-full/route.ts`
    - `app/api/cron/run-detection-rules/route.ts`
    - `app/api/cron/sla-checker/route.ts`
    - `app/api/cron/sync-connectors/route.ts`
    - `app/api/cron/sync-tip-feeds/route.ts`
    - `app/api/cron/uba-baseline-update/route.ts`
    - `app/api/cron/vuln-scan/route.ts`

## 2. Dashboard Auth
**Verification:**
- `middleware.ts` uses `auth.protect()` for `/dashboard/*`.
- `app/dashboard/page.tsx` (server component) uses `auth()` and redirects if no `userId`.
- `app/dashboard/layout.tsx` (client component) uses `SessionGuard` for client-side protection.
**Decision:** Existing protection is sufficient. No changes needed.

## 3. Console Log Cleanup
**Problem:** Excessive `console.log` statements in production-bound code (`lib/`, `app/api/`).
**Solution:** Remove or replace with `console.error`.
**Implementation:**
- Grep and replace `console.log` in `lib/` and `app/api/`.
- Exceptions: Startup messages or explicit health check logs.

## 4. Environment Variable Audit
**Goal:** Ensure `.env.example` is complete and all variables are used.
**Implementation:**
- Compare `.env.example` with `process.env` usage in the codebase.
- Update `.env.example` if any missing.

## 5. Error Handling & 404
**Verification:**
- `app/dashboard/error.tsx` exists and logs to Sentry.
- `app/not-found.tsx` exists and matches PhishSlayer design.
**Decision:** Existing components meet requirements. No changes needed.

## 6. Final Build & Verification
**Implementation:**
- Run `npm run build`.
- Run `npm run test`.
- Verify success before commit.
