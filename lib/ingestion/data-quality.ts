import { UDMEvent } from './udm';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

export interface QualityResult {
  passed: boolean;
  warnings: string[];
  is_duplicate: boolean;
  is_stale: boolean;
  quality_score: number;
}

const recentHashes = new Set<string>();

export function runQualityChecks(event: UDMEvent): QualityResult {
  const warnings: string[] = [];
  let is_duplicate = false;
  let is_stale = false;
  let quality_score = 100;

  // 1. Clock skew check
  if (event.timestamp_utc && event.ingested_at) {
    const ts = new Date(event.timestamp_utc).getTime();
    const now = new Date(event.ingested_at).getTime();
    const delta = Math.abs(now - ts);
    
    if (delta > 300000) { // 5 mins
      const aheadBehind = now > ts ? 'behind' : 'ahead';
      warnings.push(`CLOCK_SKEW: event is ${delta}ms ${aheadBehind} ingest time`);
      quality_score -= 10;
      
      if (delta > 3600000) { // 1 hour
        is_stale = true;
        warnings.push(`STALE_EVENT`);
        quality_score -= 20;
      }
      
      event.extra = event.extra || {};
      event.extra.original_timestamp = event.timestamp_utc;
      event.timestamp_utc = event.ingested_at;
    }
  }

  // 2. Missing critical fields
  const required = ['org_id', 'data_source_type', 'timestamp_utc', 'raw_log', 'event_type'];
  required.forEach(field => {
    if (!(event as any)[field]) {
      warnings.push(`MISSING_REQUIRED: ${field}`);
      quality_score -= 30;
    }
  });

  if (!event.src_ip && !event.host_name && !event.user_name) {
    warnings.push("NO_ENTITY_IDENTIFIER");
    quality_score -= 25;
  }

  // 3. Duplicate detection
  const dedupStr = `${event.org_id}|${event.timestamp_utc}|${event.src_ip}|${event.alert_rule_id}|${event.raw_log}`;
  const hash = crypto.createHash('sha256').update(dedupStr).digest('hex');
  if (recentHashes.has(hash)) {
    is_duplicate = true;
  } else {
    recentHashes.add(hash);
    setTimeout(() => recentHashes.delete(hash), 60000); // Keep in memory for 60s
  }

  // 4. IP Validation & RFC1918 Tagging
  const validateIp = (ipField: 'src_ip' | 'dst_ip') => {
    const ip = event[ipField];
    if (ip) {
      // Basic IP regex
      const isValid = /^((25[0-5]|(2[0-4]|1\d|[1-9]|)\d)\.?\b){4}$/.test(ip) || /^[a-fA-F0-9:]+$/.test(ip);
      if (!isValid) {
        warnings.push(`INVALID_IP: ${ip}`);
        event[ipField] = undefined;
        quality_score -= 10;
      } else {
        const parts = ip.split('.').map(Number);
        if (parts.length === 4) {
          const isInternal = (parts[0] === 10) || 
                             (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) || 
                             (parts[0] === 192 && parts[1] === 168);
          if (isInternal) {
            event.extra = event.extra || {};
            event.extra[`${ipField}_internal`] = true;
          }
        }
      }
    }
  };
  validateIp('src_ip');
  validateIp('dst_ip');

  // 5. Hash Validation
  const validateHash = (field: 'process_hash_md5' | 'process_hash_sha256' | 'file_hash_md5' | 'file_hash_sha256', len: number) => {
    if (event[field]) {
      if (event[field]!.length !== len || !/^[a-fA-F0-9]+$/.test(event[field]!)) {
        warnings.push(`INVALID_HASH: ${field}`);
        event[field] = undefined;
        quality_score -= 5;
      } else {
        event[field] = event[field]!.toLowerCase();
      }
    }
  };
  validateHash('process_hash_md5', 32);
  validateHash('file_hash_md5', 32);
  validateHash('process_hash_sha256', 64);
  validateHash('file_hash_sha256', 64);

  // 6. Encoding detection (basic JS utf-8 normalization)
  // Replaces invalid sequences automatically inside Buffer -> String conversions, handled at parser

  if (warnings.length > 0) {
    event.normalization_warnings = [...(event.normalization_warnings || []), ...warnings];
  }

  return {
    passed: quality_score > 0,
    warnings,
    is_duplicate,
    is_stale,
    quality_score: Math.max(0, quality_score)
  };
}
