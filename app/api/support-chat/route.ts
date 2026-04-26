import { NextResponse } from "next/server";
import { z } from "zod";
import { groqComplete } from "@/lib/ai/groq";
import { createClient } from "@/lib/supabase/server";
import { auth } from '@clerk/nextjs/server';
import { checkRateLimit, getClientIp } from "@/lib/security/rateLimit";
import { sanitizePromptInput } from "@/lib/security/sanitize";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  message: z.string().trim().min(1).max(2000),
  userId: z.string().optional().nullable(),
  userEmail: z.string().optional().nullable(),
});

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
  if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();

    const clientIp = getClientIp(request);
    const rate = checkRateLimit(`support-chat:${userId}:${clientIp}`, {
      windowMs: 60_000,
      max: 6,
    });

    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429 },
      );
    }

    const parsed = bodySchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request payload" },
        { status: 400 },
      );
    }

    if (!process.env.GROQ_API_KEY) {
      console.error("GROQ_API_KEY is not set for /api/support-chat");
      return NextResponse.json(
        { error: "Support service is unavailable" },
        { status: 500 },
      );
    }

    // Check AI rate limits
    const { data: profile } = await supabase
      .from('profiles')
      .select('api_calls_today, api_calls_reset_at')
      .eq('id', userId)
      .single();

    let calls = profile?.api_calls_today || 0;
    let resetAt = profile?.api_calls_reset_at ? new Date(profile.api_calls_reset_at) : new Date(0);
    const now = new Date();
    
    if (now >= resetAt) {
      calls = 0;
      resetAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now
    }
    
    if (calls >= 50) {
      return NextResponse.json({ error: "Daily AI limit reached" }, { status: 429 });
    }

    const systemPrompt =
      "You are Phish-Slayer AI Support, an expert cybersecurity SOC assistant. Help users navigate the platform, understand alerts, use features, and resolve issues. Be concise and technical.";
    const safeMessage = sanitizePromptInput(parsed.data.message, 2000);
    const safeUserId = sanitizePromptInput(parsed.data.userId || userId, 80);
    const userPrompt = `Context:\n- User ID: ${safeUserId}\n\nUser message: ${safeMessage}`;

    let reply = "";
    try {
      const responseText = await groqComplete(systemPrompt, userPrompt, 512);

      // Increment AI calls after success
      await supabase.from('profiles').update({
        api_calls_today: calls + 1,
        api_calls_reset_at: resetAt.toISOString()
      }).eq('id', userId);

      reply =
        responseText.trim() ||
        "I can help with that. Please share a bit more detail.";
    } catch (error) {
      console.warn("Support chat fallback used", {
        error: error instanceof Error ? error.message : "unknown",
      });
      reply = "Support is temporarily unavailable. Try again shortly.";
    }

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Support chat route error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
