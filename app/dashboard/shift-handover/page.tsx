"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { createClient } from "@/lib/supabase/client";
import DashboardCard from "@/components/dashboard/DashboardCard";
import { Loader2, ClipboardList, Send, Calendar } from "lucide-react";
import { toast } from "sonner";

type Handover = {
  id: string;
  shift_end: string;
  open_alerts_count: number;
  groq_narrative: string;
  created_at: string;
};

export default function ShiftHandoverPage() {
  const { user } = useUser();
  const [handovers, setHandovers] = useState<Handover[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
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
        fetchHandovers(data.organization_id);
      }
    }
    loadOrg();
  }, [user]);

  async function fetchHandovers(id: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/shift-handover?organization_id=${id}`);
      const data = await res.json();
      setHandovers(data);
    } catch (error) {
      toast.error("Failed to load handovers");
    } finally {
      setLoading(false);
    }
  }

  async function generateHandover() {
    if (!orgId) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/shift-handover", {
        method: "POST",
        body: JSON.stringify({ organization_id: orgId })
      });
      if (res.ok) {
        toast.success("Handover report generated");
        fetchHandovers(orgId);
      }
    } catch (error) {
      toast.error("Failed to generate report");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 text-white p-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ClipboardList className="text-primary" />
            Shift Handover
          </h1>
          <p className="text-white/50 text-sm">Automated analyst shift transitions</p>
        </div>
        <button 
          onClick={generateHandover}
          disabled={generating}
          className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-full flex items-center gap-2 font-semibold transition-all disabled:opacity-50"
        >
          {generating ? <Loader2 className="animate-spin w-4 h-4" /> : <Send className="w-4 h-4" />}
          Generate Report
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-6">
          {handovers.length > 0 ? (
            <DashboardCard className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold">Latest Narrative</h2>
                <span className="text-xs text-white/40 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(handovers[0].created_at).toLocaleString()}
                </span>
              </div>
              <div className="bg-black/40 border border-white/10 rounded-xl p-6 font-mono text-sm leading-relaxed whitespace-pre-wrap text-cyan-50">
                {handovers[0].groq_narrative}
              </div>
            </DashboardCard>
          ) : (
            <DashboardCard className="p-20 text-center text-white/40">
              No handover reports generated yet.
            </DashboardCard>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <h3 className="text-sm font-bold uppercase tracking-widest text-white/50">History</h3>
          {loading ? (
            <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>
          ) : (
            handovers.map((h) => (
              <DashboardCard key={h.id} className="p-4 hover:bg-white/5 transition-all cursor-pointer">
                <p className="text-sm font-bold">{new Date(h.created_at).toLocaleDateString()}</p>
                <p className="text-xs text-white/40">{new Date(h.created_at).toLocaleTimeString()} • {h.open_alerts_count} Open Alerts</p>
              </DashboardCard>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
