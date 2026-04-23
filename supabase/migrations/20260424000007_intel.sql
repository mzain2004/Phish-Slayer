-- ================================================================
-- PhishSlayer: Threat Intelligence Feeds Schema
-- ================================================================

-- ── threat_intel table updates ──────────────────────────────────
ALTER TABLE public.threat_intel ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'internal';
ALTER TABLE public.threat_intel ADD COLUMN IF NOT EXISTS ioc_type TEXT;
ALTER TABLE public.threat_intel ADD COLUMN IF NOT EXISTS confidence INTEGER DEFAULT 50;
ALTER TABLE public.threat_intel ADD COLUMN IF NOT EXISTS expiry TIMESTAMPTZ;
ALTER TABLE public.threat_intel ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;
ALTER TABLE public.threat_intel ADD COLUMN IF NOT EXISTS case_id UUID;
ALTER TABLE public.threat_intel ADD COLUMN IF NOT EXISTS mitre_techniques TEXT[];
ALTER TABLE public.threat_intel ADD COLUMN IF NOT EXISTS raw_data JSONB;

-- ── intel_sync_log table ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.intel_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL,
  entries_added INTEGER DEFAULT 0,
  entries_updated INTEGER DEFAULT 0,
  sync_duration_ms INTEGER,
  error TEXT,
  synced_at TIMESTAMPTZ DEFAULT now()
);

-- ── Enable RLS ───────────────────────────────────────────────────
ALTER TABLE public.intel_sync_log ENABLE ROW LEVEL SECURITY;

-- ── RLS Policies ─────────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'intel_sync_log' AND policyname = 'intel_sync_log_policy') THEN
    CREATE POLICY "intel_sync_log_policy" ON public.intel_sync_log FOR SELECT USING (auth.jwt() IS NOT NULL);
  END IF;
END $$;

-- ── Indices ──────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_threat_intel_value ON public.threat_intel(value);
CREATE INDEX IF NOT EXISTS idx_threat_intel_source ON public.threat_intel(source);
CREATE INDEX IF NOT EXISTS idx_threat_intel_active ON public.threat_intel(active);
CREATE INDEX IF NOT EXISTS idx_intel_sync_log_date ON public.intel_sync_log(synced_at DESC);
