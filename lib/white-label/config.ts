import { supabaseAdmin } from "@/lib/supabase/admin";

export interface WhiteLabelConfig {
  custom_logo_url?: string;
  custom_domain?: string;
  primary_color?: string;
  company_name_override?: string;
  hide_phishslayer_branding?: boolean;
}

export const DEFAULT_CONFIG: WhiteLabelConfig = {
  primary_color: "#7c6af7",
  hide_phishslayer_branding: false,
};

export async function getWhiteLabelConfig(orgId: string): Promise<WhiteLabelConfig> {
  const { data: org } = await supabaseAdmin
    .from("organizations")
    .select("white_label_config")
    .eq("id", orgId)
    .single();

  return {
    ...DEFAULT_CONFIG,
    ...(org?.white_label_config || {}),
  };
}

export interface CSSVars {
  "--primary": string;
  "--primary-foreground": string;
}

export function applyWhiteLabel(config: WhiteLabelConfig): CSSVars {
  // Map config to CSS custom property overrides
  // This is a foundation for future dynamic styling
  return {
    "--primary": config.primary_color || DEFAULT_CONFIG.primary_color!,
    "--primary-foreground": "#ffffff",
  };
}
