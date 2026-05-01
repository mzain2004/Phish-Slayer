import { describe, it, expect } from 'vitest';
import { IngestionPipeline } from '../ingestion/pipeline';
import { ruleBasedTag } from '../mitre/auto-tagger';
import { checkQuota } from '../quotas/enforcer';
import { deliverWebhook } from '../webhooks/delivery';

describe('Smoke Test', () => {
  it('should have critical exports defined', () => {
    expect(IngestionPipeline).toBeDefined();
    expect(ruleBasedTag).toBeDefined();
    expect(checkQuota).toBeDefined();
    expect(deliverWebhook).toBeDefined();
  });
});
