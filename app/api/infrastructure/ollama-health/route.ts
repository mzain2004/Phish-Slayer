import { NextResponse } from "next/server";
import { z } from "zod";
import {
  OLLAMA_BASE_URL,
  ollamaHealth,
  ollamaModels,
} from "@/lib/ollama-client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ModelsResponseSchema = z.array(z.string());

export async function GET() {
  const online = await ollamaHealth();

  let models: string[] = [];
  if (online) {
    try {
      const rawModels = await ollamaModels();
      const parsedModels = ModelsResponseSchema.safeParse(rawModels);
      models = parsedModels.success ? parsedModels.data : [];
    } catch {
      models = [];
    }
  }

  return NextResponse.json({
    online,
    models,
    base_url: OLLAMA_BASE_URL,
    fallback_active: !online,
  });
}
