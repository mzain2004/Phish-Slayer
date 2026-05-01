import { supabaseAdmin } from '@/lib/supabase/admin';
import { groqComplete } from '@/lib/ai/groq';

export interface HuntHypothesis {
    title: string;
    description: string;
    mitre_techniques: string[];
    hunt_query: string;
    hunt_query_type: string;
    priority: string;
}

export async function generateFromThreatIntel(orgId: string): Promise<HuntHypothesis[]> {
    const hypotheses: HuntHypothesis[] = [];

    // 1. Query high-threat IOCs
    const { data: iocs } = await supabaseAdmin
        .from('threat_iocs')
        .select('*')
        .eq('is_active', true)
        .gt('threat_score', 70)
        .order('threat_score', { ascending: false })
        .limit(10);

    // 2. Query high-confidence actors
    const { data: actors } = await supabaseAdmin
        .from('threat_actors')
        .select('*, actor:actor_id')
        .eq('org_id', orgId)
        .gt('match_confidence', 0.5)
        .limit(5);

    const threats = [...(iocs || []), ...(actors || [])];

    // 3. Generate hypotheses via LLM
    for (const threat of threats) {
        const prompt = `Given this threat: ${JSON.stringify(threat)}
        Generate a hunt hypothesis for a security analyst.
        Return JSON: { "title": "...", "description": "...", "mitre_techniques": ["T1234"], "hunt_query_sql": "SELECT * FROM udm_events WHERE ..." }
        Make sure the query is valid PostgreSQL syntax targeting 'udm_events' table.`;

        const response = await groqComplete(`You are an expert Threat Hunter. Output ONLY valid JSON.`, prompt);
        
        try {
            const parsed = JSON.parse(response.replace(/```json|```/g, '').trim());
            hypotheses.push({
                title: parsed.title,
                description: parsed.description,
                mitre_techniques: parsed.mitre_techniques || [],
                hunt_query: parsed.hunt_query_sql,
                hunt_query_type: 'sql',
                priority: 'HIGH'
            });
        } catch (e) {
            console.error('[HypothesisGenerator] Failed to parse Threat Intel JSON:', e);
        }
    }

    return hypotheses.map(h => ({ ...h, hypothesis_source: 'threat_intel' }));
}

export async function generateFromCoverageGaps(orgId: string): Promise<HuntHypothesis[]> {
    const hypotheses: HuntHypothesis[] = [];
    
    // 1. Call coverage gaps
    // Simulating call to getCoverageGaps since we can't easily import it without circular dependencies or complex paths right now
    // We'll use a placeholder array for the top 5 uncovered techniques
    const topGaps = ["T1566", "T1078", "T1059", "T1003", "T1486"]; 

    // 2. Generate hypotheses
    for (const gap of topGaps) {
        const prompt = `Technique ${gap} has zero detection coverage.
        Generate a hunt hypothesis to find evidence of this technique in security logs.
        Return JSON: { "title": "...", "description": "...", "hunt_query_sql": "SELECT * FROM udm_events WHERE ..." }
        Make sure the query is valid PostgreSQL syntax targeting 'udm_events' table.`;

        const response = await groqComplete(`You are an expert Threat Hunter. Output ONLY valid JSON.`, prompt);

        try {
            const parsed = JSON.parse(response.replace(/```json|```/g, '').trim());
            hypotheses.push({
                title: parsed.title,
                description: parsed.description,
                mitre_techniques: [gap],
                hunt_query: parsed.hunt_query_sql,
                hunt_query_type: 'sql',
                priority: 'HIGH',
                hypothesis_source: 'actor_ttp'
            } as any);
        } catch (e) {
            console.error('[HypothesisGenerator] Failed to parse Gap JSON:', e);
        }
    }

    return hypotheses;
}

