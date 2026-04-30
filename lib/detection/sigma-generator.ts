import { groqComplete } from '../ai/groq';
import YAML from 'yaml';

export async function generateSigmaRule(huntFinding: string, logSample: string): Promise<string | null> {
    const systemPrompt = `You are an expert Detection Engineer. 
Write a Sigma YAML rule for the provided security finding and log sample.
Output ONLY valid YAML. Do not include markdown code blocks or explanations.
The rule must have: title, id, status, description, logsource, detection, and level.`;

    const userPrompt = `HUNT FINDING: ${huntFinding}\n\nLOG SAMPLE: ${logSample}`;

    for (let attempt = 0; attempt < 2; attempt++) {
        try {
            const rawYaml = await groqComplete(systemPrompt, userPrompt);
            const cleanedYaml = rawYaml.replace(/```yaml|```/g, '').trim();
            
            // Validate YAML
            const parsed = YAML.parse(cleanedYaml);
            const requiredFields = ['title', 'id', 'status', 'description', 'logsource', 'detection', 'level'];
            const hasAllFields = requiredFields.every(field => parsed[field] !== undefined);

            if (hasAllFields) {
                return cleanedYaml;
            }
        } catch (error) {
            console.error(`[SigmaGenerator] Attempt ${attempt + 1} failed:`, error);
        }
    }

    return null;
}
