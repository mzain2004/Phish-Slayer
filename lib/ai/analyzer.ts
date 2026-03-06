'use server';

import { GoogleGenAI } from '@google/genai';

const getAI = () => new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function analyzeThreat(incidentDescription: string) {
  if (!process.env.GEMINI_API_KEY) {
    console.warn('GEMINI_API_KEY is not set. Skipping AI analysis.');
    return null;
  }

  const ai = getAI();
  
  const prompt = `You are an elite Level 3 SOC Analyst. Analyze this incident description. Return ONLY a valid JSON object with exactly three keys: risk_score (number 1-10), threat_category (string), and remediation_steps (array of 3 strings). No markdown formatting, no conversational text.

Incident Description:
${incidentDescription}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    
    let text = response.text || '';
    
    // Clean up potential markdown formatting that the model might include despite instructions
    if (text.startsWith('```json')) {
      text = text.replace(/^```json/, '').replace(/```$/, '').trim();
    } else if (text.startsWith('```')) {
      text = text.replace(/^```/, '').replace(/```$/, '').trim();
    }
    
    return JSON.parse(text);
  } catch (error) {
    console.error('AI Analysis Error:', error);
    return null;
  }
}

export async function scoreCtiFinding(summary: {
  last_analysis_stats: Record<string, number>;
  reputation: number;
  meaningful_name?: string;
}): Promise<{ risk_score: number; threat_category: string; ai_summary: string } | null> {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }

  const ai = getAI();

  const prompt = `You are an elite Level 3 SOC Analyst. Review this stripped VirusTotal threat data. Return ONLY a valid JSON object with exactly three keys: risk_score (number 1-10), threat_category (string), and ai_summary (a concise, 2-sentence summary of the threat level and reputation). No markdown formatting, no conversational text.

VirusTotal Data:
${JSON.stringify(summary, null, 2)}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    
    let text = response.text || '';
    
    if (text.startsWith('\`\`\`json')) {
      text = text.replace(/^```json/, '').replace(/```$/, '').trim();
    } else if (text.startsWith('\`\`\`')) {
      text = text.replace(/^```/, '').replace(/```$/, '').trim();
    }
    
    return JSON.parse(text);
  } catch (error) {
    console.error('CTI Scoring Error:', error);
    return null;
  }
}
