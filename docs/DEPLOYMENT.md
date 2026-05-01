# Deployment Guide

## Azure VM Deployment (Ubuntu 24.04)

Follow these steps to deploy PhishSlayer to a production Azure VM.

### 1. Initial Setup
SSH into your Azure VM:
```bash
ssh mzain2004@40.123.224.93
```

### 2. Update Code
Navigate to the project directory and pull the latest changes:
```bash
cd ~/Phish-Slayer
git pull origin main
```

### 3. Environment Variables
Ensure your production environment variables are set:
```bash
cp .env.example .env.production
# Edit .env.production with real secrets (Clerk, Supabase, Groq, Polar, etc.)
nano .env.production
```

### 4. Docker Deployment
Build and start the containers using Docker Compose:
```bash
docker-compose build
docker-compose up -d
```
*Note: Containers always run on port 3000:3000.*

### 5. Verification
Verify the deployment by checking the health endpoint:
```bash
curl https://phishslayer.tech/api/health
```

### 6. Scheduled Tasks (Cron)
Install the crontab for background tasks (OSINT scans, metric updates):
```bash
# Add to crontab
crontab scripts/cron-runner.sh
```

## Rollback
If a deployment fails, use the rollback workflow:
```bash
git checkout HEAD^
docker-compose up -d --build
```
