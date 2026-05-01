@GEMINI.md @graph.md
New session. Read both. Build MUST pass.
Sprint 18: Polar Billing Integration + Plan Gating.
Sprint 17 complete.

NOTE: Payment provider is POLAR (polar.sh) NOT Stripe.
Zain's account is pending UBL bank verification on Polar.

AUDIT: Read app/api/billing/ routes. Read app/dashboard/billing/page.tsx.
Check organizations.plan column exists (Sprint 15 added it).

═══ PART 1 — POLAR SETUP ═══

npm install @polar-sh/sdk

/lib/billing/polar.ts
import { Polar } from '@polar-sh/sdk'
export const polar = new Polar({ accessToken: process.env.POLAR_ACCESS_TOKEN })

Add to .env.example (NEVER .env.production — append only):
POLAR_ACCESS_TOKEN=
POLAR_ORGANIZATION_ID=
POLAR_PRO_PRODUCT_ID=
POLAR_ENTERPRISE_PRODUCT_ID=
POLAR_WEBHOOK_SECRET=

═══ PART 2 — CHECKOUT ═══

/app/api/billing/checkout/route.ts (UPDATE existing — read first):
Auth + org scope.
POST body: {plan: 'pro'|'enterprise'}
Use Polar SDK to create checkout:
  polar.checkouts.create({
    products: [process.env[plan === 'pro' ? 'POLAR_PRO_PRODUCT_ID' : 'POLAR_ENTERPRISE_PRODUCT_ID']],
    successUrl: 'https://phishslayer.tech/dashboard?upgraded=true',
    metadata: { orgId }
  })
Return {checkoutUrl: checkout.url}

═══ PART 3 — POLAR WEBHOOK ═══

/app/api/billing/webhook/route.ts (UPDATE — read first):
This must be PUBLIC (no Clerk auth). Verify Polar signature.
Handle events:
  order.created / subscription.active:
    Get orgId from metadata
    UPDATE organizations SET plan = 'pro' (or enterprise)
  subscription.canceled / subscription.revoked:
    SET plan = 'free'
  subscription.updated:
    Check new product ID → update plan accordingly

Polar webhook verification:
  import { validateEvent } from '@polar-sh/sdk/webhooks'
  validateEvent(rawBody, headers, process.env.POLAR_WEBHOOK_SECRET)
  If invalid: return 400

═══ PART 4 — PLAN GATING ═══

/lib/billing/plan-gate.ts (UPDATE or CREATE):
const PLAN_RANK = {free: 0, pro: 1, enterprise: 2}

async function requirePlan(orgId: string, required: 'pro'|'enterprise'): Promise<boolean>
  Get org.plan from DB
  Return PLAN_RANK[org.plan] >= PLAN_RANK[required]

Wire plan gating (read each file first, add 3 lines):
app/api/osint/brand/scan/route.ts → requirePlan('pro')
app/api/playbooks/[id]/execute/route.ts → requirePlan('pro')
app/api/malware/analyze/route.ts → requirePlan('pro')
If plan check fails: return apiError('UPGRADE_REQUIRED','Plan upgrade required',403,{required_plan})

═══ PART 5 — BILLING UI ═══

/app/dashboard/billing/page.tsx (UPDATE existing — read first):
Show current plan badge: FREE|PRO|ENTERPRISE
Usage stats from /api/settings/usage (Sprint 15)
Upgrade buttons:
  "Upgrade to Pro" → POST /api/billing/checkout {plan:'pro'} → redirect to checkoutUrl
  "Upgrade to Enterprise" → same with enterprise
If already pro: show "Upgrade to Enterprise" only
If enterprise: show "You're on the best plan 🚀"
Show Polar customer portal link if on paid plan.

═══ FINAL ═══
npm run build. Zero errors.
git commit -m "feat(billing): Sprint 18 Polar billing, plan gating, checkout flow"
git push origin main