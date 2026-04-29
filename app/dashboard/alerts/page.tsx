"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { createClient } from "@/lib/supabase/client";
import DashboardCard from "@/components/dashboard/DashboardCard";
import { Loader2, ShieldAlert, CheckCircle, UserPlus, Ghost, ShieldOff } from "lucide-react";
import { toast } from "sonner";

type Alert = {
  id: string;
  title: string;
  severity_level: number;
  status: string;
  source_ip: string;
  alert_type: string;
  created_at: string;
  acknowledged_by: string | null;
  acknowledged_at: string | null;
  assigned_to: string | null;
  dedup_count: number;
  is_suppressed: boolean;
  is_false_positive: boolean;
  triage_age_seconds: number | null;
};

export default function AlertsPage() {
  const { user } = useUser();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [analysts, setAnalysts] = useState<{id: string, name: string}[]>([]);

  useEffect(() => {
    fetchAlerts();
    fetchAnalysts();
  }, [user]);

  async function fetchAlerts() {
    setLoading(true);
    try {
      const res = await fetch("/api/alerts");
      if (res.ok) {
        const data = await res.json();
        setAlerts(data);
      }
    } catch (error) {
      toast.error("Failed to load alerts");
    } finally {
      setLoading(false);
    }
  }

  async function fetchAnalysts() {
    if (user) setAnalysts([{ id: user.id, name: user.fullName || "Current User" }]);
  }

  async function handleAcknowledge(id: string) {
    try {
      const res = await fetch(`/api/alerts/${id}/acknowledge`, { method: "POST" });
      if (res.ok) {
        toast.success("Alert acknowledged");
        fetchAlerts();
      } else if (res.status === 409) {
        toast.error("Already acknowledged by another analyst");
      }
    } catch (error) {
      toast.error("Failed to acknowledge");
    }
  }

  async function handleAssign(id: string, analystId: string) {
    try {
      const res = await fetch(`/api/alerts/${id}/assign`, { 
        method: "POST",
        body: JSON.stringify({ analystId })
      });
      if (res.ok) {
        toast.success("Alert assigned");
        fetchAlerts();
      }
    } catch (error) {
      toast.error("Failed to assign");
    }
  }

  async function handleMarkFP(id: string) {
    try {
      const res = await fetch(`/api/alerts/${id}/false-positive`, { method: "POST" });
      if (res.ok) {
        toast.success("Marked as False Positive");
        fetchAlerts();
      }
    } catch (error) {
      toast.error("Failed to mark FP");
    }
  }

  function getSeverityColor(level: number) {
    if (level >= 13) return "text-red-500 bg-red-500/10 border-red-500/30";
    if (level >= 9) return "text-orange-400 bg-orange-400/10 border-orange-400/30";
    return "text-yellow-400 bg-yellow-400/10 border-yellow-400/30";
  }

  return (
    <div className="flex flex-col gap-6 text-white p-8">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ShieldAlert className="text-primary" />
          Alert Center
        </h1>
        <p className="text-white/50 text-sm">Real-time threat monitoring and triage</p>
      </div>

      <DashboardCard className="overflow-hidden">
        {loading ? (
          <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>
        ) : alerts.length === 0 ? (
          <div className="p-20 text-center text-white/40">No alerts found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-white/5 text-white/70 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Alert Details</th>
                  <th className="px-6 py-4">Severity</th>
                  <th className="px-6 py-4">Source IP</th>
                  <th className="px-6 py-4">Triage Age</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {alerts.map((alert) => (
                  <tr key={alert.id} className={`hover:bg-white/5 transition-colors ${alert.is_suppressed ? 'opacity-50 grayscale' : ''}`}>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{alert.title}</span>
                          {alert.dedup_count > 1 && (
                            <span className="bg-primary/20 text-primary text-[10px] px-1.5 py-0.5 rounded font-bold">
                              x{alert.dedup_count} duplicates
                            </span>
                          )}
                          {alert.is_suppressed && (
                            <span className="bg-white/10 text-white/60 text-[10px] px-1.5 py-0.5 rounded font-bold">
                              SUPPRESSED
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-white/40 font-mono uppercase">{alert.alert_type}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${getSeverityColor(alert.severity_level)}`}>
                        Level {alert.severity_level}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-cyan-300">{alert.source_ip || "-"}</td>
                    <td className="px-6 py-4 text-xs">
                      {alert.acknowledged_at ? (
                        <span className="text-green-400 flex items-center gap-1"><CheckCircle className="w-3 h-3"/> ACK'D</span>
                      ) : (
                        <span className="text-orange-400 font-bold">{alert.triage_age_seconds}s aging</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className={`text-[10px] font-bold uppercase ${alert.status === 'open' ? 'text-primary' : 'text-white/40'}`}>
                          {alert.status}
                        </span>
                        {alert.assigned_to && (
                          <span className="text-[10px] text-white/40 flex items-center gap-1">
                            <UserPlus className="w-3 h-3" /> {alert.assigned_to === user?.id ? "YOU" : "ANALYST"}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {!alert.acknowledged_at && !alert.is_suppressed && (
                          <button 
                            onClick={() => handleAcknowledge(alert.id)}
                            className="bg-primary hover:bg-primary/90 text-white px-3 py-1 rounded text-xs font-bold"
                          >
                            ACK
                          </button>
                        )}
                        <select 
                          className="bg-white/5 border border-white/10 rounded px-2 py-1 text-xs outline-none focus:border-primary"
                          value={alert.assigned_to || ""}
                          onChange={(e) => handleAssign(alert.id, e.target.value)}
                        >
                          <option value="">Assign...</option>
                          {analysts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                        </select>
                        <button 
                          onClick={() => handleMarkFP(alert.id)}
                          title="Mark as False Positive"
                          className="p-1.5 rounded hover:bg-red-500/20 text-white/40 hover:text-red-400 transition-all"
                        >
                          <Ghost className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DashboardCard>
    </div>
  );
}
