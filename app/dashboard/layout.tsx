import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import DashboardLayoutClient from "./components/DashboardLayoutClient";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId, orgId: clerkOrgId } = await auth();

  if (!userId) {
    redirect("/");
  }

  const supabase = await createClient();
  const cookieStore = await cookies();

  // FIX 2: ORG AUTO-CREATION ON FIRST LOGIN
  if (!clerkOrgId) {
    // 1. Check if user already owns an organization in our DB
    const { data: existingOrg } = await supabase
      .from("organizations")
      .select("id, setup_complete")
      .eq("owner_id", userId)
      .limit(1)
      .maybeSingle();

    if (!existingOrg) {
      // 2. No org found, create one
      const { data: newOrg, error: insertError } = await supabase
        .from("organizations")
        .insert({
          owner_id: userId,
          name: 'My Organization',
          plan: 'free',
          setup_complete: false
        })
        .select("id")
        .single();

      if (!insertError && newOrg) {
        // Also add the user as a member
        await supabase.from("organization_members").insert({
            organization_id: newOrg.id,
            user_id: userId,
            role: 'owner'
        });

        // Redirect to onboarding
        redirect("/dashboard/onboarding");
      }
    } else {
      (await cookies()).set("ps_org_id", existingOrg.id, { path: "/" });
      if (!existingOrg.setup_complete) {
        // Optional: redirect to onboarding if found but not setup
      }
    }
  }

  return (
    <DashboardLayoutClient>
      {children}
    </DashboardLayoutClient>
  );
}
