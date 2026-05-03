# Emergency Fix Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Execute the 8 critical fixes for the PhishSlayer platform to ensure stability and correct functionality.

**Architecture:** We will systematically apply the remaining fixes (1, 2, 3, 5) and verify the already-applied fixes (4, 6, 7, 8). Finally, we will ensure the build passes and commit the changes.

**Tech Stack:** Next.js 15, TypeScript, Supabase (DB only), Clerk (Auth)

---

### Task 1: Fix Command Center Blank Crash (Fix 1)

**Files:**
- Modify: `app/dashboard/page.tsx`

- [ ] **Step 1: Read the file to find the `createClient` initialization**
- [ ] **Step 2: Move `createClient` inside the `try/catch` block**

```tsx
// app/dashboard/page.tsx
export default async function DashboardOverviewPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/");
  }

  let orgId: string | null = null;
  let orgData: any = null;
  let scanRows: ScanRow[] = [];
  let incidentRows: IncidentRow[] = [];
  let intelCount = 0;
  let silentConnector = null;

  try {
    const supabase = await createClient(); // Moved inside try block
    const { data: membership, error: memError } = await supabase
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();
      
    // ... rest of the existing try block code ...
  } catch (error) {
    console.error("[Dashboard] Data fetch error:", error);
    // Fallback to empty state but don't crash
  }
  
  // ... rest of the component
}
```

### Task 2: Org Auto-Creation and Context Handling (Fix 2)

**Files:**
- Modify: `app/dashboard/layout.tsx`
- Modify: `app/dashboard/apikeys/page.tsx`
- Modify: `app/dashboard/email-analyzer/page.tsx`

- [ ] **Step 1: Set cookie for existing organizations in layout**

```tsx
// app/dashboard/layout.tsx (Inside the `if (!clerkOrgId)` block)
    if (!existingOrg) {
      // 2. No org found, create one
      // ... existing insert code ...
    } else {
      cookieStore.set("phishslayer_org_id", existingOrg.id, { path: "/" });
      if (!existingOrg.setup_complete) {
        // Optional: redirect to onboarding if found but not setup
      }
    }
```

- [ ] **Step 2: Update API Keys page to fall back to cookie/searchParams**

```tsx
// app/dashboard/apikeys/page.tsx
import { useSearchParams } from "next/navigation";
// ... inside component:
  const { organization, isLoaded: orgLoaded } = useOrganization();
  const searchParams = useSearchParams();
  const getCookie = (name: string) => {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? match[2] : null;
  };
  const orgId = organization?.id || searchParams.get('orgId') || getCookie('phishslayer_org_id');
```

- [ ] **Step 3: Update Email Analyzer page similarly**

```tsx
// app/dashboard/email-analyzer/page.tsx
import { useSearchParams } from "next/navigation";
// ... inside component:
  const { organization, isLoaded: orgLoaded } = useOrganization();
  const searchParams = useSearchParams();
  const getCookie = (name: string) => {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? match[2] : null;
  };
  const orgId = organization?.id || searchParams.get('orgId') || getCookie('phishslayer_org_id');
```

### Task 3: Fix Profile RLS Policy (Fix 3)

**Files:**
- Test: Supabase DB

- [ ] **Step 1: Check existing policies**
Run: `npx supabase db psql -c "SELECT policyname, cmd, qual FROM pg_policies WHERE tablename IN ('profiles');"`

- [ ] **Step 2: Update the policy**
Run: `npx supabase db psql -c "ALTER POLICY \"Users can view own profile\" ON profiles USING ((auth.jwt() ->> 'sub') = user_id::text);"`
Run: `npx supabase db psql -c "ALTER POLICY \"Users can insert own profile\" ON profiles WITH CHECK ((auth.jwt() ->> 'sub') = user_id::text);"`
Run: `npx supabase db psql -c "ALTER POLICY \"Users can update own profile\" ON profiles USING ((auth.jwt() ->> 'sub') = user_id::text);"`
*(Note: Replace policy names with the actual names found in Step 1)*

### Task 4: Verify Integrations Marketplace (Fix 4)

- [ ] **Step 1: Verify static registry is used**
Check `app/dashboard/integrations/page.tsx`. It already uses `getAllIntegrations()` from the registry. No changes needed.

### Task 5: Seed IOCs (Fix 5)

- [ ] **Step 1: Check IOC count**
Run: `npx supabase db psql -c "SELECT COUNT(*) FROM threat_iocs;"`

- [ ] **Step 2: Trigger Seed (if 0)**
If count is 0, trigger the local API endpoint (or call the function directly via a script):
```bash
node -e "require('http').request('http://localhost:3000/api/admin/seed-iocs', {method: 'POST'}).end()"
```
*(Alternatively, since we are using Supabase, we can just execute the API route locally if the server is running, or write a quick script to seed it).*

### Task 6: Verify Threat Scanner Profile Fallback (Fix 6)

- [ ] **Step 1: Verify fallback logic**
Check `lib/supabase/actions.ts`. The `currentUser` fallback logic is already implemented. No changes needed.

### Task 7: Verify Scan Results Pending Fix (Fix 7)

- [ ] **Step 1: Verify internal IP validation**
Check `lib/supabase/actions.ts`. The regex validation for `isInternal` is already implemented. No changes needed.

### Task 8: Verify MFA WebAuthn Disabled (Fix 8)

- [ ] **Step 1: Verify UI update**
Check `app/dashboard/settings/SettingsClient.tsx`. Passkey option is already hidden with the placeholder text. No changes needed.

### Task 9: Final Verification and Commit

- [ ] **Step 1: Build project**
Run: `npm run build`
Ensure zero errors.

- [ ] **Step 2: Commit and push**
```bash
git add -A
git commit -m "fix(critical): org auto-creation, dashboard crash, RLS profile, integrations registry, IOC import"
git push origin main
```
