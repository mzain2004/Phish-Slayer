import { createClient } from "@supabase/supabase-js";
import { ruleBasedTag } from "./auto-tagger";
import { llmTagger } from "./llm-tagger";
import { getTechniqueById } from "./attack-data";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function tagAlert(alert: any, orgId: string): Promise<string[]> {
  try {
    const supabase = getAdminClient();

    // 1. Try rule-based
    let tags = ruleBasedTag({
      rule_name: alert.rule_name || alert.title,
      event_category: alert.event_category || alert.alert_type,
      process_name: alert.payload?.process_name
    }).map(t => t.id);

    // 2. If empty, try LLM
    if (tags.length === 0) {
      tags = await llmTagger(alert);
    }

    // 3. Deduplicate
    tags = Array.from(new Set(tags));

    if (tags.length === 0) return [];

    // 4. Update alerts table mitre_tags column
    if (alert.id) {
      await supabase.from('alerts')
        .update({ mitre_tags: tags })
        .eq('id', alert.id)
        .eq('org_id', orgId);
    }

    // 5. Update mitre_coverage table
    for (const tag of tags) {
      const technique = getTechniqueById(tag);
      if (!technique) continue;

      const tacticId = technique.tactic_id || 'UNKNOWN';

      // Check if coverage exists
      const { data: existing } = await supabase.from('mitre_coverage')
        .select('id, detection_count')
        .eq('org_id', orgId)
        .eq('technique_id', tag)
        .maybeSingle();

      if (existing) {
        await supabase.from('mitre_coverage')
          .update({
            detection_count: (existing.detection_count || 0) + 1,
            last_detected_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);
      } else {
        await supabase.from('mitre_coverage')
          .insert({
            org_id: orgId,
            technique_id: tag,
            tactic_id: tacticId,
            coverage_level: 2, // 2=good(alert)
            last_detected_at: new Date().toISOString(),
            detection_count: 1
          });
      }
    }

    return tags;
  } catch (e) {
    console.error("[TagAlert] Failed to tag alert:", e);
    return [];
  }
}
