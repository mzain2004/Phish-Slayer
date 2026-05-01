import { supabaseAdmin } from '@/lib/supabase/admin';

/**
 * Calculates a composite risk score (0-100) for an organization.
 */
export async function calculateOrgRiskScore(orgId: string): Promise<number> {
    console.log(`[RiskScore] Calculating risk score for Org ${orgId}`);
    
    let riskScore = 0;

    try {
        // 1. Open Alerts (CRITICAL * 5, HIGH * 3)
        const { data: alerts } = await supabaseAdmin
            .from('alerts')
            .select('severity')
            .eq('org_id', orgId)
            .eq('status', 'open');

        if (alerts) {
            alerts.forEach(a => {
                if (a.severity === 'CRITICAL') riskScore += 5;
                if (a.severity === 'HIGH') riskScore += 3;
            });
        }

        // 2. Unpatched KEV CVEs (* 10)
        const { data: vulns } = await supabaseAdmin
            .from('vuln_tracking')
            .select('id')
            .eq('organization_id', orgId)
            .eq('is_kev', true)
            .eq('status', 'open');
        
        if (vulns) riskScore += vulns.length * 10;

        // 3. MTTR > 24h (+15)
        const { data: mttr } = await supabaseAdmin.rpc('calculate_org_mttr', {
            p_org_id: orgId,
            p_interval: '30 days'
        });
        if (mttr > 86400) riskScore += 15;

        // 4. MITRE Coverage < 30% (+20)
        // Note: This logic depends on our coverage engine. 
        // We'll check the summary in organizations if available.
        const { data: org } = await supabaseAdmin
            .from('organizations')
            .select('mitre_coverage_score')
            .eq('id', orgId)
            .single();
        
        if (org?.mitre_coverage_score?.overall_percentage < 30) riskScore += 20;

        // 5. SLA Breaches last 7d (* 8)
        const { data: breaches } = await supabaseAdmin
            .from('regulatory_deadlines')
            .select('id')
            .eq('org_id', orgId)
            .eq('status', 'breached')
            .gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString());
        
        if (breaches) riskScore += breaches.length * 8;

        // Cap at 100
        const finalScore = Math.min(100, riskScore);

        // Determine Risk Level
        let riskLevel = 'LOW';
        if (finalScore >= 80) riskLevel = 'CRITICAL';
        else if (finalScore >= 60) riskLevel = 'HIGH';
        else if (finalScore >= 40) riskLevel = 'MEDIUM';

        // Update Organization
        await supabaseAdmin
            .from('organizations')
            .update({
                org_risk_score: finalScore,
                risk_score: finalScore, // Support both column names for now
                risk_level: riskLevel,
                last_metrics_update: new Date().toISOString()
            })
            .eq('id', orgId);

        return finalScore;

    } catch (error) {
        console.error(`[RiskScore] Error:`, error);
        return 0;
    }
}
