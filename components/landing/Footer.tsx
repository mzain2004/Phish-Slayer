import Link from "next/link";
import { Shield } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-[#161B22] text-[#8B949E] py-16 border-t border-[#30363D] font-sans">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-12">
          {/* Column 1: Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 text-[#2DD4BF] font-bold text-lg mb-3">
              <Shield className="w-5 h-5" /> PHISH-SLAYER
            </div>
            <p className="text-sm leading-relaxed mb-6 font-medium text-[#E6EDF3]">
              Autonomous Blue Team AI — Monitor. Analyze. Neutralize.
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Enter email for updates"
                className="bg-[#0D1117] border border-[#30363D] rounded-[8px] px-3 py-2 text-sm text-[#E6EDF3] focus:outline-none focus:border-[#2DD4BF] focus:ring-1 focus:ring-[#2DD4BF] flex-1 min-w-0"
              />
              <button className="bg-[#2DD4BF] text-[#0D1117] font-bold px-4 py-2 rounded-[8px] text-sm hover:bg-[#2DD4BF]/90 transition-colors">
                Subscribe
              </button>
            </div>
          </div>

          {/* Column 2: Product */}
          <div>
            <h4 className="text-[#E6EDF3] font-bold mb-4">Product</h4>
            <ul className="space-y-2.5">
              <li><Link href="/#features" className="hover:text-[#2DD4BF] transition-colors text-sm">Features</Link></li>
              <li><Link href="/pricing" className="hover:text-[#2DD4BF] transition-colors text-sm">Pricing</Link></li>
              <li><Link href="/api-docs" className="hover:text-[#2DD4BF] transition-colors text-sm">API Docs</Link></li>
              <li><span className="text-[#8B949E] text-sm cursor-not-allowed">Changelog <span className="text-[10px] ml-1 px-1.5 py-0.5 rounded-full bg-[#1C2128] border border-[#30363D]">Soon</span></span></li>
              <li><span className="text-[#8B949E] text-sm cursor-not-allowed">Status <span className="text-[10px] ml-1 px-1.5 py-0.5 rounded-full bg-[#1C2128] border border-[#30363D]">Soon</span></span></li>
            </ul>
          </div>

          {/* Column 3: Security */}
          <div>
            <h4 className="text-[#E6EDF3] font-bold mb-4">Security</h4>
            <ul className="space-y-2.5">
              <li><Link href="/#how-it-works" className="hover:text-[#2DD4BF] transition-colors text-sm">How It Works</Link></li>
              <li><Link href="/legal/privacy" className="hover:text-[#2DD4BF] transition-colors text-sm">Compliance</Link></li>
              <li><Link href="/legal/privacy" className="hover:text-[#2DD4BF] transition-colors text-sm">Privacy Policy</Link></li>
              <li><Link href="/legal/terms" className="hover:text-[#2DD4BF] transition-colors text-sm">Terms of Service</Link></li>
              <li><a href="mailto:security@phishslayer.tech" className="hover:text-[#2DD4BF] transition-colors text-sm">Bug Bounty</a></li>
            </ul>
          </div>

          {/* Column 4: Company */}
          <div>
            <h4 className="text-[#E6EDF3] font-bold mb-4">Company</h4>
            <ul className="space-y-2.5">
              <li><Link href="/about" className="hover:text-[#2DD4BF] transition-colors text-sm">About</Link></li>
              <li><Link href="/blog" className="hover:text-[#2DD4BF] transition-colors text-sm">Blog</Link></li>
              <li><a href="mailto:careers@phishslayer.tech" className="hover:text-[#2DD4BF] transition-colors text-sm">Careers</a></li>
              <li><Link href="/contact" className="hover:text-[#2DD4BF] transition-colors text-sm">Contact</Link></li>
              <li>
                <button 
                  onClick={() => {
                    const el = document.querySelector(".termly-display-preferences") as HTMLElement;
                    if (el) el.click();
                  }}
                  className="hover:text-[#2DD4BF] transition-colors text-sm bg-transparent border-none p-0"
                >
                  Consent Preferences
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-[#30363D] flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
          <p>© 2026 Phish-Slayer. All rights reserved.</p>
          <p>Built by <a href="https://phishslayer.tech" className="text-[#2DD4BF] hover:underline">Muhammad Zain</a></p>
        </div>
      </div>
    </footer>
  );
}
