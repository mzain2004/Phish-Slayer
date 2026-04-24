import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function Page() {
  const { userId } = await auth();

  if (userId) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-[#22d3ee]/30 selection:text-white">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-6 pt-32 pb-24 text-center">
        <h1 className="text-6xl md:text-8xl font-bold tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40">
          PhishSlayer
        </h1>
        <p className="text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto mb-12 font-light">
          Autonomous SOC Platform. Zero L1/L2/L3 analysts.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/sign-up"
            className="w-full sm:w-auto px-8 py-4 bg-[#22d3ee] text-black font-bold uppercase tracking-wider rounded-none hover:bg-[#22d3ee]/90 transition-all text-center"
          >
            Get Started Free
          </Link>
          <Link
            href="/sign-in"
            className="w-full sm:w-auto px-8 py-4 border border-white/10 text-white font-bold uppercase tracking-wider rounded-none hover:bg-white/5 transition-all text-center"
          >
            Sign In
          </Link>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-6 py-24 border-t border-white/5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Feature 1 */}
          <div className="flex flex-col gap-4">
            <div className="w-12 h-1 px-0 bg-[#22d3ee]" />
            <h3 className="text-2xl font-bold">Autonomous Triage</h3>
            <p className="text-gray-400 leading-relaxed">
              Every alert enters a self-driving pipeline. Real-time normalization, 
              deduplication, and risk-based decisioning without human touch.
            </p>
            <div className="mt-2 font-mono text-xs text-[#22d3ee]/60 uppercase tracking-widest">
              Status: ACTIVE
            </div>
          </div>

          {/* Feature 2 */}
          <div className="flex flex-col gap-4">
            <div className="w-12 h-1 px-0 bg-[#22d3ee]" />
            <h3 className="text-2xl font-bold">AI Threat Intel</h3>
            <p className="text-gray-400 leading-relaxed">
              Global multi-source enrichment from OTX, MISP, and MalwareBazaar 
              correlated with internal behavior profiles instantly.
            </p>
            <div className="mt-2 font-mono text-xs text-[#22d3ee]/60 uppercase tracking-widest text-code">
              IOC_COUNT: 1.2M+
            </div>
          </div>

          {/* Feature 3 */}
          <div className="flex flex-col gap-4">
            <div className="w-12 h-1 px-0 bg-[#22d3ee]" />
            <h3 className="text-2xl font-bold">Zero Human L1/L2/L3</h3>
            <p className="text-gray-400 leading-relaxed">
              From host isolation to token revocation, PhishSlayer executes 
              full-spectrum SOAR playbooks automatically in seconds.
            </p>
            <div className="mt-2 font-mono text-xs text-[#22d3ee]/60 uppercase tracking-widest">
              MTTR: &lt; 2 MIN
            </div>
          </div>
        </div>
      </div>

      {/* Code Section */}
      <div className="max-w-7xl mx-auto px-6 py-24 border-t border-white/5">
        <div className="bg-[#111111] p-8 font-mono text-sm overflow-x-auto border border-white/5">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-3 h-3 bg-red-500/20 rounded-full" />
            <div className="w-3 h-3 bg-yellow-500/20 rounded-full" />
            <div className="w-3 h-3 bg-green-500/20 rounded-full" />
            <span className="ml-4 text-white/40 uppercase tracking-widest text-xs">PhishSlayer Shell</span>
          </div>
          <p className="text-green-400">$ phishslayer-recon --target 192.168.1.1</p>
          <p className="text-gray-500">[*] Scanning asset for lateral movement artifacts...</p>
          <p className="text-gray-500">[+] Attack path detected: T1021.001 (Remote Desktop Protocol)</p>
          <p className="text-yellow-400">[!] Triggering autonomous host isolation (Wazuh Agent 004)...</p>
          <p className="text-blue-400">[OK] Containment successful. Case #4812 closed.</p>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-7xl mx-auto px-6 py-12 border-t border-white/5 text-gray-600 flex justify-between items-center">
        <div className="text-xs uppercase tracking-[0.2em]">© 2026 PhishSlayer SOC</div>
        <div className="flex gap-8 text-xs uppercase tracking-widest">
          <a href="#" className="hover:text-white transition-colors">Documentation</a>
          <a href="#" className="hover:text-white transition-colors">API</a>
          <a href="#" className="hover:text-white transition-colors">Support</a>
        </div>
      </div>
    </div>
  );
}
