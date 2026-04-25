const { withSentryConfig } = require("@sentry/nextjs");

const cspHeader = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://clerk.phishslayer.tech https://accounts.phishslayer.tech https://challenges.cloudflare.com https://static.cloudflareinsights.com https://*.clerk.com",
  "script-src-elem 'self' 'unsafe-inline' https://clerk.phishslayer.tech https://accounts.phishslayer.tech https://challenges.cloudflare.com https://static.cloudflareinsights.com https://*.clerk.com",
  "worker-src 'self' blob:",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://fonts.gstatic.com",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https://fonts.googleapis.com https://fonts.gstatic.com",
  // Sentry ingest endpoints added alongside existing Clerk / Supabase domains
  "connect-src 'self' https://clerk.phishslayer.tech https://accounts.phishslayer.tech https://challenges.cloudflare.com https://*.clerk.accounts.dev https://*.supabase.co wss://*.supabase.co https://api.clerk.com https://*.clerk.com https://*.sentry.io https://sentry.io",
  "frame-src 'self' https://challenges.cloudflare.com https://accounts.phishslayer.tech https://*.clerk.com",
  "frame-ancestors 'self'",
].join("; ");

const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  // Changed from DENY → SAMEORIGIN so the dashboard can be embedded within the same origin
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  { key: "X-XSS-Protection", value: "1; mode=block" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
  {
    key: "Content-Security-Policy",
    value: cspHeader,
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  serverExternalPackages: ["ssh2"],
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
  experimental: {
    optimizePackageImports: [
      "framer-motion",
      "lucide-react",
      "@supabase/supabase-js",
    ],
    serverActions: {
      allowedOrigins: [
        "phishslayer.tech",
        "www.phishslayer.tech",
        "40.123.224.93",
        "localhost:3000",
      ],
    },
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
};

// withSentryConfig wraps the Next.js config to:
//  - Upload source maps to Sentry on build (requires SENTRY_AUTH_TOKEN env var)
//  - Inject Sentry SDK into the server/edge/client bundles automatically
module.exports = withSentryConfig(nextConfig, {
  // Organisation & project — filled via env vars or Sentry wizard in CI
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Suppress noisy Sentry build logs
  silent: !process.env.CI,

  // Upload source maps only when SENTRY_AUTH_TOKEN is present (CI / production)
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
    deleteSourcemapsAfterUpload: true,
  },

  // Disable the Sentry file-system telemetry tunnel to keep the surface small
  autoInstrumentServerFunctions: false,

  // We're not using Vercel, so skip their-specific wrapping
  widenClientFileUpload: true,
});


// Injected content via Sentry wizard below

const { withSentryConfig } = require("@sentry/nextjs");

module.exports = withSentryConfig(module.exports, {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: "air-universty",
  project: "javascript-nextjs",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  tunnelRoute: "/monitoring",

  webpack: {
    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,

    // Tree-shaking options for reducing bundle size
    treeshake: {
      // Automatically tree-shake Sentry logger statements to reduce bundle size
      removeDebugLogging: true,
    },
  },
});
