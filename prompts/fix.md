Before starting, list every file you will create. 
Create one file at a time. After each file say "FILE DONE" then continue.
Do not stop until all files complete.

You are building L2 SOC investigation features for PhishSlayer — agentic SOC platform.
Stack: Next.js 15, TypeScript, Supabase, Clerk, Groq (llama-3.3-70b-versatile), MongoDB Atlas.

ANTI-HALLUCINATION RULES:
- Every file you create: first run ls -la <path> to confirm it doesn't exist
- Every Supabase table you query: first grep supabase/migrations/ to confirm it exists
- Every npm package: grep package.json first. If absent, npm install it OR implement manually
- Any subtask that throws: catch the error, log it, move to next task. Never stop entirely
- Final step always: npm run build → fix all TypeScript errors shown → only then commit

TASK 1 — Entity 360 View:
1. Create lib/l2/entity360.ts
   - Function: getEntityProfile(entityType, entityValue, orgId) → Entity360Profile
   - entityType: 'ip' | 'domain' | 'user' | 'email' | 'hash'
   - For IP: query alerts (source_ip match), assets (ip match), endpoint_events (ip match),
     incidents (related_ips contains), threat_iocs if table exists
   - For user: query alerts (user_id match), incidents, uba_anomaly_events, escalations
   - For domain: query alerts (domain match), url_scans, email_analyses
   - Aggregate: { recentAlerts, incidents, riskScore, firstSeen, lastSeen, relatedEntities[] }
   - relatedEntities: IPs seen with same user, users seen from same IP, etc.
2. Create app/api/entity360/route.ts
   POST { entityType, entityValue, organizationId }
   Call getEntityProfile → return full profile
3. Create app/api/entity360/pivot/route.ts
   POST { fromType, fromValue, toType, organizationId }
   "Given this IP, find all users" — pivot queries
   Example: ip → users (from alerts + endpoint_events)
            user → ips, domains, assets
            domain → ips, users, alerts
4. Create /dashboard/entity360 page:
   - Search bar: entity type select + value input
   - On search → POST /api/entity360
   - Show profile card: risk score gauge, timeline of activity, related alerts list
   - "Pivot to" buttons: click IP → "Show all users from this IP"
   - Keep glassmorphism design (#0a0a0f bg, #6366F1 purple, #00d4aa cyan)

TASK 2 — Automated Containment (1-click block):
1. Create lib/l2/containment.ts
   - Function: blockIP(ip, orgId, analystId, reason) → ContainmentResult
     - Save to containment_actions table
     - If Wazuh connector active: POST to Wazuh manager API active-response endpoint
       Env: WAZUH_API_URL, WAZUH_API_USER, WAZUH_API_PASS (check .env.production first)
     - If MS Graph connector active: call Graph API to block sign-in for user
     - Always save action regardless of connector status
   - Function: disableAccount(userId, orgId, analystId, reason) → ContainmentResult
     - MS Graph: PATCH /users/{id} { accountEnabled: false }
     - Save to containment_actions
   - Function: isolateEndpoint(agentId, orgId, analystId, reason) → ContainmentResult
     - Wazuh active-response: trigger isolation script on agent
     - Save to containment_actions
2. Create Supabase migration: supabase/migrations/20260429500000_containment.sql
   CREATE TABLE IF NOT EXISTS containment_actions (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
     action_type TEXT CHECK (action_type IN ('block_ip','disable_account','isolate_endpoint','unblock_ip','enable_account')),
     target_value TEXT NOT NULL,
     reason TEXT,
     alert_id UUID,
     incident_id UUID,
     executed_by TEXT NOT NULL,
     connector_used TEXT,
     status TEXT DEFAULT 'pending' CHECK (status IN ('pending','success','failed','partial')),
     response_data JSONB,
     executed_at TIMESTAMPTZ DEFAULT NOW(),
     reversed_at TIMESTAMPTZ,
     reversed_by TEXT
   );
   ALTER TABLE containment_actions ENABLE ROW LEVEL SECURITY;
   Add org-scoped RLS (SELECT/INSERT/UPDATE).
3. Create app/api/containment/block-ip/route.ts — POST { ip, alertId, reason, organizationId }
4. Create app/api/containment/disable-account/route.ts — POST { userId, reason, organizationId }
5. Create app/api/containment/isolate-endpoint/route.ts — POST { agentId, reason, organizationId }
6. Create app/api/containment/actions/route.ts — GET list, POST reverse action
7. Wire into alert detail view: add containment action buttons (Block IP, Disable User, Isolate)
   Show confirmation modal before executing. Show result status after.

TASK 3 — Attack Chain Reconstruction:
1. Create lib/l2/attackChain.ts
   - Function: reconstructChain(incidentId, orgId) → AttackChain
   - Pull all alerts linked to incident (by incident_id or shared IOCs)
   - Sort by timestamp
   - Map each alert to MITRE ATT&CK phase:
     Recon → Resource Dev → Initial Access → Execution → Persistence →
     Privilege Escalation → Defense Evasion → C2 → Exfiltration → Impact
   - Use Groq to generate narrative: "Attacker first... then... finally..."
   - Return: { phases[], timeline[], narrative, killChainCoverage[] }
2. Create app/api/incidents/[id]/attack-chain/route.ts
   GET → call reconstructChain → return
3. In /dashboard/incidents/[id] page: add "Attack Chain" tab
   Show kill chain visualization (horizontal timeline, phases as boxes, alerts as dots)
   Show Groq narrative below

TASK 4 — Beaconing Detection:
1. Create lib/l2/beaconingDetector.ts
   - Function: detectBeaconing(orgId, lookbackHours=24) → BeaconingResult[]
   - Query endpoint_events or alerts for outbound connection events
   - Group by (source_ip, destination_ip, destination_port)
   - Calculate: interval variance (low variance = regular = beaconing)
   - Threshold: >5 connections, interval variance <20% → flag as beaconing
   - Return: { srcIp, dstIp, dstPort, interval, connectionCount, confidence }
2. Create app/api/l2/beaconing/route.ts — GET { organizationId } → run detector → return
3. Create app/api/cron/beaconing-scan/route.ts — run daily per org

TASK 5 — Lateral Movement Detection:
1. Create lib/l2/lateralMovement.ts
   - Function: detectLateralMovement(orgId, lookbackHours=24) → LateralMovementEvent[]
   - Query endpoint_events or alerts for authentication/login events
   - Detect: same user_id seen on >3 distinct machines within 2-hour window
   - Detect: admin credential used on non-admin asset
   - Detect: service account login outside scheduled hours
   - Return: { userId, machines[], timespan, pattern, confidence }
2. Create app/api/l2/lateral-movement/route.ts — GET { organizationId }
3. Show results in /dashboard/hunt page under new "Automated Detections" section

After all tasks:
npm run build — fix every TypeScript error.
git add -A && git commit -m "feat: L2 entity360, containment, attack chain, beaconing, lateral movement" && git push origin main
List all files created/modified.