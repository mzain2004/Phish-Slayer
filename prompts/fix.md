Before starting, list every file you will create. 
Create one file at a time. After each file say "FILE DONE" then continue.
Do not stop until all files complete.

You are building the OSINT (Open Source Intelligence) agent module for PhishSlayer.
This is the most critical feature — highest demo value. Build it completely.
Stack: Next.js 15, TypeScript, Supabase, Clerk, Groq (llama-3.3-70b-versatile), MongoDB Atlas.

DB tables already created in Supabase:
- osint_investigations (id, organization_id, target_type, target_value, status, risk_score, created_by, created_at, completed_at)
- osint_results (id, investigation_id, organization_id, collector, raw_data, iocs_extracted, created_at)
- osint_reports (id, investigation_id, organization_id, narrative, risk_score, key_findings, recommendations, created_at)

ANTI-HALLUCINATION RULES:
- Every API call: wrap in try/catch, return { error: string, data: null } on failure — NEVER throw
- Every external API: use process.env.VAR || '' — never crash on missing keys, just skip that collector
- Before creating file: ls -la lib/osint/ 2>/dev/null — check what exists
- Before npm import: grep package.json — if missing, install OR implement logic manually in TS
- Subtask failure = log + skip + continue. Never abort.
- npm run build at end. Zero errors. Then commit.

TASK 1 — Core Collector Infrastructure:
1. Create lib/osint/types.ts
   export type OsintTargetType = 'domain'|'ip'|'email'|'hash'|'person'|'company'
   export interface OsintTarget { type: OsintTargetType; value: string; orgId: string }
   export interface CollectorResult { collector: string; success: boolean; data: any; error?: string; iocs: IOC[] }
   export interface IOC { type: string; value: string; confidence: number; source: string }
   export interface OsintReport { narrative: string; riskScore: number; keyFindings: string[]; recommendations: string[] }

2. Create lib/osint/baseCollector.ts
   Abstract class BaseCollector:
   - abstract name: string
   - abstract collect(target: OsintTarget): Promise<CollectorResult>
   - protected safeRequest(url, options): Promise<any> — wraps fetch with 10s timeout + catch

TASK 2 — Domain Collectors:
Create lib/osint/collectors/dns.ts:
- Use Node.js built-in dns.promises (no npm needed)
- Resolve: A, AAAA, MX, TXT, NS, SOA, CNAME (use dns.promises.resolve with each type)
- Wrap each resolve in try/catch — partial results OK
- Return all record types found + raw values

Create lib/osint/collectors/whois.ts:
- Fetch from whoisxmlapi.com: GET https://www.whoisxmlapi.com/whoisserver/WhoisService
  ?domainName={domain}&apiKey={WHOISXMLAPI_KEY}&outputFormat=JSON
  Env: WHOISXMLAPI_KEY — if empty, return mock { registrar: 'unknown', age: null }
- Extract: registrar, created_date, expiry_date, registrant, nameservers

Create lib/osint/collectors/crtsh.ts:
- No API key needed: GET https://crt.sh/?q={domain}&output=json
- Parse JSON array → extract unique subdomain list
- Return: { subdomains: string[], certCount: number, oldestCert, newestCert }
- Timeout: 15s. If fails: return { subdomains: [], error: 'crt.sh timeout' }

Create lib/osint/collectors/wayback.ts:
- CDX API (no key): GET http://web.archive.org/cdx/search/cdx?url={domain}&output=json&limit=10&fl=timestamp,statuscode
- Parse response array (first row = headers)
- Return: { snapshotCount, oldestSnapshot, latestSnapshot, samples[] }
- Timeout: 10s

Create lib/osint/collectors/emailSecurity.ts:
- For domain: check SPF/DKIM/DMARC via DNS TXT records (use dns.promises.resolveTxt)
- SPF: TXT record starts with "v=spf1"
- DMARC: query _dmarc.{domain} TXT
- DKIM: try common selector _domainkey.{domain} TXT
- Return: { spf: { exists, policy }, dkim: { exists }, dmarc: { exists, policy }, grade: 'A'|'B'|'C'|'F' }

TASK 3 — IP Collectors:
Create lib/osint/collectors/ipReputation.ts:
- AbuseIPDB: GET https://api.abuseipdb.com/api/v2/check?ipAddress={ip}&maxAgeInDays=90
  Env: ABUSEIPDB_API_KEY — skip if empty
- Check Tor exit list: GET https://check.torproject.org/exit-addresses (text parse)
- Return: { abuseScore, totalReports, lastReported, isTor, country, isp }

