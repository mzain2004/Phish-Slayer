#!/bin/sh
set -eu

if [ ! -d node_modules ]; then
  echo "[cron-runner] Installing dependencies..."
  npm ci --no-audit --no-fund
fi

echo "[cron-runner] Starting scheduler"
node -r ts-node/register/transpile-only scripts/cron-runner.ts
