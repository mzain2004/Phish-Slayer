-- Sprint 20: Database Performance Optimization

-- Core indexes for organization-scoped time-series data
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_alerts_org_ts ON public.alerts(org_id, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cases_org_ts ON public.cases(organization_id, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_osint_findings_org_ts ON public.osint_findings(organization_id, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_udm_events_org_ts ON public.udm_events(org_id, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_hunt_hypotheses_org_ts ON public.hunt_hypotheses(organization_id, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_playbook_runs_org_ts ON public.playbook_runs(organization_id, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_threat_iocs_org_ts ON public.threat_iocs(last_seen DESC); -- No org_id in threat_iocs usually, it's global
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ioc_hits_org_ts ON public.ioc_hits(org_id, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_trail_org_ts ON public.audit_trail(org_id, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_webhook_deliveries_org_ts ON public.webhook_deliveries(org_id, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_quota_usage_org_ts ON public.quota_usage(org_id, created_at DESC);

-- Specific query optimizations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_udm_events_org_ip ON public.udm_events(org_id, src_ip);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_threat_iocs_type_val ON public.threat_iocs(ioc_type, ioc_value);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_alerts_org_sev_stat ON public.alerts(org_id, severity, status);
