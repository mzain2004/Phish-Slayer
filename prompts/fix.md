@GEMINI.md @graph.md
New session. Read both. Build MUST pass.
Sprint 19: Testing Infrastructure + Critical Path Tests.
Sprint 18 complete.

═══ PART 1 — SETUP ═══

npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom

/vitest.config.ts
import { defineConfig } from 'vitest/config'
export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./lib/__tests__/setup.ts'],
  }
})

/lib/__tests__/setup.ts
import '@testing-library/jest-dom'

package.json: add scripts:
"test": "vitest run",
"test:watch": "vitest",
"test:coverage": "vitest run --coverage"

═══ PART 2 — UNIT TESTS ═══

/lib/__tests__/enrichment.test.ts
Test rule-based MITRE tagger:
  {rule_name: 'Brute Force'} → contains 'T1110'
  {rule_name: 'PowerShell'} → contains 'T1059'
  {rule_name: 'xyz_unknown_thing'} → empty array

/lib/__tests__/ioc-processor.test.ts
Test normalizeIOC:
  {type:'ip', value:'192.168.001.001'} → '192.168.1.1'
  {type:'hash_sha256', value:'ABC123...(64chars)'} → lowercase
  {type:'domain', value:'EVIL.COM.'} → 'evil.com'

/lib/__tests__/pipeline.test.ts
Mock Supabase client with vi.mock.
Test ingestEvent: verify calls format detection → quality check → insert
Assert org_id always present in insert call.

/lib/__tests__/quota-enforcer.test.ts
Mock Supabase. Test checkQuota:
  count=0, limit=100 → {allowed:true, remaining:100}
  count=100, limit=100 → {allowed:false, remaining:0}

/app/api/__tests__/health.test.ts
import handler from '../health/route'
Test: GET request → 200 → {status:'ok'}

═══ PART 3 — INTEGRATION SMOKE TESTS ═══

/lib/__tests__/smoke.test.ts
Test that critical lib exports exist (not undefined):
  import { ingestEvent } from '../ingestion/pipeline'
  import { tagAlert } from '../mitre/auto-tagger'
  import { checkQuota } from '../quotas/enforcer'
  import { deliverWebhook } from '../webhooks/delivery'
  expect(ingestEvent).toBeDefined()
  (etc)

═══ FINAL ═══
npm run build && npm run test
Both must pass.
git commit -m "feat(testing): Sprint 19 vitest setup, critical path tests"
git push origin main