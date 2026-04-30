import { adversaries } from "./adversary-profiles";
import { createClient } from "@supabase/supabase-js";

export interface SimScore {
  adversary_name: string;
  score: number;
  would_detect: string[];
  would_miss: string[];
}

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function scoreAdversarySimulation(orgId: string, adversaryId: string): Promise<SimScore> {
  const adversary = adversaries.find(a => a.id === adversaryId);
  if (!adversary) {
    throw new Error(`Adversary ${adversaryId} not found`);
  }

  const supabase = getAdminClient();
  
  // Get coverage for this org matching the adversary's techniques
  const { data: coverage } = await supabase
    .from("mitre_coverage")
    .select("technique_id")
    .eq("org_id", orgId)
    .gt("coverage_level", 0)
    .in("technique_id", adversary.techniques);

  const coveredIds = new Set(coverage?.map(c => c.technique_id) || []);

  const would_detect: string[] = [];
  const would_miss: string[] = [];

  for (const techId of adversary.techniques) {
    if (coveredIds.has(techId)) {
      would_detect.push(techId);
    } else {
      would_miss.push(techId);
    }
  }

  const score = adversary.techniques.length > 0 
    ? (would_detect.length / adversary.techniques.length) * 100 
    : 0;

  return {
    adversary_name: adversary.name,
    score,
    would_detect,
    would_miss
  };
}
