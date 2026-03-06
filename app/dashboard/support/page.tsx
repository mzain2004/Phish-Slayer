"use client";

import { toast } from "sonner";
import { 
  Search, 
  Rocket, 
  Radar, 
  Microscope, 
  Unplug, 
  CreditCard, 
  Verified, 
  ArrowRight,
  Headset,
  MessageSquare,
  Users
} from "lucide-react";

export default function HelpAndSupportPage() {
  return (
    <div className="text-slate-900 font-sans flex flex-col bg-[#fafafa] min-h-screen">
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 py-8">
        
        {/* Premium Header */}
        <header className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Support Center</h1>
          <p className="mt-1 text-sm text-slate-500">Access clinical security engineering support and documentation.</p>
        </header>
        {/* Knowledge Base Search */}
        <section className="mb-12">
          <div className="relative w-full max-w-4xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              className="h-14 w-full rounded-xl border border-slate-200 bg-white pl-12 pr-32 text-base shadow-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-shadow"
              placeholder="Search documentation, guides, and FAQs..."
              type="text"
            />
            <button 
              onClick={() => toast.info("Searching knowledge base...")}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-10 rounded-lg bg-gradient-to-r from-teal-400 to-blue-500 px-6 text-sm font-bold text-white shadow-md transition-all hover:shadow-cyan-500/25 border-none"
            >
              Search
            </button>
          </div>
          <div className="mt-3 flex flex-wrap justify-center gap-2 text-sm text-slate-500 w-full max-w-4xl mx-auto">
            <span className="font-medium mr-1">Popular:</span>
            <button className="text-teal-600 hover:text-teal-700 hover:underline transition-colors" onClick={() => toast.info("Loading API Setup guide...")}>API Setup</button>
            <span className="text-slate-300">•</span>
            <button className="text-teal-600 hover:text-teal-700 hover:underline transition-colors" onClick={() => toast.info("Loading MFA Recovery guide...")}>MFA Recovery</button>
            <span className="text-slate-300">•</span>
            <button className="text-teal-600 hover:text-teal-700 hover:underline transition-colors" onClick={() => toast.info("Loading Integrations guide...")}>Integrations</button>
          </div>
        </section>

        {/* Category Grid */}
        <section className="mb-12">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Browse by Category</h2>
          </div>
          
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Getting Started */}
            <button 
              onClick={() => toast.info("Opening Getting Started documentation...")}
              className="text-left group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-teal-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-teal-50 text-teal-600 transition-colors group-hover:bg-teal-600 group-hover:text-white">
                <Rocket className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 group-hover:text-teal-700 transition-colors">Getting Started</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500 line-clamp-2">Learn the fundamental concepts of Phish-Slayer and set up your environment in minutes.</p>
              <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-teal-600">
                View articles <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </button>

            {/* Scan Management */}
            <button 
              onClick={() => toast.info("Opening Scan Management documentation...")}
              className="text-left group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-teal-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-teal-50 text-teal-600 transition-colors group-hover:bg-teal-600 group-hover:text-white">
                <Radar className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 group-hover:text-teal-700 transition-colors">Scan Management</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500 line-clamp-2">Configure automated scan schedules, domain monitoring, and perimeter defense strategies.</p>
              <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-teal-600">
                View articles <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </button>

            {/* Threat Intelligence */}
            <button 
              onClick={() => toast.info("Opening Threat Intelligence documentation...")}
              className="text-left group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-teal-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-teal-50 text-teal-600 transition-colors group-hover:bg-teal-600 group-hover:text-white">
                <Microscope className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 group-hover:text-teal-700 transition-colors">Threat Intelligence</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500 line-clamp-2">Analyze real-time data feeds and stay ahead of evolving phishing tactics worldwide.</p>
              <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-teal-600">
                View articles <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </button>

            {/* API & Integrations */}
            <button 
              onClick={() => toast.info("Opening API & Integrations documentation...")}
              className="text-left group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-teal-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-teal-50 text-teal-600 transition-colors group-hover:bg-teal-600 group-hover:text-white">
                <Unplug className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 group-hover:text-teal-700 transition-colors">API & Integrations</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500 line-clamp-2">Connect Phish-Slayer to your existing SOC stack via Webhooks, REST API, or SDKs.</p>
              <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-teal-600">
                View articles <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </button>

            {/* Billing */}
            <button 
              onClick={() => toast.info("Opening Billing documentation...")}
              className="text-left group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-teal-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-teal-50 text-teal-600 transition-colors group-hover:bg-teal-600 group-hover:text-white">
                <CreditCard className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 group-hover:text-teal-700 transition-colors">Billing</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500 line-clamp-2">Manage your subscription tiers, billing cycles, invoices, and payment methods.</p>
              <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-teal-600">
                View articles <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </button>

            {/* Security & Compliance */}
            <button 
              onClick={() => toast.info("Opening Security & Compliance documentation...")}
              className="text-left group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-teal-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-teal-50 text-teal-600 transition-colors group-hover:bg-teal-600 group-hover:text-white">
                <Verified className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 group-hover:text-teal-700 transition-colors">Security & Compliance</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500 line-clamp-2">Download SOC2 reports, review our privacy policy, and manage IAM user roles.</p>
              <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-teal-600">
                View articles <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </button>
          </div>
        </section>

        {/* FAQ Section */}
        {/* FAQ & Contact Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* FAQ Section */}
          <section className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8">
            <div className="mb-8">
              <h2 className="text-xl font-bold tracking-tight text-slate-900">Frequently Asked Questions</h2>
              <p className="mt-1 text-sm text-slate-500">Can't find what you're looking for? Browse these common queries.</p>
            </div>
            
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-6">
                <h4 className="text-base font-bold text-slate-900">How do I whitelist Phish-Slayer IPs for internal testing?</h4>
                <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                  To ensure our simulation emails bypass your filters, you need to add our dedicated IP range (found in Settings &gt; Security) to your Exchange or GSuite allowlist.
                </p>
              </div>
              <div className="border-b border-slate-100 pb-6">
                <h4 className="text-base font-bold text-slate-900">Can I export threat reports to PDF or CSV?</h4>
                <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                  Yes, all dashboard views include an 'Export' button in the top right corner. You can generate scheduled weekly reports automatically in your preferred format.
                </p>
              </div>
              <div className="border-b border-slate-100 pb-6">
                <h4 className="text-base font-bold text-slate-900">What happens if a high-risk threat is detected?</h4>
                <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                  Phish-Slayer will trigger an immediate alert via Slack, Email, or Webhook (depending on your configuration) and provide a one-click containment option.
                </p>
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">Is 2FA mandatory for all users?</h4>
                <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                  Admins can enforce global MFA policies via the Compliance tab. We support TOTP apps, hardware keys, and SMS (Pro plans and above).
                </p>
              </div>
            </div>
          </section>

          {/* Contact Section */}
          <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8 flex flex-col justify-center text-center">
            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-teal-50 text-teal-600">
              <Headset className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Still need help?</h2>
            <p className="mt-2 text-sm text-slate-500 leading-relaxed">
              Our clinical security engineering team is available 24/7 for Enterprise customers.
            </p>
            <div className="mt-8 flex flex-col gap-3">
              <button 
                onClick={() => toast.info("Connecting to live support agent...")}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-teal-400 to-blue-500 px-6 py-3 text-sm font-bold text-white shadow-md transition-all hover:shadow-cyan-500/25 border-none"
              >
                Contact Support
                <MessageSquare className="w-4 h-4 ml-1" />
              </button>
              <button 
                onClick={() => toast.info("Redirecting to Community Forum...")}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-900 transition-all hover:bg-slate-50"
              >
                Join Community
                <Users className="w-4 h-4 ml-1" />
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
