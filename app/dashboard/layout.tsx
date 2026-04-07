import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Sidebar from "@/components/dashboard/Sidebar";
import { DashboardErrorBoundary } from "./components/ErrorBoundary";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  return (
    <div
      className="dashboard-theme relative flex h-screen flex-row overflow-hidden text-white"
      style={{
        background:
          "linear-gradient(135deg, #0f0c29 0%, #1a1a3e 30%, #0d2b2b 70%, #0D1117 100%)",
      }}
    >
      <div className="absolute left-0 top-0 bottom-0 z-50 p-3">
        <Sidebar />
      </div>
      <main className="relative z-10 flex-1 min-w-0 overflow-y-auto overflow-x-hidden ml-[88px] mr-3 mt-3 mb-3">
        <DashboardErrorBoundary>{children}</DashboardErrorBoundary>
      </main>
    </div>
  );
}
