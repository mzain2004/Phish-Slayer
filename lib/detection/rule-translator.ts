import { groqComplete } from '../ai/groq';

export async function translateSigma(sigmaYaml: string, target: 'splunk' | 'kql' | 'esql'): Promise<string | null> {
    const systemPrompt = `You are a specialist in SIEM query translation.
Convert the provided Sigma YAML rule to ${target.toUpperCase()} query.
Output ONLY the raw query string. Do not include markdown code blocks or explanations.`;

    try {
        const query = await groqComplete(systemPrompt, sigmaYaml);
        return query.replace(/```|```[a-z]+/g, '').trim();
    } catch (error) {
        console.error(`[RuleTranslator] Translation to ${target} failed:`, error);
        return null;
    }
}
