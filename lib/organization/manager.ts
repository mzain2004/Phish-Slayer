import { SupabaseClient } from "@supabase/supabase-js";
import { v4 as uuidv4 } from "uuid";
import { Organization, OrganizationMember, OrganizationStats } from "../soc/types";

export class OrganizationManager {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  public async createOrganization(name: string, owner_user_id: string, plan: "starter" | "professional" | "enterprise"): Promise<Organization> {
    const baseSlug = name.toLowerCase().replace(/\s+/g, "-");
    const randomChars = Math.random().toString(36).substring(2, 6);
    const slug = `${baseSlug}-${randomChars}`;

    const organizationId = uuidv4();
    const now = new Date();

    const organization: Partial<Organization> = {
      id: organizationId,
      name,
      slug,
      plan,
      status: "trial",
      owner_user_id,
      sla_config: {
        p1_response_minutes: 15,
        p2_response_minutes: 60,
        p3_response_minutes: 240,
        p4_response_minutes: 1440,
        breach_notify_email: null
      },
      branding: {
        logo_url: null,
        primary_color: "#7c6af7", // Updated to PhishSlayer brand color
        company_name: name,
        report_footer: null
      },
      alert_quota_monthly: plan === "starter" ? 1000 : (plan === "professional" ? 5000 : 25000),
      alerts_used_this_month: 0,
      created_at: now,
      trial_ends_at: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)
    };

    await this.supabase.from("organizations").insert({
      ...organization,
      created_at: organization.created_at?.toISOString(),
      trial_ends_at: organization.trial_ends_at?.toISOString()
    });

    await this.supabase.from("organization_members").insert({
      id: uuidv4(),
      organization_id: organizationId,
      user_id: owner_user_id,
      role: "owner",
      active: true,
      invited_at: now.toISOString(),
      accepted_at: now.toISOString()
    });

    return organization as Organization;
  }

  public async getOrganization(organization_id: string): Promise<Organization | null> {
    const { data } = await this.supabase.from("organizations").select("*").eq("id", organization_id).maybeSingle();
    return data;
  }

  public async getOrganizationBySlug(slug: string): Promise<Organization | null> {
    const { data } = await this.supabase.from("organizations").select("*").eq("slug", slug).maybeSingle();
    return data;
  }

  public async getUserOrganizations(user_id: string): Promise<Organization[]> {
    const { data } = await this.supabase
      .from("organization_members")
      .select("organizations(*)")
      .eq("user_id", user_id)
      .eq("active", true);

    return (data || []).map(d => d.organizations as unknown as Organization);
  }

  public async addUser(organization_id: string, user_id: string, role: string): Promise<OrganizationMember> {
    const { data: existing } = await this.supabase
      .from("organization_members")
      .select("*")
      .eq("organization_id", organization_id)
      .eq("user_id", user_id)
      .maybeSingle();

    if (existing) {
      const { data } = await this.supabase
        .from("organization_members")
        .update({ role, active: true })
        .eq("id", existing.id)
        .select()
        .single();
      return data;
    }

    const { data } = await this.supabase
      .from("organization_members")
      .insert({
        id: uuidv4(),
        organization_id,
        user_id,
        role,
        active: true
      })
      .select()
      .single();
    
    return data;
  }

  public async removeUser(organization_id: string, user_id: string): Promise<void> {
    await this.supabase
      .from("organization_members")
      .update({ active: false })
      .eq("organization_id", organization_id)
      .eq("user_id", user_id);
  }

  public async getOrganizationStats(organization_id: string): Promise<OrganizationStats> {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { count: alerts24h } = await this.supabase
      .from("alerts")
      .select("*", { count: 'exact', head: true })
      .eq("organization_id", organization_id)
      .gte("created_at", twentyFourHoursAgo);

    const { data: openCases } = await this.supabase
      .from("cases")
      .select("*")
      .eq("organization_id", organization_id)
      .eq("status", "open");

    const { data: closedCases } = await this.supabase
      .from("cases")
      .select("*")
      .eq("organization_id", organization_id)
      .eq("status", "closed")
      .gte("closed_at", twentyFourHoursAgo);

    // MTTD/MTTR Simulation
    let mttd = 12; // Placeholder
    let mttr = 45; // Placeholder
    let breaches = 0;

    const p1Open = openCases?.filter(c => c.severity === 'p1').length || 0;
    const p2Open = openCases?.filter(c => c.severity === 'p2').length || 0;

    const riskScore = Math.min((p1Open * 20) + (p2Open * 10) + (breaches * 15) + ((alerts24h || 0) / 10), 100);

    return {
      organization_id,
      alerts_24h: alerts24h || 0,
      open_cases: openCases?.length || 0,
      mttd_minutes: mttd,
      mttr_minutes: mttr,
      sla_breaches_24h: breaches,
      top_alert_types: ["Phishing", "Brute Force"],
      risk_score: Math.round(riskScore)
    };
  }

  public async checkQuota(organization_id: string): Promise<boolean> {
    const { data } = await this.supabase
      .from("organizations")
      .select("alert_quota_monthly, alerts_used_this_month")
      .eq("id", organization_id)
      .single();
    
    if (!data) return false;
    return data.alerts_used_this_month < data.alert_quota_monthly;
  }

  public async incrementAlertCount(organization_id: string): Promise<void> {
    await this.supabase.rpc('increment_organization_alerts', { o_id: organization_id });
  }

  public async resetMonthlyQuotas(): Promise<void> {
    await this.supabase.from("organizations").update({ alerts_used_this_month: 0 }).neq("id", "");
  }
}
