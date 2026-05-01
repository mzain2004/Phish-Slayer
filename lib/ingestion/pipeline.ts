import { SupabaseClient } from "@supabase/supabase-js";
import { UDMEvent } from "./udm";
import { v4 as uuidv4 } from "uuid";
import { parseEvent, detectFormat } from "./parsers";
import { runQualityChecks } from "./data-quality";
import { updateConnectorHealth } from "./connector-health";
import { orchestrateEnrichment } from "../agents/enrichment/enrichment-orchestrator";
import { calculateSeverity } from "../agents/l1/severity-scorer";
import { deduplicateAlert as deduplicateAlertEngine, fingerprintAlert } from "../agents/l1/correlator";
import { matchWatchlist } from "../agents/l1/watchlist-matcher";
import { checkQuota, incrementUsage } from "../quotas/enforcer";
import { deliverWebhook } from "../webhooks/delivery";

export class IngestionPipeline {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  public async ingestEvent(
    raw: string | Buffer,
    connectorId: string,
    orgId: string,
    format?: string
  ): Promise<UDMEvent> {
    // 0. Quota Check
    const quota = await checkQuota(orgId, 'alerts_per_day');
    if (!quota.allowed) {
      throw new Error(`quota_exceeded:${quota.limit}`);
    }

    const rawStr = typeof raw === 'string' ? raw : raw.toString('utf-8');
    const autoFormat = format && format !== 'unknown' ? format : detectFormat(rawStr);
    
    const partialUdm = parseEvent(rawStr, autoFormat, connectorId);

    const event: UDMEvent = {
      ...partialUdm,
      id: uuidv4(),
      org_id: orgId,
      connector_id: connectorId,
      data_source_type: autoFormat,
      ingested_at: new Date().toISOString(),
      clock_skew_ms: 0,
      timestamp_utc: partialUdm.timestamp_utc || new Date().toISOString(),
      raw_log: rawStr,
      event_type: partialUdm.event_type || 'log',
      normalization_version: partialUdm.normalization_version || '1.0',
    };

    // 4. Data Quality
    const qResult = runQualityChecks(event);
    event.is_duplicate = qResult.is_duplicate;
    event.is_stale = qResult.is_stale;
    
    // 5. Store to UDM
    const { error: insertError } = await this.supabase.from("udm_events").insert(event);
    if (insertError) {
      console.error("[pipeline] Failed to insert UDM event", insertError);
    }

    // 5.1 Increment Usage
    await incrementUsage(orgId, 'alerts_per_day');

    // 6. Update Connector Health
    await updateConnectorHealth(connectorId, orgId);

    // 7. If Duplicate, skip agent processing
    if (qResult.is_duplicate) {
      console.info(`[pipeline] Duplicate event detected. Skipping agent pipeline.`);
      return event;
    }

    // 8. If Alert -> pass to L1
    if (event.event_type === 'alert') {
      this.triggerL1Pipeline(event).catch(e => {
        console.error("[pipeline] Failed to trigger L1 pipeline", e);
      });
    }

    return event;
  }

  public async ingestBatch(
    entries: Array<{raw: string, format?: string}>,
    connectorId: string,
    orgId: string
  ): Promise<{processed: number, duplicates: number, errors: number}> {
    
    const maxConcurrent = 100;
    let processed = 0;
    let duplicates = 0;
    let errors = 0;

    for (let i = 0; i < entries.length; i += maxConcurrent) {
      const chunk = entries.slice(i, i + maxConcurrent);
      const results = await Promise.allSettled(chunk.map(e => 
        this.ingestEvent(e.raw, connectorId, orgId, e.format)
      ));

      results.forEach(res => {
        if (res.status === 'fulfilled') {
          processed++;
          if (res.value.is_duplicate) duplicates++;
        } else {
          errors++;
          console.error("[pipeline] Error ingesting batch event:", res.reason);
        }
      });
    }

    return { processed, duplicates, errors };
  }

  private async triggerL1Pipeline(udmEvent: UDMEvent) {
    const rawAlertObj = {
      id: udmEvent.id,
      source: udmEvent.data_source_type,
      severity: udmEvent.alert_severity_raw || "INFO",
      rule_level: udmEvent.alert_severity_score ? Math.floor(udmEvent.alert_severity_score / 6.25) : 0,
      payload: typeof udmEvent.raw_log === 'string' ? JSON.parse(udmEvent.raw_log).data || JSON.parse(udmEvent.raw_log) : udmEvent.raw_log
    };

    // 1. Enrich
    const enrichedAlert = await orchestrateEnrichment(rawAlertObj as any, udmEvent.org_id);
    
    // 2. Deduplicate
    const { isDuplicate, clusterId } = await deduplicateAlertEngine(enrichedAlert, udmEvent.org_id);
    
    if (isDuplicate) {
      console.info(`[pipeline] Alert ${udmEvent.id} deduplicated into cluster ${clusterId}`);
      return;
    }

    // 3. Severity & Watchlist
    const severityResult = calculateSeverity(enrichedAlert);
    const watchlistResult = await matchWatchlist(enrichedAlert, udmEvent.org_id);

    if (watchlistResult.matched) {
      severityResult.label = 'CRITICAL';
      severityResult.score = 100;
      severityResult.breakdown['Watchlist Match'] = 100;
    }

    // 4. Save to DB
    const alert = {
      id: udmEvent.id,
      org_id: udmEvent.org_id,
      source: udmEvent.data_source_type,
      status: 'open',
      severity: severityResult.label,
      rule_level: rawAlertObj.rule_level,
      payload: rawAlertObj.payload,
      enrichment: enrichedAlert.enrichment,
      fingerprint: fingerprintAlert(enrichedAlert),
      cluster_id: clusterId || udmEvent.id,
      queue_priority: severityResult.score,
      created_at: new Date().toISOString()
    };
    await this.supabase.from('alerts').insert(alert);

    if (alert.severity === 'CRITICAL') {
      void deliverWebhook(udmEvent.org_id, 'alert.created', alert);
    }
  }

  public async ingestEmail(): Promise<number> {
    // Left empty here for brevity or could re-implement
    return 0;
  }
}
