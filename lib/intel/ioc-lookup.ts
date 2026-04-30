import { supabaseAdmin } from '@/lib/supabase/admin';

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const iocCache = new Map<string, { data: any, timestamp: number }>();

export async function lookupIOC(type: string, value: string) {
    const cacheKey = `${type}:${value}`;
    const cached = iocCache.get(cacheKey);

    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
        return cached.data;
    }

    const { data, error } = await supabaseAdmin
        .from('threat_iocs')
        .select('*')
        .eq('ioc_type', type)
        .eq('ioc_value', value)
        .eq('is_active', true)
        .maybeSingle();

    if (error) {
        console.error(`Error looking up IOC ${cacheKey}:`, error);
        return null;
    }

    if (data) {
        iocCache.set(cacheKey, { data, timestamp: Date.now() });
    }

    return data;
}
