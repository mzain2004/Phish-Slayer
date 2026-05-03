import { createClient } from '@supabase/supabase-js';
import { LLMResponse } from './types';

let groq: any = null;
let providerFailures: Record<string, number> = { groq: 0, openai: 0, anthropic: 0, ollama: 0 };
let circuitBreakerTripTime: Record<string, number | null> = { groq: null, openai: null, anthropic: null, ollama: null };

async function getGroq() {
  if (!groq) {
    const { default: Groq } = await import('groq-sdk');
    groq = new Groq({ apiKey: process.env.GROQ_API_KEY || '' });
  }
  return groq;
}

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function getProviderHealth(): Promise<Record<string, boolean>> {
  const now = Date.now();
  const health: Record<string, boolean> = {};
  
  for (const provider of ['groq', 'openai', 'anthropic', 'ollama']) {
    if (circuitBreakerTripTime[provider]) {
      // 60s cooldown
      if (now - circuitBreakerTripTime[provider]! > 60000) {
        providerFailures[provider] = 0;
        circuitBreakerTripTime[provider] = null;
        health[provider] = true;
      } else {
        health[provider] = false;
      }
    } else {
      health[provider] = providerFailures[provider] < 3;
    }
  }
  return health;
}

async function logProviderStatus(provider: string, status: string) {
  const supabase = getAdminClient();
  await supabase.from('llm_provider_health').upsert({
    id: provider,
    provider,
    status,
    last_check: new Date().toISOString(),
    failure_count: providerFailures[provider]
  }, { onConflict: 'provider' });
}

export async function callLLM(prompt: string, systemPrompt: string, options: any = {}): Promise<LLMResponse> {
  const health = await getProviderHealth();
  const start = Date.now();

  // Try Groq first if healthy
  if (health['groq']) {
    try {
      const client = await getGroq();
      const response = await client.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        model: options.model || 'llama-3.3-70b-versatile',
      });
      
      const content = response.choices[0]?.message?.content || '';
      // estimate tokens
      const tokens_used = response.usage?.total_tokens || Math.ceil((prompt.length + content.length) / 4);

      providerFailures['groq'] = 0;
      
      return {
        content,
        tokens_used,
        model: options.model || 'llama-3.3-70b-versatile',
        provider: 'groq',
        latency_ms: Date.now() - start
      };
    } catch (err: any) {
      console.error('[GROQ ERROR]', err.message, err.status);
      providerFailures['groq']++;
      if (providerFailures['groq'] >= 3) {
        circuitBreakerTripTime['groq'] = Date.now();
        await logProviderStatus('groq', 'down');
      }
      console.warn(`[LLMClient] Groq failed, falling back. Errors: ${providerFailures['groq']}`);
    }
  }

  // Fallback to Ollama or throw if all down
  throw new Error("All LLM providers down or exhausted.");
}
