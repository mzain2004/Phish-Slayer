import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { email, tier } = await request.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Valid email required" },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    // Try with tier first, fallback without it
    const { error } = await supabase
      .from("waitlist")
      .upsert(
        { email, tier: tier || "adaptive_defense" },
        { onConflict: "email" },
      );

    if (error) {
      // Fallback: try insert with just email
      const { error: fallbackError } = await supabase
        .from("waitlist")
        .upsert({ email }, { onConflict: "email" });

      if (fallbackError) {
        console.error("Waitlist fallback error:", fallbackError);
        return NextResponse.json(
          { error: String(fallbackError.message) },
          { status: 500 },
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Waitlist error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
