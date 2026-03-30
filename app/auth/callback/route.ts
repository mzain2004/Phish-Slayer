import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://phishslayer.tech";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${siteUrl}/dashboard`);
    }
  }

  // Redirect to login on error
  return NextResponse.redirect(
    `${siteUrl}/auth/login?error=auth_callback_failed`,
  );
}
