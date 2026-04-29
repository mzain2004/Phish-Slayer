import { SupabaseClient } from "@supabase/supabase-js";
import { RawLogEntry, LogIngestionStats, RawAlert } from "../soc/types";
import { autoDetectAndNormalize } from "./normalizer";
import { v4 as uuidv4 } from "uuid";
import Imap from "node-imap";
import { simpleParser } from "mailparser";
import { AutonomousOrchestrator } from "../soc/orchestrator";

export class IngestionPipeline {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  public async ingestLog(
    raw_content: string,
    source_type: string,
    organization_id: string,
    source_ip: string | null = null
  ): Promise<RawLogEntry> {
    const normalized = autoDetectAndNormalize(raw_content);
    const id = uuidv4();

    const entry: RawLogEntry = {
      id,
      source_type: source_type as any,
      source_ip,
      raw_content,
      parsed_fields: normalized,
      ingested_at: new Date(),
      normalized,
      organization_id
    };

    // 1. Insert into raw_logs
    await this.supabase.from("raw_logs").insert({
      id: entry.id,
      organization_id: entry.organization_id,
      source_type: entry.source_type,
      source_ip: entry.source_ip,
      raw_content: entry.raw_content,
      parsed_fields: entry.normalized,
      normalized: entry.normalized,
      processed: false,
      alert_created: false
    });

    // 2. High severity detection -> Alert
    if (normalized.severity > 8) {
      const title = `Auto-Alert: ${normalized.action}`;

      // TASK 2: Alert Suppression
      const { checkSuppression } = await import("../l1/suppressionEngine");
      const { suppressed, ruleId } = await checkSuppression(this.supabase, {
        title,
        source_ip: entry.source_ip,
        severity_level: normalized.severity,
        raw_log: normalized,
        org_id: entry.organization_id
      });

      // TASK 3: False Positive Engine
      let isFPDetected = false;
      if (!suppressed) {
        const { checkFalsePositive } = await import("../l1/falsePositiveEngine");
        const { isFP } = await checkFalsePositive(this.supabase, {
          title,
          source_ip: entry.source_ip,
          alert_type: normalized.category,
          raw_log: normalized,
          org_id: entry.organization_id
        });
        isFPDetected = isFP;
      }

      // TASK 5: Watchlist Matcher
      let isWatchlistHit = false;
      let watchlistReason = "";
      if (!suppressed && !isFPDetected) {
        const { matchWatchlist } = await import("../l1/watchlistMatcher");
        const { isMatch, reason } = await matchWatchlist(this.supabase, {
          source_ip: entry.source_ip,
          raw_log: normalized,
          org_id: entry.organization_id
        });
        isWatchlistHit = isMatch;
        watchlistReason = reason || "";
      }

      let finalIsDuplicate = false;
      let finalGroupId = null;
      let finalCount = 1;

      if (!suppressed && !isFPDetected) {
        // TASK 1: Alert Deduplication
        const { deduplicateAlert } = await import("../l1/alertDedup");
        const { isDuplicate, groupId, count } = await deduplicateAlert(this.supabase, {
          title,
          source_ip: entry.source_ip,
          org_id: entry.organization_id
        });
        finalIsDuplicate = isDuplicate;
        finalGroupId = groupId;
        finalCount = isDuplicate ? count : 1;
      }

      const { data: alertData, error: alertError } = await this.supabase.from("alerts").insert({
        org_id: entry.organization_id,
        alert_type: normalized.category,
        severity_level: isWatchlistHit ? Math.min(15, normalized.severity + 3) : normalized.severity,
        source_ip: entry.source_ip,
        raw_log: normalized,
        status: isFPDetected ? "closed" : "open",
        title: isWatchlistHit ? `[WATCHLIST HIT] ${title}` : title,
        dedup_group_id: finalGroupId,
        dedup_count: finalCount,
        is_suppressed: suppressed || finalIsDuplicate || isFPDetected,
        is_false_positive: isFPDetected,
        queue_priority: normalized.severity >= 13 ? 100 : normalized.severity >= 9 ? 75 : 50
      }).select("id, severity_level").single();

      if (!alertError && alertData?.id) {
        // TASK 1: Asset Criticality
        const { getAlertCriticality } = await import("../l1/assetCriticality");
        const elevatedSeverity = await getAlertCriticality(this.supabase, {
          source_ip: entry.source_ip,
          severity_level: alertData.severity_level,
          org_id: entry.organization_id
        });

        // TASK 2: Business Hours
        const { flagOutOfHoursLogin } = await import("../l1/businessHours");
        const isOutOfHours = flagOutOfHoursLogin({ alert_type: normalized.category, title }, 'UTC');

        const updates: any = {};
        if (elevatedSeverity !== alertData.severity_level) {
          updates.severity_level = elevatedSeverity;
          updates.queue_priority = 100; // Force to top
        }
        
        if (isOutOfHours) {
          // Assuming we want to track this in tags or title
          updates.title = `[OUT OF HOURS] ${isWatchlistHit ? `[WATCHLIST HIT] ${title}` : title}`;
        }

        if (Object.keys(updates).length > 0) {
          await this.supabase.from("alerts").update(updates).eq("id", alertData.id);
        }

        // TASK 5: Queue Rebalancing (only if critical)
        if (elevatedSeverity >= 13) {
          const { rebalanceQueue } = await import("../l1/queueRebalancer");
          void rebalanceQueue(this.supabase, entry.organization_id);
        }

        await this.supabase.from("raw_logs").update({
          processed: true,
          alert_created: true
        }).eq("id", entry.id);

        // 3. Trigger Autonomous Orchestrator (Async) - Skip if duplicate, suppressed, or FP
        if (!finalIsDuplicate && !suppressed && !isFPDetected) {
          const orchestrator = new AutonomousOrchestrator(this.supabase);
          void orchestrator.processAlert(alertData.id, entry.organization_id);
        }
      }
    }
    return entry;
  }

