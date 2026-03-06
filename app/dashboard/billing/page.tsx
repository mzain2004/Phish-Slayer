"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  ShieldCheck,
  LayoutDashboard,
  Radar,
  Shield,
  FileText,
  Users,
  CreditCard,
  Settings,
  HelpCircle,
  Check,
  X,
  CheckCircle2,
  Plus,
  Download
} from "lucide-react";

export default function BillingPage() {
  const [activePlan, setActivePlan] = useState('Professional');

  const handlePlanChange = (planName: string) => {
    const plans = ['Basic', 'Professional', 'Enterprise'];
    const currentIndex = plans.indexOf(activePlan);
    const newIndex = plans.indexOf(planName);
    
    if (newIndex > currentIndex) {
      toast.success(`Successfully upgraded to ${planName} plan!`);
    } else {
      toast.success(`Successfully downgraded to ${planName} plan!`);
    }
    setActivePlan(planName);
  };

  const getPlanButton = (planName: string) => {
    const plans = ['Basic', 'Professional', 'Enterprise'];
    const currentIndex = plans.indexOf(activePlan);
    const planIndex = plans.indexOf(planName);

    if (currentIndex === planIndex) {
      return (
        <button className="w-full py-2.5 rounded-lg bg-teal-50 text-teal-700 font-semibold cursor-default border border-teal-100">
          Active Plan
        </button>
      );
    } else if (planIndex > currentIndex) {
      return (
        <button 
          onClick={() => handlePlanChange(planName)}
          className="w-full py-2.5 rounded-lg bg-gradient-to-r from-teal-400 to-blue-500 text-white font-semibold hover:shadow-lg hover:shadow-cyan-500/25 transition-all shadow-sm border-none"
        >
          Upgrade
        </button>
      );
    } else {
      return (
        <button 
          onClick={() => handlePlanChange(planName)}
          className="w-full py-2.5 rounded-lg border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors shadow-sm"
        >
          Downgrade
        </button>
      );
    }
  };

  return (
    <div className="bg-[#fafafa] text-slate-900 font-sans min-h-full flex">
      
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 flex flex-col bg-white border-r border-slate-200 h-screen z-20">
        <div className="p-6 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 leading-tight">Phish-Slayer</h1>
            <p className="text-xs text-slate-500 font-medium">Enterprise Admin</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto w-full">
          <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors group" href="#">
            <LayoutDashboard className="w-5 h-5 text-slate-400 group-hover:text-blue-600 transition-colors" />
            <span className="text-sm font-medium">Dashboard</span>
          </a>
          <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors group" href="#">
            <Radar className="w-5 h-5 text-slate-400 group-hover:text-blue-600 transition-colors" />
            <span className="text-sm font-medium">Scan Manager</span>
          </a>
          <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors group" href="#">
            <Shield className="w-5 h-5 text-slate-400 group-hover:text-blue-600 transition-colors" />
            <span className="text-sm font-medium">Threat Intel</span>
          </a>
          <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors group" href="#">
            <FileText className="w-5 h-5 text-slate-400 group-hover:text-blue-600 transition-colors" />
            <span className="text-sm font-medium">Reports</span>
          </a>

          <div className="pt-4 mt-4 border-t border-slate-100">
            <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Settings</p>
            <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors group" href="#">
              <Users className="w-5 h-5 text-slate-400 group-hover:text-blue-600 transition-colors" />
              <span className="text-sm font-medium">Team Members</span>
            </a>
            <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-blue-50 text-blue-600 transition-colors" href="#">
              <CreditCard className="w-5 h-5" />
              <span className="text-sm font-medium">Billing & Plans</span>
            </a>
            <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors group" href="#">
              <Settings className="w-5 h-5 text-slate-400 group-hover:text-blue-600 transition-colors" />
              <span className="text-sm font-medium">Configuration</span>
            </a>
          </div>
        </nav>

        <div className="p-4 border-t border-slate-200">
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-slate-200 rounded-full h-8 w-8 flex items-center justify-center overflow-hidden">
                <img 
                  alt="User Avatar" 
                  className="h-full w-full object-cover" 
                  title="Portrait of a smiling man" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDL30QJ5OfGFTowCaHTFdOu0ecwbQFzBYc57bCs2ymQIAkVkXWPWF8hwbDd4TkizXxcxdM-4vmbIzB8WcFhpt1CBBHMV_07moIzuJSbYEjjIDfRZHNqvE_CCzhFBFb4jOya04HU34ZAZJErzq15go6zZ-yVHoeSXHd0g2p6l-Sw6DtV_WUGLoozKE3q9A06NdCdWylgg4ycYicIJiqt-799mZydBNFLbKu1hoMevobE50-8VzseK7xFHyzmAI3wor2BXGDAQi5faRV3"
                />
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-semibold text-slate-900 truncate">Alex Morgan</p>
                <p className="text-xs text-slate-500 truncate">alex@enterprise.com</p>
              </div>
            </div>
            <button className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold py-2 px-4 rounded-lg transition-colors shadow-sm">
              <ShieldCheck className="w-4 h-4" />
              Upgrade Plan
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-h-full bg-[#fafafa]">
        
        {/* Top Header */}
        <header className="h-16 flex items-center justify-between px-8 bg-white border-b border-slate-200 shrink-0 shadow-sm z-10">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-slate-900">Billing & Subscription</h2>
            <span className="h-5 w-px bg-slate-200 hidden sm:block"></span>
            <span className="text-sm text-slate-500 hidden sm:block">Manage your plan and payment details</span>
          </div>
          <div className="flex items-center gap-4">
            {/* Header cleaned up for focus */}
          </div>
        </header>

        {/* Scrollable Content View */}
        <div className="flex-1 p-4 sm:p-8">
          <div className="max-w-7xl mx-auto space-y-8 pb-10">
            
            {/* Current Plan Overview Header Card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold text-slate-900">Current Plan</h3>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-100 uppercase tracking-wide">
                      {activePlan} Tier
                    </span>
                  </div>
                  <p className="text-slate-500 text-sm max-w-xl leading-relaxed">
                    You are currently subscribed to the {activePlan} plan. Your next billing date is <span className="font-medium text-slate-900">November 24, 2023</span>.
                  </p>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-500">Next Payment</p>
                    <p className="text-2xl font-bold text-slate-900 tracking-tight">
                      {activePlan === 'Basic' ? '$99' : activePlan === 'Enterprise' ? '$899' : '$299'}<span className="text-sm font-normal text-slate-500">/mo</span>
                    </p>
                  </div>
                  <div className="h-10 w-px bg-slate-200 hidden md:block"></div>
                  <button 
                    onClick={() => toast.error("Subscription scheduled for cancellation.")}
                    className="text-red-600 hover:text-red-700 text-sm font-medium px-4 py-2 hover:bg-red-50 border border-transparent hover:border-red-100 rounded-lg transition-colors"
                  >
                    Cancel Subscription
                  </button>
                </div>
              </div>

              {/* Usage Metrics Progress Bars */}
              <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <div className="flex justify-between text-xs font-medium mb-2">
                    <span className="text-slate-600">Monthly Scans</span>
                    <span className="text-slate-900">8,240 / 10,000</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-teal-500 w-[82%] rounded-full"></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-medium mb-2">
                    <span className="text-slate-600">Team Members</span>
                    <span className="text-slate-900">12 / 20</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 w-[60%] rounded-full"></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-medium mb-2">
                    <span className="text-slate-600">API Requests</span>
                    <span className="text-slate-900">45k / 100k</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 w-[45%] rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Pricing Tiers Grid */}
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-4">Available Plans</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Basic Plan */}
                <div className={`bg-white rounded-xl p-6 shadow-sm flex flex-col relative ${activePlan === 'Basic' ? 'border-2 border-teal-500 shadow-md' : 'border border-slate-200 hover:border-slate-300 transition-colors'}`}>
                  {activePlan === 'Basic' && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-teal-400 to-blue-500 text-white px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide shadow-sm whitespace-nowrap">
                      Current Plan
                    </div>
                  )}
                  <div className={`mb-4 ${activePlan === 'Basic' ? 'mt-2' : ''}`}>
                    <h4 className={`text-lg font-bold ${activePlan === 'Basic' ? 'text-teal-600' : 'text-slate-900'}`}>Basic</h4>
                    <p className="text-sm text-slate-500 mt-1">Essential protection for small teams</p>
                  </div>
                  <div className="mb-6">
                    <span className="text-3xl font-bold text-slate-900 tracking-tight">$99</span>
                    <span className="text-slate-500 font-medium">/month</span>
                  </div>
                  <ul className="space-y-3 mb-8 flex-1">
                    <li className="flex items-start gap-2 text-sm text-slate-600">
                      <Check className="w-5 h-5 text-emerald-500 shrink-0" />
                      <span>Up to 2,000 scans/mo</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-slate-600">
                      <Check className="w-5 h-5 text-emerald-500 shrink-0" />
                      <span>3 Team Members</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-slate-600">
                      <Check className="w-5 h-5 text-emerald-500 shrink-0" />
                      <span>Basic Reporting</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-slate-400">
                      <X className="w-5 h-5 shrink-0" />
                      <span>No API Access</span>
                    </li>
                  </ul>
                  {getPlanButton('Basic')}
                </div>

                {/* Professional Plan */}
                <div className={`bg-white rounded-xl p-6 shadow-sm flex flex-col relative ${activePlan === 'Professional' ? 'border-2 border-teal-500 shadow-md' : 'border border-slate-200 hover:border-slate-300 transition-colors'}`}>
                  {activePlan === 'Professional' && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-teal-400 to-blue-500 text-white px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide shadow-sm whitespace-nowrap">
                      Current Plan
                    </div>
                  )}
                  <div className={`mb-4 ${activePlan === 'Professional' ? 'mt-2' : ''}`}>
                    <h4 className={`text-lg font-bold ${activePlan === 'Professional' ? 'text-teal-600' : 'text-slate-900'}`}>Professional</h4>
                    <p className="text-sm text-slate-500 mt-1">Advanced security for growing businesses</p>
                  </div>
                  <div className="mb-6">
                    <span className="text-3xl font-bold text-slate-900 tracking-tight">$299</span>
                    <span className="text-slate-500 font-medium">/month</span>
                  </div>
                  <ul className="space-y-3 mb-8 flex-1">
                    <li className="flex items-start gap-2 text-sm text-slate-700 font-medium">
                      <CheckCircle2 className={`w-5 h-5 shrink-0 ${activePlan === 'Professional' ? 'text-teal-600' : 'text-emerald-500'}`} />
                      <span>Up to 10,000 scans/mo</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-slate-700 font-medium">
                      <CheckCircle2 className={`w-5 h-5 shrink-0 ${activePlan === 'Professional' ? 'text-teal-600' : 'text-emerald-500'}`} />
                      <span>20 Team Members</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-slate-700 font-medium">
                      <CheckCircle2 className={`w-5 h-5 shrink-0 ${activePlan === 'Professional' ? 'text-teal-600' : 'text-emerald-500'}`} />
                      <span>Advanced Reporting & Analytics</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-slate-700 font-medium">
                      <CheckCircle2 className={`w-5 h-5 shrink-0 ${activePlan === 'Professional' ? 'text-teal-600' : 'text-emerald-500'}`} />
                      <span>Full API Access</span>
                    </li>
                  </ul>
                  {getPlanButton('Professional')}
                </div>

                {/* Enterprise Plan */}
                <div className={`bg-white rounded-xl p-6 shadow-sm flex flex-col relative ${activePlan === 'Enterprise' ? 'border-2 border-teal-500 shadow-md' : 'border border-slate-200 hover:border-slate-300 transition-colors'}`}>
                  {activePlan === 'Enterprise' && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-teal-400 to-blue-500 text-white px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide shadow-sm whitespace-nowrap">
                      Current Plan
                    </div>
                  )}
                  <div className={`mb-4 ${activePlan === 'Enterprise' ? 'mt-2' : ''}`}>
                    <h4 className={`text-lg font-bold ${activePlan === 'Enterprise' ? 'text-teal-600' : 'text-slate-900'}`}>Enterprise</h4>
                    <p className="text-sm text-slate-500 mt-1">Maximum security for large organizations</p>
                  </div>
                  <div className="mb-6">
                    <span className="text-3xl font-bold text-slate-900 tracking-tight">$899</span>
                    <span className="text-slate-500 font-medium">/month</span>
                  </div>
                  <ul className="space-y-3 mb-8 flex-1">
                    <li className="flex items-start gap-2 text-sm text-slate-600">
                      <Check className="w-5 h-5 text-emerald-500 shrink-0" />
                      <span>Unlimited scans</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-slate-600">
                      <Check className="w-5 h-5 text-emerald-500 shrink-0" />
                      <span>Unlimited Team Members</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-slate-600">
                      <Check className="w-5 h-5 text-emerald-500 shrink-0" />
                      <span>Custom Integrations</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-slate-600">
                      <Check className="w-5 h-5 text-emerald-500 shrink-0" />
                      <span>Dedicated Account Manager</span>
                    </li>
                  </ul>
                  {getPlanButton('Enterprise')}
                </div>

              </div>
            </div>

            {/* Bottom Row: Payment Methods & Invoice History */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              <div className="lg:col-span-1">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Payment Method</h3>
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex items-start gap-4 mb-4">
                    <div className="bg-white p-2 rounded border border-slate-200 h-10 w-14 flex items-center justify-center shrink-0">
                      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <rect fill="#1e293b" height="14" rx="2" width="20" x="2" y="5"></rect>
                        <rect fill="#e2e8f0" height="2" width="20" x="2" y="11"></rect>
                        <circle cx="18" cy="16" fill="#ef4444" r="1.5"></circle>
                        <circle cx="15" cy="16" fill="#fbbf24" r="1.5"></circle>
                      </svg>
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-sm">Mastercard ending in 8824</p>
                      <p className="text-xs text-slate-500 mt-1">Expiry 12/2025</p>
                      <p className="text-xs text-slate-500 mt-0.5">Default payment method</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => toast.success("Secure payment gateway opened.")}
                    className="text-sm font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add new payment method</span>
                  </button>
                </div>
              </div>

              <div className="lg:col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-slate-900">Billing History</h3>
                  <button 
                    onClick={() => toast.success("Downloading all invoices...")}
                    className="text-sm text-teal-600 hover:text-teal-700 font-medium"
                  >
                    Download All
                  </button>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[500px]">
                      <thead>
                        <tr className="bg-slate-50/80 border-b border-slate-200 text-xs uppercase text-slate-500 font-semibold tracking-wider">
                          <th className="px-6 py-4">Invoice</th>
                          <th className="px-6 py-4">Date</th>
                          <th className="px-6 py-4">Amount</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4 text-right"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm">
                        <tr className="group hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 font-medium text-slate-900">INV-2023-012</td>
                          <td className="px-6 py-4 text-slate-500">Oct 24, 2023</td>
                          <td className="px-6 py-4 text-slate-900 font-mono font-medium">$299.00</td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100 shadow-sm">
                              Paid
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button 
                              onClick={() => toast.success("Downloading invoice PDF...")}
                              className="text-slate-400 hover:text-teal-600 transition-colors w-8 h-8 rounded-md hover:bg-teal-50 inline-flex items-center justify-center focus:outline-none" 
                              title="Download PDF"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                        <tr className="group hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 font-medium text-slate-900">INV-2023-011</td>
                          <td className="px-6 py-4 text-slate-500">Sep 24, 2023</td>
                          <td className="px-6 py-4 text-slate-900 font-mono font-medium">$299.00</td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100 shadow-sm">
                              Paid
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button 
                              onClick={() => toast.success("Downloading invoice PDF...")}
                              className="text-slate-400 hover:text-teal-600 transition-colors w-8 h-8 rounded-md hover:bg-teal-50 inline-flex items-center justify-center focus:outline-none" 
                              title="Download PDF"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                        <tr className="group hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 font-medium text-slate-900">INV-2023-010</td>
                          <td className="px-6 py-4 text-slate-500">Aug 24, 2023</td>
                          <td className="px-6 py-4 text-slate-900 font-mono font-medium">$299.00</td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100 shadow-sm">
                              Paid
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button 
                              onClick={() => toast.success("Downloading invoice PDF...")}
                              className="text-slate-400 hover:text-teal-600 transition-colors w-8 h-8 rounded-md hover:bg-teal-50 inline-flex items-center justify-center focus:outline-none" 
                              title="Download PDF"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
        
      </main>
    </div>
  );
}
