"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { createClient } from "@/lib/supabase/client";
import DashboardCard from "@/components/dashboard/DashboardCard";
import { Loader2, Shield, Target, AlertCircle, FileText, ChevronRight } from "lucide-react";
import { toast } from "sonner";

export default function DetectionCoveragePage() {
  const { user } = useUser();
  const [report, setReport] = useState<any>(null);
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
        fetchReport(data.organization_id);
      }
    }
    loadOrg();
  }, [user]);

  async function fetchReport(id: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/l3/detection-coverage?organizationId=${id}`);
      if (res.ok) setReport(await res.json());
    } catch (e) {
      toast.error("Failed to load coverage report");
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>;
  if (!report) return <div className="p-20 text-center text-white/40">Failed to load report.</div>;

  return (
    <div className="flex flex-col gap-6 p-8 text-white max-w-7xl mx-auto">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="text-primary" />
            MITRE ATT&CK Coverage
          </h1>
          <p className="text-white/50 text-sm">Gap analysis based on active rules and recent detections</p>
        </div>
        <div className="text-right">
           <p className="text-xs font-bold text-white/40 uppercase tracking-widest">Global Coverage</p>
           <p className="text-4xl font-black text-primary">{report.coveragePercent}%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <DashboardCard className="lg:col-span-2 p-6">
           <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
              <Target className="w-5 h-5 text-cyan-400" />
              Techniques Matrix
           </h2>
           <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {[...report.covered, ...report.gaps].sort((a, b) => a.id.localeCompare(b.id)).map(t => {
                const isCovered = report.covered.some((c: any) => c.id === t.id);
                return (
                  <div key={t.id} className={`p-3 rounded-lg border text-left transition-all ${isCovered ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/20 opacity-60'}`}>
                     <p className={`text-[10px] font-bold ${isCovered ? 'text-emerald-400' : 'text-red-400'}`}>{t.id}</p>
                     <p className="text-[11px] font-medium leading-tight mt-1 line-clamp-2">{t.name}</p>
                  </div>
                )
              })}
           </div>
        </DashboardCard>

        <div className="flex flex-col gap-6">
           <DashboardCard className="p-6 border-primary/20">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                 <AlertCircle className="w-5 h-5 text-primary" />
                 Critical Gaps
              </h2>
              <div className="flex flex-col gap-3">
                 {report.gaps.slice(0, 5).map((g: any) => (
                   <div key={g.id} className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5">
                      <span className="text-sm font-medium">{g.name}</span>
                      <a href={`/dashboard/detection-rules?template=${g.id}`} className="text-[10px] font-bold text-primary hover:underline">CREATE RULE</a>
                   </div>
                 ))}
              </div>
           </DashboardCard>

           <DashboardCard className="p-6">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                 <FileText className="w-5 h-5 text-cyan-400" />
                 AI Recommendations
              </h2>
              <div className="bg-black/40 border border-white/10 rounded-xl p-4 font-mono text-[11px] leading-relaxed text-cyan-50 whitespace-pre-wrap">
                 {report.recommendations}
              </div>
           </DashboardCard>
        </div>
      </div>
    </div>
  );
}
