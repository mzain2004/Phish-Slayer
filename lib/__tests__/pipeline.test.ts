import { describe, it, expect, vi, beforeEach } from 'vitest';
import { IngestionPipeline } from '../ingestion/pipeline';
import { checkQuota, incrementUsage } from '../quotas/enforcer';

// Mock dependencies
vi.mock('../quotas/enforcer', () => ({
  checkQuota: vi.fn(),
  incrementUsage: vi.fn(),
}));

vi.mock('../ingestion/parsers', () => ({
  parseEvent: vi.fn().mockReturnValue({ timestamp_utc: '2023-01-01T00:00:00Z' }),
  detectFormat: vi.fn().mockReturnValue('json'),
}));

vi.mock('../ingestion/data-quality', () => ({
  runQualityChecks: vi.fn().mockReturnValue({ is_duplicate: false, is_stale: false }),
}));

vi.mock('../ingestion/connector-health', () => ({
  updateConnectorHealth: vi.fn(),
}));

describe('IngestionPipeline', () => {
  let pipeline: IngestionPipeline;
  let mockSupabase: any;

  beforeEach(() => {
    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      insert: vi.fn().mockResolvedValue({ error: null }),
    };
    pipeline = new IngestionPipeline(mockSupabase);
    vi.clearAllMocks();
  });

  it('should ingest event and include org_id', async () => {
    (checkQuota as any).mockResolvedValue({ allowed: true, limit: 100 });
    
    const event = await pipeline.ingestEvent('{"data":"test"}', 'conn-1', 'org-123');

    expect(mockSupabase.from).toHaveBeenCalledWith('udm_events');
    expect(mockSupabase.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        org_id: 'org-123',
        connector_id: 'conn-1',
      })
    );
    expect(incrementUsage).toHaveBeenCalledWith('org-123', 'alerts_per_day');
  });

  it('should throw error if quota exceeded', async () => {
    (checkQuota as any).mockResolvedValue({ allowed: false, limit: 100 });

    await expect(pipeline.ingestEvent('{}', 'conn-1', 'org-123'))
      .rejects.toThrow('quota_exceeded:100');
  });
});
