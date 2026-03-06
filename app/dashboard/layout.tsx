"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShieldAlert,
  LayoutDashboard,
  Radar,
  Shield,
  FileText,
  Database,
  Settings,
  User,
  CreditCard,
  HelpCircle,
} from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Scan Manager", href: "/dashboard/scans", icon: Radar },
    { name: "Threat Intel", href: "/dashboard/threats", icon: Shield },
    { name: "Incident Reports", href: "/dashboard/incidents", icon: FileText },
    { name: "Intel Vault", href: "/dashboard/intel", icon: Database },
  ];

  const configNavigation = [
    { name: "Platform Settings", href: "/dashboard/settings", icon: Settings },
    { name: "Billing", href: "/dashboard/billing", icon: CreditCard },
  ];

  // Helper to highlight the active link based strictly on pathname
  const isCurrentPath = (path: string) => pathname === path;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 text-slate-900 font-sans">
      
      {/* Global Persistent Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-full flex-shrink-0 z-20">
        
        {/* Brand Header */}
        <div className="h-16 flex items-center px-6 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3 text-blue-600">
            <ShieldAlert className="w-6 h-6" />
            <h1 className="text-slate-900 text-lg font-bold tracking-tight">Phish-Slayer</h1>
          </div>
        </div>

        {/* Primary Navigation Links */}
        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1 w-full">
          {navigation.map((item) => {
            const isActive = isCurrentPath(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group ${
                  isActive
                    ? "bg-teal-50 text-teal-600"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <item.icon
                  className={`w-5 h-5 transition-colors shrink-0 ${
                    isActive ? "text-teal-600" : "text-slate-400 group-hover:text-teal-600"
                  }`}
                />
                <span className="text-sm font-medium">{item.name}</span>
              </Link>
            );
          })}

          <div className="pt-4 pb-2 px-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Configuration</p>
          </div>

          {/* Configuration Navigation Links */}
          {configNavigation.map((item) => {
            const isActive = isCurrentPath(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group ${
                  isActive
                    ? "bg-teal-50 text-teal-600"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <item.icon
                  className={`w-5 h-5 transition-colors shrink-0 ${
                    isActive ? "text-teal-600" : "text-slate-400 group-hover:text-teal-600"
                  }`}
                />
                <span className="text-sm font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Support & Identity Bottom Anchor */}
        <div className="p-4 border-t border-slate-100 shrink-0 space-y-3">
          <Link
            href="/dashboard/support"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group ${
              isCurrentPath("/dashboard/support")
                ? "bg-teal-50 text-teal-600"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <HelpCircle
              className={`w-5 h-5 transition-colors shrink-0 ${
                isCurrentPath("/dashboard/support") ? "text-teal-600" : "text-slate-400 group-hover:text-teal-600"
              }`}
            />
            <span className="text-sm font-medium">Support</span>
          </Link>
          
          <Link 
            href="/dashboard/profile"
            className="flex items-center gap-3 p-2 rounded-lg bg-slate-50 border border-slate-100 mt-2 hover:bg-teal-50 hover:border-teal-100 cursor-pointer transition-colors group"
          >
            <div className="relative">
              <div 
                className="w-8 h-8 rounded-full bg-cover bg-center" 
                style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuC0bAWDAC2XvkR-idD433cZo1h10tLtJQ4Mysi5GAZTenetbtdfmWL05QXuNEocmgo8TUN2Zh8ojrA_nGXN3f6HeSTeF1yp-hs1w1_j-0f0muroP6ztC2WF1HEb-vZJTOsjqBeteG6krTzhL-RMGi3rznhHIYfHpSvLm043BuMUqJnQwVPXXIpdDWfcX2G1q436MRBkqcksfraM9Xla9f_Gc_L1FunPy93-hpLNxMo1r3cenkLgKVx3IHJwjPOGZ7-mHBVqhLyNK7p0')" }}
              ></div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate group-hover:text-teal-700 transition-colors">Alex Morgan</p>
              <p className="text-xs text-slate-500 font-medium truncate group-hover:text-teal-600/70 transition-colors">Enterprise Admin</p>
            </div>
          </Link>
        </div>
      </aside>

      {/* 
          Main Content Shell
          ==================
          SIDEBAR INCEPTION FIX: We inject a CSS trick `[&>div>aside]:hidden` 
          which intercepts the rendered pages directly underneath this Layout 
          and hides their hardcoded `<aside>` blocks without breaking their inner flex calculations.
          We also ensure the unwrapped page `div` occupies full space via `[&>div]:w-full`.
      */}
      <main className="flex-1 min-w-0 h-full overflow-y-auto bg-[#fafafa] p-4 md:p-8 [&>div>aside]:hidden [&>div]:w-full">
        {children}
      </main>

    </div>
  );
}
