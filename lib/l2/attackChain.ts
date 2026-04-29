import { SupabaseClient } from "@supabase/supabase-js";
import { Groq } from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function reconstructChain(supabase: SupabaseClient, incidentId: string, orgId: string) {
  try {
    // 1. Pull related alerts
    const { data: alerts } = await supabase
      .from("alerts")
      .select("*")
      .eq("org_id", orgId)
      // Logic to find alerts by incident_id or similar tags
      .order("created_at", { ascending: true });

    if (!alerts || alerts.length === 0) return { phases: [], narrative: "No alerts found for this incident." };

    // 2. Map to MITRE phases (Simplified mapping)
    const phases = alerts.map(a => ({
      timestamp: a.created_at,
      title: a.title,
      phase: a.mitre_tactic || "Unknown",
      severity: a.severity_level
    }));

    // 3. Groq Narrative
    const prompt = `You are a Lead Incident Responder. Reconstruct the attack narrative for this sequence of alerts:
    ${JSON.stringify(phases)}
    
    Describe how the attacker likely gained entry, what they did next, and their ultimate objective. Be technical and concise.`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
    });

    return {
      phases,
      narrative: chatCompletion.choices[0]?.message?.content || "Failed to generate narrative.",
      killChainCoverage: Array.from(new Set(phases.map(p => p.phase)))
    };
  } catch (err) {
    console.error("[attackChain] Error:", err);
    throw err;
  }
}
