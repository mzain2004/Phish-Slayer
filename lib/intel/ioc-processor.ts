import { supabaseAdmin } from '@/lib/supabase/admin';

export type IOCType = 'ip' | 'domain' | 'url' | 'hash_md5' | 'hash_sha256' | 'email' | 'cve';

export function normalizeIOC(type: IOCType, value: string): string | null {
    if (!value) return null;
    let normalized = value.trim();

    switch (type) {
        case 'ip':
            // Basic IP normalization (lowercase, trim, strip leading zeros)
            normalized = normalized.toLowerCase();
            if (/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(normalized)) {
                normalized = normalized.split('.').map(part => parseInt(part, 10).toString()).join('.');
            } else if (!normalized.includes(':')) {
                return null;
            }
            break;
        case 'domain':
            normalized = normalized.toLowerCase();
            if (normalized.endsWith('.')) normalized = normalized.slice(0, -1);
            if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(normalized)) return null;
            break;
        case 'url':
            try {
                const url = new URL(normalized);
                normalized = url.toString();
            } catch {
                return null;
            }
            break;
        case 'hash_md5':
            normalized = normalized.toLowerCase();
            if (!/^[a-f0-9]{32}$/.test(normalized)) return null;
            break;
        case 'hash_sha256':
            normalized = normalized.toLowerCase();
            if (!/^[a-f0-9]{64}$/.test(normalized)) return null;
            break;
        case 'email':
            normalized = normalized.toLowerCase();
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) return null;
            break;
        case 'cve':
            normalized = normalized.toUpperCase();
            if (!/^CVE-\d{4}-\d{4,}$/.test(normalized)) return null;
            break;
    }

    return normalized;
}

export async function deduplicateIOC(ioc: {
    ioc_type: IOCType;
    ioc_value: string;
    threat_score?: number;
    confidence?: number;
    tags?: string[];
    malware_families?: string[];
    source: string;
}) {
    const normalizedValue = normalizeIOC(ioc.ioc_type, ioc.ioc_value);
    if (!normalizedValue) return null;

    // Check if exists
    const { data: existing } = await supabaseAdmin
        .from('threat_iocs')
        .select('*')
        .eq('ioc_type', ioc.ioc_type)
        .eq('ioc_value', normalizedValue)
        .single();

    if (existing) {
        // Boost confidence by 0.05 (max 1.0)
        const newConfidence = Math.min(1.0, (existing.confidence || 0.5) + 0.05);
        const newTags = Array.from(new Set([...(existing.tags || []), ...(ioc.tags || [])]));
        const newFamilies = Array.from(new Set([...(existing.malware_families || []), ...(ioc.malware_families || [])]));
        const newSources = Array.from(new Set([...(existing.sources || []), ioc.source]));

        const { data, error } = await supabaseAdmin
            .from('threat_iocs')
            .update({
                confidence: newConfidence,
                tags: newTags,
                malware_families: newFamilies,
                sources: newSources,
                last_seen: new Date().toISOString(),
                is_active: true // Reactivate if it was decayed
            })
            .eq('id', existing.id)
            .select()
            .single();
        
        return { action: 'updated', data, error };
    } else {
        // Insert new
        const { data, error } = await supabaseAdmin
            .from('threat_iocs')
            .insert({
                ioc_type: ioc.ioc_type,
                ioc_value: normalizedValue,
                threat_score: ioc.threat_score || 50,
                confidence: ioc.confidence || 0.5,
                tags: ioc.tags || [],
                malware_families: ioc.malware_families || [],
                sources: [ioc.source],
                is_active: true
            })
            .select()
            .single();
        
        return { action: 'created', data, error };
    }
}
