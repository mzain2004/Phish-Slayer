import Link from "next/link";
import { Shield } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-[#050507] text-slate-400 py-16 border-t border-white/5 font-sans antialiased">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-12">
          {/* Column 1: Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 text-teal-400 font-bold text-lg mb-3 tracking-tight">
              <Shield className="w-5 h-5" strokeWidth={1.5} /> PHISH-SLAYER
            </div>
            <p className="text-sm leading-relaxed mb-6 font-medium text-slate-300">
              Autonomous Blue Team AI — Monitor. Analyze. Neutralize.
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Enter email for updates"
                className="bg-slate-900/40 border border-white/5 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/30 flex-1 min-w-0 backdrop-blur-2xl placeholder:text-slate-600 transition-colors"
              />
              <button className="bg-[#2DD4BF] text-slate-950 font-bold px-4 py-2 rounded-lg text-sm hover:bg-[#2DD4BF]/90 transition-colors">
                Subscribe
              </button>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-white font-bold mb-4 tracking-tight">Product</h4>
            <ul className="space-y-2.5">
              <li><Link href="/#features" className="hover:text-teal-400 transition-colors text-sm">Features</Link></li>
              <li><Link href="/pricing" className="hover:text-teal-400 transition-colors text-sm">Pricing</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-4 tracking-tight">Legal</h4>
            <ul className="space-y-2.5">
              <li><Link href="/legal/privacy" className="hover:text-teal-400 transition-colors text-sm">Privacy Policy</Link></li>
              <li><Link href="/legal/terms" className="hover:text-teal-400 transition-colors text-sm">Terms of Service</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-4 tracking-tight">Company</h4>
            <ul className="space-y-2.5">
              <li><Link href="/contact" className="hover:text-teal-400 transition-colors text-sm">Contact</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
          <p>© 2026 Phish-Slayer. All rights reserved.</p>
          <p>Built by <a href="https://phishslayer.tech" className="text-teal-400 hover:underline">Muhammad Zain</a></p>
        </div>
      </div>
    </footer>
  );
}
