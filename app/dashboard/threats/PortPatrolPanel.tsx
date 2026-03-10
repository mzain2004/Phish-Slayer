"use client";

import { useState } from "react";
import {
  Radar,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Globe,
  Timer,
  Wifi,
  Info,
} from "lucide-react";
import { toast } from "sonner";

interface PortScanResult {
  port: number;
  open: boolean;
  service: string;
  riskLevel: "critical" | "high" | "medium" | "info";
  description: string;
}

interface PortPatrolReport {
  target: string;
  resolvedIp: string;
  scannedAt: string;
  scanDurationMs: number;
  openPorts: PortScanResult[];
  riskSummary: string;
  overallRisk: "clean" | "suspicious" | "critical";
}

interface PortPatrolPanelProps {
  target: string;
  initialData?: PortPatrolReport | null;
}

export default function PortPatrolPanel({
  target,
  initialData,
}: PortPatrolPanelProps) {
  const [report, setReport] = useState<PortPatrolReport | null>(
    initialData || null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(0); // 0=idle, 1=dns, 2=scanning, 3=analyzing

  const runScan = async () => {
    if (!target) return;
    setLoading(true);
    setError(null);
    setStep(1);

    try {
      // Simulate step progress
      setTimeout(() => setStep(2), 800);
      setTimeout(() => setStep(3), 3000);

      const res = await fetch("/api/recon/port-patrol", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Scan failed" }));
        throw new Error(err.error || "Port scan failed");
      }

      const data = await res.json();
      setReport(data);
      toast.success("Port patrol scan complete");
    } catch (err: any) {
      setError(err.message || "Port scan failed");
      toast.error(err.message || "Port scan failed");
    } finally {
      setLoading(false);
      setStep(0);
    }
  };

  const riskRowClass = (level: string) => {
    switch (level) {
      case "critical":
        return "bg-red-50 border-l-4 border-l-red-500";
      case "high":
        return "bg-orange-50 border-l-4 border-l-orange-500";
      case "medium":
        return "bg-amber-50 border-l-4 border-l-amber-400";
      default:
        return "bg-slate-50 border-l-4 border-l-slate-300";
    }
  };

  const riskBadgeClass = (level: string) => {
    switch (level) {
      case "critical":
        return "bg-red-100 text-red-700 border-red-300";
      case "high":
        return "bg-orange-100 text-orange-700 border-orange-300";
      case "medium":
        return "bg-amber-100 text-amber-700 border-amber-300";
      default:
        return "bg-slate-100 text-slate-600 border-slate-300";
    }
  };

  const overallBadge = (risk: string) => {
    switch (risk) {
      case "critical":
        return {
          color: "bg-red-100 text-red-700 border-red-300",
          label: "🔴 CRITICAL",
        };
      case "suspicious":
        return {
          color: "bg-orange-100 text-orange-700 border-orange-300",
          label: "🟠 SUSPICIOUS",
        };
      default:
        return {
          color: "bg-emerald-100 text-emerald-700 border-emerald-300",
          label: "🟢 CLEAN",
        };
    }
  };

  // Loading state
  if (loading) {
    const steps = [
      { label: "Resolving DNS...", done: step > 1 },
      { label: "Scanning 16 ports...", done: step > 2 },
      { label: "Analyzing results...", done: false },
    ];
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-6">
        <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center">
          <Radar className="w-8 h-8 text-orange-600 animate-pulse" />
        </div>
        <div className="space-y-2 w-64">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              {step > i + 1 ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              ) : step === i + 1 ? (
                <Loader2 className="w-4 h-4 text-orange-500 animate-spin shrink-0" />
              ) : (
                <div className="w-4 h-4 rounded-full border-2 border-slate-200 shrink-0" />
              )}
              <span
                className={`text-sm ${step >= i + 1 ? "text-slate-900 font-semibold" : "text-slate-400"}`}
              >
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
          <AlertTriangle className="w-7 h-7 text-red-500" />
        </div>
        <p className="text-sm font-semibold text-red-600">{error}</p>
        <button
          onClick={runScan}
          className="px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 transition-colors"
        >
          Retry Scan
        </button>
      </div>
    );
  }

  // Initial state
  if (!report) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-5">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center shadow-sm">
          <Radar className="w-10 h-10 text-orange-600" />
        </div>
        <div className="text-center">
          <h3 className="text-lg font-bold text-slate-900">Port Patrol</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-xs">
            Active reconnaissance — scans 16 high-risk ports for open services
          </p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 max-w-sm">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-700">
              This performs active network reconnaissance. Only scan targets you
              are authorized to test.
            </p>
          </div>
        </div>
        <button
          onClick={runScan}
          className="flex items-center gap-2 px-6 py-3 bg-orange-600 text-white font-bold text-sm rounded-xl hover:bg-orange-700 transition-all shadow-lg shadow-orange-200 hover:shadow-orange-300 hover:-translate-y-0.5"
        >
          <Radar className="w-4 h-4" />
          Launch Port Patrol
        </button>
      </div>
    );
  }

  // Results view
  const badge = overallBadge(report.overallRisk);
  return (
    <div className="space-y-5 p-1">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Radar className="w-5 h-5 text-orange-600" />
          <h3 className="text-base font-bold text-slate-900">Port Patrol</h3>
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full">
            Active Recon
          </span>
        </div>
        <button
          onClick={runScan}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-orange-600 bg-orange-50 rounded-lg hover:bg-orange-100 border border-orange-200 transition-colors"
        >
          Re-scan
        </button>
      </div>

      {/* Info cards grid */}
      <div className="grid grid-cols-4 gap-3">
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Globe className="w-3.5 h-3.5 text-slate-400" />
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Resolved IP
            </p>
          </div>
          <p className="text-sm font-mono font-bold text-slate-900">
            {report.resolvedIp}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Timer className="w-3.5 h-3.5 text-slate-400" />
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Duration
            </p>
          </div>
          <p className="text-sm font-bold text-slate-900">
            {(report.scanDurationMs / 1000).toFixed(1)}s
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Wifi className="w-3.5 h-3.5 text-slate-400" />
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Open Ports
            </p>
          </div>
          <p className="text-sm font-bold text-slate-900">
            {report.openPorts.length}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Risk
            </p>
          </div>
          <span
            className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${badge.color}`}
          >
            {badge.label}
          </span>
        </div>
      </div>

      {/* Open ports table or clean state */}
      {report.openPorts.length > 0 ? (
        <div className="rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Port
                </th>
                <th className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Service
                </th>
                <th className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Risk
                </th>
                <th className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Description
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {report.openPorts.map((p) => (
                <tr key={p.port} className={riskRowClass(p.riskLevel)}>
                  <td className="px-4 py-2.5 font-mono font-bold text-slate-900">
                    {p.port}
                  </td>
                  <td className="px-4 py-2.5 font-semibold text-slate-800">
                    {p.service}
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${riskBadgeClass(p.riskLevel)}`}
                    >
                      {p.riskLevel}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-slate-600 text-xs">
                    {p.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-10 gap-3 bg-emerald-50 rounded-xl border border-emerald-200">
          <CheckCircle2 className="w-10 h-10 text-emerald-500" />
          <p className="text-sm font-bold text-emerald-700">
            No high-risk ports detected
          </p>
          <p className="text-xs text-emerald-600">
            Target has a minimal attack surface across all 16 scanned ports
          </p>
        </div>
      )}

      {/* Summary */}
      <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
        <p className="text-sm text-slate-700">{report.riskSummary}</p>
        <p className="text-[10px] text-slate-400 mt-2">
          Scanned at: {new Date(report.scannedAt).toLocaleString()}
        </p>
      </div>
    </div>
  );
}
