"use client";

import { useEffect, useState, useMemo } from "react";
import { useUser } from "@clerk/nextjs";
import { createClient } from "@/lib/supabase/client";
import DashboardCard from "@/components/dashboard/DashboardCard";
import { Loader2, TrendingUp, Clock, AlertTriangle, ShieldCheck, Users, BarChart3 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from "recharts";
import { toast } from "sonner";
import { CISOMetrics } from "@/lib/l3/cisoMetrics";

export default function CISOPage() {
  const { user } = useUser();
  const [metrics, setMetrics] = useState<CISOMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [orgId, setOrgId] = useState<string | null>(null);

  useEffect(() => {
    async function loadOrg() {
      if (!user) return;
      const supabase = createClient();
      const { data } = await supabase
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();
      if (data) {
        setOrgId(data.organization_id);
        fetchMetrics(data.organization_id);
      }
    }
    loadOrg();
  }, [user]);

  async function fetchMetrics(id: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/l3/ciso-metrics?organizationId=${id}`);
      if (res.ok) {
        setMetrics(await res.json());
      }
    } catch (e) {
      toast.error("Failed to load executive metrics");
    } finally {
      setLoading(false);
    }
  }

  const COLORS = ['#6366F1', '#00d4aa', '#F59E0B', '#EF4444', '#8B5CF6'];

  if (loading) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>;
  if (!metrics) return <div className="p-20 text-center text-white/40">Failed to load metrics.</div>;

  return (
    <div className="flex flex-col gap-8 p-8 text-white max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <TrendingUp className="text-primary w-8 h-8" />
          Executive SOC Dashboard
        </h1>
        <p className="text-white/50 mt-1">CISO-level insights and performance metrics for the last 30 days</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         <DashboardCard className="p-6 bg-primary/10 border-primary/20">
            <div className="flex justify-between items-start">
               <span className="text-xs font-bold text-white/40 uppercase tracking-widest">MTTD</span>
               <Clock className="w-4 h-4 text-primary" />
            </div>
            <p className="text-3xl font-bold mt-2">{Math.round(metrics.mttd_seconds / 60)}m</p>
            <p className="text-[10px] text-white/40 mt-1">Mean Time to Detect</p>
         </DashboardCard>

         <DashboardCard className="p-6 bg-cyan-500/10 border-cyan-500/20">
            <div className="flex justify-between items-start">
               <span className="text-xs font-bold text-white/40 uppercase tracking-widest">MTTR</span>
               <ShieldCheck className="w-4 h-4 text-cyan-400" />
            </div>
            <p className="text-3xl font-bold mt-2">{Math.round(metrics.mttr_seconds / 3600)}h</p>
            <p className="text-[10px] text-white/40 mt-1">Mean Time to Respond</p>
         </DashboardCard>

         <DashboardCard className="p-6 bg-orange-500/10 border-orange-500/20">
            <div className="flex justify-between items-start">
               <span className="text-xs font-bold text-white/40 uppercase tracking-widest">SLA Compliance</span>
               <AlertTriangle className="w-4 h-4 text-orange-400" />
            </div>
            <p className="text-3xl font-bold mt-2">{Math.round((1 - metrics.sla_breach_rate) * 100)}%</p>
            <p className="text-[10px] text-white/40 mt-1">Within 4hr Response Window</p>
         </DashboardCard>

         <DashboardCard className="p-6 bg-purple-500/10 border-purple-500/20">
            <div className="flex justify-between items-start">
               <span className="text-xs font-bold text-white/40 uppercase tracking-widest">FP Rate</span>
               <BarChart3 className="w-4 h-4 text-purple-400" />
            </div>
            <p className="text-3xl font-bold mt-2">{Math.round(metrics.false_positive_rate * 100)}%</p>
            <p className="text-[10px] text-white/40 mt-1">False Positive Efficiency</p>
         </DashboardCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         <DashboardCard className="p-8">
            <h2 className="text-xl font-bold mb-6">Alert Volume (30 Days)</h2>
            <div className="h-[300px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={metrics.alert_volume_daily}>
                     <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                     <XAxis dataKey="date" stroke="#ffffff40" fontSize={10} tickFormatter={(v) => v.split('-').slice(1).join('/')} />
                     <YAxis stroke="#ffffff40" fontSize={10} />
                     <Tooltip 
                        contentStyle={{ backgroundColor: '#0a0a0f', border: '1px solid #ffffff10', borderRadius: '12px' }}
                        itemStyle={{ color: '#6366F1' }}
                     />
                     <Line type="monotone" dataKey="count" stroke="#6366F1" strokeWidth={3} dot={{ r: 4, fill: '#6366F1' }} activeDot={{ r: 8 }} />
                  </LineChart>
               </ResponsiveContainer>
            </div>
         </DashboardCard>

         <DashboardCard className="p-8">
            <h2 className="text-xl font-bold mb-6">Top Attack Vectors</h2>
            <div className="h-[300px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metrics.top_attack_types} layout="vertical" margin={{ left: 40 }}>
                     <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" horizontal={false} />
                     <XAxis type="number" hide />
                     <YAxis type="category" dataKey="category" stroke="#ffffff60" fontSize={10} width={100} />
                     <Tooltip cursor={{ fill: '#ffffff05' }} contentStyle={{ backgroundColor: '#0a0a0f', border: '1px solid #ffffff10' }} />
                     <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                        {metrics.top_attack_types.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                     </Bar>
                  </BarChart>
               </ResponsiveContainer>
            </div>
         </DashboardCard>
      </div>

      <DashboardCard className="p-8">
         <div className="flex items-center gap-2 mb-6 text-xl font-bold">
            <Users className="w-5 h-5 text-primary" />
            <h2>Analyst Performance Leaderboard</h2>
         </div>
         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead className="bg-white/5 text-white/40 text-[10px] uppercase tracking-widest font-black">
                  <tr>
                     <th className="px-6 py-4">Analyst ID</th>
                     <th className="px-6 py-4">Alerts Resolved</th>
                     <th className="px-6 py-4 text-right">Avg Triage Time</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-white/5">
                  {metrics.analyst_performance.map((a, i) => (
                     <tr key={i} className="hover:bg-white/5 transition-all">
                        <td className="px-6 py-4 font-mono text-sm">{a.name}</td>
                        <td className="px-6 py-4 font-bold">{a.handled}</td>
                        <td className="px-6 py-4 text-right font-mono text-cyan-400">
                           {Math.round(a.avg_triage_seconds / 60)}m {Math.round(a.avg_triage_seconds % 60)}s
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
