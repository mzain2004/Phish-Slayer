-- Sprint 14: Hunt Hypothesis Generator + Intel-Driven Detection Pipeline

-- Drop existing status check to allow new values
ALTER TABLE public.hunt_hypotheses DROP CONSTRAINT IF EXISTS hunt_hypotheses_status_check;

-- Add new columns
ALTER TABLE public.hunt_hypotheses ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.hunt_hypotheses ADD COLUMN IF NOT EXISTS hypothesis_source TEXT;
ALTER TABLE public.hunt_hypotheses ADD COLUMN IF NOT EXISTS mitre_techniques TEXT[];
ALTER TABLE public.hunt_hypotheses ADD COLUMN IF NOT EXISTS hunt_query TEXT;
ALTER TABLE public.hunt_hypotheses ADD COLUMN IF NOT EXISTS hunt_query_type TEXT;
ALTER TABLE public.hunt_hypotheses ADD COLUMN IF NOT EXISTS confidence DECIMAL(3,2);
ALTER TABLE public.hunt_hypotheses ADD COLUMN IF NOT EXISTS result_summary TEXT;
ALTER TABLE public.hunt_hypotheses ADD COLUMN IF NOT EXISTS executed_at TIMESTAMPTZ;

-- Add new status check constraint
ALTER TABLE public.hunt_hypotheses ADD CONSTRAINT hunt_hypotheses_status_check
    CHECK (status IN ('pending', 'active', 'completed', 'dismissed', 'PENDING', 'RUNNING', 'COMPLETED', 'NO_FINDINGS'));

-- (The table already has organization_id, title, priority, findings_count, created_at and RLS enabled)
