# Deployment.md — Infrastructure and Deploy Process
# Phish-Slayer V3

---

## 1. Server Details

| Property | Value |
|----------|-------|
| Provider | Microsoft Azure |
| OS | Ubuntu 24.04 LTS |
| IP Address | 20.235.98.184 |
| Domain | phishslayer.tech |
| SSH User | mzain2004 |
| App Path | `/home/mzain2004/Phish-Slayer` |
| Node Version | 20.20.1 |
| GitHub Repo | `mzain2004/Phish-Slayer` |

---

## 2. How the App Runs — CRITICAL

The app does NOT use `npm start` or `next start`.

It runs via a **custom `server.js`** file using PM2:

```bash
pm2 start server.js --name phish-slayer --node-args="--max-old-space-size=768"
```

`server.js` does two things:
1. Creates a Next.js HTTP request handler and starts it on port 3000
2. Attaches a `ws` WebSocket server to the same HTTP server for EDR agent connections

**Never suggest replacing `server.js` with `npm start` or `next start`** — this would kill the WebSocket server and break the entire EDR system.

---

## 3. Environment Variables — CRITICAL RULES

### File Location
Production: `/home/mzain2004/Phish-Slayer/.env.production`

### dotenv Load Order — CRITICAL
`server.js` loads dotenv at the **very first line** using a **hardcoded absolute path**:

```javascript
// Line 1 of server.js — DO NOT MOVE OR MODIFY
require('dotenv').config({ path: '/home/mzain2004/Phish-Slayer/.env.production' });
```

**Why hardcoded absolute path:**
- Conditional path resolution (e.g., `process.env.NODE_ENV === 'production' ? '...' : '...'`) can silently fail if `NODE_ENV` is not set before dotenv loads
- Hardcoded path guarantees the correct file is always loaded regardless of working directory or environment state
- This was the root cause of `AGENT_SECRET` being undefined despite being in `.env.production`

**Never:**
- Move the dotenv require away from line 1
- Change it to a conditional path
- Change it to a relative path

### Special Characters in Values
Values containing `#` MUST use double quotes:

```bash
# CORRECT
AGENT_SECRET="PhSlyr_Agent_2026!xK9#mZ"

# WRONG — dotenv treats # as comment, value becomes "PhSlyr_Agent_2026!xK9"
AGENT_SECRET=PhSlyr_Agent_2026!xK9#mZ
```

### Verifying dotenv is Loading Correctly
Check PM2 output logs for this line on startup:
```
[dotenv@17.x.x] injecting env (17) from .env.production
```
The number `(17)` should match the number of variables in `.env.production`. If it shows `(0)` or loads from `.env.local`, the path is wrong.

---

## 4. PM2 Configuration

### Ecosystem File
`/home/mzain2004/Phish-Slayer/ecosystem.config.js`

### Standard Restart (code changes only)
```bash
npm run build && pm2 restart phish-slayer --update-env
```

### Full Restart (when environment variables change) — CRITICAL
When `.env.production` is modified, a simple restart does NOT reload env vars. Must do:

```bash
pm2 stop phish-slayer
pm2 delete phish-slayer
NODE_ENV=production pm2 start server.js --name phish-slayer --node-args="--max-old-space-size=768"
pm2 save
```

**Why full delete is required:** PM2 caches the environment at startup. `pm2 restart --update-env` does NOT reliably reload all variables. Only `pm2 delete` + fresh start guarantees clean env.

### Useful PM2 Commands
```bash
pm2 logs phish-slayer          # Live logs
pm2 logs phish-slayer --lines 100  # Last 100 lines
pm2 status                     # App status
pm2 show phish-slayer          # Detailed info including env vars
pm2 save                       # Save config for auto-restart on reboot
pm2 startup                    # Generate startup script
```

---

## 5. Nginx Configuration

Config file: `/etc/nginx/sites-available/default`

### Critical Config Block
```nginx
server {
    listen 80;
    server_name phishslayer.tech www.phishslayer.tech 20.235.98.184;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        
        # WebSocket upgrade support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass $http_upgrade;
        
        # REQUIRED headers — removing any of these breaks auth
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Accept-Encoding "";  # Required for WebSocket
    }
}
```

### After Nginx Changes
```bash
sudo nginx -t                          # Test config syntax
sudo systemctl reload nginx            # Apply changes
```

---

## 6. Deploy Workflow

### From Local Windows Machine
```bat
./deploy.bat
```

`deploy.bat` pushes to GitHub. The server then pulls and rebuilds.

### On Server (after git pull)
```bash
cd /home/mzain2004/Phish-Slayer
git pull origin main
npm install                            # Only if package.json changed
npm run build
pm2 restart phish-slayer --update-env
```

### If Environment Variables Changed
See Full Restart in section 4.

---

## 7. Memory Constraints

Azure VM has limited RAM. The Node.js process is capped:
```
--max-old-space-size=768
```

This means 768MB max for the Node.js heap. If the app crashes with out-of-memory errors, do not increase this — optimize the code instead.

---

## 8. Checking Server Health

```bash
# Check if app is running
pm2 status

# Check what's on port 3000
sudo lsof -i :3000

# Check Nginx
sudo systemctl status nginx

# Test the endpoint
curl -I https://phishslayer.tech

# Check disk space
df -h

# Check memory
free -h
```

---

## 9. EDR Agent Run Command (for testing)

```bash
AGENT_SECRET='PhSlyr_Agent_2026!xK9#mZ' \
NEXT_PUBLIC_SITE_URL=https://phishslayer.tech \
npx ts-node --skipProject \
  --compiler-options '{"module":"commonjs"}' \
  lib/agent/endpointMonitor.ts
```

---

## 10. Known Issues and Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| `AGENT_SECRET` undefined | dotenv loaded after it's needed, or wrong path | Ensure `require('dotenv').config({path: '/home/mzain2004/Phish-Slayer/.env.production'})` is line 1 of server.js |
| `#` truncated in env values | dotenv treats `#` as comment | Wrap value in double quotes |
| `1008 Unauthorized` WS rejection | AGENT_SECRET mismatch or dotenv not loading | Verify dotenv loads 17 vars; verify AGENT_SECRET double-quoted |
| RSV1 WebSocket frame error | perMessageDeflate enabled | Set `perMessageDeflate: false` on both server and client |
| CSRF error on Server Actions | Missing Nginx headers or allowedOrigins | Check Nginx passes all 5 headers; check allowedOrigins in next.config.ts |
| 502 Bad Gateway | Next.js app not running | `pm2 status` → restart if needed |
| Env vars not updating | PM2 cache | Full delete + restart cycle |
