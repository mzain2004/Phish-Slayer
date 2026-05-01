-- Sprint 24: Multi-Region and White-Label Foundation

ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS data_region TEXT DEFAULT 'uae-north';

ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS white_label_config JSONB DEFAULT '{}';
