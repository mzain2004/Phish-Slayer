import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { Toaster } from "sonner";
import { validateEnv } from "@/lib/config/validateEnv";
import AnimatedGradientMesh from "@/components/AnimatedGradientMesh";
import GlobalSupportWidget from "@/components/GlobalSupportWidget";
import { ClerkProvider } from "@clerk/nextjs";

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
    <ClerkProvider
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl="/dashboard"
      signUpFallbackRedirectUrl="/dashboard"
    >
      <html
        lang="en"
        suppressHydrationWarning
        className="dark selection:bg-teal-500/30"
      >
        <body className="bg-black text-white antialiased min-h-screen font-sans">
          <AnimatedGradientMesh />
          {children}
          <GlobalSupportWidget />
          <Toaster richColors position="top-right" />
        </body>
      </html>
    </ClerkProvider>
  );
}
