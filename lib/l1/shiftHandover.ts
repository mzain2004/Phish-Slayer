import { SupabaseClient } from "@supabase/supabase-js";
import { Groq } from "groq-sdk";

let groqClient: Groq | null = null;
function getGroq(): Groq {
  if (!groqClient) {
    groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return groqClient;
}

export async function generateHandoverReport(supabase: SupabaseClient, orgId: string, analystId: string) {
  try {
    // 1. Pull Data
    const [{ data: openAlerts }, { data: criticalCases }, { data: newIntel }] = await Promise.all([
      supabase.from("alerts").select("*").eq("org_id", orgId).eq("status", "open").limit(50),
      supabase.from("cases").select("*").eq("organization_id", orgId).neq("status", "closed").eq("severity", "p1").limit(10),
      supabase.from("fp_fingerprints").select("*").eq("organization_id", orgId).gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    ]);

    const summaryData = {
      open_alerts_count: openAlerts?.length || 0,
      critical_cases: (criticalCases || []).map(c => ({ id: c.id, title: c.title })),
      new_iocs: newIntel?.length || 0
    };

    // 2. Groq Narrative
    const prompt = `You are a Senior SOC Analyst. Write a professional shift handover report based on this data:
    - Open Alerts: ${summaryData.open_alerts_count}
    - Critical Cases: ${JSON.stringify(summaryData.critical_cases.map(c => c.title))}
    - New False Positive Fingerprints Added: ${summaryData.new_iocs}
    
    Provide a concise summary of critical open items, analyst assignments, and recommended next actions for the next shift. Use a professional, monospaced-friendly format.`;

    const chatCompletion = await getGroq().chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
    });

    const narrative = chatCompletion.choices[0]?.message?.content || "No narrative generated.";

    // 3. Save to DB
    const { data: report, error } = await supabase
      .from("shift_handovers")
      .insert({
        organization_id: orgId,
        created_by: analystId,
        shift_end: new Date().toISOString(),
        open_alerts_count: summaryData.open_alerts_count,
        critical_cases: summaryData.critical_cases,
        groq_narrative: narrative,
        raw_data: summaryData
      })
      .select()
      .single();

    if (error) throw error;
    return report;
  } catch (err) {
    console.error("[handover] Error:", err);
    throw err;
  }
}
