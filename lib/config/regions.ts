export const REGIONS = {
  'uae-north': {
    name: 'UAE North',
    supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    flag: '🇦🇪',
    data_residency: ['UAE', 'GCC']
  },
  'eu-west': {
    name: 'EU West (Coming Soon)',
    supabase_url: null,
    flag: '🇪🇺',
    data_residency: ['EU', 'EEA']
  },
  'us-east': {
    name: 'US East (Coming Soon)',
    supabase_url: null,
    flag: '🇺🇸',
    data_residency: ['US']
  }
} as const;

export type RegionKey = keyof typeof REGIONS;
export type RegionInfo = typeof REGIONS[RegionKey];

export function getRegion(key: string): RegionInfo {
  return REGIONS[key as RegionKey] || REGIONS['uae-north'];
}
