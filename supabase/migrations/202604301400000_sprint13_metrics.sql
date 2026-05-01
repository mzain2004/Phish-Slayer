-- Sprint 13: SOC Performance Metrics + Org Risk Score

-- 1. Metrics Timeseries
CREATE TABLE IF NOT EXISTS public.metrics_timeseries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    metric_name TEXT NOT NULL,
    metric_value FLOAT NOT NULL,
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Organization Risk Scoring Enhancements
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS org_risk_score INTEGER DEFAULT 0;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS last_metrics_update TIMESTAMPTZ;

-- 3. Case completed_at/closed_at check
-- Sprint 7 migration had closed_at update but let's ensure the column exists
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ;

-- Enable RLS
ALTER TABLE public.metrics_timeseries ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow members to select metrics" ON public.metrics_timeseries
    FOR SELECT USING (org_id IN (SELECT organization_id FROM tenant_users WHERE user_id = auth.uid()::text));

CREATE POLICY "Allow members to insert metrics" ON public.metrics_timeseries
    FOR INSERT WITH CHECK (org_id IN (SELECT organization_id FROM tenant_users WHERE user_id = auth.uid()::text));

CREATE INDEX IF NOT EXISTS idx_metrics_timeseries_org_name ON public.metrics_timeseries(org_id, metric_name, recorded_at DESC);

-- 4. RPC Functions for Metrics
CREATE OR REPLACE FUNCTION calculate_org_mttd(p_org_id UUID, p_interval TEXT)
RETURNS FLOAT AS $$
DECLARE
    result FLOAT;
BEGIN
    SELECT AVG(EXTRACT(EPOCH FROM (ingested_at - timestamp_utc)))
    INTO result
    FROM udm_events
    WHERE org_id = p_org_id
      AND event_type = 'alert'
      AND ingested_at > NOW() - p_interval::INTERVAL;
    
    RETURN COALESCE(result, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION calculate_org_mttr(p_org_id UUID, p_interval TEXT)
RETURNS FLOAT AS $$
DECLARE
    result FLOAT;
BEGIN
    SELECT AVG(EXTRACT(EPOCH FROM (closed_at - created_at)))
    INTO result
    FROM cases
    WHERE organization_id = p_org_id
      AND status = 'CLOSED'
      AND closed_at IS NOT NULL
      AND closed_at > NOW() - p_interval::INTERVAL;
    
    RETURN COALESCE(result, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
