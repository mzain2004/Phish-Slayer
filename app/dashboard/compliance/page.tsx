"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { createClient } from "@/lib/supabase/client";
import DashboardCard from "@/components/dashboard/DashboardCard";
import { Loader2, ShieldCheck, CheckCircle2, XCircle, Info, Download } from "lucide-react";
import { toast } from "sonner";

export default function CompliancePage() {
  const { user } = useUser();
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [framework, setFramework] = useState("NIST CSF");
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
        fetchReport(data.organization_id, framework);
      }
    }
    loadOrg();
  }, [user, framework]);

  async function fetchReport(id: string, fw: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/l3/compliance?organizationId=${id}&framework=${fw}`);
      if (res.ok) setReport(await res.json());
    } catch (e) {
      toast.error("Failed to load compliance posture");
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>;
  if (!report) return <div className="p-20 text-center text-white/40">Failed to load report.</div>;

  return (
    <div className="flex flex-col gap-6 p-8 text-white max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShieldCheck className="text-primary" />
            Compliance Posture
          </h1>
          <p className="text-white/50 text-sm">Automated control validation and evidence collection</p>
        </div>
        <div className="flex items-center gap-4">
           <select 
              className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm outline-none focus:border-primary"
              value={framework}
              onChange={e => setFramework(e.target.value)}
           >
              <option value="NIST CSF">NIST CSF</option>
              <option value="SOC 2">SOC 2 Type II</option>
              <option value="ISO 27001">ISO 27001</option>
           </select>
           <button className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all">
              <Download className="w-4 h-4" /> Export Evidence
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <DashboardCard className="p-6">
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Controls Passed</p>
            <p className="text-3xl font-black text-emerald-400 mt-1">{report.passCount}</p>
         </DashboardCard>
         <DashboardCard className="p-6">
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Controls Failed</p>
            <p className="text-3xl font-black text-red-500 mt-1">{report.failCount}</p>
         </DashboardCard>
         <DashboardCard className="p-6">
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Compliance Health</p>
            <p className="text-3xl font-black text-primary mt-1">{Math.round((report.passCount / (report.passCount + report.failCount)) * 100)}%</p>
         </DashboardCard>
      </div>

      <DashboardCard className="overflow-hidden">
         <table className="w-full text-left">
            <thead className="bg-white/5 text-white/40 text-[10px] uppercase tracking-widest font-black">
               <tr>
                  <th className="px-6 py-4">Control ID</th>
                  <th className="px-6 py-4">Requirement</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Automated Evidence</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
               {report.controls.map((c: any) => (
                  <tr key={c.id} className="hover:bg-white/5 transition-all">
                     <td className="px-6 py-4 font-mono text-sm font-bold text-primary">{c.id}</td>
                     <td className="px-6 py-4 text-sm font-medium">{c.name}</td>
                     <td className="px-6 py-4">
                        <span className={`flex items-center gap-1.5 text-[10px] font-black uppercase ${c.status === 'PASS' ? 'text-emerald-400' : 'text-red-500'}`}>
                           {c.status === 'PASS' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                           {c.status}
                        </span>
                     </td>
                     <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-[11px] text-white/60">
                           <Info className="w-3 h-3 text-cyan-400" />
                           {c.evidence}
                        </div>
                     </td>
                  </tr>
               ))}
            </tbody>
         </table>
      </DashboardCard>
    </div>
  );
}
