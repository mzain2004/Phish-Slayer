import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";
import SettingsClient from "./SettingsClient";

export default async function PlatformSettingsPage() {
  const { userId, orgId } = await auth();

  if (!userId) {
    redirect("/");
  }

  const supabase = await createClient();
  const [{ data: profile }, { data: org }] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, avatar_url, email")
      .eq("id", userId)
      .maybeSingle(),
    orgId ? supabase
      .from("organizations")
      .select("name, data_region")
      .eq("id", orgId)
      .single() : Promise.resolve({ data: null })
  ]);

  return (
    <SettingsClient
      userId={userId}
      userEmail={(profile?.email as string | null) ?? ""}
      initialFullName={(profile?.full_name as string | null) ?? ""}
      initialAvatarUrl={(profile?.avatar_url as string | null) ?? null}
      orgName={org?.name ?? null}
      orgRegion={org?.data_region ?? "uae-north"}
    />
  );
}
