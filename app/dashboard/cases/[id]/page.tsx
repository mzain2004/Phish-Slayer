"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  AlertTriangle,
  Clock,
  FileText,
  Loader2,
  Radar,
  ShieldAlert,
  ChevronRight
} from "lucide-react";
import { useAuth, useOrganization } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";
import DashboardCard from "@/components/dashboard/DashboardCard";
import StatusBadge from "@/components/dashboard/StatusBadge";

// Helper to get client-side cookie
function getCookie(name: string) {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift();
  return null;
}


type TimelineEvent = {
  id: string;
  timestamp: string;
  source: string;
  sourceType: string;
  eventType: string;
  actor: string;
  target?: string;
  action?: string;
  outcome?: string;
  severity: string;
};

type AttackPhase = {
  phase: string;
  killChainStage: string;
  startTime: string;
  endTime: string;
  events: TimelineEvent[];
  summary: string;
};

type AttackTimeline = {
  caseId: string;
  orgId: string;
  startTime: string;
  endTime: string;
  totalEvents: number;
  phases: AttackPhase[];
  timeline: TimelineEvent[];
  attackPath: AttackPhase[];
  involvedIps: string[];
  involvedUsers: string[];
};

type EvidenceItem = {
  id: string;
  evidence_type?: string;
  type?: string;
  title: string;
  description?: string | null;
  tags?: string[];
  addedAt?: string;
  created_at?: string;
};

type ForensicReport = {
  caseId: string;
  generatedAt: string;
  executiveSummary: string;
  technicalAnalysis: string;
  attackMethodology: string;
  impactAssessment: string;
  recommendations: string[];
  evidenceCount: number;
  iocSummary: string[];
};

function formatDateTime(value?: string | null) {
  if (!value) return "Unknown";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Unknown";
  return parsed.toLocaleString();
}

