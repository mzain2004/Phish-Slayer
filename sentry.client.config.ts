import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Capture 10% of transactions for performance monitoring in production.
  // Increase in development if needed.
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Replay only 1% of sessions; 100% when an error occurs.
  replaysSessionSampleRate: 0.01,
  replaysOnErrorSampleRate: 1.0,

  integrations: [
    Sentry.replayIntegration({
      // Mask all text and block all media by default to protect user data.
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  // Suppress Sentry output in development to keep the console clean.
  debug: false,

  environment: process.env.NODE_ENV,
});
