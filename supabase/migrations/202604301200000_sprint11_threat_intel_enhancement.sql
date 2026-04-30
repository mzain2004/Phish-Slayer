-- Sprint 11: Threat Actor Profiles + Campaign Tracker

-- Threat Actors Attribution
CREATE TABLE IF NOT EXISTS public.threat_actors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    actor_id TEXT NOT NULL, -- Matches ID in /lib/intel/actor-profiles.ts
    match_confidence DECIMAL(3, 2) DEFAULT 0.00,
    first_seen TIMESTAMPTZ DEFAULT NOW(),
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    associated_incidents UUID[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Campaign Tracker
CREATE TABLE IF NOT EXISTS public.campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    actor_id TEXT, -- Optional attribution link
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'dormant', 'concluded')),
    iocs JSONB DEFAULT '{"ips": [], "domains": [], "hashes": []}',
    linked_cases UUID[] DEFAULT '{}',
    linked_alerts UUID[] DEFAULT '{}',
    first_seen TIMESTAMPTZ DEFAULT NOW(),
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    tlp TEXT DEFAULT 'AMBER' CHECK (tlp IN ('WHITE', 'GREEN', 'AMBER', 'RED')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.threat_actors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow members to select threat_actors" ON public.threat_actors
    FOR SELECT USING (org_id IN (SELECT organization_id FROM tenant_users WHERE user_id = auth.uid()::text));

CREATE POLICY "Allow members to insert threat_actors" ON public.threat_actors
    FOR INSERT WITH CHECK (org_id IN (SELECT organization_id FROM tenant_users WHERE user_id = auth.uid()::text));

CREATE POLICY "Allow members to update threat_actors" ON public.threat_actors
    FOR UPDATE USING (org_id IN (SELECT organization_id FROM tenant_users WHERE user_id = auth.uid()::text));

CREATE POLICY "Allow members to select campaigns" ON public.campaigns
    FOR SELECT USING (org_id IN (SELECT organization_id FROM tenant_users WHERE user_id = auth.uid()::text));

CREATE POLICY "Allow members to insert campaigns" ON public.campaigns
    FOR INSERT WITH CHECK (org_id IN (SELECT organization_id FROM tenant_users WHERE user_id = auth.uid()::text));

CREATE POLICY "Allow members to update campaigns" ON public.campaigns
    FOR UPDATE USING (org_id IN (SELECT organization_id FROM tenant_users WHERE user_id = auth.uid()::text));

CREATE INDEX IF NOT EXISTS idx_threat_actors_org ON public.threat_actors(org_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_org ON public.campaigns(org_id);