export default function CaseDetailPage() {
  const params = useParams();
  const caseId = Array.isArray(params?.id)
    ? params.id[0]
    : (params?.id as string | undefined);
  const { userId } = useAuth();
  const { organization, isLoaded: orgLoaded } = useOrganization();
  const searchParams = useSearchParams();
  const orgId = searchParams.get("orgId") || organization?.id || getCookie("ps_org_id") || null;

  const [activeTab, setActiveTab] = useState<'timeline' | 'chain'>('timeline');
  const [timeline, setTimeline] = useState<AttackTimeline | null>(null);
  const [evidence, setEvidence] = useState<EvidenceItem[]>([]);
  const [report, setReport] = useState<ForensicReport | null>(null);
  const [attackChain, setAttackChain] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState<string | null>(null);

  useEffect(() => {
    if (!orgLoaded) return;
    if (!userId || !orgId || !caseId) {
      setLoading(false);
      return;
    }

    let isActive = true;
    setLoading(true);
    setErrorText(null);

    Promise.all([
      fetch(`/api/cases/${caseId}/timeline`, { cache: "no-store" }),
      fetch(`/api/cases/${caseId}/evidence`, { cache: "no-store" }),
      fetch(`/api/cases/${caseId}/report`, { cache: "no-store" }),
    ])
      .then(async ([timelineRes, evidenceRes, reportRes]) => {
        if (!timelineRes.ok) throw new Error("Failed to load timeline");
        if (!evidenceRes.ok) throw new Error("Failed to load evidence");
        if (!reportRes.ok) throw new Error("Failed to load report");

        const [timelineData, evidenceData, reportData] = await Promise.all([
          timelineRes.json(),
          evidenceRes.json(),
          reportRes.json(),
        ]);

        if (!isActive) return;
        setTimeline(timelineData as AttackTimeline);
        setEvidence((evidenceData as EvidenceItem[]) || []);
        setReport(reportData as ForensicReport);
      })
      .catch((error) => {
        if (!isActive) return;
        setErrorText(error instanceof Error ? error.message : "Unable to load case data");
      })
      .finally(() => {
        if (!isActive) return;
        setLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [caseId, orgId, orgLoaded, userId]);

  useEffect(() => {
    async function loadChain() {
       if (!caseId || !orgId) return;
       const res = await fetch(`/api/incidents/${caseId}/attack-chain`);
       if (res.ok) setAttackChain(await res.json());
    }
    if (activeTab === 'chain' && !attackChain) loadChain();
  }, [activeTab, caseId, orgId, attackChain]);

  const timelineSummary = useMemo(() => {
    if (!timeline) return { phases: 0, events: 0, iocs: 0 };
    return {
      phases: timeline.phases?.length || 0,
      events: timeline.totalEvents || 0,
      iocs: (timeline.involvedIps?.length || 0) + (timeline.involvedUsers?.length || 0),
    };
  }, [timeline]);

  return (
    <div className="flex flex-col gap-6 text-white p-8">
      <div className="flex items-center gap-2 text-sm text-white/40 mb-2">
        <a href="/dashboard/cases" className="hover:text-primary transition-colors">Cases</a>
        <ChevronRight className="w-4 h-4" />
        <span className="text-white">Dossier {caseId}</span>
      </div>

      <DashboardCard className="flex flex-col gap-4 p-6">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-xs uppercase tracking-widest text-slate-400">Case dossier</p>
            <h2 className="text-lg font-semibold text-white">Case {caseId || ""}</h2>
          </div>
          <span className="text-xs text-slate-400">Organization: {organization?.name || "Not selected"}</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
          <DashboardCard className="bg-white/5 border-white/5 px-3 py-2">
            <p className="text-[10px] uppercase font-bold text-white/40">Phases</p>
            <p className="text-xl font-bold text-violet-300">{timelineSummary.phases}</p>
          </DashboardCard>
          <DashboardCard className="bg-white/5 border-white/5 px-3 py-2">
            <p className="text-[10px] uppercase font-bold text-white/40">Events</p>
            <p className="text-xl font-bold text-sky-300">{timelineSummary.events}</p>
          </DashboardCard>
          <DashboardCard className="bg-white/5 border-white/5 px-3 py-2">
            <p className="text-[10px] uppercase font-bold text-white/40">Evidence</p>
            <p className="text-xl font-bold text-emerald-300">{report?.evidenceCount ?? evidence.length}</p>
          </DashboardCard>
          <DashboardCard className="bg-white/5 border-white/5 px-3 py-2">
            <p className="text-[10px] uppercase font-bold text-white/40">IOCs</p>
            <p className="text-xl font-bold text-red-300">{timelineSummary.iocs}</p>
          </DashboardCard>
        </div>
      </DashboardCard>

      <div className="flex items-center gap-4 border-b border-white/10 pb-2">
        <button 
          onClick={() => setActiveTab('timeline')}
          className={`pb-2 px-4 text-sm font-bold transition-all ${activeTab === 'timeline' ? 'text-primary border-b-2 border-primary' : 'text-white/40 hover:text-white/60'}`}
        >
          TIMELINE
        </button>
        <button 
          onClick={() => setActiveTab('chain')}
          className={`pb-2 px-4 text-sm font-bold transition-all ${activeTab === 'chain' ? 'text-primary border-b-2 border-primary' : 'text-white/40 hover:text-white/60'}`}
        >
          ATTACK CHAIN
        </button>
      </div>

      {!orgLoaded ? (
        <DashboardCard className="text-white/70 p-20 text-center">Loading organization...</DashboardCard>
      ) : !orgId ? (
        <DashboardCard className="text-white/70 p-20 text-center">Initializing organization context...</DashboardCard>
      ) : loading ? (
        <div className="flex justify-center p-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : errorText ? (
        <DashboardCard className="border-red-400/40 bg-red-500/10 p-6 text-sm text-red-200">
          <div className="flex items-center gap-2"><AlertTriangle className="h-4 w-4" />{errorText}</div>
        </DashboardCard>
      ) : activeTab === 'timeline' ? (
        <div className="flex flex-col gap-6">
          <DashboardCard className="flex flex-col gap-4 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Radar className="h-5 w-5 text-primary" />
              <h3 className="text-base font-semibold text-white">Attack Timeline</h3>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {(timeline?.phases || []).map((phase) => (
                <div key={`${phase.phase}-${phase.startTime}`} className="rounded-xl border border-white/10 bg-white/[0.02] p-4 hover:bg-white/[0.04] transition-all">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold text-white uppercase">{phase.killChainStage}</p>
                    <span className="bg-orange-500/20 text-orange-400 text-[10px] px-2 py-0.5 rounded-full font-bold">{phase.events.length} EVENTS</span>
                  </div>
                  <p className="mt-2 text-xs text-slate-300 leading-relaxed">{phase.summary}</p>
                  <p className="mt-3 text-[10px] text-slate-500 font-mono">{formatDateTime(phase.startTime)} - {formatDateTime(phase.endTime)}</p>
                </div>
              ))}
            </div>
          </DashboardCard>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
             <DashboardCard className="p-6">
               <h3 className="font-bold mb-4 flex items-center gap-2"><ShieldAlert className="w-4 h-4 text-amber-400" /> Evidence Locker</h3>
               {evidence.length === 0 ? <p className="text-sm text-white/20 italic">No evidence collected.</p> : 
                 evidence.map(item => (
                   <div key={item.id} className="p-3 bg-white/5 rounded-lg border border-white/5 mb-3">
                      <p className="text-sm font-bold">{item.title}</p>
                      <p className="text-[10px] text-white/40 mt-1">{item.description}</p>
                   </div>
                 ))
               }
             </DashboardCard>
             <DashboardCard className="p-6">
               <h3 className="font-bold mb-4 flex items-center gap-2"><FileText className="w-4 h-4 text-cyan-400" /> Executive Summary</h3>
               <p className="text-sm text-slate-300 leading-relaxed">{report?.executiveSummary || "No report generated yet."}</p>
             </DashboardCard>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4">
          <DashboardCard className="p-8">
            <h2 className="text-xl font-bold mb-8 flex items-center gap-2">
               <Radar className="text-primary w-5 h-5" /> Reconstructed Kill Chain
            </h2>
            <div className="flex justify-between items-start gap-4 overflow-x-auto pb-8 pt-4 px-2">
               {['Initial Access', 'Execution', 'Persistence', 'Privilege Escalation', 'Defense Evasion', 'C2', 'Exfiltration'].map((stage, i) => {
                  const hasAlert = attackChain?.phases?.some((p: any) => p.phase?.toLowerCase()?.includes(stage.toLowerCase()));
                  return (
                    <div key={stage} className="flex flex-col items-center gap-3 min-w-[140px] relative group">
                       <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${hasAlert ? 'bg-primary/20 border-primary text-primary shadow-[0_0_15px_rgba(99,102,241,0.5)]' : 'bg-white/5 border-white/10 text-white/20'}`}>
                          {i + 1}
                       </div>
                       <p className={`text-[10px] font-bold uppercase text-center transition-colors ${hasAlert ? 'text-white' : 'text-white/20'}`}>{stage}</p>
                       {i < 6 && <div className="absolute top-6 -right-1/2 w-full h-[2px] bg-white/5 -z-10" />}
                    </div>
                  )
               })}
            </div>
          </DashboardCard>

          <DashboardCard className="p-8">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
               <FileText className="text-cyan-400 w-5 h-5" /> Investigator Narrative
            </h3>
            <div className="bg-black/40 rounded-xl p-8 font-mono text-sm leading-relaxed whitespace-pre-wrap text-cyan-50 border border-white/10 shadow-inner">
               {attackChain ? attackChain.narrative : <div className="flex justify-center p-10"><Loader2 className="animate-spin text-primary" /></div>}
            </div>
          </DashboardCard>
        </div>
      )}
    </div>
  );
}
