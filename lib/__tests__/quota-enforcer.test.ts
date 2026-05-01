import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkQuota } from '../quotas/enforcer';
import { supabaseAdmin } from '../supabase/admin';

vi.mock('../supabase/admin', () => ({
  supabaseAdmin: {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn(),
  },
}));

describe('checkQuota', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should allow if usage is below limit', async () => {
    const mockOrg = { plan_limits: { alerts_per_day: 100 } };
    const mockUsage = { count: 0 };

    (supabaseAdmin.from as any)().single
      .mockResolvedValueOnce({ data: mockOrg }) // First call for org
      .mockResolvedValueOnce({ data: mockUsage }); // Second call for usage

    const result = await checkQuota('org-1', 'alerts_per_day');
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(100);
  });

  it('should block if usage meets limit', async () => {
    const mockOrg = { plan_limits: { alerts_per_day: 100 } };
    const mockUsage = { count: 100 };

    (supabaseAdmin.from as any)().single
      .mockResolvedValueOnce({ data: mockOrg })
      .mockResolvedValueOnce({ data: mockUsage });

    const result = await checkQuota('org-1', 'alerts_per_day');
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });
});
