"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Brain, Loader2, Sparkles } from "lucide-react";
import { useAuth, useOrganization } from "@clerk/nextjs";
import DashboardCard from "@/components/dashboard/DashboardCard";
import StatusBadge from "@/components/dashboard/StatusBadge";

type HuntHypothesis = {
  id: string;
  title: string;
  hypothesis?: string | null;
  mitre_technique?: string | null;
  priority?: "low" | "medium" | "high" | string;
  data_sources?: string[] | null;
  search_patterns?: unknown;
  status?: string | null;
  ai_generated?: boolean | null;
  created_at?: string | null;
};

type GenerateResponse = {
  success: boolean;
  count: number;
  hypotheses?: HuntHypothesis[];
  error?: string;
};

function priorityTone(priority?: string | null) {
  const value = priority?.toLowerCase() || "medium";
  if (value === "high") return "critical";
  if (value === "low") return "healthy";
  return "warning";
}

export default function ThreatHuntsPage() {
  const { userId } = useAuth();
  const { organization, isLoaded: orgLoaded } = useOrganization();
  const orgId = organization?.id || null;

  const [hypotheses, setHypotheses] = useState<HuntHypothesis[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [generating, setGenerating] = useState(false);

  const fetchHypotheses = useCallback(async () => {
    if (!userId || !orgId) {
      setHypotheses([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorText(null);
    try {
      const response = await fetch("/api/hunting/hypotheses", {
        method: "GET",
        cache: "no-store",
      });
      const payload = (await response.json()) as HuntHypothesis[] | { error?: string };

      if (!response.ok) {
        throw new Error((payload as { error?: string }).error || "Failed to load hypotheses");
      }

      setHypotheses(Array.isArray(payload) ? payload : []);
    } catch (error) {
      setErrorText(error instanceof Error ? error.message : "Unable to load hypotheses");
    } finally {
      setLoading(false);
    }
  }, [orgId, userId]);

  const handleGenerate = async () => {
    if (!orgId) return;
    setGenerating(true);
    setErrorText(null);

    try {
      const response = await fetch("/api/hunting/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId: orgId }),
      });
      const payload = (await response.json()) as GenerateResponse;

      if (!response.ok) {
        throw new Error(payload.error || "Failed to generate hypotheses");
      }

      await fetchHypotheses();
    } catch (error) {
      setErrorText(error instanceof Error ? error.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    if (!orgLoaded) return;
    void fetchHypotheses();
  }, [fetchHypotheses, orgLoaded]);

  const filtered = useMemo(() => {
    const search = searchText.trim().toLowerCase();
    if (!search) return hypotheses;

    return hypotheses.filter((item) => {
      const title = item.title?.toLowerCase() || "";
      const mitre = item.mitre_technique?.toLowerCase() || "";
      return title.includes(search) || mitre.includes(search);
    });
  }, [hypotheses, searchText]);

  return (
    <div className="flex flex-col gap-6 text-white">
      <div className="p-6 bg-[rgba(23,28,35,0.85)] backdrop-blur-3xl border border-[rgba(48,54,61,0.9)] rounded-2xl flex flex-col gap-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Threat Hunts</h1>
            <p className="text-sm text-white/70">
              Hypothesis-driven hunts generated from your recent alert patterns.
            </p>
          </div>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={!orgId || generating}
            className="inline-flex items-center gap-2 rounded-xl border border-violet-400/30 bg-violet-500/20 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-violet-100 disabled:opacity-60"
          >
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Generate AI Hypotheses
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder="Search title or MITRE technique"
            className="rounded-xl border border-[rgba(48,54,61,0.9)] bg-black/30 px-3 py-2 text-sm"
          />
        </div>
      </div>

      {!orgLoaded ? (
        <div className="p-6 bg-[rgba(23,28,35,0.85)] backdrop-blur-3xl border border-[rgba(48,54,61,0.9)] rounded-2xl text-white/70">
          Loading organization...
        </div>
      ) : !orgId ? (
        <div className="p-6 bg-[rgba(23,28,35,0.85)] backdrop-blur-3xl border border-[rgba(48,54,61,0.9)] rounded-2xl text-white/70">
          Select an organization to view hypotheses.
        </div>
      ) : loading ? (
        <div className="rounded-2xl border border-[rgba(48,54,61,0.9)] bg-[rgba(23,28,35,0.85)] p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={`hypothesis-skeleton-${index}`}
                className="h-[200px] rounded-2xl border border-[rgba(48,54,61,0.9)] bg-black/20 animate-pulse"
              />
            ))}
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-6 bg-[rgba(23,28,35,0.85)] backdrop-blur-3xl border border-[rgba(48,54,61,0.9)] rounded-2xl text-white/70">
          No hypotheses match your search.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filtered.map((item) => (
            <DashboardCard key={item.id} className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold leading-tight text-white">{item.title}</h2>
                  <p className="text-xs text-white/60">
                    {item.mitre_technique ? `MITRE ${item.mitre_technique}` : "No MITRE technique"}
                  </p>
                </div>
                <StatusBadge status={priorityTone(item.priority)} label={item.priority || "medium"} />
              </div>

              <p className="text-sm text-white/80">
                {item.hypothesis || "No hypothesis text provided."}
              </p>

              <div className="flex flex-wrap gap-2 text-xs text-white/60">
                <span className="inline-flex items-center gap-1">
                  <Brain className="h-3.5 w-3.5" />
                  {item.ai_generated ? "AI generated" : "Analyst authored"}
                </span>
                <span>Status: {item.status || "pending"}</span>
              </div>

              {item.data_sources && item.data_sources.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {item.data_sources.map((source) => (
                    <span
                      key={`${item.id}-${source}`}
                      className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-[10px] uppercase tracking-widest text-white/70"
                    >
                      {source}
                    </span>
                  ))}
                </div>
              ) : null}
            </DashboardCard>
          ))}
        </div>
      )}

      {errorText ? (
        <DashboardCard className="border-red-400/40 bg-red-500/10 p-4 text-sm text-red-200">
          {errorText}
        </DashboardCard>
      ) : null}
    </div>
  );
}
