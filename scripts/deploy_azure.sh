#!/bin/bash
set -euo pipefail

cd /opt/phishslayer || exit 1
git pull origin main

if [ ! -f .env.production ]; then
  echo "ERROR: .env.production not found"
  exit 1
fi

docker compose down --remove-orphans
docker compose build --no-cache
docker compose up -d

sleep 10

curl -f http://localhost:3000 || exit 1
curl -f http://localhost:8000/api/v1/health || exit 1

echo "DEPLOY SUCCESS — $(date)"
