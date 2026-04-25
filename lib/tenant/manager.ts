import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * TenantManager — handles cross-tenant administrative operations.
 * Used by the cron job to perform monthly maintenance tasks.
 */
export class TenantManager {
  constructor(private readonly supabase: SupabaseClient) {}

  /**
   * Resets the monthly alert quota counter for every organisation.
   * Called on the 1st of each month by the cron route.
   */
  async resetMonthlyQuotas(): Promise<void> {
    const { error } = await this.supabase
      .from("organizations")
      .update({ monthly_alert_count: 0 })
      .neq("id", "");

    if (error) {
      throw new Error(`[TenantManager] resetMonthlyQuotas failed: ${error.message}`);
    }
  }
}
