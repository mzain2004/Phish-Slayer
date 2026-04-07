"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Sidebar from "@/components/dashboard/Sidebar";
import { DashboardErrorBoundary } from "./components/ErrorBoundary";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/");
        return;
      }

      setAuthReady(true);
    };

    void checkAuth();
  }, [router]);

  if (!authReady) {
    return (
      <div
        className="dashboard-theme relative flex h-screen flex-row overflow-hidden text-white"
        style={{
          background:
            "linear-gradient(135deg,#0f0c29 0%,#1a1a3e 30%,#0d2b2b 70%,#0D1117 100%)",
        }}
      />
    );
  }

  return (
    <div
      className="dashboard-theme relative flex h-screen flex-row overflow-hidden text-white"
      style={{
        background:
          "linear-gradient(135deg,#0f0c29 0%,#1a1a3e 30%,#0d2b2b 70%,#0D1117 100%)",
      }}
    >
      <div
        className="shrink-0 p-3"
        style={{
          width: expanded ? 264 : 88,
          transition: "width 0.25s cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        <Sidebar expanded={expanded} setExpanded={setExpanded} />
      </div>
      <main className="relative z-10 flex-1 min-w-0 overflow-y-auto overflow-x-hidden pt-3 pr-3 pb-3 pl-0">
        <DashboardErrorBoundary>{children}</DashboardErrorBoundary>
      </main>
    </div>
  );
}