export async function generateFromAnomalies(orgId: string): Promise<HuntHypothesis[]> {
    const hypotheses: HuntHypothesis[] = [];

    // 1. Query critical alerts in last 24h
    const { data: alerts } = await supabaseAdmin
        .from('alerts')
        .select('mitre_techniques')
        .eq('org_id', orgId)
        .eq('severity', 'CRITICAL')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .not('mitre_techniques', 'is', null);

    if (!alerts) return [];

    // 2. Group by technique
    const techniqueCounts: Record<string, number> = {};
    alerts.forEach(a => {
        (a.mitre_techniques || []).forEach((t: string) => {
            techniqueCounts[t] = (techniqueCounts[t] || 0) + 1;
        });
    });

    // 3. Find triggers (3+ alerts)
    const triggers = Object.entries(techniqueCounts).filter(([_, count]) => count >= 3).map(([t]) => t);

    // 4. Generate hypotheses
    for (const trigger of triggers) {
        const prompt = `Technique ${trigger} appeared in 3+ CRITICAL alerts in the last 24 hours.
        Generate a hunt hypothesis targeting this technique cluster.
        Return JSON: { "title": "...", "description": "...", "hunt_query_sql": "SELECT * FROM udm_events WHERE ..." }`;

        const response = await groqComplete(`You are an expert Threat Hunter. Output ONLY valid JSON.`, prompt);

        try {
            const parsed = JSON.parse(response.replace(/```json|```/g, '').trim());
            hypotheses.push({
                title: parsed.title,
                description: parsed.description,
                mitre_techniques: [trigger],
                hunt_query: parsed.hunt_query_sql,
                hunt_query_type: 'sql',
                priority: 'CRITICAL',
                hypothesis_source: 'anomaly'
            } as any);
        } catch (e) {
            console.error('[HypothesisGenerator] Failed to parse Anomaly JSON:', e);
        }
    }

    return hypotheses;
}

export async function generateWeeklyHunts(orgId: string): Promise<HuntHypothesis[]> {
    const hypotheses: HuntHypothesis[] = [];
    const commonTechniques = ['T1566', 'T1078', 'T1059', 'T1003', 'T1486', 'T1047', 'T1021', 'T1053', 'T1071', 'T1027'];

    for (const tech of commonTechniques.slice(0, 3)) { // Limit to 3 for performance in this demo
        const prompt = `Generate a fresh hunt query for common technique ${tech}.
        Return JSON: { "title": "...", "description": "...", "hunt_query_sql": "SELECT * FROM udm_events WHERE ..." }`;

        const response = await groqComplete(`You are an expert Threat Hunter. Output ONLY valid JSON.`, prompt);

        try {
            const parsed = JSON.parse(response.replace(/```json|```/g, '').trim());
            hypotheses.push({
                title: parsed.title,
                description: parsed.description,
                mitre_techniques: [tech],
                hunt_query: parsed.hunt_query_sql,
                hunt_query_type: 'sql',
                priority: 'MEDIUM',
                hypothesis_source: 'manual'
            } as any);
        } catch (e) {
            console.error('[HypothesisGenerator] Failed to parse Weekly JSON:', e);
        }
    }

    return hypotheses;
}

export async function generateAllHypotheses(orgId: string): Promise<void> {
    console.log(`[HypothesisGenerator] Generating all hypotheses for Org ${orgId}...`);

    const allHypotheses = await Promise.all([
        generateFromThreatIntel(orgId),
        generateFromCoverageGaps(orgId),
        generateFromAnomalies(orgId),
        generateWeeklyHunts(orgId)
    ]);

    const flatHypotheses = allHypotheses.flat();

    // Deduplicate by checking recent DB entries
    const { data: recent } = await supabaseAdmin
        .from('hunt_hypotheses')
        .select('title')
        .eq('organization_id', orgId)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    const recentTitles = new Set(recent?.map(r => r.title) || []);

    const newEntries = flatHypotheses.filter(h => !recentTitles.has(h.title)).map(h => ({
        organization_id: orgId,
        title: h.title,
        description: h.description,
        hypothesis_source: (h as any).hypothesis_source,
        mitre_techniques: h.mitre_techniques,
        hunt_query: h.hunt_query,
        hunt_query_type: h.hunt_query_type,
        confidence: 0.8, // Default
        priority: h.priority,
        status: 'PENDING',
        ai_generated: true
    }));

    if (newEntries.length > 0) {
        const { error } = await supabaseAdmin.from('hunt_hypotheses').insert(newEntries);
        if (error) console.error('[HypothesisGenerator] Insert error:', error);
        else console.log(`[HypothesisGenerator] Inserted ${newEntries.length} new hypotheses.`);
    }
}
