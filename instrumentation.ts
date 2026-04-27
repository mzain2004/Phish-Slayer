import { validateEnv } from "./lib/config/validateEnv";
import * as Sentry from "@sentry/nextjs";

export async function register() {
  // Validate required environment vars early
  validateEnv();
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

export const onRequestError = Sentry.captureRequestError;
