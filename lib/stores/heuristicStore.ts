import { create } from 'zustand';

interface HeuristicResult {
  heuristicScore: number;
  summary: string;
  indicators: string[];
  manipulationTactics: string[];
  credentialHarvestingSignals: string[];
  combinedRiskScore: number;
  confidence: 'low' | 'medium' | 'high';
  analyzedAt: string;
}

interface HeuristicStore {
  results: Record<string, HeuristicResult>;
  loading: Record<string, boolean>;
  errors: Record<string, string>;
  setResult: (target: string, result: HeuristicResult) => void;
  setLoading: (target: string, loading: boolean) => void;
  setError: (target: string, error: string) => void;
  getResult: (target: string) => HeuristicResult | null;
  clearError: (target: string) => void;
}

export const useHeuristicStore = create<HeuristicStore>((set, get) => ({
  results: {},
  loading: {},
  errors: {},
  setResult: (target, result) =>
    set((state) => ({
      results: { ...state.results, [target]: result },
      errors: { ...state.errors, [target]: undefined as any },
    })),
  setLoading: (target, loading) =>
    set((state) => ({
      loading: { ...state.loading, [target]: loading },
    })),
  setError: (target, error) =>
    set((state) => ({
      errors: { ...state.errors, [target]: error },
    })),
  getResult: (target) => get().results[target] || null,
  clearError: (target) =>
    set((state) => {
      const next = { ...state.errors };
      delete next[target];
      return { errors: next };
    }),
}));
