// This file is required by Next.js 15 App Router for Sentry router transition tracking.
// Sentry is initialized in sentry.client.config.ts — do NOT add Sentry.init() here.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
