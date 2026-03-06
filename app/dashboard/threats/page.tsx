"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldAlert,
  CheckCircle2,
  Share,
  Activity,
  AlertTriangle,
  Code,
  Lock,
  Ban,
  Loader2,
  Radar,
  ImageOff,
  FileDown,
} from "lucide-react";
import { toast } from "sonner";
import { getScans, getIncidents, createIncident, addToWhitelist } from "@/lib/supabase/actions";

type ScanRecord = {
  id?: string;
  target: string;
  status: string;
  date: string;
  verdict?: string;
  malicious_count?: number;
  total_engines?: number;
  ai_summary?: string;
  risk_score?: number;
  threat_category?: string;
};

export default function ThreatIntelligencePage() {
  const router = useRouter();
  const [isPendingAction, startActionTransition] = useTransition();
  const [scan, setScan] = useState<ScanRecord | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [isWhitelisted, setIsWhitelisted] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    getScans()
      .then((rows) => {
        // Pick most recent completed scan with the highest risk_score
        const completed = (rows as ScanRecord[]).filter((r) => r.status === "Completed");
        if (completed.length === 0) {
          setScan(null);
          return;
        }
        completed.sort((a, b) => (b.risk_score ?? 0) - (a.risk_score ?? 0));
        setScan(completed[0]);
        setImageLoaded(false);
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  if (!loaded) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!scan) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <Radar className="w-16 h-16 text-slate-300 mb-4" />
        <h2 className="text-xl font-bold text-slate-700 mb-2">No threat data available</h2>
        <p className="text-sm text-slate-500 max-w-md">
          Run a scan from the <a href="/dashboard/scans" className="text-blue-600 font-semibold hover:underline">Scans</a> page first. The highest-risk completed scan will automatically appear here for deep analysis.
        </p>
      </div>
    );
  }

  const riskScore = scan.risk_score ?? 0;
  const priorityLabel =
    riskScore >= 80
      ? "Priority 1"
      : riskScore >= 50
      ? "Priority 2"
      : "Priority 3";
  const priorityColor =
    riskScore >= 80
      ? "bg-red-600"
      : riskScore >= 50
      ? "bg-orange-500"
      : "bg-yellow-500";
  const verdictLabel = scan.verdict || "Unknown";
  const verdictColor =
    verdictLabel.toLowerCase() === "malicious"
      ? "text-red-600"
      : verdictLabel.toLowerCase() === "clean"
      ? "text-emerald-600"
      : "text-orange-600";
  const threatTag = scan.threat_category || "Unclassified";
  const malicious = scan.malicious_count ?? 0;
  const totalEngines = scan.total_engines ?? 0;
  const scanDate = scan.date
    ? new Date(scan.date).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZoneName: "short",
      })
    : "—";

  // Build a structured payload object for the Source Analysis pane
  const analysisPayload = {
    target: scan.target,
    verdict: verdictLabel,
    risk_score: riskScore,
    threat_category: threatTag,
    malicious_engines: `${malicious} / ${totalEngines}`,
    ai_summary: scan.ai_summary || "No AI analysis available.",
    scan_date: scan.date,
  };

  // Dynamic semantic themes
  const theme = riskScore >= 70
    ? { text: "text-red-600", bg: "bg-red-600", bgLight: "bg-red-50/50", border: "border-red-600", ring: "ring-red-600/20" }
    : riskScore >= 40
    ? { text: "text-orange-500", bg: "bg-orange-500", bgLight: "bg-orange-50/50", border: "border-orange-500", ring: "ring-orange-500/20" }
    : { text: "text-emerald-600", bg: "bg-emerald-600", bgLight: "bg-emerald-50/50", border: "border-emerald-500", ring: "ring-emerald-500/20" };

  const handleTakeAction = () => {
    if (!scan) return;
    startActionTransition(async () => {
      try {
        const result = await createIncident({
          title: `Threat Detected: ${scan.target}`,
          severity: riskScore >= 80 ? 'Critical' : riskScore >= 50 ? 'High' : 'Medium',
          status: 'Open Investigations',
          description: `Automatically escalated from Threat Scanner.\nTarget: ${scan.target}\nRisk Score: ${riskScore}\nVerdict: ${verdictLabel}\nCategory: ${threatTag}`
        });

        if (result?.error) {
          toast.error(result.error);
          return;
        }

        toast.success("Threat escalated to Incident Reports.");
        router.push("/dashboard/incidents");
      } catch (err: any) {
        toast.error(err.message || "Failed to escalate threat");
      }
    });
  };

  const handleWhitelist = () => {
    if (!scan) return;
    startActionTransition(async () => {
      try {
        const result = await addToWhitelist(scan.target);
        
        if (result?.error) {
          toast.error(result.error);
          return;
        }

        toast.success("Target added to whitelist.");
        setIsWhitelisted(true);
      } catch (err: any) {
        toast.error(err.message || "Failed to add to whitelist.");
      }
    });
  };

  const generatePDF = async () => {
    if (!scan) return;
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');

    const doc = new jsPDF('p', 'mm', 'a4');
    const w = doc.internal.pageSize.getWidth();

    // ── Header Bar ──
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, w, 38, 'F');
    doc.setFillColor(13, 148, 136); // teal-600
    doc.rect(0, 38, w, 3, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.text('PHISH-SLAYER', 15, 18);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text('Executive Threat Report', 15, 26);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 15, 32);

    // Confidential badge
    doc.setFillColor(239, 68, 68);
    doc.roundedRect(w - 55, 12, 42, 9, 2, 2, 'F');
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('CONFIDENTIAL', w - 50, 18);

    let y = 52;

    // ── Target Section ──
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text('TARGET', 15, y);
    y += 6;
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42);
    doc.text(scan.target, 15, y);
    y += 12;

    // ── Verdict + Risk Score ──
    const vIsMalicious = scan.verdict?.toLowerCase() === 'malicious';
    doc.setFillColor(vIsMalicious ? 254 : 236, vIsMalicious ? 242 : 253, vIsMalicious ? 242 : 245);
    doc.roundedRect(15, y, w - 30, 22, 3, 3, 'F');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text('VERDICT', 20, y + 8);
    doc.setFontSize(14);
    doc.setTextColor(vIsMalicious ? 220 : 5, vIsMalicious ? 38 : 150, vIsMalicious ? 38 : 105);
    doc.text((scan.verdict || 'Unknown').toUpperCase(), 20, y + 17);

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text('RISK SCORE', w / 2 + 10, y + 8);
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text(`${riskScore} / 100`, w / 2 + 10, y + 17);
    y += 30;

    // ── Threat Category ──
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text('THREAT CATEGORY', 15, y);
    y += 6;
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(threatTag, 15, y);
    y += 12;

    // ── AI Summary ──
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text('AI THREAT ANALYSIS', 15, y);
    y += 6;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    const summaryLines = doc.splitTextToSize(scan.ai_summary || 'No AI analysis available.', w - 30);
    doc.text(summaryLines, 15, y);
    y += summaryLines.length * 4.5 + 8;

    // ── Engine Detection Table ──
    autoTable(doc, {
      startY: y,
      head: [['Metric', 'Value']],
      body: [
        ['Malicious Engines', `${malicious} / ${totalEngines}`],
        ['Detection Rate', totalEngines > 0 ? `${((malicious / totalEngines) * 100).toFixed(1)}%` : 'N/A'],
        ['Priority Level', priorityLabel],
        ['Scan Date', scanDate],
      ],
      theme: 'grid',
      headStyles: { fillColor: [13, 148, 136], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 9, textColor: [51, 65, 85] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: 15, right: 15 },
    });

    // ── Footer ──
    const pageH = doc.internal.pageSize.getHeight();
    doc.setFillColor(248, 250, 252);
    doc.rect(0, pageH - 18, w, 18, 'F');
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text('Phish-Slayer Enterprise Security • Confidential • For authorized recipients only', w / 2, pageH - 8, { align: 'center' });

    doc.save(`phish-slayer-report-${scan.target.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
    toast.success('Executive Report downloaded.');
  };

  return (
    <div className="bg-transparent text-slate-900 font-sans min-h-screen flex flex-col w-full">

      {/* Threat Header */}
      <div className="sticky top-4 sm:top-6 z-40 w-full max-w-7xl mx-auto px-4 sm:px-6 pointer-events-none">
        <section className="bg-white/95 backdrop-blur border border-slate-200 rounded-2xl px-6 py-4 shadow-sm pointer-events-auto">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-6 w-full lg:w-auto">
            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[10px] font-black text-white px-2 py-0.5 rounded-sm uppercase ${theme.bg}`}>
                  {priorityLabel}
                </span>
                <span className="text-xs text-slate-500 font-medium tracking-wide">
                  {scan.id ? `ID-${String(scan.id).slice(0, 8)}` : "—"} • {verdictLabel}
                </span>
              </div>
              <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight leading-none truncate max-w-lg">
                {scan.target}
              </h1>
            </div>
            <div className="hidden sm:flex flex-col items-center justify-center px-6 border-l border-slate-200 h-12">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Threat Score</span>
              <span className={`text-3xl font-black leading-none mt-1 ${theme.text}`}>
                {riskScore}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full lg:w-auto mt-4 lg:mt-0">
            <button
              onClick={generatePDF}
              className="flex-1 lg:flex-none flex items-center justify-center px-5 h-11 rounded-lg border border-teal-200 bg-teal-50 text-teal-700 font-bold text-sm hover:bg-teal-100 transition-all shadow-sm"
            >
              <FileDown className="w-5 h-5 mr-2" />
              Executive Report
            </button>
            <button 
              onClick={handleWhitelist}
              disabled={isPendingAction || isWhitelisted}
              className="flex-1 lg:flex-none flex items-center justify-center px-5 h-11 rounded-lg border border-slate-200 bg-white text-slate-700 font-bold text-sm hover:bg-slate-50 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle2 className={`w-5 h-5 mr-2 ${isWhitelisted ? 'text-emerald-500' : ''}`} />
              {isWhitelisted ? 'Whitelisted' : 'Whitelist'}
            </button>
            <button 
              onClick={handleTakeAction}
              disabled={isPendingAction}
              className="flex-1 lg:flex-none flex items-center justify-center px-8 h-11 rounded-lg bg-gradient-to-r from-teal-400 to-blue-500 hover:from-teal-500 hover:to-blue-600 text-white font-black text-sm transition-all shadow-lg hover:shadow-cyan-500/25 border-none disabled:opacity-50"
            >
              {isPendingAction ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Ban className="w-5 h-5 mr-2 font-bold" />}
              TAKE ACTION
            </button>
          </div>
        </div>
        </section>
      </div>

      {/* Main Grid Content */}
      <main className="flex-1 px-4 sm:px-6 py-8 w-full max-w-7xl mx-auto flex flex-col gap-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          
          {/* Network Activity Panel */}
          <div className="lg:col-span-1 flex flex-col">
            <div className="bg-white rounded-xl border border-slate-200 flex flex-col h-full shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2 uppercase tracking-wide">
                  <Activity className="w-5 h-5 text-teal-600" />
                  Scan Summary
                </h3>
                <span className={`text-[10px] font-mono font-bold text-white px-2 py-0.5 rounded ${theme.bg}`}>
                  {verdictLabel.toUpperCase()}
                </span>
              </div>
              <div className="flex-1 overflow-y-auto max-h-[700px] scrollbar-thin scrollbar-thumb-slate-300">
                <div className="flex flex-col divide-y divide-slate-50">

                  {/* Engine Stats */}
                  <div className={`p-4 ${theme.bgLight} border-l-[6px] ${theme.border}`}>
                    <div className="flex justify-between items-start mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-black text-white px-1.5 py-0.5 rounded ${theme.bg}`}>
                          ENGINES
                        </span>
                        {riskScore >= 40 && (
                          <AlertTriangle className={`w-4 h-4 animate-pulse ${theme.text}`} />
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono font-medium">
                        {malicious}/{totalEngines}
                      </span>
                    </div>
                    <div className={`font-mono text-xs font-bold truncate mb-1.5 ${theme.text}`}>
                      {malicious} malicious detection{malicious !== 1 ? "s" : ""}
                    </div>
                    <div className="w-full bg-slate-200/50 rounded-full h-2 mt-2">
                      <div
                        className={`${theme.bg} h-2 rounded-full transition-all`}
                        style={{ width: totalEngines > 0 ? `${(malicious / totalEngines) * 100}%` : "0%" }}
                      />
                    </div>
                  </div>

                  {/* Threat Category */}
                  <div className={`p-4 border-l-[6px] ${riskScore >= 40 ? theme.border : "border-slate-300"}`}>
                    <div className="flex justify-between items-start mb-1.5">
                      <span className={`text-[10px] font-black text-white px-1.5 py-0.5 rounded ${riskScore >= 40 ? theme.bg : "bg-slate-400"}`}>
                        CATEGORY
                      </span>
                    </div>
                    <div className={`font-mono text-xs font-bold truncate mb-1 ${riskScore >= 40 ? theme.text : "text-slate-700"}`}>
                      {threatTag}
                    </div>
                    <p className="text-[11px] text-slate-500 italic">
                      Risk score: {riskScore}/100
                    </p>
                  </div>

                  {/* AI Summary */}
                  <div className="p-4 hover:bg-slate-50 border-l-[6px] border-teal-500 transition-colors">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] font-bold text-teal-700 bg-teal-100 px-1.5 py-0.5 rounded">
                        AI ANALYSIS
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                      {scan.ai_summary || "No AI analysis available."}
                    </p>
                  </div>

                  {/* Scan Timestamp */}
                  <div className="p-4 hover:bg-slate-50 border-l-[6px] border-transparent transition-colors">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-[10px] font-bold text-teal-700 bg-teal-100 px-1.5 py-0.5 rounded">
                        SCANNED
                      </span>
                    </div>
                    <div className="font-mono text-xs text-slate-800 truncate mt-1">
                      {scanDate}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sandbox & Code Analysis Panel */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden h-full">
              {/* Tab Header */}
              <div className="flex items-center bg-slate-50 border-b border-slate-200 px-4 pt-2.5">
                <div className="flex gap-1">
                  <button className="px-5 py-2.5 bg-white border-t border-x border-slate-200 rounded-t-lg text-[11px] font-black text-teal-600 tracking-wide border-b-2 border-b-white z-10">
                    RENDERED VIEW
                  </button>
                  <button 
                    onClick={() => toast.info("Data extraction engine coming in v2.0")}
                    className="px-5 py-2.5 text-slate-500 hover:text-slate-900 text-[11px] font-bold transition-colors"
                  >
                    DOM TREE
                  </button>
                  <button 
                    onClick={() => toast.info("Data extraction engine coming in v2.0")}
                    className="px-5 py-2.5 text-slate-500 hover:text-slate-900 text-[11px] font-bold transition-colors"
                  >
                    WHOIS
                  </button>
                </div>
                <div className="flex-1"></div>
                <div className="flex items-center gap-3 pr-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Live Sandbox</span>
                  <div className="flex gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-400"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-400"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                  </div>
                </div>
              </div>

              {/* Rendered Sandbox View & Code View */}
              <div className="flex-1 grid grid-cols-1 xl:grid-cols-2 gap-0 min-h-[400px]">
                
                {/* Visual Sandbox */}
                <div className="flex-1 bg-slate-100 p-6 flex flex-col items-center justify-center relative border-r border-slate-200">
                  <div className="w-full max-w-md bg-white rounded-xl shadow-md overflow-hidden border border-slate-200 relative">
                    {/* Fake Browser Header */}
                    <div className="bg-slate-100 border-b border-slate-200 p-2.5 flex items-center justify-between">
                      <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-slate-300"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-slate-300"></div>
                      </div>
                      <div className="bg-white px-3 py-1 rounded-md text-[9px] text-slate-400 font-mono w-2/3 truncate text-center shadow-sm">
                        {scan.target}
                      </div>
                      <div className="w-8"></div>
                    </div>
                    {/* Visual Sandbox Image */}
                    <div className="aspect-[4/3] relative bg-slate-50">
                      {/* IP Address Detection — no screenshot for raw IPs */}
                      {/^(?:\d{1,3}\.){3}\d{1,3}$/.test(scan.target) ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-slate-100">
                          <ImageOff className="w-10 h-10 text-slate-300 mb-3" />
                          <h4 className="text-sm font-bold text-slate-600 mb-1">Sandbox unavailable for raw IP addresses.</h4>
                          <p className="text-xs text-slate-400 max-w-[220px] leading-relaxed">
                            Visual rendering requires a resolvable domain. Analysis data is still available in the panels.
                          </p>
                        </div>
                      ) : (
                        <>
                          {/* Skeleton / Loader */}
                          {!imageLoaded && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-slate-100 z-10 animate-pulse">
                              <Loader2 className="w-8 h-8 animate-spin text-teal-600 mb-4" />
                              <h4 className="text-sm font-bold text-slate-700 mb-1.5">Generating Sandbox...</h4>
                              <p className="text-xs text-slate-500 max-w-[200px] leading-relaxed">
                                Acquiring live snapshot via secure tunnel.
                              </p>
                            </div>
                          )}
                          
                          {/* Live Screenshot */}
                          <img 
                            src={`https://image.thum.io/get/width/1200/crop/800/https://${scan.target}`}
                            alt={`Live snapshot of ${scan.target}`}
                            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                            onLoad={() => setImageLoaded(true)}
                            onError={() => setImageLoaded(true)}
                          />
                        </>
                      )}
                      
                      {/* Scan Overlay */}
                      <div className={`absolute inset-0 ${theme.bgLight} pointer-events-none opacity-20`}>
                        <div className={`absolute left-0 w-full h-[2px] ${theme.bg} shadow-[0_0_12px_rgba(0,0,0,0.3)] animate-[scan_2s_ease-in-out_infinite]`}></div>
                      </div>
                      
                      {/* Threat Tag */}
                      {riskScore >= 40 && (
                        <div className={`absolute top-[55%] left-1/2 -translate-x-1/2 w-[85%] border-2 ${theme.border} bg-white rounded-lg p-2 animate-pulse shadow-lg`}>
                          <div className="flex items-center gap-2">
                            <AlertTriangle className={`w-4 h-4 ${theme.text}`} />
                            <span className={`text-[10px] font-black ${theme.text} uppercase`}>
                              {threatTag}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-8 flex flex-col items-center text-center">
                    <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-2">
                      Scanned: {scanDate}
                    </span>
                  </div>
                </div>

                {/* Source Analysis — Real JSON payload */}
                <div className="w-full flex flex-col bg-slate-900 text-slate-300 font-mono text-[11px] overflow-hidden">
                  <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Code className="w-4 h-4 text-teal-400" />
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Source Analysis
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500">JSON payload</span>
                  </div>
                  <div className="flex-1 overflow-auto p-4 scrollbar-thin scrollbar-thumb-slate-700">
                    <pre className="text-[11px] leading-relaxed whitespace-pre-wrap text-slate-300">
                      {JSON.stringify(analysisPayload, null, 2)}
                    </pre>
                  </div>
                  <div className={`p-4 border-t ${riskScore >= 70 ? "bg-red-600 border-red-700" : riskScore >= 40 ? "bg-orange-500 border-orange-600" : "bg-emerald-600 border-emerald-700"}`}>
                    <div className="flex items-start gap-3">
                      <div className="bg-white/20 p-1 rounded">
                        <ShieldAlert className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="text-white font-black text-xs leading-none mb-1">
                          {riskScore >= 70
                            ? "HIGH RISK DETECTED"
                            : riskScore >= 40
                            ? "MODERATE RISK"
                            : "LOW RISK"}
                        </h4>
                        <p className="text-white/90 text-[10px] leading-tight font-medium">
                          {scan.ai_summary
                            ? scan.ai_summary.slice(0, 120) + (scan.ai_summary.length > 120 ? "…" : "")
                            : "No detailed analysis available for this scan."}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Intel Stats Below Main Panel */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Engine Detection</span>
                <span className="font-bold text-slate-900">
                  {malicious} / {totalEngines} engines
                </span>
                <span className="text-[11px] text-slate-500">
                  {totalEngines > 0
                    ? `${((malicious / totalEngines) * 100).toFixed(1)}% flagged`
                    : "No engine data"}
                </span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Verdict</span>
                <div className={`flex items-center gap-1.5 font-bold ${verdictColor}`}>
                  {verdictLabel.toLowerCase() === "malicious" ? (
                    <AlertTriangle className="w-4 h-4" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>{verdictLabel}</span>
                </div>
                <span className="text-[11px] text-slate-500">
                  Risk: {riskScore}/100
                </span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</span>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-slate-900 rounded flex items-center justify-center text-[10px] text-white font-bold">
                    <ShieldAlert className="w-3 h-3" />
                  </div>
                  <span className="font-bold text-slate-900">{threatTag}</span>
                </div>
                <span className="text-[11px] text-red-600 font-bold">
                  {riskScore >= 70 ? "Action recommended" : "Monitor"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes scan {
            0% { top: 0; opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { top: 100%; opacity: 0; }
          }
        `
      }} />
    </div>
  );
}