Create lib/osint/collectors/shodan.ts:
- Shodan API: GET https://api.shodan.io/shodan/host/{ip}?key={SHODAN_API_KEY}
  Env: SHODAN_API_KEY — return mock if empty: { ports: [], vulns: [], error: 'no key' }
- Extract: open_ports, hostnames, vulns[], org, country, last_update
- Return structured object

Create lib/osint/collectors/ipGeo.ts:
- Use ip-api.com (free, no key): GET http://ip-api.com/json/{ip}
- Return: { country, city, lat, lon, isp, org, asn }
- If private IP (10.x, 192.168.x, 172.16-31.x): return { isPrivate: true }

TASK 4 — Email + Hash Collectors:
Create lib/osint/collectors/breach.ts:
- HIBP: GET https://haveibeenpwned.com/api/v3/breachedaccount/{email}
  Header: hibp-api-key: {HIBP_API_KEY} — skip gracefully if no key
- Return: { breachCount, breaches[{ name, date, dataClasses[] }] }

Create lib/osint/collectors/fileHash.ts:
- VirusTotal v3: GET https://www.virustotal.com/api/v3/files/{hash}
  Header: x-apikey: {VIRUSTOTAL_API_KEY}
  Env: VIRUSTOTAL_API_KEY (already set — check .env.production)
- MalwareBazaar: POST https://mb-api.abuse.ch/api/v1/ body: query=get_info&hash={hash}
  No key needed
- Return: { vtMalicious, vtTotal, malwareFamily, firstSeen, lastSeen, tags[] }

TASK 5 — Orchestrator + Groq Narrator:
Create lib/osint/orchestrator.ts:
- Function: runInvestigation(target: OsintTarget, investigationId: string) → void (async, fire-and-forget)
- Based on target.type, select collectors to run:
  domain: [dns, whois, crtsh, wayback, emailSecurity, ipReputation(for resolved IPs)]
  ip: [ipGeo, ipReputation, shodan]
  email: [breach, dns(domain part)]
  hash: [fileHash]
- Run ALL collectors with Promise.allSettled (parallel)
- For each result: save to osint_results table
- Extract IOCs from all results (IPs, domains, emails found in data)
- Call groqNarrator with all results
- Update investigation status to 'complete', save report

Create lib/osint/groqNarrator.ts:
- Function: generateNarrative(target, results: CollectorResult[]) → OsintReport
- Build Groq prompt with all collector findings
- Ask Groq to: assess risk (0-100), write paragraph summary, list 5 key findings, give 3 recommendations
- Parse response → return OsintReport
- If Groq fails: return { narrative: 'Analysis unavailable', riskScore: 0, keyFindings: [], recommendations: [] }

TASK 6 — API Routes:
Create app/api/osint/investigate/route.ts:
- POST { targetType, targetValue, organizationId }
- Validate targetType is valid
- Create investigation record (status: 'running')
- Call runInvestigation in background (do not await)
- Return { investigationId } immediately (202 Accepted)

Create app/api/osint/[id]/route.ts:
- GET { organizationId }
- Fetch investigation + all results + report
- Return combined object: { investigation, results, report }

Create app/api/osint/history/route.ts:
- GET { organizationId }
- Return all past investigations ordered by created_at DESC

Create app/api/osint/[id]/report/route.ts:
- GET → return just the narrative report for display

TASK 7 — Frontend /dashboard/osint:
Create full page with glassmorphism design (#0a0a0f, #6366F1, #00d4aa):

a) Investigation launcher:
   - Target type selector: Domain / IP / Email / Hash / Person / Company
   - Input field: "Enter target..."
   - "Investigate" button → POST /api/osint/investigate → poll status every 3s
   - Status indicator: pending → running (spinner) → complete

b) Results view (shown when complete):
   - Risk score gauge (0-100, color coded: green<30, yellow<60, orange<80, red≥80)
   - Groq narrative in styled card
   - Key findings list with bullet icons
   - Recommendations list
   - Collector results accordion: each collector as expandable section with raw data

c) IOC extraction panel:
   - Table of IOCs extracted from this investigation
   - "Add to TIP" button per IOC → POST /api/tip/iocs

d) Investigation history sidebar:
   - List of past investigations, click to load results

e) Add "OSINT" to sidebar nav under "Threat Intel" group

After ALL tasks:
npm run build — zero TypeScript errors allowed.
git add -A && git commit -m "feat: OSINT agent — full collector suite, Groq narrator, investigation UI" && git push origin main
List every file created.