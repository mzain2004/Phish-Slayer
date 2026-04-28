import {
  Activity,
  AlertTriangle,
  Bot,
  CreditCard,
  Eye,
  FileText,
  KeyRound,
  LayoutDashboard,
  LifeBuoy,
  Mail,
  Plug,
  Radar,
  Search,
  Settings,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Terminal,
  User,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type DashboardNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export type DashboardNavGroup = {
  label: string;
  items: DashboardNavItem[];
};

export const dashboardNavGroups: DashboardNavGroup[] = [
  {
    label: "Overview",
    items: [
      { href: "/dashboard", label: "Command Center", icon: LayoutDashboard },
    ],
  },
  {
    label: "Threat Scanner",
    items: [
      { href: "/dashboard/threats", label: "Threat Scanner", icon: Radar },
      { href: "/dashboard/email-analyzer", label: "Email Analyzer", icon: Mail },
      { href: "/dashboard/scans", label: "Scan History", icon: Search },
    ],
  },
  {
    label: "Incidents",
    items: [
      { href: "/dashboard/incidents", label: "Incidents", icon: AlertTriangle },
      { href: "/dashboard/uba", label: "UBA", icon: ShieldAlert },
      { href: "/dashboard/escalations", label: "Escalations", icon: Shield },
    ],
  },
  {
    label: "Threat Hunt",
    items: [
      { href: "/dashboard/hunt", label: "Threat Hunt", icon: Activity },
      { href: "/dashboard/detection-rules", label: "Detection Rules", icon: ShieldCheck },
    ],
  },
  {
    label: "Vulnerabilities",
    items: [
      { href: "/dashboard/vulnerabilities", label: "Vulnerabilities", icon: AlertTriangle },
    ],
  },
  {
    label: "Intel Vault",
    items: [
      { href: "/dashboard/threat-intel", label: "Threat Intel", icon: FileText },
      { href: "/dashboard/intel", label: "Intel Vault", icon: FileText },
      { href: "/dashboard/darkweb", label: "Dark Web", icon: Eye },
    ],
  },
  {
    label: "Automation",
    items: [
      { href: "/dashboard/agents", label: "Agents", icon: Bot },
      { href: "/dashboard/terminal", label: "AI Terminal", icon: Terminal },
      { href: "/dashboard/integrations", label: "Integrations", icon: Plug },
    ],
  },
  {
    label: "Platform",
    items: [
      { href: "/dashboard/identity", label: "Identity", icon: Users },
      { href: "/dashboard/reports", label: "Reports", icon: FileText },
      { href: "/dashboard/billing", label: "Billing", icon: CreditCard },
      { href: "/dashboard/apikeys", label: "API Keys", icon: KeyRound },
      { href: "/dashboard/support", label: "Support", icon: LifeBuoy },
      { href: "/dashboard/settings", label: "Settings", icon: Settings },
      { href: "/dashboard/profile", label: "Profile", icon: User },
    ],
  },
];

// Flat list for compatibility and lookups
export const dashboardNavItems: DashboardNavItem[] = dashboardNavGroups.flatMap(
  (group) => group.items,
);

function formatSegment(segment: string): string {
  return segment
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function getDashboardTitle(pathname: string | null): string {
  if (!pathname || pathname === "/dashboard") {
    return "Command Center";
  }

  const match = dashboardNavItems.find((item) => item.href === pathname);
  if (match) {
    return match.label;
  }

  const segment =
    pathname.split("/").filter(Boolean).slice(-1)[0] || "dashboard";
  return formatSegment(segment);
}

export function getDashboardBreadcrumb(pathname: string | null): string[] {
  const crumbs = ["Dashboard"];

  if (!pathname || pathname === "/dashboard") {
    return crumbs;
  }

  const segments = pathname.split("/").filter(Boolean).slice(1);
  for (const segment of segments) {
    crumbs.push(formatSegment(segment));
  }

  return crumbs;
}