  public async ingestBatch(entries: any[], organization_id: string): Promise<LogIngestionStats> {
    const startTime = Date.now();
    let totalParsed = 0;
    let totalFailed = 0;
    const sourcesBreakdown: Record<string, number> = {};

    const results = await Promise.allSettled(entries.map(e => 
      this.ingestLog(e.raw_content, e.source_type, organization_id, e.source_ip)
    ));

    results.forEach((res, i) => {
      const type = entries[i].source_type;
      sourcesBreakdown[type] = (sourcesBreakdown[type] || 0) + 1;
      if (res.status === "fulfilled") totalParsed++;
      else totalFailed++;
    });

    return {
      total_received: entries.length,
      total_parsed: totalParsed,
      total_failed: totalFailed,
      sources_breakdown: sourcesBreakdown,
      avg_parse_time_ms: (Date.now() - startTime) / (entries.length || 1),
      last_ingested_at: new Date()
    };
  }

  public async ingestEmail(): Promise<number> {
    const config: any = {
      user: process.env.IMAP_USER,
      password: process.env.IMAP_PASSWORD,
      host: process.env.IMAP_HOST,
      port: parseInt(process.env.IMAP_PORT || "993"),
      tls: (process.env.IMAP_PORT || "993") === "993"
    };

    if (!config.user || !config.password || !config.host) {
      console.warn("[ingestion] IMAP not configured — skipping");
      return 0;
    }

    return new Promise((resolve) => {
      const imap = new Imap(config);
      let count = 0;

      imap.once("ready", () => {
        imap.openBox("INBOX", false, (err) => {
          if (err) { resolve(0); return; }
          imap.search(["UNSEEN"], (err, results) => {
            if (err || !results.length) { imap.end(); resolve(0); return; }
            
            const f = imap.fetch(results, { bodies: "" });
            f.on("message", (msg) => {
              msg.on("body", (stream) => {
                simpleParser(stream as any, async (err, parsed) => {
                  if (err) return;
                  const raw_content = `From: ${parsed?.from?.text} Subject: ${parsed?.subject} Body: ${parsed?.text?.slice(0, 500)}`;
                  await this.ingestLog(raw_content, "email", "system");
                  count++;
                });
              });
              msg.once("attributes", (attrs) => {
                imap.addFlags(attrs.uid, ["\\Seen"], () => {});
              });
            });
            f.once("end", () => {
              imap.end();
              resolve(count);
            });
          });
        });
      });

      imap.once("error", (err: any) => {
        console.error("[imap] error:", err);
        resolve(count);
      });

      imap.connect();
    });
  }

  public async getStats(organization_id: string): Promise<LogIngestionStats> {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: logs } = await this.supabase
      .from("raw_logs")
      .select("source_type")
      .eq("organization_id", organization_id)
      .gte("ingested_at", twentyFourHoursAgo);

    const breakdown: Record<string, number> = {};
    logs?.forEach(l => {
      breakdown[l.source_type] = (breakdown[l.source_type] || 0) + 1;
    });

    return {
      total_received: logs?.length || 0,
      total_parsed: logs?.length || 0, // Simplified
      total_failed: 0,
      sources_breakdown: breakdown,
      avg_parse_time_ms: 0,
      last_ingested_at: new Date()
    };
  }
}
