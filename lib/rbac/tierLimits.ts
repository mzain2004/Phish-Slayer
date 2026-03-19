export type Tier = 'recon' | 'soc_pro' | 'command_control'
export type Role = 'super_admin' | 'admin' | 'analyst' | 'viewer'

export const TIER_LIMITS = {
  recon: {
    scansPerDay: 10,
    agentSlots: 1,
    apiCallsPerDay: 0,
    canUseIntelVault: false,
    canUseWhitelist: false,
    canExportPDF: false,
    canUsePublicAPI: false,
    canManageTeam: false,
  },
  soc_pro: {
    scansPerDay: 500,
    agentSlots: 10,
    apiCallsPerDay: 1000,
    canUseIntelVault: false,
    canUseWhitelist: true,
    canExportPDF: true,
    canUsePublicAPI: true,
    canManageTeam: false,
  },
  command_control: {
    scansPerDay: Infinity,
    agentSlots: Infinity,
    apiCallsPerDay: Infinity,
    canUseIntelVault: true,
    canUseWhitelist: true,
    canExportPDF: true,
    canUsePublicAPI: true,
    canManageTeam: true,
  },
}

export function getTierLimits(tier: Tier) {
  return TIER_LIMITS[tier] ?? TIER_LIMITS.recon
}

export function canPerformScan(tier: Tier, scansToday: number): boolean {
  if (tier === 'command_control') return true
  return scansToday < TIER_LIMITS[tier].scansPerDay
}

export function canAddAgent(tier: Tier, currentAgents: number): boolean {
  if (tier === 'command_control') return true
  return currentAgents < TIER_LIMITS[tier].agentSlots
}
