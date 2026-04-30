-- Migration: MITRE Coverage and Tracking

DO $$ 
BEGIN
  -- Check if mitre_coverage table exists, if not create it
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename  = 'mitre_coverage') THEN
    CREATE TABLE public.mitre_coverage (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      org_id UUID NOT NULL REFERENCES organizations(id),
      technique_id TEXT NOT NULL,
      tactic_id TEXT NOT NULL,
      detection_rule_id UUID REFERENCES detection_rules(id),
      coverage_level INTEGER DEFAULT 0,
      last_detected_at TIMESTAMPTZ,
      detection_count INTEGER DEFAULT 0,
      updated_at TIMESTAMPTZ DEFAULT now(),
      UNIQUE(org_id, technique_id, detection_rule_id)
    );

    ALTER TABLE public.mitre_coverage ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "org_isolation" ON public.mitre_coverage
      USING (org_id = current_setting('app.current_org_id')::uuid);
  ELSE
    -- Alter existing table to add any missing columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mitre_coverage' AND column_name = 'technique_id') THEN
        ALTER TABLE public.mitre_coverage ADD COLUMN technique_id TEXT NOT NULL DEFAULT 'UNKNOWN';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mitre_coverage' AND column_name = 'tactic_id') THEN
        ALTER TABLE public.mitre_coverage ADD COLUMN tactic_id TEXT NOT NULL DEFAULT 'UNKNOWN';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mitre_coverage' AND column_name = 'detection_rule_id') THEN
        ALTER TABLE public.mitre_coverage ADD COLUMN detection_rule_id UUID REFERENCES detection_rules(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mitre_coverage' AND column_name = 'coverage_level') THEN
        ALTER TABLE public.mitre_coverage ADD COLUMN coverage_level INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mitre_coverage' AND column_name = 'last_detected_at') THEN
        ALTER TABLE public.mitre_coverage ADD COLUMN last_detected_at TIMESTAMPTZ;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mitre_coverage' AND column_name = 'detection_count') THEN
        ALTER TABLE public.mitre_coverage ADD COLUMN detection_count INTEGER DEFAULT 0;
    END IF;
  END IF;

  -- Add mitre_tags column to alerts if it does not exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'alerts' AND column_name = 'mitre_tags') THEN
      ALTER TABLE public.alerts ADD COLUMN mitre_tags TEXT[] DEFAULT ARRAY[]::TEXT[];
  END IF;

  -- Add mitre_coverage_score to organizations if it does not exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'mitre_coverage_score') THEN
      ALTER TABLE public.organizations ADD COLUMN mitre_coverage_score JSONB;
  END IF;

END $$;
