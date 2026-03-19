import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { Toaster } from "sonner";
import { validateEnv } from "@/lib/config/validateEnv";
import ConsentBanner from "@/components/ConsentBanner";

// Validate environment variables at startup (server-side only)
validateEnv();

export const metadata: Metadata = {
  title: "Phish Slayer",
  description: "Advanced phishing threat detection and response platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className="dark selection:bg-teal-500/30"
    >
      <head>
        <Script
          src="https://app.termly.io/resource-blocker/fa073781-55e5-45b6-a6ef-29405a9723b7?autoBlock=on"
          strategy="beforeInteractive"
        />
      </head>
      <body className="bg-[#0d1117] text-[#e6edf3] antialiased min-h-screen">
        <div className="fixed inset-0 z-[-1] bg-[#0a0f1e] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(20,184,166,0.18),rgba(10,15,30,0))]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        </div>
        {children}
        <Toaster richColors position="top-right" />
        <ConsentBanner />
      </body>
    </html>
  );
}
