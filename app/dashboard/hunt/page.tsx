"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Brain, Loader2, Sparkles, Zap } from "lucide-react";
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
  const [generating, setGenerating] = useState(false);
  const [automatedFindings, setAutomatedFindings] = useState<{beaconing: any[], lateral: any[]}>({beaconing: [], lateral: []});

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

  const loadAutomated = useCallback(async () => {
    if (!orgId) return;
    try {
      const [bRes, lRes] = await Promise.all([
        fetch(`/api/l2/beaconing?organizationId=${orgId}`),
        fetch(`/api/l2/lateral-movement?organizationId=${orgId}`)
      ]);
      if (bRes.ok && lRes.ok) {
        setAutomatedFindings({
          beaconing: await bRes.json(),
          lateral: await lRes.json()
        });
      }
    } catch (e) {
      console.error("Failed to load automated findings", e);
    }
  }, [orgId]);

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
    if (orgLoaded) {
      fetchHypotheses();
      loadAutomated();
    }
  }, [orgLoaded, fetchHypotheses, loadAutomated]);

  return (
    <div className="flex flex-col gap-6 p-8 text-white">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="text-primary" />
            Threat Hunting
          </h1>
          <p className="text-white/50 text-sm">Hypothesis-driven and automated discovery</p>
        </div>
        <button 
          onClick={handleGenerate}
          disabled={generating}
          className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-full flex items-center gap-2 font-semibold transition-all disabled:opacity-50"
        >
          {generating ? <Loader2 className="animate-spin w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
          Generate Hypotheses
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-6">
           <DashboardCard className="p-6">
              <h2 className="text-lg font-bold mb-4">Active Hypotheses</h2>
              {loading ? (
                <div className="flex justify-center p-20"><Loader2 className="animate-spin text-primary" /></div>
              ) : hypotheses.length === 0 ? (
                <p className="text-center text-white/20 p-20">No active hypotheses found.</p>
              ) : (
                <div className="flex flex-col gap-3">
                   {hypotheses.map(h => (
                     <div key={h.id} className="p-4 bg-white/5 rounded-xl border border-white/10 flex justify-between items-center">
                        <div>
                          <p className="font-bold">{h.title}</p>
                          <p className="text-xs text-white/40">{h.mitre_technique || "Generic"}</p>
                        </div>
                        <StatusBadge status={priorityTone(h.priority)} label={h.priority || "Medium"} />
                     </div>
                   ))}
                </div>
              )}
           </DashboardCard>
        </div>

        <div className="flex flex-col gap-6">
          <DashboardCard className="p-6 border-cyan-500/20">
             <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
               <Zap className="w-4 h-4 text-cyan-400" />
               Automated Detections
             </h2>
             <div className="flex flex-col gap-4">
                <div>
                   <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-2 border-b border-white/5 pb-1">Beaconing</p>
                   {automatedFindings.beaconing.length === 0 ? <p className="text-xs text-white/20 italic">No patterns detected</p> : 
                     automatedFindings.beaconing.map((b, i) => (
                       <div key={i} className="mb-2 p-2 bg-white/5 rounded border border-white/5">
                          <p className="text-xs font-mono text-cyan-300 truncate" title={`${b.srcIp} -> ${b.dstIp}`}>{b.srcIp} → {b.dstIp}</p>
                          <p className="text-[10px] text-white/40">Interval: {b.interval}s • {Math.round(b.confidence*100)}% Conf</p>
                       </div>
                     ))
                   }
                </div>
                <div>
                   <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-2 border-b border-white/5 pb-1">Lateral Movement</p>
                   {automatedFindings.lateral.length === 0 ? <p className="text-xs text-white/20 italic">No activity detected</p> : 
                     automatedFindings.lateral.map((l, i) => (
                       <div key={i} className="mb-2 p-2 bg-white/5 rounded border border-white/5">
                          <p className="text-xs font-bold text-orange-400">{l.userId}</p>
                          <p className="text-[10px] text-white/40">{l.machines.length} machines in {l.timespan}</p>
                       </div>
                     ))
                   }
                </div>
             </div>
          </DashboardCard>
        </div>
      </div>
      {errorText && <p className="text-red-400 text-sm text-center">{errorText}</p>}
    </div>
  );
}
