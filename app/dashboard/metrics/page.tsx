"use client";

import React, { useState, useEffect } from "react";
import { BarChart3, Loader2 } from "lucide-react";
import DashboardCard from "@/components/dashboard/DashboardCard";
import EmptyState from "@/components/ui/empty-state";

export default function MetricsPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulated fetch
    setTimeout(() => {
      setData([]);
      setLoading(false);
    }, 1000);
  }, []);

  return (
    <div className="flex flex-col gap-6 p-8">
      <h1 className="text-2xl font-bold text-white">Platform Metrics</h1>
      <DashboardCard className="bg-[#0a0a0f] border-white/10">
        {loading ? (
          <div className="p-20 flex justify-center">
            <Loader2 className="animate-spin text-primary" />
          </div>
        ) : data.length === 0 ? (
          <EmptyState 
            icon={BarChart3}
            title="Collecting metrics"
            description="MTTD, MTTR, and risk scores populate after 24 hours of activity."
          />
        ) : (
          <div className="p-6">Metrics visualization here</div>
        )}
      </DashboardCard>
    </div>
  );
}
