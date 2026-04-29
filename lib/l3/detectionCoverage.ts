import { SupabaseClient } from "@supabase/supabase-js";
import { Groq } from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const KEY_TECHNIQUES = [
  { id: 'T1078', name: 'Valid Accounts' },
  { id: 'T1566', name: 'Phishing' },
  { id: 'T1190', name: 'Exploit Public-Facing App' },
  { id: 'T1059', name: 'Command and Scripting Interpreter' },
  { id: 'T1053', name: 'Scheduled Task/Job' },
  { id: 'T1055', name: 'Process Injection' },
  { id: 'T1003', name: 'OS Credential Dumping' },
  { id: 'T1021', name: 'Remote Services' },
  { id: 'T1071', name: 'Application Layer Protocol' },
  { id: 'T1041', name: 'Exfiltration Over C2 Channel' },
  { id: 'T1027', name: 'Obfuscated Files or Information' },
  { id: 'T1083', name: 'File and Directory Discovery' },
  { id: 'T1018', name: 'Remote System Discovery' },
  { id: 'T1562', name: 'Impair Defenses' },
  { id: 'T1070', name: 'Indicator Removal' },
  { id: 'T1037', name: 'Boot or Logon Initialization Scripts' },
  { id: 'T1547', name: 'Boot or Logon Autostart Execution' },
  { id: 'T1210', name: 'Exploitation of Remote Services' },
  { id: 'T1574', name: 'Hijack Execution Flow' },
  { id: 'T1543', name: 'Create or Modify System Process' }
];

export async function analyzeCoverage(supabase: SupabaseClient, orgId: string) {
  try {
    const [{ data: rules }, { data: alerts }] = await Promise.all([
      supabase.from("detection_rules").select("mitre_technique").eq("organization_id", orgId).eq("is_active", true),
      supabase.from("alerts").select("mitre_techniques").eq("org_id", orgId).gte("created_at", new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())
    ]);

    const coveredFromRules = new Set(rules?.map(r => r.mitre_technique).flat().filter(Boolean));
    const coveredFromAlerts = new Set(alerts?.map(a => a.mitre_techniques).flat().filter(Boolean));
    
    const covered = Array.from(new Set([...Array.from(coveredFromRules), ...Array.from(coveredFromAlerts)]));
    
    const gaps = KEY_TECHNIQUES.filter(t => !covered.includes(t.id));
    const coveragePercent = Math.round(((KEY_TECHNIQUES.length - gaps.length) / KEY_TECHNIQUES.length) * 100);

    const gapNames = gaps.slice(0, 5).map(g => g.name).join(", ");
    const prompt = `As a Cyber Security Architect, analyze these MITRE ATT&CK gaps for a SOC: ${gapNames}.
    Provide 3 specific detection rule recommendations (title and logic summary) to bridge these gaps.`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
    });

    return {
      covered: KEY_TECHNIQUES.filter(t => covered.includes(t.id)),
      gaps,
      coveragePercent,
      recommendations: chatCompletion.choices[0]?.message?.content || "No recommendations generated."
    };
  } catch (err) {
    console.error("[coverage] Error:", err);
    throw err;
  }
}
