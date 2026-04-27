import { createClient } from '@/lib/supabase/server';
import { MitreTechnique, getAllTechniques } from './techniques';

export interface TacticCoverage {
  tactic: string;
  totalTechniques: number;
  seenTechniques: number;
  coveragePercent: number;
  techniques: Record<string, number>;
}

export interface MitreCoverage {
  orgId: string;
  tacticCoverage: Record<string, TacticCoverage>;
  totalUniqueTechniques: number;
  mostCommonTechniques: MitreTechnique[];
  lastCalculated: string;
}

export async function calculateOrgCoverage(orgId: string): Promise<MitreCoverage> {
  const supabase = await createClient();
  const allTechs = getAllTechniques();
  
  const { data: tags } = await supabase
    .from('mitre_alert_tags')
    .select('technique_id, tactic')
    .eq('organization_id', orgId);

  const hitMap: Record<string, Record<string, number>> = {};
  const techCounts: Record<string, number> = {};

  (tags || []).forEach(tag => {
    if (!hitMap[tag.tactic]) hitMap[tag.tactic] = {};
    hitMap[tag.tactic][tag.technique_id] = (hitMap[tag.tactic][tag.technique_id] || 0) + 1;
    techCounts[tag.technique_id] = (techCounts[tag.technique_id] || 0) + 1;
  });

  const tacticCoverage: Record<string, TacticCoverage> = {};
  
  // Group all possible techniques by tactic for denominator
  const techsByTactic: Record<string, string[]> = {};
  allTechs.forEach(t => {
    t.tactics.forEach(tactic => {
      if (!techsByTactic[tactic]) techsByTactic[tactic] = [];
      techsByTactic[tactic].push(t.id);
    });
  });

  Object.keys(techsByTactic).forEach(tactic => {
    const total = techsByTactic[tactic].length;
    const seen = Object.keys(hitMap[tactic] || {}).length;
    tacticCoverage[tactic] = {
      tactic,
      totalTechniques: total,
      seenTechniques: seen,
      coveragePercent: (seen / total) * 100,
      techniques: hitMap[tactic] || {}
    };
  });

  const mostCommonIds = Object.entries(techCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(e => e[0]);

  const coverage: MitreCoverage = {
    orgId,
    tacticCoverage,
    totalUniqueTechniques: Object.keys(techCounts).length,
    mostCommonTechniques: mostCommonIds.map(id => allTechs.find(t => t.id === id)!).filter(Boolean),
    lastCalculated: new Date().toISOString()
  };

  await supabase.from('mitre_coverage').upsert({
    organization_id: orgId,
    coverage: coverage as any,
    last_calculated: coverage.lastCalculated,
    total_techniques_seen: coverage.totalUniqueTechniques
  });

  return coverage;
}
