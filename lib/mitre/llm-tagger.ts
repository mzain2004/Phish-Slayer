import { Groq } from "groq-sdk";
import { techniques, getTechniqueById } from "./attack-data";

let groqClient: Groq | null = null;

function getGroq(): Groq {
  if (!groqClient) {
    groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY || '' });
  }
  return groqClient;
}

function sanitizeForLLM(input: string): string {
  return input
    .replace(/ignore\s+previous\s+instructions?/gi, '[REDACTED]')
    .replace(/system\s*:/gi, '[REDACTED]')
    .replace(/<\|.*?\|>/g, '[REDACTED]')
    .replace(/\[INST\]|\[\/INST\]/g, '[REDACTED]')
    .slice(0, 2000)  // max 2000 chars into any LLM prompt
}

export async function llmTagger(alert: any): Promise<string[]> {
  try {
    // Generate a mini catalog for the LLM to pick from
    const catalogStr = techniques.map(t => `${t.id}: ${t.name}`).join("\n");

    const alertName = sanitizeForLLM(alert.rule_name || alert.title || 'Unknown');
    const category = sanitizeForLLM(alert.event_category || 'Unknown');
    const details = sanitizeForLLM(JSON.stringify(alert.payload || alert.raw_log || {}));

    const prompt = `You are a MITRE ATT&CK expert. Map the following alert to the most appropriate technique IDs.
    
    Alert Name: ${alertName}
    Category: ${category}
    Details: ${details}

    Allowed Techniques Catalog:
    ${catalogStr}
    
    Return ONLY the technique IDs separated by commas. Example: T1566, T1059.001. Do not explain.`;

    const chatCompletion = await getGroq().chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      temperature: 0.1
    });

    const responseText = chatCompletion.choices[0]?.message?.content || "";
    
    // Extract T-codes using regex
    const matches = responseText.match(/T\d{4}(?:\.\d{3})?/g) || [];
    
    // Validate against catalog
    const validIds = new Set<string>();
    for (const id of matches) {
      if (getTechniqueById(id)) validIds.add(id);
    }
    
    return Array.from(validIds);
  } catch (err) {
    console.error("[LLMTagger] Error communicating with Groq:", err);
    return []; // Never crash, just return empty
  }
}
