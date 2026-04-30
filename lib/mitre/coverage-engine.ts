import { createClient } from "@supabase/supabase-js";
import { techniques, tactics } from "./attack-data";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export interface TacticScore {
  tactic_id: string;
  name: string;
  coverage_percent: number;
  covered_count: number;
  total_count: number;
}

export interface CoverageReport {
  overall_score: number;
  tactic_scores: TacticScore[];
  gaps: string[];
}

export interface Gap {
  technique_id: string;
  name: string;
  reason: string;
}

export async function calculateCoverage(orgId: string): Promise<CoverageReport> {
  const supabase = getAdminClient();
  const { data: coverage } = await supabase
    .from("mitre_coverage")
    .select("technique_id, coverage_level")
    .eq("org_id", orgId)
    .gt("coverage_level", 0);

  const coveredIds = new Set(coverage?.map(c => c.technique_id) || []);
  const tacticScores: TacticScore[] = [];
  const gaps: string[] = [];

  let totalCovered = 0;
  const totalTechniques = techniques.length;

  for (const tactic of tactics) {
    const tacticTechniques = techniques.filter(t => t.tactic_id === tactic.id);
    let coveredInTactic = 0;

    for (const tech of tacticTechniques) {
      if (coveredIds.has(tech.id)) {
        coveredInTactic++;
      } else {
        gaps.push(tech.id);
      }
    }

    totalCovered += coveredInTactic;

    tacticScores.push({
      tactic_id: tactic.id,
      name: tactic.name,
      total_count: tacticTechniques.length,
      covered_count: coveredInTactic,
      coverage_percent: tacticTechniques.length > 0 ? (coveredInTactic / tacticTechniques.length) * 100 : 0
    });
  }

  const overallScore = totalTechniques > 0 ? (totalCovered / totalTechniques) * 100 : 0;

  return {
    overall_score: overallScore,
    tactic_scores: tacticScores,
    gaps
  };
}

export async function getCoverageGaps(orgId: string): Promise<Gap[]> {
  const report = await calculateCoverage(orgId);
  const topAttacked = ["T1566", "T1078", "T1059", "T1003", "T1486", "T1047", "T1071", "T1110"];
  const prioritizedGaps: Gap[] = [];

  for (const gapId of report.gaps) {
    const tech = techniques.find(t => t.id === gapId);
    if (!tech) continue;

    let priority = 0;
    let reason = "Gap in coverage";

    if (topAttacked.includes(tech.id)) {
      priority += 100;
      reason = "High frequency attack vector";
      if (tech.detection_difficulty === 'easy') {
        priority += 50;
        reason += " + easy to detect";
      }
    } else if (tech.detection_difficulty === 'easy') {
      priority += 50;
      reason = "Easy to detect";
    }

    prioritizedGaps.push({
      technique_id: tech.id,
      name: tech.name,
      reason
    });
  }

  // Sort by priority (this is implicit based on reason in this simplified version, let's add a weight if needed, 
  // or just sort by the conditions)
  return prioritizedGaps.sort((a, b) => {
    if (a.reason.includes("High frequency") && !b.reason.includes("High frequency")) return -1;
    if (!a.reason.includes("High frequency") && b.reason.includes("High frequency")) return 1;
    if (a.reason.includes("easy") && !b.reason.includes("easy")) return -1;
    if (!a.reason.includes("easy") && b.reason.includes("easy")) return 1;
    return 0;
  });
}
