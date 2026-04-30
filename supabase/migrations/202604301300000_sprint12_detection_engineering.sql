-- Sprint 12: Detection Engineering + Sigma Lifecycle + AI Rule Generator

-- Update detection_rules table for Sigma Lifecycle
ALTER TABLE public.detection_rules ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('staging', 'testing', 'active', 'retired'));
ALTER TABLE public.detection_rules ADD COLUMN IF NOT EXISTS fp_count INTEGER DEFAULT 0;
ALTER TABLE public.detection_rules ADD COLUMN IF NOT EXISTS tp_count INTEGER DEFAULT 0;
ALTER TABLE public.detection_rules ADD COLUMN IF NOT EXISTS last_tested_at TIMESTAMPTZ;
ALTER TABLE public.detection_rules ADD COLUMN IF NOT EXISTS sigma_yaml TEXT;

-- Indexing for performance
CREATE INDEX IF NOT EXISTS idx_detection_rules_status ON public.detection_rules(status);
CREATE INDEX IF NOT EXISTS idx_detection_rules_org_id ON public.detection_rules(organization_id);
