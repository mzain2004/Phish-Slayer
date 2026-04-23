-- ================================================================
-- PhishSlayer: Auto-Close & Feedback Loop Schema
-- ================================================================

-- ── feedback_entries table ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.feedback_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
    original_action TEXT,
    analyst_decision TEXT CHECK (analyst_decision IN ('true_positive', 'false_positive', 'benign')),
    analyst_id TEXT,
    notes TEXT,
    alert_type TEXT,
    source_ip TEXT,
    rule_id TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ── auto_close_log table ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.auto_close_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
    action TEXT,
    reason TEXT,
    suppression_rule_id UUID REFERENCES public.suppression_rules(id),
    confidence INTEGER,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ── Helper for incrementing hit count ───────────────────────────
CREATE OR REPLACE FUNCTION public.increment_rule_hit(rule_id_val UUID)
RETURNS void AS $$
BEGIN
    UPDATE public.suppression_rules
    SET hit_count = hit_count + 1,
        last_hit = now()
    WHERE id = rule_id_val;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Enable RLS ───────────────────────────────────────────────────
ALTER TABLE public.feedback_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auto_close_log ENABLE ROW LEVEL SECURITY;

-- ── RLS Policies ─────────────────────────────────────────────────

-- feedback_entries: Authenticated access
CREATE POLICY "Authenticated users can view feedback" 
    ON public.feedback_entries FOR SELECT 
    USING (auth.jwt() IS NOT NULL);

CREATE POLICY "Users can insert their own feedback" 
    ON public.feedback_entries FOR INSERT 
    WITH CHECK ((auth.jwt() ->> 'sub') = analyst_id);

-- auto_close_log: Authenticated access
CREATE POLICY "Authenticated users can view auto close logs" 
    ON public.auto_close_log FOR SELECT 
    USING (auth.jwt() IS NOT NULL);

-- Service role bypass
CREATE POLICY "Service role full access" ON public.feedback_entries FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access" ON public.auto_close_log FOR ALL USING (auth.role() = 'service_role');

-- ── Indices ──────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_feedback_entries_ip_rule ON public.feedback_entries(source_ip, rule_id);
CREATE INDEX IF NOT EXISTS idx_feedback_entries_decision ON public.feedback_entries(analyst_decision);
CREATE INDEX IF NOT EXISTS idx_suppression_rules_matching ON public.suppression_rules(value, rule_type);
CREATE INDEX IF NOT EXISTS idx_auto_close_log_case_id ON public.auto_close_log(case_id);
