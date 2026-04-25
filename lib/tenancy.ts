import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";

export type OrganizationRole = "owner" | "admin" | "analyst";

type OrganizationRow = {
  id: string;
  name: string;
};

type OrganizationMemberRow = {
  organization_id: string;
  role: OrganizationRole;
  created_at: string;
};

export type OrganizationResolution = {
  organizationId: string;
  organizationName: string;
  role: OrganizationRole;
};

function buildDefaultOrganizationSlug(userEmail?: string): string {
  const emailPrefix =
    typeof userEmail === "string" && userEmail.includes("@")
      ? userEmail.split("@")[0]
      : "default";
  const normalizedPrefix = emailPrefix.toLowerCase().replace(/[^a-z0-9]/g, "-");
  const safePrefix = normalizedPrefix.length > 0 ? normalizedPrefix : "default";

  return `${safePrefix}-${Date.now()}`;
}

export function getServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY",
    );
  }

  return createSupabaseAdminClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function getAuthenticatedUser() {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  return { id: userId };
}

async function getOrganizationById(organizationId: string): Promise<OrganizationRow | null> {
  const adminClient = getServiceRoleClient();
  const { data, error } = await adminClient
    .from("organizations")
    .select("id, name")
    .eq("id", organizationId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as OrganizationRow;
}

async function getMembership(
  userId: string,
  organizationId: string,
): Promise<OrganizationMemberRow | null> {
  const adminClient = getServiceRoleClient();
  const { data, error } = await adminClient
    .from("organization_members")
    .select("organization_id, role, created_at")
    .eq("user_id", userId)
    .eq("organization_id", organizationId)
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as OrganizationMemberRow;
}

async function getFirstMembership(
  userId: string,
): Promise<OrganizationMemberRow | null> {
  const adminClient = getServiceRoleClient();
  const { data, error } = await adminClient
    .from("organization_members")
    .select("organization_id, role, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as OrganizationMemberRow;
}

async function getOwnedOrganization(
  userId: string,
): Promise<OrganizationResolution | null> {
  const adminClient = getServiceRoleClient();
  const { data, error } = await adminClient
    .from("organizations")
    .select("id, name")
    .eq("owner_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return {
    organizationId: data.id,
    organizationName: data.name,
    role: "owner",
  };
}

async function createDefaultOrganizationForUser(
  userId: string,
  orgNameHint?: string,
  userEmail?: string,
): Promise<OrganizationResolution> {
  const adminClient = getServiceRoleClient();
  const existingOwnedOrg = await getOwnedOrganization(userId);
  if (existingOwnedOrg) {
    return existingOwnedOrg;
  }
  const defaultName =
    orgNameHint && orgNameHint.trim().length > 0
      ? `${orgNameHint.trim()} Organization`
      : "Default Organization";
  const slug = buildDefaultOrganizationSlug(userEmail);

  const { data: orgInsert, error: orgError } = await adminClient
    .from("organizations")
    .insert({
      name: defaultName,
      slug,
      plan: "trial",
      owner_id: userId,
    })
    .select("id, name")
    .single();

  if (orgError || !orgInsert) {
    throw new Error(
      `Failed to create default organization: ${orgError?.message || "insert failed"}`,
    );
  }

  await adminClient.from("organization_members").upsert(
    {
      organization_id: orgInsert.id,
      user_id: userId,
      role: "owner",
    },
    { onConflict: "organization_id,user_id" },
  );

  return {
    organizationId: orgInsert.id,
    organizationName: orgInsert.name,
    role: "owner",
  };
}

export async function resolveOrganizationForUser(options: {
  userId: string;
  preferredOrganizationId?: string;
  organizationNameHint?: string;
  userEmail?: string;
  autoCreate?: boolean;
}): Promise<OrganizationResolution | null> {
  const {
    userId,
    preferredOrganizationId,
    organizationNameHint,
    userEmail,
    autoCreate = true,
  } = options;

  if (preferredOrganizationId) {
    const directMembership = await getMembership(userId, preferredOrganizationId);
    if (directMembership) {
      const organization = await getOrganizationById(preferredOrganizationId);
      if (!organization) {
        return null;
      }

      return {
        organizationId: organization.id,
        organizationName: organization.name,
        role: directMembership.role,
      };
    }

    const ownedOrg = await getOwnedOrganization(userId);
    if (ownedOrg && ownedOrg.organizationId === preferredOrganizationId) {
      return ownedOrg;
    }

    return null;
  }

  const firstMembership = await getFirstMembership(userId);
  if (firstMembership) {
    const organization = await getOrganizationById(firstMembership.organization_id);
    if (organization) {
      return {
        organizationId: organization.id,
        organizationName: organization.name,
        role: firstMembership.role,
      };
    }
  }

  const ownedOrg = await getOwnedOrganization(userId);
  if (ownedOrg) {
    return ownedOrg;
  }

  if (!autoCreate) {
    return null;
  }

  return createDefaultOrganizationForUser(userId, organizationNameHint, userEmail);
}
