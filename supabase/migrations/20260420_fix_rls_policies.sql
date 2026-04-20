-- Allow authenticated users to read data scoped to their organization membership.

DROP POLICY IF EXISTS "Authenticated read own org" ON public.organizations;
CREATE POLICY "Authenticated read own org" ON public.organizations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.organization_members m
      WHERE m.organization_id = organizations.id
        AND m.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Authenticated read own org" ON public.soc_metrics;
CREATE POLICY "Authenticated read own org" ON public.soc_metrics
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.organization_members m
      WHERE m.organization_id = soc_metrics.organization_id
        AND m.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Authenticated read own org" ON public.agent_reasoning;
CREATE POLICY "Authenticated read own org" ON public.agent_reasoning
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.organization_members m
      WHERE m.organization_id = agent_reasoning.organization_id
        AND m.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Authenticated read own org" ON public.static_analysis;
CREATE POLICY "Authenticated read own org" ON public.static_analysis
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.organization_members m
      WHERE m.organization_id = static_analysis.organization_id
        AND m.user_id = auth.uid()
    )
  );
