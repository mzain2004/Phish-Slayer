import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CommandCenterView from "@/components/dashboard/CommandCenterView";

type ScanRow = {
  target: string | null;
  verdict: string | null;
  date: string | null;
  risk_score: number | null;
};

type IncidentRow = {
  status: string | null;
};

export default async function DashboardOverviewPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const [{ data: scans }, { data: incidents }, { count: intelCount }] =
    await Promise.all([
      supabase
        .from("scans")
        .select("target, verdict, date, risk_score")
        .order("date", { ascending: false })
        .limit(100),
      supabase.from("incidents").select("status"),
      supabase
        .from("proprietary_intel")
        .select("*", { count: "exact", head: true }),
    ]);

  const scanRows = (scans ?? []) as ScanRow[];
  const incidentRows = (incidents ?? []) as IncidentRow[];

  const totalScans = scanRows.length;
  const maliciousScans = scanRows.filter(
    (scan) => (scan.verdict || "").toLowerCase() === "malicious",
  ).length;
  const activeIncidents = incidentRows.filter(
    (incident) => !(incident.status || "").toLowerCase().includes("resolved"),
  ).length;
  const resolvedIncidents = incidentRows.filter((incident) =>
    (incident.status || "").toLowerCase().includes("resolved"),
  ).length;

  const recentScans = scanRows.slice(0, 5).map((scan) => ({
    target: scan.target || "Unknown target",
    verdict: (scan.verdict || "clean").toLowerCase(),
    dateLabel: scan.date ? new Date(scan.date).toLocaleString() : "Just now",
    riskScore: scan.risk_score ?? 0,
  }));

  return (
    <CommandCenterView
      totalScans={totalScans}
      maliciousScans={maliciousScans}
      activeIncidents={activeIncidents}
      resolvedIncidents={resolvedIncidents}
      intelVaultSize={intelCount ?? 0}
      recentScans={recentScans}
    />
  );
}
