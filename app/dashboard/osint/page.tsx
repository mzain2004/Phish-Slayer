"use client";

import { useEffect, useState, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { createClient } from "@/lib/supabase/client";
import DashboardCard from "@/components/dashboard/DashboardCard";
import { Loader2, Search, Zap, History, Shield, AlertTriangle, FileText, ChevronDown, ChevronUp, Database, SearchIcon } from "lucide-react";
import { toast } from "sonner";
import EmptyState from "@/components/ui/empty-state";
import SkeletonLoader from "@/components/ui/skeleton-loader";

export default function OsintPage() {
  const { user } = useUser();
  const [type, setType] = useState('domain');
  const [value, setValue] = useState('');
  const [investigationId, setInvestigationId] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'running' | 'complete'>('idle');
  const [report, setReport] = useState<any>(null);
  const [results, setResults] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [expandedCollector, setExpandedCollector] = useState<string | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);

  useEffect(() => {
    async function loadOrg() {
      if (!user) return;
      const supabase = createClient();
      const { data } = await supabase.from("organization_members").select("organization_id").eq("user_id", user.id).limit(1).maybeSingle();
      if (data) {
        setOrgId(data.organization_id);
        fetchHistory(data.organization_id);
      }
    }
    loadOrg();
  }, [user]);

  if (!orgId) return <SkeletonLoader />;

  async function fetchHistory(id: string) {
    const res = await fetch(`/api/osint/history?organizationId=${id}`);
    if (res.ok) setHistory(await res.json());
  }

  async function startInvestigation() {
    if (!orgId || !value) return;
    setStatus('running');
    setReport(null);
    setResults([]);
    try {
      const res = await fetch("/api/osint/investigate", {
        method: "POST",
        body: JSON.stringify({ targetType: type, targetValue: value, organizationId: orgId })
      });
      if (res.ok) {
        const data = await res.json();
        setInvestigationId(data.investigationId);
        pollStatus(data.investigationId);
      } else {
        setStatus('idle');
        toast.error("Failed to start investigation");
      }
    } catch (e) {
      setStatus('idle');
    }
  }

  const pollStatus = useCallback((id: string) => {
    const interval = setInterval(async () => {
      const res = await fetch(`/api/osint/${id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.investigation.status === 'complete') {
          setReport(data.report);
          setResults(data.results);
          setStatus('complete');
          fetchHistory(orgId!);
          clearInterval(interval);
        } else if (data.investigation.status === 'failed') {
          setStatus('idle');
          toast.error("Investigation failed");
          clearInterval(interval);
        }
      }
    }, 3000);
  }, [orgId]);

  function getRiskColor(score: number) {
    if (score >= 80) return "text-red-500";
    if (score >= 60) return "text-orange-500";
    if (score >= 30) return "text-yellow-500";
    return "text-green-500";
  }

  return (
    <div className="flex flex-col gap-8 p-8 text-white max-w-7xl mx-auto">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Zap className="text-primary w-8 h-8" />
            OSINT Investigator
          </h1>
          <p className="text-white/50 mt-1">External intelligence gathering and deep analysis agent</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 flex flex-col gap-6">
          <DashboardCard className="p-6 bg-white/5 border-white/10 backdrop-blur-xl">
             <div className="flex gap-4 items-center">
                <select 
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-primary"
                  value={type}
                  onChange={e => setType(e.target.value)}
                  aria-label="Target type"
                >
                  <option value="domain">Domain</option>
                  <option value="ip">IP Address</option>
                  <option value="email">Email</option>
                  <option value="hash">File Hash</option>
                </select>
                <div className="flex-1 relative">
                  <label htmlFor="target-value" className="sr-only">Target value</label>
                  <input 
                    id="target-value"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-6 py-3 text-sm outline-none focus:border-primary placeholder:text-white/20"
                    placeholder="Enter target value (e.g. example.com or 1.1.1.1)..."
                    value={value}
                    onChange={e => setValue(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && startInvestigation()}
                  />
                </div>
                <button 
                  onClick={startInvestigation}
                  disabled={status === 'running'}
                  className="bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-xl font-black flex items-center gap-2 transition-all disabled:opacity-50"
                  aria-label="Start OSINT investigation"
                >
                  {status === 'running' ? <Loader2 className="animate-spin w-5 h-5" /> : "INVESTIGATE"}
                </button>
             </div>
          </DashboardCard>

          {status === 'running' && (
            <div className="flex flex-col items-center justify-center p-20 gap-4 opacity-50">
               <Loader2 className="w-12 h-12 animate-spin text-primary" />
               <p className="font-bold tracking-widest text-xs uppercase">Agent is gathering intelligence...</p>
            </div>
          )}

          {status === 'complete' && report && (
            <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <DashboardCard className="p-8 flex flex-col items-center justify-center gap-2 border-primary/20">
                   <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Calculated Risk</p>
                   <p className={`text-6xl font-black ${getRiskColor(report.risk_score)}`}>{report.risk_score}</p>
                   <p className="text-[10px] font-medium text-white/20">OSINT AI VERDICT</p>
                </DashboardCard>

                <DashboardCard className="md:col-span-2 p-8 border-cyan-500/20">
                   <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-cyan-400" />
                      AI Technical Narrative
                   </h2>
                   <p className="text-sm leading-relaxed text-slate-300 font-medium">{report.narrative}</p>
                </DashboardCard>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <DashboardCard className="p-6">
                    <h3 className="font-bold mb-4 flex items-center gap-2 text-primary"><Shield className="w-4 h-4"/> Key Findings</h3>
                    <ul className="flex flex-col gap-3">
                       {(report.key_findings || []).map((f: string, i: number) => (
                         <li key={i} className="text-xs flex gap-3 p-3 bg-white/5 rounded-lg border border-white/5">
                            <span className="text-primary font-bold">0{i+1}</span>
                            {f}
                         </li>
                       ))}
                    </ul>
                 </DashboardCard>
                 <DashboardCard className="p-6">
                    <h3 className="font-bold mb-4 flex items-center gap-2 text-cyan-400"><AlertTriangle className="w-4 h-4"/> Recommendations</h3>
                    <ul className="flex flex-col gap-3">
                       {(report.recommendations || []).map((r: string, i: number) => (
                         <li key={i} className="text-xs flex gap-3 p-3 bg-white/5 rounded-lg border border-white/5">
                            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1" />
                            {r}
                         </li>
                       ))}
                    </ul>
                 </DashboardCard>
              </div>

              <div className="flex flex-col gap-3">
                 <h3 className="text-xs font-bold text-white/30 uppercase tracking-widest px-2">Raw Intelligence Results</h3>
                 {results.map((res) => (
                    <DashboardCard key={res.id} className="overflow-hidden border-white/5">
                       <div 
                         onClick={() => setExpandedCollector(expandedCollector === res.collector ? null : res.collector)}
                         className="p-4 flex justify-between items-center cursor-pointer hover:bg-white/5 transition-all"
                       >
                          <div className="flex items-center gap-3">
                             <Database className="w-4 h-4 text-white/40" />
                             <span className="font-bold text-sm">{res.collector}</span>
                          </div>
                          {expandedCollector === res.collector ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                       </div>
                       {expandedCollector === res.collector && (
                         <div className="p-6 bg-black/40 border-t border-white/5">
                            <pre className="text-[10px] font-mono leading-relaxed text-cyan-50 whitespace-pre-wrap overflow-auto max-h-[300px]">
                               {JSON.stringify(res.raw_data, null, 2)}
                            </pre>
                         </div>
                       )}
                    </DashboardCard>
                 ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-6">
           <div className="flex items-center gap-2 text-xs font-bold text-white/40 uppercase tracking-widest px-2">
              <History className="w-4 h-4" />
              History
           </div>
           <div className="flex flex-col gap-3">
              {history.length === 0 ? (
                <EmptyState 
                    icon={SearchIcon}
                    title="No OSINT findings"
                    description="Configure brand monitoring to scan for threats."
                    actionLabel="Configure"
                    actionHref="/dashboard/settings"
                />
              ) : history.map((h) => (
                <div 
                  key={h.id} 
                  onClick={async () => {
                    const res = await fetch(`/api/osint/${h.id}`);
                    const data = await res.json();
                    setReport(data.report);
                    setResults(data.results);
                    setStatus('complete');
                    setValue(h.target_value);
                    setType(h.target_type);
                  }}
                  className="p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 cursor-pointer transition-all group"
                >
                   <div className="flex justify-between items-start">
                      <p className="text-xs font-mono font-bold truncate max-w-[150px]">{h.target_value}</p>
                      <span className={`text-[10px] font-black ${getRiskColor(h.risk_score)}`}>{h.risk_score}</span>
                   </div>
                   <p className="text-[10px] text-white/30 mt-2 uppercase">{h.target_type} • {new Date(h.created_at).toLocaleDateString()}</p>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
}
