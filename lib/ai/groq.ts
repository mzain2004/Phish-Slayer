let groqClient: any = null;

const DEFAULT_MODEL = "llama-3.3-70b-versatile";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getGroqClient() {
  if (!groqClient) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error("Missing GROQ_API_KEY");
    }
    const { default: Groq } = await import("groq-sdk");
    groqClient = new Groq({ apiKey });
  }

  return groqClient;
}

export function getGroqModel(): string {
  return process.env.GROQ_MODEL ?? DEFAULT_MODEL;
}

export async function groqComplete(
  systemPrompt: string,
  userPrompt: string,
  maxTokens = 1024,
): Promise<string> {
  for (let i = 0; i < 3; i += 1) {
    try {
      const client = await getGroqClient();
      const timeoutPromise = new Promise<any>((_, reject) =>
        setTimeout(() => reject(new Error("Groq request timeout")), 8000)
      );
      const responsePromise = client.chat.completions.create({
        model: getGroqModel(),
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: maxTokens,
        temperature: 0.1,
      });
      const response: any = await Promise.race([responsePromise, timeoutPromise]);
      return response.choices[0]?.message?.content ?? "";
    } catch (error) {
      console.error('[GROQ ERROR]', (error as Error).message, (error as any).status);
      const status = (error as { status?: number | string } | null)?.status;
      if ((status === 429 || status === "429") && i < 2) {
        await sleep(2 ** i * 2000);
        continue;
      }
      // If aborted due to timeout, retry will occur on next loop iteration
      const err = error as any;
      if (err?.name === 'AbortError') {
        // timeout, retry up to allowed attempts
        if (i < 2) {
          await sleep(500 * (i + 1));
          continue;
        }
      }
      if (i === 2) throw error;
    }
  }

  return "";
}
