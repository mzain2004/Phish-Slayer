"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type DecisionAuditRow = {
  id: string;
  agent_level: "L1";
  decision: string;
  reasoning_text: string;
  confidence_score: number | null;
  actions_taken: unknown;
  created_at: string;
};

function timeAgo(timestamp: string): string {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diffSeconds = Math.max(0, Math.floor((now - then) / 1000));
  if (diffSeconds < 60) return `${diffSeconds}s ago`;
  const mins = Math.floor(diffSeconds / 60);
  if (mins < 60) return `${mins} minute${mins === 1 ? "" : "s"} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export default function L1DecisionLog() {
  const [rows, setRows] = useState<DecisionAuditRow[]>([]);
  const [errorText, setErrorText] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setErrorText(null);
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("agent_reasoning")
          .select(
            "id, agent_level, decision, reasoning_text, confidence_score, actions_taken, created_at",
          )
          .eq("agent_level", "L1")
          .order("created_at", { ascending: false })
          .limit(20);

        if (error) {
          throw new Error(error.message);
        }

        setRows((data || []) as DecisionAuditRow[]);
      } catch (error) {
        setErrorText(error instanceof Error ? error.message : "Unknown error");
      }
    };

    void load();
  }, []);

  return (
    <div className="p-6 glass flex flex-col gap-4">
      <h2 className="text-xl font-bold text-white">
        L1 Autonomous Decision Log
      </h2>

      <div className="flex flex-col gap-3 max-h-80 overflow-y-auto pr-1">
        {rows.length === 0 ? (
          <p className="text-sm text-white/50">No autonomous decisions yet.</p>
        ) : (
          rows.map((row) => {
            const escalated = row.decision.toUpperCase() === "ESCALATE";
            const confidence =
              typeof row.confidence_score === "number"
                ? `${Math.round(row.confidence_score * 100)}% confidence`
                : "confidence unavailable";
            const actionTaken = Array.isArray(row.actions_taken)
              ? String(row.actions_taken[0] || "UNKNOWN")
              : "UNKNOWN";

            return (
              <div key={row.id} className="glass p-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span
                        className={`text-[10px] uppercase tracking-[0.14em] font-semibold rounded-full px-2 py-1 border ${
                        escalated
                            ? "text-danger border-danger/30 bg-danger/20"
                            : "text-accent border-accent/30 bg-accent/15"
                        }`}
                    >
                        {escalated ? "ESCALATED" : "CLOSED"}
                    </span>
                    <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-[#7c6af7]/20 text-[#7c6af7]">L1 AGENT</span>
                  </div>
                  <span className="text-xs text-white/50">
                    {timeAgo(row.created_at)}
                  </span>
                </div>

                <p className="text-sm text-white/80 mt-2">
                  {row.reasoning_text || "No reasoning captured."}
                </p>
                <p className="text-xs text-white/60 mt-1">
                  <span className={`${
                    row.confidence_score && row.confidence_score >= 0.90 ? 'text-green-400' :
                    row.confidence_score && row.confidence_score >= 0.70 ? 'text-yellow-400' :
                    'text-red-400'
                  }`}>
                    {confidence}
                  </span> • action: {actionTaken}
                </p>
              </div>
            );
          })
        )}
      </div>

      {errorText ? <p className="text-sm text-red-400">{errorText}</p> : null}
    </div>
  );
}
