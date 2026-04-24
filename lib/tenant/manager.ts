import { SupabaseClient } from "@supabase/supabase-js";
import { Tenant, TenantUser, TenantStats, SLAConfig } from "../soc/types";
import { v4 as uuidv4 } from "uuid";

export class TenantManager {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  public async createTenant(name: string, owner_user_id: string, plan: "starter" | "professional" | "enterprise"): Promise<Tenant> {
    const baseSlug = name.toLowerCase().replace(/\s+/g, "-");
    const randomChars = Math.random().toString(36).substring(2, 6);
    const slug = `${baseSlug}-${randomChars}`;

    const tenantId = uuidv4();
    const now = new Date();

    const tenant: Partial<Tenant> = {
      id: tenantId,
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
        primary_color: "#22d3ee",
        company_name: name,
        report_footer: null
      },
      alert_quota_monthly: plan === "starter" ? 1000 : (plan === "professional" ? 5000 : 25000),
      alerts_used_this_month: 0,
      created_at: now,
      trial_ends_at: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)
    };

    await this.supabase.from("tenants").insert({
      ...tenant,
      created_at: tenant.created_at?.toISOString(),
      trial_ends_at: tenant.trial_ends_at?.toISOString()
    });

    await this.supabase.from("tenant_users").insert({
      id: uuidv4(),
      tenant_id: tenantId,
      user_id: owner_user_id,
      role: "owner",
      active: true,
      invited_at: now.toISOString(),
      accepted_at: now.toISOString()
    });

    return tenant as Tenant;
  }

  public async getTenant(tenant_id: string): Promise<Tenant | null> {
    const { data } = await this.supabase.from("tenants").select("*").eq("id", tenant_id).maybeSingle();
    return data;
  }

  public async getTenantBySlug(slug: string): Promise<Tenant | null> {
    const { data } = await this.supabase.from("tenants").select("*").eq("slug", slug).maybeSingle();
    return data;
  }

  public async getUserTenants(user_id: string): Promise<Tenant[]> {
    const { data } = await this.supabase
      .from("tenant_users")
      .select("tenants(*)")
      .eq("user_id", user_id)
      .eq("active", true);

    return (data || []).map(d => d.tenants as unknown as Tenant);
  }

  public async addUser(tenant_id: string, user_id: string, role: string): Promise<TenantUser> {
    const { data: existing } = await this.supabase
      .from("tenant_users")
      .select("*")
      .eq("tenant_id", tenant_id)
      .eq("user_id", user_id)
      .maybeSingle();

    if (existing) {
      const { data } = await this.supabase
        .from("tenant_users")
        .update({ role, active: true })
        .eq("id", existing.id)
        .select()
        .single();
      return data;
    }

    const { data } = await this.supabase
      .from("tenant_users")
      .insert({
        id: uuidv4(),
        tenant_id,
        user_id,
        role,
        active: true
      })
      .select()
      .single();
    
    return data;
  }

  public async removeUser(tenant_id: string, user_id: string): Promise<void> {
    await this.supabase
      .from("tenant_users")
      .update({ active: false })
      .eq("tenant_id", tenant_id)
      .eq("user_id", user_id);
  }

  public async getTenantStats(tenant_id: string): Promise<TenantStats> {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { count: alerts24h } = await this.supabase
      .from("alerts")
      .select("*", { count: 'exact', head: true })
      .eq("org_id", tenant_id)
      .gte("created_at", twentyFourHoursAgo);

    const { data: openCases } = await this.supabase
      .from("cases")
      .select("*")
      .eq("org_id", tenant_id)
      .eq("status", "open");

    const { data: closedCases } = await this.supabase
      .from("cases")
      .select("*")
      .eq("org_id", tenant_id)
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
      tenant_id,
      alerts_24h: alerts24h || 0,
      open_cases: openCases?.length || 0,
      mttd_minutes: mttd,
      mttr_minutes: mttr,
      sla_breaches_24h: breaches,
      top_alert_types: ["Phishing", "Brute Force"],
      risk_score: Math.round(riskScore)
    };
  }

  public async checkQuota(tenant_id: string): Promise<boolean> {
    const { data } = await this.supabase
      .from("tenants")
      .select("alert_quota_monthly, alerts_used_this_month")
      .eq("id", tenant_id)
      .single();
    
    if (!data) return false;
    return data.alerts_used_this_month < data.alert_quota_monthly;
  }

  public async incrementAlertCount(tenant_id: string): Promise<void> {
    await this.supabase.rpc('increment_tenant_alerts', { t_id: tenant_id });
  }

  public async resetMonthlyQuotas(): Promise<void> {
    await this.supabase.from("tenants").update({ alerts_used_this_month: 0 }).neq("id", "");
  }
}
