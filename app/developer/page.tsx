'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Code2, 
  Terminal, 
  Key, 
  Webhook, 
  Shield, 
  ChevronRight, 
  Copy, 
  Check, 
  Zap, 
  Layers,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';

export default function DeveloperPortal() {
  const [activeTab, setActiveTab] = useState('curl');
  const [copied, setCopied] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const examples: Record<string, string> = {
    curl: `curl -X POST https://phishslayer.tech/api/ingest/webhook \\
  -H "X-API-Key: ps_your_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "vendor": "Manual",
    "event_type": "test_alert",
    "severity": "HIGH",
    "data": {
      "src_ip": "1.2.3.4",
      "message": "Simulated unauthorized access attempt"
    }
  }'`,
    python: `import requests

url = "https://phishslayer.tech/api/ingest/webhook"
headers = {
    "X-API-Key": "ps_your_key_here",
    "Content-Type": "application/json"
}
payload = {
    "vendor": "Manual",
    "event_type": "test_alert",
    "severity": "HIGH",
    "data": {
        "src_ip": "1.2.3.4",
        "message": "Simulated unauthorized access attempt"
    }
}

response = requests.post(url, json=payload, headers=headers)
print(response.json())`,
    javascript: `const response = await fetch("https://phishslayer.tech/api/ingest/webhook", {
  method: "POST",
  headers: {
    "X-API-Key": "ps_your_key_here",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    vendor: "Manual",
    event_type: "test_alert",
    severity: "HIGH",
    data: {
      src_ip: "1.2.3.4",
      message: "Simulated unauthorized access attempt"
    }
  })
});

const data = await response.json();
console.log(data);`
  };

  const endpoints = [
    { method: 'POST', path: '/v1/ingest/webhook', desc: 'Send security events (Public)', auth: 'API Key' },
    { method: 'GET', path: '/v1/alerts', desc: 'List organization alerts', auth: 'API Key' },
    { method: 'GET', path: '/v1/alerts/{id}', desc: 'Get alert details', auth: 'API Key' },
    { method: 'POST', path: '/v1/cases', desc: 'Create a security case', auth: 'API Key' },
    { method: 'GET', path: '/v1/cases/{id}', desc: 'Get case details and timeline', auth: 'API Key' },
    { method: 'POST', path: '/v1/playbooks/{id}/execute', desc: 'Trigger response action', auth: 'API Key' },
    { method: 'GET', path: '/v1/osint/brand/findings', desc: 'List OSINT results', auth: 'API Key' },
    { method: 'GET', path: '/v1/metrics/summary', desc: 'Get org security posture', auth: 'API Key' },
    { method: 'GET', path: '/v1/health', desc: 'Check API availability', auth: 'None' },
    { method: 'GET', path: '/v1/openapi.json', desc: 'Full OpenAPI spec', auth: 'None' },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white font-sans selection:bg-[#7c6af7]/30 selection:text-white relative overflow-hidden">
      {/* Stars Background */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#7c6af7]/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#00d4aa]/10 blur-[120px] rounded-full" />
        <div className="stars-container opacity-30" />
      </div>

      {/* Navbar */}
      <nav className="relative z-10 border-b border-white/5 bg-[#0a0a0f]/50 backdrop-blur-xl sticky top-0">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <Shield className="w-8 h-8 text-[#7c6af7] group-hover:scale-110 transition-transform" />
            <span className="text-xl font-bold tracking-tighter font-mono">
              Phish<span className="text-[#7c6af7]">Slayer</span> <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded ml-1 text-slate-400">DEV</span>
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/api-docs" className="text-sm text-slate-400 hover:text-white transition-colors">Swagger UI</Link>
            <Link href="/sign-in" className="bg-[#7c6af7] text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#6b5ae6] transition-all">Dashboard</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative z-10 max-w-7xl mx-auto px-6 pt-32 pb-24">
        <div className="max-w-3xl">
            <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-8">
                Build on the <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#7c6af7] to-[#00d4aa]">
                    Autonomous SOC.
                </span>
            </h1>
            <p className="text-xl text-slate-400 leading-relaxed mb-12">
                PhishSlayer is a developer-first platform. Programmatically ingest alerts, 
                query security telemetry, and trigger response actions through our high-performance REST API.
            </p>
            <div className="flex flex-wrap gap-4">
                <a href="#quickstart" className="px-8 py-4 bg-white text-black font-bold rounded-xl hover:bg-slate-100 transition-all flex items-center gap-2">
                    Start Building <ArrowRight className="w-4 h-4" />
                </a>
                <Link href="/api-docs" className="px-8 py-4 bg-white/5 border border-white/10 text-white font-bold rounded-xl hover:bg-white/10 transition-all flex items-center gap-2">
                    Reference Docs <ExternalLink className="w-4 h-4" />
                </Link>
            </div>
        </div>
      </header>

      {/* Quickstart */}
      <section id="quickstart" className="relative z-10 max-w-7xl mx-auto px-6 py-24 border-t border-white/5">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            <div>
                <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
                    <Zap className="text-yellow-400" /> 3-Step Quickstart
                </h2>
                <div className="space-y-12 relative">
                    <div className="absolute left-6 top-4 bottom-4 w-px bg-gradient-to-b from-[#7c6af7] to-transparent opacity-20" />
                    
                    <div className="relative pl-16">
                        <div className="absolute left-0 top-0 w-12 h-12 rounded-full bg-[#7c6af7]/20 border border-[#7c6af7]/40 flex items-center justify-center font-bold text-[#7c6af7]">1</div>
                        <h3 className="text-xl font-bold mb-2">Generate API Key</h3>
                        <p className="text-slate-400">Log in to your dashboard and navigate to Settings &rsaquo; API Keys. Create a new key with ingest and read scopes.</p>
                    </div>

                    <div className="relative pl-16">
                        <div className="absolute left-0 top-0 w-12 h-12 rounded-full bg-[#7c6af7]/20 border border-[#7c6af7]/40 flex items-center justify-center font-bold text-[#7c6af7]">2</div>
                        <h3 className="text-xl font-bold mb-2">Send Your First Alert</h3>
                        <p className="text-slate-400 mb-4">Use the provided curl example to send a test security event to our ingestion engine.</p>
                    </div>

                    <div className="relative pl-16">
                        <div className="absolute left-0 top-0 w-12 h-12 rounded-full bg-[#7c6af7]/20 border border-[#7c6af7]/40 flex items-center justify-center font-bold text-[#7c6af7]">3</div>
                        <h3 className="text-xl font-bold mb-2">Monitor In Real-Time</h3>
                        <p className="text-slate-400">Head over to Mission Control. You will see your alert processed by the L1 Agent within seconds.</p>
                    </div>
                </div>
            </div>

            <div className="bg-[#11111a] border border-white/10 rounded-3xl p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-4">
                    <div className="flex gap-2">
                        {['curl', 'python', 'javascript'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeTab === tab ? 'bg-[#7c6af7] text-white' : 'text-slate-500 hover:text-white'}`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                    <button 
                        onClick={() => handleCopy(examples[activeTab])}
                        className="p-2 hover:bg-white/5 rounded-lg transition-colors text-slate-500 hover:text-white"
                    >
                        {copied ? <Check className="w-4 h-4 text-[#00d4aa]" /> : <Copy className="w-4 h-4" />}
                    </button>
                </div>
                <pre className="text-sm font-mono overflow-x-auto p-4 text-slate-300 leading-relaxed max-h-[400px]">
                    {examples[activeTab]}
                </pre>
            </div>
        </div>
      </section>

      {/* Endpoints Table */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-24 border-t border-white/5">
        <h2 className="text-3xl font-bold mb-12 flex items-center gap-3">
            <Layers className="text-[#00d4aa]" /> Popular Endpoints
        </h2>
        <div className="bg-[#11111a] border border-white/10 rounded-3xl overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-white/5 text-[10px] uppercase font-black tracking-widest text-slate-500">
                        <tr>
                            <th className="px-6 py-4">Method</th>
                            <th className="px-6 py-4">Endpoint</th>
                            <th className="px-6 py-4">Description</th>
                            <th className="px-6 py-4">Auth</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {endpoints.map((ep, i) => (
                            <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded text-[10px] font-black ${ep.method === 'GET' ? 'bg-blue-500/10 text-blue-400' : 'bg-green-500/10 text-green-400'}`}>
                                        {ep.method}
                                    </span>
                                </td>
                                <td className="px-6 py-4 font-mono text-sm text-[#7c6af7]">{ep.path}</td>
                                <td className="px-6 py-4 text-sm text-slate-400">{ep.desc}</td>
                                <td className="px-6 py-4 text-xs font-bold text-slate-500">{ep.auth}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      </section>

      {/* Rate Limits */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-24 border-t border-white/5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
                <h2 className="text-3xl font-bold mb-6">Rate Limits</h2>
                <p className="text-slate-400 mb-8">We enforce rate limits to ensure stability and fair use. Exceeding these limits will return a `429 Too Many Requests` status code.</p>
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                        <span className="font-bold">Starter Plan</span>
                        <span className="text-slate-400">60 RPM</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-[#7c6af7]/10 rounded-2xl border border-[#7c6af7]/20">
                        <span className="font-bold">Pro Plan</span>
                        <span className="text-[#7c6af7] font-black font-mono">600 RPM</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-[#00d4aa]/10 rounded-2xl border border-[#00d4aa]/20">
                        <span className="font-bold">Enterprise</span>
                        <span className="text-[#00d4aa] font-black">Unlimited*</span>
                    </div>
                </div>
            </div>
            <div className="bg-gradient-to-br from-[#7c6af7]/20 to-transparent border border-[#7c6af7]/30 rounded-3xl p-12 flex flex-col items-center justify-center text-center">
                <h3 className="text-2xl font-bold mb-4 text-white">Full API Documentation</h3>
                <p className="text-slate-300 mb-8">Ready for the deep dive? Explore our full OpenAPI 3.1 specification via Swagger UI.</p>
                <Link href="/api-docs" className="px-10 py-4 bg-[#7c6af7] text-white font-black rounded-xl hover:bg-[#6b5ae6] transition-all shadow-[0_0_30px_rgba(124,106,247,0.4)]">
                    Explore API Reference
                </Link>
            </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 max-w-7xl mx-auto px-6 py-20 border-t border-white/5 text-center">
        <p className="text-slate-500 text-sm">© 2026 PhishSlayer Platform. Built for developers.</p>
      </footer>

      <style jsx>{`
        .stars-container {
            position: absolute;
            width: 100%;
            height: 100%;
            background-image: 
                radial-gradient(1px 1px at 20px 30px, #eee, rgba(0,0,0,0)),
                radial-gradient(1px 1px at 40px 70px, #fff, rgba(0,0,0,0)),
                radial-gradient(1.5px 1.5px at 50px 160px, #ddd, rgba(0,0,0,0)),
                radial-gradient(1px 1px at 90px 40px, #fff, rgba(0,0,0,0)),
                radial-gradient(1px 1px at 130px 80px, #fff, rgba(0,0,0,0)),
                radial-gradient(1.5px 1.5px at 160px 120px, #ddd, rgba(0,0,0,0));
            background-repeat: repeat;
            background-size: 200px 200px;
        }
      `}</style>
    </div>
  );
}
