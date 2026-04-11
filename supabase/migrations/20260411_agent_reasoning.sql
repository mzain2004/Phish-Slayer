CREATE TABLE agent_reasoning (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_id UUID REFERENCES alerts(id) ON DELETE SET NULL,
  escalation_id UUID REFERENCES escalations(id) ON DELETE SET NULL,
  agent_level TEXT NOT NULL CHECK (agent_level IN ('L1', 'L2', 'L3')),
  decision TEXT NOT NULL,
  confidence_score FLOAT,
  reasoning_text TEXT NOT NULL,
  iocs_considered JSONB DEFAULT '[]',
  actions_taken JSONB DEFAULT '[]',
  model_used TEXT DEFAULT 'gemini-2.5-flash',
  execution_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE agent_reasoning ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access" ON agent_reasoning
  FOR ALL USING (auth.role() = 'service_role');

CREATE INDEX idx_agent_reasoning_alert_id ON agent_reasoning(alert_id);
CREATE INDEX idx_agent_reasoning_agent_level ON agent_reasoning(agent_level);
CREATE INDEX idx_agent_reasoning_created_at ON agent_reasoning(created_at DESC);
