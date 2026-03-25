import Link from "next/link";
import { Shield } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-[#080C10] text-[#8B949E] py-16 border-t border-[#1C2128]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-12">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 text-[#E6EDF3] font-bold text-lg mb-3 tracking-tight">
              <Shield className="w-5 h-5 text-[#2DD4BF]" strokeWidth={1.5} /> PHISH-SLAYER
            </div>
            <p className="text-sm leading-[1.7] mb-6 text-[#8B949E]">
              Autonomous Blue Team AI — Monitor. Analyze. Neutralize.
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Enter email for updates"
                className="bg-[#161B22] border border-[#30363D] rounded-[6px] px-3 py-2 text-sm text-[#E6EDF3] focus:outline-none focus:border-[#2DD4BF] flex-1 min-w-0 font-mono text-[12px] placeholder:text-[#8B949E]/50 transition-colors"
              />
              <button className="bg-[#2DD4BF] text-[#0D1117] font-bold px-4 py-2 rounded-[6px] text-sm hover:bg-[#14B8A6] transition-colors">
                Subscribe
              </button>
            </div>
          </div>

          <div>
            <h4 className="text-[#E6EDF3] font-bold mb-4 tracking-tight">Product</h4>
            <ul className="space-y-2.5">
              <li><Link href="/#features" className="hover:text-[#2DD4BF] transition-colors text-sm">Features</Link></li>
              <li><Link href="/pricing" className="hover:text-[#2DD4BF] transition-colors text-sm">Pricing</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-[#E6EDF3] font-bold mb-4 tracking-tight">Legal</h4>
            <ul className="space-y-2.5">
              <li><Link href="/legal/privacy" className="hover:text-[#2DD4BF] transition-colors text-sm">Privacy Policy</Link></li>
              <li><Link href="/legal/terms" className="hover:text-[#2DD4BF] transition-colors text-sm">Terms of Service</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-[#E6EDF3] font-bold mb-4 tracking-tight">Company</h4>
            <ul className="space-y-2.5">
              <li><Link href="/contact" className="hover:text-[#2DD4BF] transition-colors text-sm">Contact</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-[#1C2128] flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
          <p>© 2026 Phish-Slayer. All rights reserved.</p>
          <p>Built by <a href="https://phishslayer.tech" className="text-[#2DD4BF] hover:underline">Muhammad Zain</a></p>
        </div>
      </div>
    </footer>
  );
}
