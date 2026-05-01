'use client';

import { useEffect, useState } from 'react';
import DashboardCard from '@/components/dashboard/DashboardCard';
import { Share2, Link as LinkIcon, Settings, CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react';

type Connector = {
  id: string;
  name: string;
  status: 'connected' | 'disconnected' | 'error';
  lastSync: string;
  icon: string;
  color: string;
};

export default function ConnectorsPage() {
  const [loading, setLoading] = useState(false);
  const [connectors, setConnectors] = useState<Connector[]>([
    { id: 'crowdstrike', name: 'CrowdStrike', status: 'connected', lastSync: '5m ago', icon: 'CS', color: 'bg-red-500' },
    { id: 'elastic', name: 'Elastic SIEM', status: 'connected', lastSync: '12m ago', icon: 'EL', color: 'bg-yellow-400' },
    { id: 'servicenow', name: 'ServiceNow', status: 'disconnected', lastSync: 'N/A', icon: 'SN', color: 'bg-green-600' },
    { id: 'jira', name: 'Jira', status: 'connected', lastSync: '1h ago', icon: 'JR', color: 'bg-blue-600' },
    { id: 'pagerduty', name: 'PagerDuty', status: 'error', lastSync: '2h ago', icon: 'PD', color: 'bg-green-400' },
    { id: 'wazuh', name: 'Wazuh EDR', status: 'connected', lastSync: 'Just now', icon: 'WZ', color: 'bg-blue-400' },
  ]);

  const [configuring, setConfiguring] = useState<Connector | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!configuring) return;
    try {
      setSaving(true);
      const response = await fetch('/api/connectors/configure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectorId: configuring.id, apiKey }),
      });

      if (!response.ok) throw new Error('Failed to save configuration');
      
      alert('Configuration saved successfully');
      setConfiguring(null);
      setApiKey('');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Integrations</h1>
        <p className="text-gray-400">External connector status and configuration</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {connectors.map((connector) => (
          <DashboardCard key={connector.id} className="p-6 flex items-center justify-between group">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${connector.color} shadow-lg`}>
                {connector.icon}
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-white">{connector.name}</h3>
                  <span className={`badge ${
                    connector.status === 'connected' ? 'badge-clean' : 
                    connector.status === 'error' ? 'badge-risk' : 
                    'badge-offline'
                  }`}>
                    {connector.status}
                  </span>
                </div>
                {connector.id === 'wazuh' && (
                  <p className="text-[10px] text-[#22d3ee] font-mono">167.172.85.62</p>
                )}
                <p className="text-xs text-gray-500">Last sync: {connector.lastSync}</p>
              </div>
            </div>
            <button 
              onClick={() => setConfiguring(connector)}
              className="p-2 bg-white/5 border border-white/10 rounded-lg hover:bg-[#22d3ee]/10 hover:text-[#22d3ee] transition-all"
              aria-label={`Configure ${connector.name}`}
            >
              <Settings className="w-4 h-4" />
            </button>
          </DashboardCard>
        ))}
      </div>

      {/* Configure Modal */}
      {configuring && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <DashboardCard className="w-full max-w-md p-6 shadow-2xl border-[#22d3ee]/30">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] text-white font-bold ${configuring.color}`}>
                  {configuring.icon}
                </div>
                <h2 className="text-xl font-bold text-white">Configure {configuring.name}</h2>
              </div>
              <button 
                onClick={() => { setConfiguring(null); setApiKey(''); }} 
                className="text-gray-500 hover:text-white"
                aria-label="Close configuration modal"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label htmlFor="api-key" className="text-xs font-bold uppercase tracking-widest text-gray-400">API Key / Token</label>
                <input 
                  id="api-key"
                  type="password" 
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Paste your integration key here..."
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm focus:border-[#22d3ee] outline-none transition-colors"
                />
              </div>

              <div className="p-4 bg-[#22d3ee]/5 border border-[#22d3ee]/20 rounded-xl flex gap-3">
                <AlertCircle className="w-5 h-5 text-[#22d3ee] shrink-0" />
                <p className="text-xs text-gray-400 leading-relaxed">
                  Keys are encrypted at rest and stored in our secure vault. PhishSlayer uses this to ingest alerts and trigger response actions.
                </p>
              </div>

              <div className="flex gap-3 mt-4">
                <button 
                  onClick={() => { setConfiguring(null); setApiKey(''); }}
                  className="flex-1 py-3 border border-white/10 rounded-xl text-sm font-bold hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSave}
                  disabled={saving || !apiKey}
                  className="flex-1 py-3 bg-[#22d3ee] text-[#0a0a0a] rounded-xl text-sm font-bold hover:bg-[#22d3ee]/90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Integration'}
                </button>
              </div>
            </div>
          </DashboardCard>
        </div>
      )}
    </div>
  );
}
