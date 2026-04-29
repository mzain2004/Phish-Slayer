-- Migration: add Layer 0 tables

-- Agent execution checkpoint (for crash resume)
CREATE TABLE IF NOT EXISTS agent_checkpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  agent_run_id UUID NOT NULL REFERENCES agent_runs(id),
  checkpoint_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE agent_checkpoints ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_isolation" ON agent_checkpoints USING (org_id = current_setting('app.current_org_id')::uuid);

-- Dead letter queue
CREATE TABLE IF NOT EXISTS agent_dlq (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  agent_run_id UUID REFERENCES agent_runs(id),
  tier TEXT NOT NULL,
  error_message TEXT,
  input_payload JSONB,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT now() + INTERVAL '7 days'
);
ALTER TABLE agent_dlq ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_isolation" ON agent_dlq USING (org_id = current_setting('app.current_org_id')::uuid);

-- Token usage tracking
CREATE TABLE IF NOT EXISTS token_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  alert_id UUID,
  agent_run_id UUID,
  model TEXT NOT NULL,
  tokens_used INTEGER NOT NULL,
  provider TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE token_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_isolation" ON token_usage USING (org_id = current_setting('app.current_org_id')::uuid);

-- LLM provider health tracking
CREATE TABLE IF NOT EXISTS llm_provider_health (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  status TEXT NOT NULL, -- 'healthy' | 'degraded' | 'down'
  last_check TIMESTAMPTZ DEFAULT now(),
  failure_count INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);
