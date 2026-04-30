import { THREAT_ACTORS, ActorProfile } from './actor-profiles';

export interface ActorMatch {
    actor: ActorProfile;
    confidence: number;
}

/**
 * Matches a set of techniques against known threat actor profiles using Jaccard Similarity.
 * similarity = (intersection) / (union)
 */
export async function matchActor(orgId: string, techniques: string[]): Promise<ActorMatch[]> {
    if (!techniques || techniques.length === 0) return [];

    const matches: ActorMatch[] = [];
    const targetSet = new Set(techniques.map(t => t.toUpperCase()));

    for (const actor of THREAT_ACTORS) {
        const actorSet = new Set(actor.mitre_techniques.map(t => t.toUpperCase()));
        
        // Calculate Intersection
        const intersection = new Set([...targetSet].filter(x => actorSet.has(x)));
        
        // Calculate Union
        const union = new Set([...targetSet, ...actorSet]);

        const similarity = intersection.size / union.size;

        if (similarity > 0.1) { // 10% threshold for matches
            matches.push({
                actor,
                confidence: parseFloat(similarity.toFixed(2))
            });
        }
    }

    // Sort by confidence descending
    return matches.sort((a, b) => b.confidence - a.confidence);
}
