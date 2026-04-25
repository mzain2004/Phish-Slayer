'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Shield, Zap, Search, Target, Users, BarChart3, ChevronRight, Check, ArrowRight } from 'lucide-react';

export default function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f4f4f5] font-sans selection:bg-[#22d3ee]/30 selection:text-white">
      {/* Grid Background Overlay */}
      <div 
        className="fixed inset-0 z-0 pointer-events-none" 
        style={{
          backgroundImage: `linear-gradient(to right, #ffffff05 1px, transparent 1px), linear-gradient(to bottom, #ffffff05 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}
      />

      {/* Navbar */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 border-b ${isScrolled ? 'bg-[#0a0a0a]/80 backdrop-blur-md border-[#27272a]' : 'bg-transparent border-transparent'}`}>
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-8 h-8 text-[#22d3ee]" />
            <span className="text-xl font-bold tracking-tighter font-mono text-[#f4f4f5]">
              Phish<span className="text-[#22d3ee]">Slayer</span>
            </span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-[#71717a]">
            <a href="#features" className="hover:text-[#22d3ee] transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-[#22d3ee] transition-colors">How It Works</a>
            <a href="#pricing" className="hover:text-[#22d3ee] transition-colors">Pricing</a>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/sign-in"
              className="px-4 py-2 text-sm font-medium text-[#71717a] hover:text-[#f4f4f5] transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="px-5 py-2.5 bg-[#22d3ee] text-[#0a0a0a] text-sm font-bold rounded-md hover:bg-[#22d3ee]/90 transition-all shadow-[0_0_20px_rgba(34,211,238,0.2)]"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-48 pb-24 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#27272a] bg-[#111111] text-[#71717a] text-xs font-mono mb-8">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22d3ee] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#22d3ee]"></span>
          </span>
          v2.0 Autonomous Engine Online
        </div>
        
        <h1 className="text-6xl md:text-8xl font-bold tracking-tight mb-8 text-[#f4f4f5]">
          Your SOC, <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#22d3ee] to-[#a78bfa]">
            Fully Automated.
          </span>
        </h1>
        
        <p className="text-xl md:text-2xl text-[#71717a] max-w-3xl mx-auto mb-12 leading-relaxed">
          PhishSlayer autonomously triages, enriches, responds, and closes alerts. 
          No L1. No L2. One manager reviews what AI already handled.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/sign-up"
            className="w-full sm:w-auto px-8 py-4 bg-[#22d3ee] text-[#0a0a0a] font-bold rounded-lg hover:bg-[#22d3ee]/90 transition-all flex items-center justify-center gap-2"
          >
            Start Free Trial <ChevronRight className="w-4 h-4" />
          </Link>
          <a
            href="#how-it-works"
            className="w-full sm:w-auto px-8 py-4 border border-[#27272a] bg-[#111111] text-[#f4f4f5] font-bold rounded-lg hover:bg-white/5 transition-all"
          >
            See How It Works
          </a>
        </div>
        
        <div className="mt-16 text-[#71717a] text-sm font-medium">
          Used by SOC analysts and MSSPs. Built for real threats.
        </div>
      </section>

      {/* Stats Bar */}
      <section className="relative z-10 border-y border-[#27272a] bg-[#111111]/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-0">
            <div className="flex flex-col items-center md:border-r border-[#27272a]">
              <span className="text-3xl font-bold text-[#f4f4f5] font-mono">95+</span>
              <span className="text-sm text-[#71717a] uppercase tracking-wider mt-1">Threat Intel Engines</span>
            </div>
            <div className="flex flex-col items-center md:border-r border-[#27272a]">
              <span className="text-3xl font-bold text-[#f4f4f5] font-mono">&lt; 30s</span>
              <span className="text-sm text-[#71717a] uppercase tracking-wider mt-1">Mean Time to Triage</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-3xl font-bold text-[#f4f4f5] font-mono">Zero</span>
              <span className="text-sm text-[#71717a] uppercase tracking-wider mt-1">False Positive Noise</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 max-w-7xl mx-auto px-6 py-32">
        <div className="text-center mb-20">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
            Everything a SOC needs. <br />
            <span className="text-[#71717a]">Nothing it doesn't.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-8 border border-[#27272a] bg-[#111111] rounded-2xl hover:border-[#22d3ee]/50 transition-colors group">
            <div className="w-12 h-12 bg-[#22d3ee]/10 rounded-lg flex items-center justify-center mb-6 group-hover:bg-[#22d3ee]/20 transition-colors">
              <Zap className="w-6 h-6 text-[#22d3ee]" />
            </div>
            <h3 className="text-xl font-bold mb-3">Autonomous Triage</h3>
            <p className="text-[#71717a] leading-relaxed">
              L1/L2/L3 agents handle alerts end-to-end without human intervention.
            </p>
          </div>

          <div className="p-8 border border-[#27272a] bg-[#111111] rounded-2xl hover:border-[#22d3ee]/50 transition-colors group">
            <div className="w-12 h-12 bg-[#22d3ee]/10 rounded-lg flex items-center justify-center mb-6 group-hover:bg-[#22d3ee]/20 transition-colors">
              <Search className="w-6 h-6 text-[#22d3ee]" />
            </div>
            <h3 className="text-xl font-bold mb-3">IOC Enrichment</h3>
            <p className="text-[#71717a] leading-relaxed">
              VirusTotal, AbuseIPDB, Shodan, and MalwareBazaar scanned in parallel.
            </p>
          </div>

          <div className="p-8 border border-[#27272a] bg-[#111111] rounded-2xl hover:border-[#22d3ee]/50 transition-colors group">
            <div className="w-12 h-12 bg-[#22d3ee]/10 rounded-lg flex items-center justify-center mb-6 group-hover:bg-[#22d3ee]/20 transition-colors">
              <Target className="w-6 h-6 text-[#22d3ee]" />
            </div>
            <h3 className="text-xl font-bold mb-3">MITRE ATT&CK Mapping</h3>
            <p className="text-[#71717a] leading-relaxed">
              Auto-tag every alert with technique and tactic for full framework visibility.
            </p>
          </div>

          <div className="p-8 border border-[#27272a] bg-[#111111] rounded-2xl hover:border-[#22d3ee]/50 transition-colors group">
            <div className="w-12 h-12 bg-[#22d3ee]/10 rounded-lg flex items-center justify-center mb-6 group-hover:bg-[#22d3ee]/20 transition-colors">
              <Shield className="w-6 h-6 text-[#22d3ee]" />
            </div>
            <h3 className="text-xl font-bold mb-3">Wazuh EDR Integration</h3>
            <p className="text-[#71717a] leading-relaxed">
              Active response: isolate hosts, kill processes, and quarantine files.
            </p>
          </div>

          <div className="p-8 border border-[#27272a] bg-[#111111] rounded-2xl hover:border-[#22d3ee]/50 transition-colors group">
            <div className="w-12 h-12 bg-[#22d3ee]/10 rounded-lg flex items-center justify-center mb-6 group-hover:bg-[#22d3ee]/20 transition-colors">
              <Users className="w-6 h-6 text-[#22d3ee]" />
            </div>
            <h3 className="text-xl font-bold mb-3">MSSP Multi-Tenant</h3>
            <p className="text-[#71717a] leading-relaxed">
              White-label portal with per-client API keys and granular access control.
            </p>
          </div>

          <div className="p-8 border border-[#27272a] bg-[#111111] rounded-2xl hover:border-[#22d3ee]/50 transition-colors group">
            <div className="w-12 h-12 bg-[#22d3ee]/10 rounded-lg flex items-center justify-center mb-6 group-hover:bg-[#22d3ee]/20 transition-colors">
              <BarChart3 className="w-6 h-6 text-[#22d3ee]" />
            </div>
            <h3 className="text-xl font-bold mb-3">Reporting Engine</h3>
            <p className="text-[#71717a] leading-relaxed">
              MTTD/MTTR metrics, compliance reports, and executive PDFs.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="relative z-10 bg-[#111111]/30 py-32 border-y border-[#27272a]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
              From alert to closure <br />
              <span className="text-[#22d3ee]">in under 60 seconds.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="relative text-center md:text-left">
              <div className="w-12 h-12 bg-[#111111] border border-[#22d3ee] rounded-full flex items-center justify-center text-[#22d3ee] font-bold mb-6 mx-auto md:mx-0">
                1
              </div>
              <h4 className="text-lg font-bold mb-2">Alert Fires</h4>
              <p className="text-sm text-[#71717a]">Wazuh, email, or direct API ingestion.</p>
              <div className="hidden md:block absolute top-6 left-12 right-0 h-[1px] bg-gradient-to-r from-[#22d3ee] to-transparent -z-10 w-full" />
            </div>

            <div className="relative text-center md:text-left">
              <div className="w-12 h-12 bg-[#111111] border border-[#22d3ee] rounded-full flex items-center justify-center text-[#22d3ee] font-bold mb-6 mx-auto md:mx-0">
                2
              </div>
              <h4 className="text-lg font-bold mb-2">AI Triages</h4>
              <p className="text-sm text-[#71717a]">L1 agent enriches, deduplicates, scores.</p>
              <div className="hidden md:block absolute top-6 left-12 right-0 h-[1px] bg-gradient-to-r from-[#22d3ee] to-transparent -z-10 w-full" />
            </div>

            <div className="relative text-center md:text-left">
              <div className="w-12 h-12 bg-[#111111] border border-[#22d3ee] rounded-full flex items-center justify-center text-[#22d3ee] font-bold mb-6 mx-auto md:mx-0">
                3
              </div>
              <h4 className="text-lg font-bold mb-2">Autonomous Response</h4>
              <p className="text-sm text-[#71717a]">Isolate, block, escalate via playbook.</p>
              <div className="hidden md:block absolute top-6 left-12 right-0 h-[1px] bg-gradient-to-r from-[#22d3ee] to-transparent -z-10 w-full" />
            </div>

            <div className="text-center md:text-left">
              <div className="w-12 h-12 bg-[#111111] border border-[#22d3ee] rounded-full flex items-center justify-center text-[#22d3ee] font-bold mb-6 mx-auto md:mx-0">
                4
              </div>
              <h4 className="text-lg font-bold mb-2">Case Closed</h4>
              <p className="text-sm text-[#71717a]">Full audit trail, automated report generation.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="relative z-10 max-w-7xl mx-auto px-6 py-32">
        <div className="text-center mb-20">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
            Scale with your SOC.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-8 border border-[#27272a] bg-[#111111] rounded-2xl flex flex-col">
            <h3 className="text-xl font-bold mb-2">Starter</h3>
            <div className="mb-6">
              <span className="text-4xl font-bold">$99</span>
              <span className="text-[#71717a]">/mo</span>
            </div>
            <ul className="space-y-4 mb-8 flex-1">
              <li className="flex items-center gap-2 text-sm text-[#71717a]">
                <Check className="w-4 h-4 text-[#22d3ee]" /> 1 tenant
              </li>
              <li className="flex items-center gap-2 text-sm text-[#71717a]">
                <Check className="w-4 h-4 text-[#22d3ee]" /> 1,000 alerts/day
              </li>
              <li className="flex items-center gap-2 text-sm text-[#71717a]">
                <Check className="w-4 h-4 text-[#22d3ee]" /> Email support
              </li>
            </ul>
            <Link href="/sign-up" className="w-full py-3 border border-[#27272a] text-center rounded-lg hover:bg-white/5 transition-colors font-bold">
              Choose Starter
            </Link>
          </div>

          <div className="p-8 border-2 border-[#22d3ee] bg-[#111111] rounded-2xl flex flex-col relative scale-105 shadow-[0_0_40px_rgba(34,211,238,0.1)]">
            <div className="absolute top-0 right-8 -translate-y-1/2 bg-[#22d3ee] text-[#0a0a0a] text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
              Most Popular
            </div>
            <h3 className="text-xl font-bold mb-2">Professional</h3>
            <div className="mb-6">
              <span className="text-4xl font-bold">$299</span>
              <span className="text-[#71717a]">/mo</span>
            </div>
            <ul className="space-y-4 mb-8 flex-1">
              <li className="flex items-center gap-2 text-sm text-[#71717a]">
                <Check className="w-4 h-4 text-[#7c6af7]" /> 5 organizations
              </li>
              <li className="flex items-center gap-2 text-sm text-[#71717a]">
                <Check className="w-4 h-4 text-[#22d3ee]" /> 10,000 alerts/day
              </li>
              <li className="flex items-center gap-2 text-sm text-[#71717a]">
                <Check className="w-4 h-4 text-[#22d3ee]" /> Slack + Email support
              </li>
              <li className="flex items-center gap-2 text-sm text-[#71717a]">
                <Check className="w-4 h-4 text-[#22d3ee]" /> Custom playbooks
              </li>
            </ul>
            <Link href="/sign-up" className="w-full py-3 bg-[#22d3ee] text-[#0a0a0a] text-center rounded-lg hover:bg-[#22d3ee]/90 transition-colors font-bold">
              Choose Professional
            </Link>
          </div>

          <div className="p-8 border border-[#27272a] bg-[#111111] rounded-2xl flex flex-col">
            <h3 className="text-xl font-bold mb-2">Enterprise</h3>
            <div className="mb-6">
              <span className="text-4xl font-bold">Custom</span>
            </div>
            <ul className="space-y-4 mb-8 flex-1">
              <li className="flex items-center gap-2 text-sm text-[#71717a]">
                <Check className="w-4 h-4 text-[#7c6af7]" /> Unlimited organizations
              </li>
              <li className="flex items-center gap-2 text-sm text-[#71717a]">
                <Check className="w-4 h-4 text-[#22d3ee]" /> Unlimited alerts
              </li>
              <li className="flex items-center gap-2 text-sm text-[#71717a]">
                <Check className="w-4 h-4 text-[#22d3ee]" /> 24/7 SLA support
              </li>
              <li className="flex items-center gap-2 text-sm text-[#71717a]">
                <Check className="w-4 h-4 text-[#22d3ee]" /> Dedicated manager
              </li>
            </ul>
            <a href="mailto:sales@phishslayer.tech" className="w-full py-3 border border-[#27272a] text-center rounded-lg hover:bg-white/5 transition-colors font-bold">
              Contact Sales
            </a>
          </div>
        </div>
      </section>

      {/* CTA Footer Banner */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <div className="bg-gradient-to-r from-[#111111] to-[#111111] border border-[#27272a] rounded-3xl p-12 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#22d3ee]/10 blur-[100px] -z-10" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#a78bfa]/10 blur-[100px] -z-10" />
          
          <h2 className="text-3xl md:text-5xl font-bold mb-8">Ready to automate your SOC?</h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/sign-up"
              className="px-8 py-4 bg-[#22d3ee] text-[#0a0a0a] font-bold rounded-lg hover:bg-[#22d3ee]/90 transition-all"
            >
              Get Started Free
            </Link>
            <a
              href="mailto:sales@phishslayer.tech"
              className="px-8 py-4 border border-[#27272a] text-[#f4f4f5] font-bold rounded-lg hover:bg-white/5 transition-all"
            >
              Talk to Sales
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 max-w-7xl mx-auto px-6 py-20 border-t border-[#27272a]">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-6 h-6 text-[#22d3ee]" />
              <span className="text-xl font-bold tracking-tighter font-mono">PhishSlayer</span>
            </div>
            <p className="text-[#71717a] text-sm max-w-xs leading-relaxed">
              Autonomous SOC Intelligence Platform. Triage, enrich, and respond to threats in real-time.
            </p>
          </div>
          <div>
            <h5 className="text-[#f4f4f5] font-bold mb-4 uppercase text-xs tracking-widest">Product</h5>
            <ul className="space-y-3 text-sm text-[#71717a]">
              <li><a href="#features" className="hover:text-[#22d3ee] transition-colors">Features</a></li>
              <li><a href="#how-it-works" className="hover:text-[#22d3ee] transition-colors">How It Works</a></li>
              <li><a href="#pricing" className="hover:text-[#22d3ee] transition-colors">Pricing</a></li>
            </ul>
          </div>
          <div>
            <h5 className="text-[#f4f4f5] font-bold mb-4 uppercase text-xs tracking-widest">Legal & Contact</h5>
            <ul className="space-y-3 text-sm text-[#71717a]">
              <li><Link href="/privacy" className="hover:text-[#22d3ee] transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-[#22d3ee] transition-colors">Terms of Service</Link></li>
              <li><Link href="/contact" className="hover:text-[#22d3ee] transition-colors">Contact</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-20 pt-8 border-t border-[#27272a] flex justify-between items-center">
          <p className="text-[#71717a] text-xs">
            © 2026 PhishSlayer. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
