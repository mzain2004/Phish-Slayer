import { Groq } from "groq-sdk";
import { OsintTarget, CollectorResult, OsintReport } from "./types";

let groq: Groq | null = null;

function getGroq(): Groq {
  if (!groq) {
    groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return groq;
}

export async function generateNarrative(target: OsintTarget, results: CollectorResult[]): Promise<OsintReport> {
  const context = results.filter(r => r.success).map(r => `[${r.collector}] ${JSON.stringify(r.data)}`).join("\n");
  
  const prompt = `You are a Lead OSINT Analyst. Analyze the following data for target "${target.value}" (${target.type}):
  
  ${context}
  
  Provide a detailed report in JSON format with these exact keys:
  - narrative: A one-paragraph technical summary of findings.
  - riskScore: A number from 0-100.
  - keyFindings: An array of up to 5 strings.
  - recommendations: An array of up to 3 strings.
  
  Ensure the response is valid JSON and nothing else.`;

  try {
    const chatCompletion = await getGroq().chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" }
    });

    const content = JSON.parse(chatCompletion.choices[0]?.message?.content || "{}");
    return {
      narrative: content.narrative || "Analysis unavailable",
      riskScore: content.riskScore || 0,
      keyFindings: content.keyFindings || [],
      recommendations: content.recommendations || []
    };
  } catch (err) {
    console.error("[groqNarrator] Error:", err);
    return {
      narrative: "Failed to generate AI narrative due to an error.",
      riskScore: 0,
      keyFindings: [],
      recommendations: []
    };
  }
}
