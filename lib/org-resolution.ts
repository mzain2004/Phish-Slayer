import { cookies } from "next/headers";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";

export async function resolveOrgId(searchParamsOrgId?: string) {
  const { userId, orgId: clerkOrgId } = await auth();
  const cookieStore = await cookies();
  const cookieOrgId = cookieStore.get("ps_org_id")?.value;

  if (searchParamsOrgId) return searchParamsOrgId;
  if (clerkOrgId) return clerkOrgId;
  if (cookieOrgId) return cookieOrgId;

  if (userId) {
    const supabase = await createClient();
    const { data: membership } = await supabase
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();
    
    return membership?.organization_id || null;
  }

  return null;
}
