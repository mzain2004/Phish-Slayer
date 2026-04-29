import { SupabaseClient } from "@supabase/supabase-js";

export interface ComplianceControl {
  id: string;
  name: string;
  status: 'PASS' | 'FAIL' | 'PARTIAL';
  evidence: string;
}

export interface ComplianceReport {
  framework: string;
  controls: ComplianceControl[];
  passCount: number;
  failCount: number;
}

export async function getCompliancePosture(supabase: SupabaseClient, orgId: string, framework: string): Promise<ComplianceReport> {
  const [{ data: alerts }, { data: rules }, { data: connectors }] = await Promise.all([
    supabase.from("alerts").select("id").eq("org_id", orgId).limit(1),
    supabase.from("detection_rules").select("id").eq("organization_id", orgId).eq("is_active", true).limit(1),
    supabase.from("connectors").select("id").eq("organization_id", orgId).eq("status", "active").limit(1)
  ]);

  const hasAlerts = (alerts?.length || 0) > 0;
  const hasRules = (rules?.length || 0) > 0;
  const hasConnectors = (connectors?.length || 0) > 0;

  const controls: ComplianceControl[] = [];

  if (framework === 'NIST CSF') {
    controls.push({
      id: 'ID.AM-1',
      name: 'Physical devices and systems inventory',
      status: hasConnectors ? 'PASS' : 'FAIL',
      evidence: hasConnectors ? 'EDR/Cloud connectors actively syncing assets' : 'No asset sources connected'
    });
    controls.push({
      id: 'DE.AE-1',
      name: 'Anomalous activity is detected',
      status: hasRules ? 'PASS' : 'FAIL',
      evidence: hasRules ? 'Active detection rules configured' : 'No detection rules active'
    });
    controls.push({
      id: 'RS.RP-1',
      name: 'Response plan is executed',
      status: hasAlerts ? 'PASS' : 'PARTIAL',
      evidence: hasAlerts ? 'Incident response workflow triggered via alerts' : 'No alerts generated for response validation'
    });
  } else if (framework === 'SOC 2') {
    controls.push({
      id: 'CC7.2',
      name: 'System monitoring',
      status: hasRules ? 'PASS' : 'FAIL',
      evidence: hasRules ? 'Continuous monitoring via SOC detection rules' : 'No monitoring rules detected'
    });
  }

  const passCount = controls.filter(c => c.status === 'PASS').length;
  const failCount = controls.filter(c => c.status === 'FAIL').length;

  return { framework, controls, passCount, failCount };
}
