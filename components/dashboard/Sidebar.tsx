"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  CreditCard,
  FlaskConical,
  Laptop,
  LayoutDashboard,
  Settings,
  Shield,
  ShieldAlert,
  Terminal,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type SidebarItemProps = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href: string;
  active: boolean;
};

const glassCard =
  "bg-white/5 backdrop-blur-3xl border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] rounded-2xl";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Laptop, label: "Endpoint Fleet", href: "/dashboard/fleet" },
  {
    icon: FlaskConical,
    label: "Sandbox Analysis",
    href: "/dashboard/sandbox",
  },
  { icon: Terminal, label: "AI Terminal", href: "/dashboard/terminal" },
  { icon: ShieldAlert, label: "Protocols", href: "/dashboard/protocols" },
  { icon: CreditCard, label: "Billing", href: "/dashboard/billing" },
  { icon: Settings, label: "Settings", href: "/dashboard/settings" },
];

function SidebarItem({ icon: Icon, label, href, active }: SidebarItemProps) {
  return (
    <motion.div
      whileHover={!active ? { scale: 1.02, filter: "brightness(1.1)" } : {}}
      whileTap={{ scale: 0.98 }}
    >
      <Link
        href={href}
        className={`group relative flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-300 w-full text-left overflow-hidden ${
          active
            ? "bg-[#2DD4BF]/10 text-[#2DD4BF] border border-[#2DD4BF]/20"
            : "text-white/70 hover:text-white hover:bg-white/5"
        }`}
      >
        <Icon className="w-5 h-5 z-10" />
        <span className="z-10">{label}</span>
        {!active && (
          <div className="absolute bottom-0 left-4 right-4 h-[2px] bg-[#2DD4BF]/50 opacity-0 transition-opacity duration-300 group-hover:opacity-100 rounded-t-full" />
        )}
      </Link>
    </motion.div>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const [profile, setProfile] = useState({
    fullName: "Authenticated user",
    email: "authenticated@phish-slayer.local",
  });

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

  return (
    <aside
      className={`fixed top-4 bottom-4 left-4 w-[280px] ${glassCard} flex flex-col z-20`}
    >
      <div className="p-6 flex items-center gap-3 border-b border-white/10">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#A78BFA] to-[#2DD4BF] flex items-center justify-center">
          <Shield className="w-4 h-4 text-black" />
        </div>
        <span className="font-space-grotesk font-bold text-xl tracking-tight">
          Phish-Slayer
        </span>
      </div>

      <nav className="flex-1 p-4 flex flex-col gap-2">
        {navItems.map((item) => {
          const active =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname?.startsWith(item.href);

          return (
            <SidebarItem
              key={item.href}
              icon={item.icon}
              label={item.label}
              href={item.href}
              active={Boolean(active)}
            />
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer">
          <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20" />
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-medium truncate">
              {profile.fullName}
            </span>
            <span className="text-xs text-white/50 truncate">
              {profile.email}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
