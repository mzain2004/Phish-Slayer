import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://phishslayer.tech";

  if (code) {
    const supabase = await createClient();
    const { data: sessionData, error } =
      await supabase.auth.exchangeCodeForSession(code);

    if (!error && sessionData?.user) {
      const user = sessionData.user;
      const metadata = user.user_metadata;

      await supabase
        .from("profiles")
        .upsert(
          {
            id: user.id,
            email: user.email,
            full_name: metadata?.full_name || metadata?.name || "",
            avatar_url: metadata?.avatar_url || metadata?.picture || null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" },
        );

      return NextResponse.redirect(`${siteUrl}/dashboard`);
    }
  }

  // Redirect to login on error
  return NextResponse.redirect(
    `${siteUrl}/auth/login?error=auth_callback_failed`,
  );
}
