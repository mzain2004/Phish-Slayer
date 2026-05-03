"use client";

import { useEffect, useState } from "react";
import { Bot, Shield, Zap, Search, Activity, Clock, Cpu } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useOrganization } from "@clerk/nextjs";
import DashboardCard from "@/components/dashboard/DashboardCard";
import StatusBadge from "@/components/dashboard/StatusBadge";
import PhishButton from "@/components/ui/PhishButton";

export default function AgentsStatusPage() {
  const { organization } = useOrganization();
  const orgId = organization?.id;
  const [loading, setLoading] = useState(true);
  const [reasoning, setReasoning] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [lastRuns, setLastRuns] = useState<any>({});

  const fetchData = async () => {
    if (!orgId) return;
    setLoading(true);
    const supabase = createClient();

    try {
      const [reasoningRes, statsRes, l1Run, l2Run, l3Run] = await Promise.all([
        supabase
          .from("agent_reasoning")
          .select("*")
          .eq("organization_id", orgId)
          .order("created_at", { ascending: false })
          .limit(20),
        supabase
          .from("agent_reasoning")
          .select("agent_level, execution_time_ms")
          .eq("organization_id", orgId),
        supabase
          .from("agent_reasoning")
          .select("created_at")
          .eq("organization_id", orgId)
          .eq("agent_level", "L1")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("agent_reasoning")
          .select("created_at")
          .eq("organization_id", orgId)
          .eq("agent_level", "L2")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("agent_reasoning")
          .select("created_at")
          .eq("organization_id", orgId)
          .eq("agent_level", "L3")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      setReasoning(reasoningRes.data || []);
      
      const allStats = statsRes.data || [];
      setStats({
        total: allStats.length,
        l1: allStats.filter(s => s.agent_level === 'L1').length,
        l2: allStats.filter(s => s.agent_level === 'L2').length,
        l3: allStats.filter(s => s.agent_level === 'L3').length,
        avgTime: Math.round(allStats.reduce((acc, curr) => acc + (curr.execution_time_ms || 0), 0) / (allStats.length || 1))
      });

      setLastRuns({
        L1: l1Run.data?.created_at,
        L2: l2Run.data?.created_at,
        L3: l3Run.data?.created_at
      });

    } catch (err) {
      console.error("Failed to fetch agent data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orgId) fetchData();
  }, [orgId]);

  if (!orgId) return <div className="p-10 text-center text-white/40">Please select an organization.</div>;

  return (
    <div className="flex flex-col gap-8 text-white max-w-7xl mx-auto w-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tighter flex items-center gap-3">
            <Bot className="w-10 h-10 text-primary" />
            Autonomous Agent Fleet
          </h1>
          <p className="text-white/50 mt-1">Real-time status and decision logs for your SOC agents.</p>
        </div>
        <PhishButton onClick={fetchData} className="bg-white/5 border border-white/10 hover:bg-white/10">
           Refresh Status
        </PhishButton>
      </div>

      {/* Section 1: Agent Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { level: 'L1', name: 'Triage Specialist', desc: 'Alert filtering & classification' },
          { level: 'L2', name: 'Investigator', desc: 'Deep correlation & forensic tracing' },
          { level: 'L3', name: 'Strategic Hunter', desc: 'Proactive threat hunting & Sigma rules' }
        ].map(agent => (
          <DashboardCard key={agent.level} className="p-6 border-white/10 bg-white/5">
              <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-2xl ${
                    agent.level === 'L1' ? 'bg-purple-500/20 text-purple-400' :
                    agent.level === 'L2' ? 'bg-amber-500/20 text-amber-400' :
                    'bg-cyan-500/20 text-cyan-400'
                  }`}>
                    <Shield className="w-6 h-6" />
                  </div>
                  <StatusBadge status="healthy" label="Active" />
              </div>
              <h3 className="text-lg font-bold">{agent.level} {agent.name}</h3>
              <p className="text-xs text-white/40 mb-6">{agent.desc}</p>
              <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-white/30 tracking-widest">Last Run</span>
                  <span className="text-xs font-mono text-white/60">
                    {lastRuns[agent.level] ? new Date(lastRuns[agent.level]).toLocaleTimeString() : 'Never'}
                  </span>
              </div>
          </DashboardCard>
        ))}
      </div>

      {/* Section 3: Agent Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total Decisions', val: stats?.total || 0, icon: Activity },
          { label: 'L1 Decisions', val: stats?.l1 || 0, icon: Zap },
          { label: 'L2 Decisions', val: stats?.l2 || 0, icon: Search },
          { label: 'L3 Decisions', val: stats?.l3 || 0, icon: Shield },
          { label: 'Avg Latency', val: `${stats?.avgTime || 0}ms`, icon: Clock }
        ].map(s => (
          <DashboardCard key={s.label} className="p-4 bg-black/40 border-white/5">
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-tighter mb-1">{s.label}</p>
              <div className="flex items-center justify-between">
                 <p className="text-xl font-black">{s.val}</p>
                 <s.icon className="w-4 h-4 text-white/20" />
              </div>
          </DashboardCard>
        ))}
      </div>

      {/* Section 2: Recent Decisions Table */}
      <DashboardCard className="overflow-hidden border-white/10 bg-white/5">
         <div className="px-6 py-4 border-b border-white/5 bg-black/20 flex items-center justify-between">
            <h2 className="text-sm font-black uppercase tracking-widest text-white/60">Recent Reasoning Logs</h2>
            <Cpu className="w-4 h-4 text-white/20" />
         </div>
         <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
               <thead>
                  <tr className="text-white/40 border-b border-white/5 bg-black/10">
                    <th className="px-6 py-3 font-bold uppercase text-[10px] tracking-widest">Agent</th>
                    <th className="px-6 py-3 font-bold uppercase text-[10px] tracking-widest">Alert ID</th>
                    <th className="px-6 py-3 font-bold uppercase text-[10px] tracking-widest">Decision</th>
                    <th className="px-6 py-3 font-bold uppercase text-[10px] tracking-widest">Confidence</th>
                    <th className="px-6 py-3 font-bold uppercase text-[10px] tracking-widest">Model</th>
                    <th className="px-6 py-3 font-bold uppercase text-[10px] tracking-widest text-right">Time</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-white/5">
                  {reasoning.map((r, i) => (
                    <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                       <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded text-[10px] font-black ${
                            r.agent_level === 'L1' ? 'bg-purple-500/20 text-purple-400' :
                            r.agent_level === 'L2' ? 'bg-amber-500/20 text-amber-400' :
                            'bg-cyan-500/20 text-cyan-400'
                          }`}>{r.agent_level}</span>
                       </td>
                       <td className="px-6 py-4 font-mono text-xs text-white/60">{r.alert_id?.slice(0, 8)}</td>
                       <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            r.decision === 'ESCALATE' ? 'text-red-400' :
                            r.decision === 'CLOSE' ? 'text-emerald-400' :
                            'text-amber-400'
                          }`}>{r.decision}</span>
                       </td>
                       <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                             <span className="text-xs font-mono">{r.confidence_score}%</span>
                             <div className="w-16 h-1 bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full bg-primary" style={{ width: `${r.confidence_score}%` }} />
                             </div>
                          </div>
                       </td>
                       <td className="px-6 py-4 text-xs text-white/40">{r.model_used}</td>
                       <td className="px-6 py-4 text-right text-xs text-white/40">
                          {new Date(r.created_at).toLocaleTimeString()}
                       </td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </DashboardCard>
    </div>
  );
}
