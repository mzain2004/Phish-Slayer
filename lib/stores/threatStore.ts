import { create } from 'zustand';

interface DeepScanData {
  target: string;
  whois: Record<string, unknown> | null;
  dns: Record<string, unknown> | null;
  ssl: Record<string, unknown> | null;
  typosquat: Record<string, unknown> | null;
  domTree: Record<string, unknown> | null;
  allRiskFlags: string[];
}

interface ThreatStore {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  deepScanData: DeepScanData | null;
  setDeepScanData: (data: DeepScanData | null) => void;
  deepScanLoading: boolean;
  setDeepScanLoading: (loading: boolean) => void;
  scanFilter: string;
  setScanFilter: (filter: string) => void;
}

export const useThreatStore = create<ThreatStore>((set) => ({
  activeTab: 'rendered',
  setActiveTab: (tab) => set({ activeTab: tab }),
  deepScanData: null,
  setDeepScanData: (data) => set({ deepScanData: data }),
  deepScanLoading: false,
  setDeepScanLoading: (loading) => set({ deepScanLoading: loading }),
  scanFilter: '',
  setScanFilter: (filter) => set({ scanFilter: filter }),
}));
