import { SupabaseClient } from "@supabase/supabase-js";

export interface RiskFactor {
  name: string;
  points: number;
  description: string;
}

export async function calculateOrgRisk(supabase: SupabaseClient, orgId: string) {
  try {
    const factors: RiskFactor[] = [];
    
    // 1. Open Critical Alerts (25pts each, max 40)
    const { count: criticalAlerts } = await supabase
      .from("alerts")
      .select("*", { count: 'exact', head: true })
      .eq("org_id", orgId)
      .eq("status", "open")
      .gte("severity_level", 13);
    
    const alertPoints = Math.min(40, (criticalAlerts || 0) * 25);
    if (alertPoints > 0) factors.push({ 
      name: 'Critical Alerts', 
      points: alertPoints, 
      description: `${criticalAlerts} unhandled critical threats` 
    });

    // 2. Unresolved Credential Leaks (15pts each, max 30)
    const { count: leaks } = await supabase
      .from("credential_leaks")
      .select("*", { count: 'exact', head: true })
      .eq("organization_id", orgId)
      .eq("status", "new");
    
    const leakPoints = Math.min(30, (leaks || 0) * 15);
    if (leakPoints > 0) factors.push({ 
      name: 'Credential Leaks', 
      points: leakPoints, 
      description: `${leaks} leaked accounts detected` 
    });

    // 3. High-risk Users (UBA score > 80) (10pts each, max 20)
    const { count: highRiskUsers } = await supabase
      .from("user_risk_profiles")
      .select("*", { count: 'exact', head: true })
      .eq("organization_id", orgId)
      .gte("risk_score", 80);
      
    const userPoints = Math.min(20, (highRiskUsers || 0) * 10);
    if (userPoints > 0) factors.push({ 
      name: 'High-risk Users', 
      points: userPoints, 
      description: `${highRiskUsers} users with anomalous behavior` 
    });

    // 4. Critical Open CVEs (5pts each, max 20)
    const { count: vulnerabilities } = await supabase
      .from("vulnerabilities")
      .select("*", { count: 'exact', head: true })
      .eq("organization_id", orgId)
      .eq("severity", "critical")
      .eq("status", "open");

    const vulnPoints = Math.min(20, (vulnerabilities || 0) * 5);
    if (vulnPoints > 0) factors.push({ 
      name: 'Critical Vulnerabilities', 
      points: vulnPoints, 
      description: `${vulnerabilities} critical CVEs unpatched` 
    });

    const totalScore = Math.min(100, alertPoints + leakPoints + userPoints + vulnPoints);
    let level = 'LOW';
    if (totalScore > 75) level = 'CRITICAL';
    else if (totalScore > 50) level = 'HIGH';
    else if (totalScore > 25) level = 'MEDIUM';

    // Update organization
    await supabase
      .from("organizations")
      .update({
        risk_score: totalScore,
        risk_level: level,
        risk_updated_at: new Date().toISOString()
      })
      .eq("id", orgId);

    return { score: totalScore, level, factors };
  } catch (err) {
    console.error("[riskScore] Error:", err);
    throw err;
  }
}
