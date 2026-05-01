# Hardening Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Secure all cron routes, clean up logs, and perform final build verification.

**Architecture:** Implement a shared cron authorization utility and apply it across all scheduled routes. Use surgical regex replacements for log cleanup.

**Tech Stack:** Next.js 15, TypeScript, Clerk, Supabase.

---

### Task 1: Create Cron Authorization Utility

**Files:**
- Create: `lib/security/cronAuth.ts`

- [ ] **Step 1: Create the utility file**

```typescript
import { NextResponse } from "next/server";
import { safeCompare } from "@/lib/security/safeCompare";

export function verifyCronAuth(req: Request) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  const expectedAuthHeader = cronSecret ? `Bearer ${cronSecret}` : "";

  if (!cronSecret || !authHeader || !safeCompare(authHeader, expectedAuthHeader)) {
    return false;
  }
  return true;
}

export function unauthorizedResponse() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

- [ ] **Step 2: Commit utility**
```bash
git add lib/security/cronAuth.ts
git commit -m "feat(security): add cron authorization utility"
```

---

### Task 2: Secure All Cron Routes

**Files:**
- Modify: `app/api/cron/**/*.ts`

- [ ] **Step 1: Update each cron route to use verifyCronAuth**
(This involves looping through all route files identified in research and injecting the check at the top of the handler).

- [ ] **Step 2: Commit security fixes**
```bash
git add app/api/cron
git commit -m "fix(security): secure all cron routes with CRON_SECRET"
```

---

### Task 3: Console Log Cleanup

**Files:**
- Modify: `lib/**/*.ts`, `app/api/**/*.ts`

- [ ] **Step 1: Replace console.log with console.error or remove**
Search: `console\.log`
Replace: Remove if debug, change to `console.error` if error-related.

- [ ] **Step 2: Commit cleanup**
```bash
git commit -m "refactor: clean up debug console logs"
```

---

### Task 4: Environment Variable Audit

**Files:**
- Modify: `.env.example`

- [ ] **Step 1: Verify all variables and update .env.example**

- [ ] **Step 2: Commit audit**
```bash
git add .env.example
git commit -m "chore: audit and update env.example"
```

---

### Task 5: Final Build & Verification

- [ ] **Step 1: Run build**
Run: `npm run build`

- [ ] **Step 2: Run tests**
Run: `npm run test`

- [ ] **Step 3: Push to origin**
Run: `git push origin main`
