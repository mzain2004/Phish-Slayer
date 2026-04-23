-- ================================================================
-- PhishSlayer: Alert Deduplication & Suppression Schema
-- ================================================================

-- ── alert_groups table ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.alert_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_key TEXT UNIQUE NOT NULL,
    rule_id TEXT NOT NULL,
    source_ip TEXT NOT NULL,
    count INTEGER DEFAULT 1,
    first_seen TIMESTAMPTZ NOT NULL,
    last_seen TIMESTAMPTZ NOT NULL,
    suppressed BOOLEAN DEFAULT false,
    suppression_reason TEXT,
    representative_alert JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── suppression_rules table ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.suppression_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_type TEXT CHECK (rule_type IN ('ip', 'rule_id', 'cidr')),
    value TEXT NOT NULL,
    reason TEXT,
    created_by TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    hit_count INTEGER DEFAULT 0,
    last_hit TIMESTAMPTZ
);

-- ── Enable RLS ───────────────────────────────────────────────────
ALTER TABLE public.alert_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppression_rules ENABLE ROW LEVEL SECURITY;

-- ── RLS Policies ─────────────────────────────────────────────────

-- alert_groups: Authenticated access
CREATE POLICY "Authenticated users can view alert groups" 
    ON public.alert_groups FOR SELECT 
    USING (auth.jwt() IS NOT NULL);

-- suppression_rules: Scoped by created_by (Clerk sub) or admin role if available
CREATE POLICY "Users can manage their own suppression rules" 
    ON public.suppression_rules FOR ALL 
    USING ((auth.jwt() ->> 'sub') = created_by)
    WITH CHECK ((auth.jwt() ->> 'sub') = created_by);

-- Service role bypass
CREATE POLICY "Service role full access" ON public.alert_groups FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access" ON public.suppression_rules FOR ALL USING (auth.role() = 'service_role');

-- ── Indices ──────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_alert_groups_rule_id ON public.alert_groups(rule_id);
CREATE INDEX IF NOT EXISTS idx_alert_groups_source_ip ON public.alert_groups(source_ip);
CREATE INDEX IF NOT EXISTS idx_alert_groups_last_seen ON public.alert_groups(last_seen DESC);
CREATE INDEX IF NOT EXISTS idx_suppression_rules_value ON public.suppression_rules(value);
