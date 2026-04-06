"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  CreditCard,
  Database,
  FileText,
  LayoutDashboard,
  Menu,
  Monitor,
  ScanLine,
  Settings,
  Shield,
  Terminal,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type SidebarItemProps = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href: string;
  active: boolean;
};

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: ScanLine, label: "Threat Scanner", href: "/dashboard/scans" },
  { icon: Monitor, label: "Endpoint Fleet", href: "/dashboard/fleet" },
  { icon: AlertTriangle, label: "Incident Reports", href: "/dashboard/incidents" },
  { icon: Database, label: "Intel Vault", href: "/dashboard/intel" },
  { icon: Terminal, label: "AI Terminal", href: "/dashboard/terminal" },
  { icon: FileText, label: "Reports", href: "/dashboard/reports" },
  { icon: CreditCard, label: "Billing", href: "/dashboard/billing" },
  { icon: Settings, label: "Settings", href: "/dashboard/settings" },
];

function SidebarItem({
  icon: Icon,
  label,
  href,
  active,
  expanded,
}: SidebarItemProps & { expanded: boolean }) {
  return (
    <motion.div whileTap={{ scale: 0.98 }}>
      <Link
        href={href}
        className={`group relative flex w-full items-center rounded-xl py-3 text-left font-medium [transition:all_0.2s_ease] ${
          active
            ? "border-l-[3px] border-l-[#2DD4BF] bg-[rgba(45,212,191,0.15)] text-[#2DD4BF]"
            : "text-white/90 hover:bg-[rgba(255,255,255,0.07)]"
        }`}
        style={{
          justifyContent: expanded ? "flex-start" : "center",
          paddingLeft: expanded ? "1rem" : "0",
          paddingRight: expanded ? "1rem" : "0",
        }}
      >
        <Icon className="h-5 w-5 shrink-0" />
        <span
          className={`ml-3 overflow-hidden whitespace-nowrap text-sm [transition:all_0.2s_ease] ${
            expanded ? "max-w-[160px] opacity-100" : "max-w-0 opacity-0"
          }`}
        >
          {label}
        </span>
      </Link>
    </motion.div>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profile, setProfile] = useState({
    fullName: "Authenticated user",
    email: "authenticated@phish-slayer.local",
  });

  const isMobile = useMemo(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth < 768;
  }, []);

  useEffect(() => {
    const loadProfile = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return;
      }

      setProfile({
        fullName:
          typeof user.user_metadata?.full_name === "string"
            ? user.user_metadata.full_name
            : (user.email ?? "Authenticated user"),
        email: user.email ?? "authenticated@phish-slayer.local",
      });
    };

    void loadProfile();
  }, []);

  useEffect(() => {
    const width =
      typeof window !== "undefined" && window.innerWidth < 768
        ? mobileOpen
          ? "256px"
          : "0px"
        : expanded
          ? "256px"
          : "64px";

    document.documentElement.style.setProperty("--dashboard-sidebar-width", width);
  }, [expanded, mobileOpen]);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) {
        setMobileOpen(false);
      }
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const showExpanded = (typeof window !== "undefined" && window.innerWidth < 768)
    ? mobileOpen
    : expanded;

  return (
    <>
      <button
        onClick={() => setMobileOpen((v) => !v)}
        className="fixed left-3 top-3 z-40 flex h-10 w-10 items-center justify-center rounded-lg border border-white/20 bg-[rgba(30,20,60,0.85)] text-white backdrop-blur-[12px] md:hidden"
        aria-label="Toggle sidebar"
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      <aside
        onMouseEnter={() => !isMobile && setExpanded(true)}
        onMouseLeave={() => !isMobile && setExpanded(false)}
        className={`fixed left-0 top-0 z-30 flex h-screen flex-col border-r border-white/10 backdrop-blur-[12px] [transition:width_0.25s_ease,transform_0.25s_ease] ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
        style={{
          width: showExpanded ? "256px" : "64px",
          background: "rgba(30, 20, 60, 0.85)",
          overflow: "hidden",
        }}
      >
      <div className="flex items-center gap-3 border-b border-white/10 p-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#A78BFA] to-[#2DD4BF]">
          <Shield className="h-4 w-4 text-black" />
        </div>
        <span
          className={`font-space-grotesk overflow-hidden whitespace-nowrap text-xl font-bold tracking-tight [transition:all_0.2s_ease] ${
            showExpanded ? "max-w-[170px] opacity-100" : "max-w-0 opacity-0"
          }`}
        >
          Phish-Slayer
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto p-2 [max-height:100vh]">
        <div className="flex flex-col gap-2">
        {navItems.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname?.startsWith(item.href));

          return (
            <SidebarItem
              key={item.href}
              icon={item.icon}
              label={item.label}
              href={item.href}
              active={Boolean(active)}
              expanded={showExpanded}
            />
          );
        })}
        </div>
      </nav>

      <div className="p-4 border-t border-white/10">
        <div
          className="flex items-center rounded-xl px-2 py-2 hover:bg-white/5"
          style={{ justifyContent: showExpanded ? "flex-start" : "center" }}
        >
          <div className="h-8 w-8 rounded-full border border-white/20 bg-white/10" />
          <div
            className={`ml-3 min-w-0 overflow-hidden whitespace-nowrap [transition:all_0.2s_ease] ${
              showExpanded ? "max-w-[150px] opacity-100" : "max-w-0 opacity-0"
            }`}
          >
            <span className="block truncate text-sm font-medium">
              {profile.fullName}
            </span>
            <span className="block truncate text-xs text-white/50">
              {profile.email}
            </span>
          </div>
        </div>
      </div>
      </aside>
    </>
  );
}
