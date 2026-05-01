"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import PhishButton from "@/components/ui/PhishButton";
import { AlertCircle, RefreshCw } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to Sentry
    Sentry.captureException(error);
    console.error("Dashboard Error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[400px] w-full flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-12 text-center backdrop-blur-xl">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-500/20 text-red-500">
        <AlertCircle className="h-10 w-10" />
      </div>
      
      <h2 className="mb-2 text-2xl font-black text-white">Something went wrong.</h2>
      <p className="mb-8 max-w-md text-slate-400">
        Our autonomous swarm encountered an unexpected error. The security team has been notified automatically.
      </p>

      <div className="flex gap-4">
        <PhishButton
          onClick={() => reset()}
          className="flex items-center gap-2 bg-[#7c6af7] text-white px-8 py-3 rounded-lg font-bold hover:bg-[#6b5ae6] transition-all"
        >
          <RefreshCw className="h-4 w-4" /> Try again
        </PhishButton>
        
        <PhishButton
          onClick={() => window.location.href = '/dashboard'}
          className="bg-white/10 text-white px-8 py-3 rounded-lg font-bold hover:bg-white/20 transition-all"
        >
          Return Home
        </PhishButton>
      </div>
    </div>
  );
}
