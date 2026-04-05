import type { Metadata } from "next";
import Script from "next/script";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { validateEnv } from "@/lib/config/validateEnv";
import ConsentBanner from "@/components/ConsentBanner";
import GlobalSupportWidget from "@/components/GlobalSupportWidget";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

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
      className={`${spaceGrotesk.variable} ${inter.variable} dark selection:bg-teal-500/30`}
    >
      <body className="bg-black text-white antialiased min-h-screen font-sans">
        {children}
        <GlobalSupportWidget />
        <Script
          id="termly-blocker"
          src="https://app.termly.io/resource-blocker/fa073781-55e5-45b6-a6ef-29405a9723b7?autoBlock=on"
          strategy="afterInteractive"
        />
        <Toaster richColors position="top-right" />
        <ConsentBanner />
      </body>
    </html>
  );
}
