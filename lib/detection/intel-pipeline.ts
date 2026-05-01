import { supabaseAdmin } from '@/lib/supabase/admin';
import { generateSigmaRule } from './sigma-generator';
import YAML from 'yaml';
import { notify } from '@/lib/notifications/dispatcher';

export interface ThreatIOC {
    id: string;
    ioc_type: string;
    ioc_value: string;
    threat_score: number;
    tags: string[];
    malware_families: string[];
}

export async function generateDetectionFromIOC(ioc: ThreatIOC, orgId: string): Promise<any | null> {
    console.log(`[IntelPipeline] Processing IOC for detection generation: ${ioc.ioc_value}`);

    // 1. Only process specific types with high threat score
    if (ioc.threat_score < 80 || !['domain', 'hash_sha256', 'ip'].includes(ioc.ioc_type)) {
        return null;
    }

    // 2. Check if rule already exists for this IOC
    const { data: existingRules } = await supabaseAdmin
        .from('detection_rules')
        .select('id')
        .eq('organization_id', orgId)
        .ilike('sigma_yaml', `%${ioc.ioc_value}%`)
        .limit(1);

    if (existingRules && existingRules.length > 0) {
        console.log(`[IntelPipeline] Rule already exists for ${ioc.ioc_value}`);
        return null;
    }

    // 3. Generate Sigma rule via LLM
    const huntFinding = `Threat Intelligence IOC match: ${ioc.ioc_type} = ${ioc.ioc_value}`;
    const logSample = `Context: Tags: ${ioc.tags?.join(', ')}. Malware: ${ioc.malware_families?.join(', ')}.`;
    
    const rawSigmaYaml = await generateSigmaRule(huntFinding, logSample);
    if (!rawSigmaYaml) return null;

    // 4. Validate YAML
    try {
        const parsed = YAML.parse(rawSigmaYaml);
        const requiredFields = ['title', 'detection', 'logsource'];
        const missing = requiredFields.filter(field => parsed[field] === undefined);
        if (missing.length > 0) {
            console.error(`[IntelPipeline] Missing required fields in generated YAML: ${missing.join(', ')}`);
            return null;
        }

        // 5. Insert to detection_rules
        const ruleName = `TI: ${ioc.ioc_value} (${ioc.malware_families?.[0] || 'Unknown Malware'})`;
        const { data: rule, error } = await supabaseAdmin.from('detection_rules').insert({
            organization_id: orgId,
            name: ruleName,
            type: 'sigma',
            rule_content: rawSigmaYaml, // Store YAML here as well for fallback or use dedicated column
            sigma_yaml: rawSigmaYaml,
            parsed_rule: parsed,
            status: 'staging', // needs review
            severity: ioc.threat_score > 90 ? 'critical' : 'high',
            created_by: 'threat_intel_auto'
        }).select().single();

        if (error) throw error;
        return rule;

    } catch (e) {
        console.error(`[IntelPipeline] YAML validation failed:`, e);
        return null;
    }
}

export async function runIntelPipeline(orgId: string): Promise<void> {
    console.log(`[IntelPipeline] Running pipeline for Org ${orgId}`);

    try {
        // 1. Fetch top 10 new IOCs (last 24h, threat_score > 80)
        const { data: newIocs } = await supabaseAdmin
            .from('threat_iocs')
            .select('*')
            .gte('first_seen', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
            .gt('threat_score', 80)
            .in('ioc_type', ['domain', 'hash_sha256', 'ip'])
            .order('threat_score', { ascending: false })
            .limit(10);

        if (!newIocs || newIocs.length === 0) return;

        let generatedCount = 0;

        // 2. Generate detections
        for (const ioc of newIocs) {
            const rule = await generateDetectionFromIOC(ioc, orgId);
            if (rule) generatedCount++;
        }

        // 3 & 4. Log and Notify
        if (generatedCount > 0) {
            console.log(`[IntelPipeline] ${generatedCount} new detection rules generated from threat intel.`);
            void notify(orgId, {
                severity: 'info',
                event_type: 'new_detection_rules',
                message: `${generatedCount} new TI-based detection rules generated and ready for review in staging.`
            });
        }
    } catch (error) {
        console.error('[IntelPipeline] Pipeline execution failed:', error);
    }
}
