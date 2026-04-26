-- Create webhook_events table for idempotency
-- Created: 2026-04-26

CREATE TABLE IF NOT EXISTS public.webhook_events (
    event_id TEXT PRIMARY KEY,
    processed_at TIMESTAMPTZ DEFAULT NOW(),
    event_type TEXT
);

-- Enable RLS
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

-- Service role bypass
CREATE POLICY "Service role full access" ON public.webhook_events FOR ALL USING (auth.role() = 'service_role');
