import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("Waitlist request body:", body);
    const email = body?.email;
    const tier = body?.tier || "adaptive_defense";
    console.log("Email:", email, "Tier:", tier);

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Valid email required" },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    console.log("Supabase client created");

    const { data, error } = await supabase
      .from("waitlist")
      .upsert({ email }, { onConflict: "email" })
      .select();

    console.log("Supabase result:", { data, error });

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Waitlist catch error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
