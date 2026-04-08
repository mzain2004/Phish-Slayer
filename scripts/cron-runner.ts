import cron from "node-cron";
import dotenv from "dotenv";

dotenv.config({ path: process.env.CRON_ENV_FILE || ".env.production" });

type JobSpec = {
  name: string;
  schedule: string;
  path: string;
};

type JobResult = {
  ok: boolean;
  status: number;
  body: string;
  durationMs: number;
};

const baseUrl = (process.env.CRON_BASE_URL || "http://phish-slayer:3000").replace(/\/$/, "");
const cronSecret = process.env.CRON_SECRET || "";

if (!cronSecret) {
  console.error("[cron-runner] Missing CRON_SECRET; refusing to start.");
  process.exit(1);
}

const jobs: JobSpec[] = [
  { name: "L1 Triage", schedule: "0 * * * *", path: "/api/cron/l1-triage" },
  { name: "L2 Respond", schedule: "*/15 * * * *", path: "/api/cron/l2-respond" },
  { name: "L3 Hunt", schedule: "*/30 * * * *", path: "/api/cron/l3-hunt" },
];

async function runJob(job: JobSpec): Promise<JobResult> {
  const started = Date.now();
  const url = `${baseUrl}${job.path}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${cronSecret}`,
      },
    });

    const body = await response.text();
    const durationMs = Date.now() - started;

    return {
      ok: response.ok,
      status: response.status,
      body,
      durationMs,
    };
  } catch (error) {
    const durationMs = Date.now() - started;
    return {
      ok: false,
      status: 0,
      body: error instanceof Error ? error.message : "Unknown fetch error",
      durationMs,
    };
  }
}

function scheduleJob(job: JobSpec) {
  if (!cron.validate(job.schedule)) {
    console.error(
      `[cron-runner] Invalid cron schedule for ${job.name}: ${job.schedule}`,
    );
    return;
  }

  cron.schedule(job.schedule, async () => {
    const startedAt = new Date().toISOString();
    console.log(`[cron-runner] ${job.name} started at ${startedAt}`);

    const result = await runJob(job);

    if (result.ok) {
      console.log(
        `[cron-runner] ${job.name} succeeded status=${result.status} durationMs=${result.durationMs}`,
      );
      return;
    }

    console.error(
      `[cron-runner] ${job.name} failed status=${result.status} durationMs=${result.durationMs} body=${result.body}`,
    );
  });

  console.log(
    `[cron-runner] Scheduled ${job.name} (${job.schedule}) -> ${job.path}`,
  );
}

console.log(`[cron-runner] Booting with base URL ${baseUrl}`);
for (const job of jobs) {
  scheduleJob(job);
}

process.on("unhandledRejection", (reason) => {
  console.error("[cron-runner] Unhandled promise rejection", reason);
});

process.on("uncaughtException", (error) => {
  console.error("[cron-runner] Uncaught exception", error);
});
