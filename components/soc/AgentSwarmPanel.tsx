"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type AgentStatus = "online" | "idle" | "error";

type AgentRecord = {
  id: string;
  name: string;
  status: AgentStatus;
  last_run: string | null;
};

type AgentListResponse = {
  agents?: Array<{
    id?: string;
    agentId?: string;
    name?: string;
    status?: string;
    state?: string;
    lastSeen?: string;
    last_run?: string;
  }>;
};

function normalizeStatus(raw: string | undefined): AgentStatus {
  const value = (raw || "").toLowerCase();
  if (value.includes("online") || value.includes("active")) {
    return "online";
  }
  if (value.includes("error") || value.includes("fail") || value.includes("down")) {
    return "error";
  }
  return "idle";
}

function statusColor(status: AgentStatus): string {
  if (status === "online") {
    return "bg-emerald-400";
  }
  if (status === "error") {
    return "bg-red-400";
  }
  return "bg-slate-400";
}

export default function AgentSwarmPanel() {
  const [agents, setAgents] = useState<AgentRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [triggeringId, setTriggeringId] = useState<string | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [decisionCount, setDecisionCount] = useState(0);

  const fetchAgents = useCallback(async () => {
    setLoading(true);
    setErrorText(null);

    try {
      const [agentsRes, countPromise] = await Promise.all([
        fetch("/api/agent/list", { method: "GET", credentials: "include" }),
        createClient()
          .from("audit_logs")
          .select("id", { count: "exact", head: true })
          .in("action", ["L1_AUTO_CLOSED", "ALERT_ESCALATED"]),
      ]);

      const payload = (await agentsRes.json()) as AgentListResponse;
      if (!agentsRes.ok) {
        throw new Error("Failed to load agent list");
      }

      const mapped = (payload.agents || []).map((agent) => ({
        id: agent.id || agent.agentId || "l1-triage-agent",
        name: agent.name || "L1 Triage Agent",
        status: normalizeStatus(agent.status || agent.state),
        last_run: agent.last_run || agent.lastSeen || null,
      }));

      setAgents(
        mapped.length > 0
          ? mapped
          : [
              {
                id: "l1-triage-agent",
                name: "L1 Triage Agent",
                status: "idle",
                last_run: null,
              },
            ],
      );

      setDecisionCount(countPromise.count || 0);
    } catch (error) {
      setErrorText(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchAgents();
  }, [fetchAgents]);

  const totalAgents = useMemo(() => agents.length, [agents.length]);

  const triggerNow = async (agentId: string) => {
    setTriggeringId(agentId);
    setErrorText(null);

    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error("You must be authenticated to trigger this agent.");
      }

      const response = await fetch("/api/agent/triage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload?.error || "Failed to trigger L1 triage.");
      }

      await fetchAgents();
    } catch (error) {
      setErrorText(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setTriggeringId(null);
    }
  };

  return (
    <div className="p-6 bg-[rgba(23,28,35,0.85)] backdrop-blur-3xl border border-[rgba(48,54,61,0.9)] rounded-2xl flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold text-white">Agent Command Center</h2>
        <div className="text-xs text-white/60 uppercase tracking-[0.14em]">
          Agents: {totalAgents} | Decisions: {decisionCount}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-white/70">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading swarm status...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {agents.map((agent) => (
            <div
              key={agent.id}
              className="rounded-xl border border-[rgba(48,54,61,0.9)] bg-black/20 p-4 flex flex-col gap-3"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-white font-semibold">{agent.name}</p>
                <span className={`w-2.5 h-2.5 rounded-full ${statusColor(agent.status)}`} />
              </div>

              <p className="text-xs text-white/60">
                Last run: {agent.last_run ? new Date(agent.last_run).toLocaleString() : "Never"}
              </p>

              <p className="text-xs text-white/60">Total decisions made: {decisionCount}</p>

              <button
                type="button"
                onClick={() => triggerNow(agent.id)}
                disabled={triggeringId === agent.id}
                className="rounded-full px-4 py-2 text-sm font-semibold text-black bg-gradient-to-r from-[#2DD4BF] to-[#22c55e] disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
              >
                {triggeringId === agent.id ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Triggering...
                  </>
                ) : (
                  "Trigger Now"
                )}
              </button>
            </div>
          ))}
        </div>
      )}

      {errorText ? <p className="text-sm text-red-400">{errorText}</p> : null}
    </div>
  );
}