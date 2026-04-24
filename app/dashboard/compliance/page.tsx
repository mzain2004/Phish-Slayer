'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import DashboardCard from '@/components/dashboard/DashboardCard';
import { ShieldCheck, FileText, Layout, Activity, Download, Loader2 } from 'lucide-react';

export default function CompliancePage() {
  const [loading, setLoading] = useState(true);
  const [coverage, setCoverage] = useState<any[]>([]);
  const [generating, setGenerating] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        // In a real scenario, we'd query alerts and group by mitre_technique
        // For this frontend build, we'll mock the aggregated data
        const mockCoverage = [
          { id: 'T1566', name: 'Phishing', tactic: 'Initial Access', count: 124, status: 'covered' },
          { id: 'T1059', name: 'Command and Scripting Interpreter', tactic: 'Execution', count: 86, status: 'covered' },
          { id: 'T1053', name: 'Scheduled Task/Job', tactic: 'Persistence', count: 42, status: 'partial' },
          { id: 'T1003', name: 'OS Credential Dumping', tactic: 'Credential Access', count: 12, status: 'covered' },
          { id: 'T1027', name: 'Obfuscated Files or Information', tactic: 'Defense Evasion', count: 54, status: 'covered' },
          { id: 'T1046', name: 'Network Service Scanning', tactic: 'Discovery', count: 31, status: 'gap' },
        ];
        setCoverage(mockCoverage);
      } catch (err) {
        console.error('Error fetching compliance data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const handleGenerateReport = async () => {
    try {
      setGenerating(true);
      const response = await fetch('/api/reports/compliance', { method: 'POST' });
      if (!response.ok) throw new Error('Failed to generate report');
      
      // Simulate download
      alert('Compliance report generated and sent to your email.');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const frameworks = [
    { name: 'MITRE ATT&CK', coverage: 84, controls: 182, lastUpdated: '2h ago' },
    { name: 'SOC 2 Type II', coverage: 92, controls: 42, lastUpdated: '1d ago' },
    { name: 'ISO 27001', coverage: 76, controls: 114, lastUpdated: '3d ago' },
  ];

  if (loading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 bg-white/5 rounded-xl border border-white/10" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-48 bg-white/5 rounded-xl border border-white/10" />
          ))}
        </div>
        <div className="h-64 bg-white/5 rounded-xl border border-white/10" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-white">Compliance</h1>
          <p className="text-gray-400">Framework mapping and autonomous audit readiness</p>
        </div>
        <button 
          onClick={handleGenerateReport}
          disabled={generating}
          className="px-4 py-2 bg-[#22d3ee] text-[#0a0a0a] rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-[#22d3ee]/90 transition-all shadow-[0_0_20px_rgba(34,211,238,0.2)] disabled:opacity-50"
        >
          {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
          Generate Report
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard className="p-5">
          <p className="dashboard-card-label">MITRE Techniques</p>
          <div className="flex items-end gap-2 mt-1">
            <p className="dashboard-metric-value">124</p>
            <p className="text-xs text-green-400 mb-1.5 font-medium">+12%</p>
          </div>
        </DashboardCard>
        <DashboardCard className="p-5">
          <p className="dashboard-card-label">Alerts Mapped</p>
          <div className="flex items-end gap-2 mt-1">
            <p className="dashboard-metric-value">8,291</p>
            <p className="text-xs text-[#22d3ee] mb-1.5 font-medium">100%</p>
          </div>
        </DashboardCard>
        <DashboardCard className="p-5">
          <p className="dashboard-card-label">Frameworks Active</p>
          <div className="flex items-end gap-2 mt-1">
            <p className="dashboard-metric-value">{frameworks.length}</p>
          </div>
        </DashboardCard>
        <DashboardCard className="p-5">
          <p className="dashboard-card-label">Last Audit</p>
          <div className="flex items-end gap-2 mt-1">
            <p className="dashboard-metric-value text-xl">24 Apr 2026</p>
          </div>
        </DashboardCard>
      </div>

      {/* Framework Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {frameworks.map((f, i) => (
          <DashboardCard key={i} className="p-6 flex flex-col gap-6">
            <div className="flex justify-between items-start">
              <h3 className="font-bold text-white">{f.name}</h3>
              <span className="text-xs text-gray-500">{f.lastUpdated}</span>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Overall Coverage</span>
                <span className="text-[#22d3ee] font-bold">{f.coverage}%</span>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-[#22d3ee] to-[#a78bfa] rounded-full transition-all duration-1000" 
                  style={{ width: `${f.coverage}%` }}
                />
              </div>
            </div>
            <div className="flex justify-between items-center pt-2">
              <span className="text-xs text-gray-500">{f.controls} Controls Monitored</span>
              <ShieldCheck className="w-4 h-4 text-green-400" />
            </div>
          </DashboardCard>
        ))}
      </div>

      {/* Technique Coverage Table */}
      <DashboardCard className="overflow-hidden">
        <div className="p-6 border-b border-white/10">
          <h2 className="dashboard-section-heading">MITRE ATT&CK Technique Coverage</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 text-gray-400 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">Technique ID</th>
                <th className="px-6 py-4 font-semibold">Technique Name</th>
                <th className="px-6 py-4 font-semibold">Tactic</th>
                <th className="px-6 py-4 font-semibold">Alerts Mapped</th>
                <th className="px-6 py-4 font-semibold">Coverage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {coverage.map((tech) => (
                <tr key={tech.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4 font-mono text-sm text-[#22d3ee]">{tech.id}</td>
                  <td className="px-6 py-4 text-white font-medium">{tech.name}</td>
                  <td className="px-6 py-4 text-xs text-gray-400 uppercase tracking-widest">{tech.tactic}</td>
                  <td className="px-6 py-4 font-mono text-sm">{tech.count}</td>
                  <td className="px-6 py-4">
                    <span className={`badge ${
                      tech.status === 'covered' ? 'badge-clean' : 
                      tech.status === 'partial' ? 'badge-medium' : 
                      'badge-risk'
                    }`}>
                      {tech.status}
                    </span>
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
