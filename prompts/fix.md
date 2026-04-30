READ gemini.md fully before starting.
VERIFY: Layer 0 is complete and npm run build passes.

You are building Sprint 1: the Alert Enrichment Pipeline for PhishSlayer L1 agents.
This is the #1 killer feature — every alert enriched automatically before analyst sees it.

CONTEXT:
- Layer 0 runtime is built (state machine, confidence gates, ledger, DLQ, fallback LLM)
- Current L1 agent does basic processing but no external enrichment
- Need: IP geo, WHOIS, VirusTotal, AbuseIPDB, Shodan, passive DNS, hash lookup, email header parse
- Must be: async, parallel where possible, graceful on API failure, org-scoped always

AUDIT FIRST:
1. Read ALL existing L1 agent code
2. Read ALL existing enrichment code if any
3. Check: is every DB query scoped to org_id? Fix any that aren't.
4. Check: any Groq client at module level? Fix to lazy init.
5. Check: any unhandled promise rejections in agent chain? Fix.
6. List all issues found and fixed before adding new code.

ADD THESE ENV VARS to .env.example (keys only, no values):
VIRUSTOTAL_API_KEY=
ABUSEIPDB_API_KEY=
SHODAN_API_KEY=
MAXMIND_LICENSE_KEY=
GREYNOISE_API_KEY=

BUILD THESE:

## 1. IP Enrichment Agent (/lib/agents/enrichment/ip-enricher.ts)
Enrich every src_ip and dst_ip from alert:
- MaxMind GeoIP (local DB download, no API call): country, city, ASN, org, connection type
- AbuseIPDB API: confidence_score, usage_type, domain, is_tor, total_reports
- VirusTotal API (/ip_addresses/{ip}): malicious count, suspicious count, reputation
- Shodan API (/shodan/host/{ip}): open ports, services, banners, vulns (if any)
- Greynoise API (/v3/community/{ip}): noise (scanner), riot (trusted), classification
- ASN lookup: AS number, BGP prefix, upstream providers (use ipinfo.io)
- Tor exit node check (download Tor exit list, cache 24h): boolean
- VPN/hosting provider check (use ip2location or ipinfo.io)

Build:
async function enrichIP(ip: string, orgId: string): Promise<IPEnrichment>

Rules:
- All API calls: 5s timeout, fail gracefully (log + return partial)
- Cache results in Supabase for 24h to avoid re-querying same IP
- RFC1918 IPs (10.x, 172.16.x, 192.168.x): skip external APIs, mark as INTERNAL
- Parallel: all API calls fire simultaneously via Promise.allSettled()
- Never block alert processing if enrichment fails — return what you have

## 2. Domain + URL Enrichment Agent (/lib/agents/enrichment/domain-enricher.ts)
Enrich every domain and URL extracted from alert:
- VirusTotal API (/urls or /domains/{domain}): detection counts, categories, reputation
- URLhaus API: lookup domain/URL in malware DB
- PhishTank API: is this a known phishing URL?
- WHOIS/RDAP: registration date, registrar, registrant org (use whois npm package)
- Domain age calculation: registration date → days old, flag if <30 days
- DGA detection: entropy calculation + bigram analysis → 0-100 DGA score
- Tranco/Alexa rank check (cached list): top 1M = likely legitimate, unranked = suspicious
- Typosquatting check: Levenshtein distance vs org's protected domains (from connectors table)
- URL redirect unrolling: follow all redirects (max 10 hops), capture final destination
- HTTP safe fetch headers: server, X-Powered-By, Content-Type (no JS execution, just headers)

Build:
async function enrichDomain(domain: string, orgId: string): Promise<DomainEnrichment>
async function enrichURL(url: string, orgId: string): Promise<URLEnrichment>

## 3. Hash Enrichment Agent (/lib/agents/enrichment/hash-enricher.ts)
Enrich every file hash from alert:
- VirusTotal API (/files/{hash}): detection count, family, first_seen, last_seen, file_type
- MalwareBazaar API: is this hash in the malware DB? tags, signature, file_type
- NSRL lookup (cached local DB): is this hash a known-good system file?
- SSDEEP fuzzy hash comparison (if ssdeep provided): similarity to known malware
- Flag: hash not found anywhere → unknown binary → elevate confidence in alert

Build:
async function enrichHash(hash: string, hashType: 'md5'|'sha1'|'sha256', orgId: string): Promise<HashEnrichment>

## 4. Email Header Enrichment Agent (/lib/agents/enrichment/email-enricher.ts)
For alerts containing email data:
- Parse raw email headers: Received chain, Message-ID, X-Originating-IP
- SPF result extraction from Authentication-Results header
- DKIM result extraction
- DMARC result extraction
- Sender domain WHOIS + age
- Display name spoofing detection: display name contains "Security", "IT", "Admin" but domain is external
- Look-alike sender: Levenshtein distance vs org's known sender domains
- Reply-to vs From mismatch detection
- Thread hijacking: In-Reply-To references + suspicious From

Build:
async function enrichEmailHeaders(rawHeaders: string, orgId: string): Promise<EmailEnrichment>

## 5. User Context Enrichment Agent (/lib/agents/enrichment/user-enricher.ts)
Enrich user identity from alert:
- Connector lookup: if org has AD/Okta connector, query user details
- Fields to get: display_name, department, manager, role, account_age, last_login, mfa_status
- Privileged status: is this account in admin groups? service account? PAM account?
- Account risk score: based on recent alert count for this user (from Supabase, org-scoped)
- Peer group deviation: avg alerts for users in same department vs this user's alert count
- If no identity connector: return basic enrichment from alert data only

Build:
async function enrichUser(username: string, orgId: string): Promise<UserEnrichment>

## 6. Asset Context Enrichment Agent (/lib/agents/enrichment/asset-enricher.ts)
Enrich asset/host from alert:
- CMDB lookup (from assets table — create if not exists)
- Asset criticality tier: 1=Crown Jewel, 2=Business Critical, 3=Standard, 4=Test/Dev
- Asset owner: team, cost center, BU
- Network zone: DMZ, internal, OT, cloud — auto-detect from IP range + org config
- Data classification: PCI? HIPAA? PII? → from asset record
- Production flag: is this a production system?
- EOL flag: is this end-of-life software/hardware?
- Shadow IT: if asset NOT in inventory → create record, set criticality=UNKNOWN, alert "Shadow IT detected"
- Business hours context: 3am alert on finance-classified asset = higher risk

Build:
async function enrichAsset(hostname: string, ip: string, orgId: string): Promise<AssetEnrichment>

New migration needed:
CREATE TABLE IF NOT EXISTS assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  hostname TEXT,
  ip_addresses TEXT[],
  criticality INTEGER DEFAULT 3 CHECK (criticality BETWEEN 1 AND 4),
  owner_team TEXT,
  network_zone TEXT,
  data_classification TEXT[],
  is_production BOOLEAN DEFAULT false,
  is_eol BOOLEAN DEFAULT false,
  tags JSONB DEFAULT '{}',
  last_seen TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_isolation" ON assets USING (org_id = current_setting('app.current_org_id')::uuid);

## 7. Enrichment Cache Layer (/lib/agents/enrichment/cache.ts)
- Cache all enrichment results in Supabase to avoid re-querying same IOC
- IP cache TTL: 24 hours
- Domain cache TTL: 6 hours  
- Hash cache TTL: 7 days (malware doesn't un-malware)
- User cache TTL: 1 hour
- Asset cache TTL: 15 minutes

New migration:
CREATE TABLE IF NOT EXISTS enrichment_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  ioc_type TEXT NOT NULL,
  ioc_value TEXT NOT NULL,
  enrichment_data JSONB NOT NULL,
  source TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(org_id, ioc_type, ioc_value, source)
);
ALTER TABLE enrichment_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_isolation" ON enrichment_cache USING (org_id = current_setting('app.current_org_id')::uuid);

## 8. Master Enrichment Orchestrator (/lib/agents/enrichment/enrichment-orchestrator.ts)
- Receives raw alert from Wazuh webhook
- Extracts all IOCs: IPs, domains, URLs, hashes, emails, usernames, hostnames
- Fires all enrichment agents in parallel (Promise.allSettled)
- Aggregates results into unified EnrichmentData object
- Stores enrichment in alerts.enrichment column (JSONB)
- Calculates enrichment-based severity boost (from gemini.md modifier table)
- Passes enriched alert to L1 agent chain

Build:
async function orchestrateEnrichment(alert: Alert, orgId: string): Promise<EnrichedAlert>

## 9. Severity Scoring Engine (/lib/agents/l1/severity-scorer.ts)
Apply all modifiers from the architecture spec:
Base severity from source (Wazuh rule level → 0-100) + these modifiers:
- Asset criticality 1 (Crown Jewel): +40
- Asset criticality 2 (Business Critical): +25
- Asset criticality 3 (Standard): +10
- Asset criticality 4 (Test): +0
- Data classification (PCI/HIPAA/PII asset): +20
- CISA KEV match: +15
- EPSS score >0.5: +10
- Active exploitation in wild (GreyNoise): +20
- Threat intel IOC match: +25
- Off-hours anomaly (alert time vs asset business hours): +10
- Internet-facing asset: +15
- Privileged account involved: +20
- Active campaign match (from campaign_tracker table): +30
- Repeated pattern (same signature 3x in 1hr from same source): +15

Final score capped at 100 → map to severity label:
- 90-100: CRITICAL
- 70-89: HIGH
- 40-69: MEDIUM
- 10-39: LOW
- 0-9: INFO

## 10. Watchlist Matching Agent (/lib/agents/l1/watchlist-matcher.ts)
- On every alert, check all IOCs against org's watchlist
- Watchlist table: org_id, ioc_type, ioc_value, label, confidence, source
- Fuzzy match for domains: Levenshtein distance ≤ 2 = flag
- Exact match for IPs and hashes
- Regex match for custom patterns
- Watchlist match → instant severity MAX + skip normal queue → priority processing
- Watchlist populated from: CTI feeds + customer-defined entries

New migration:
CREATE TABLE IF NOT EXISTS watchlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  ioc_type TEXT NOT NULL,
  ioc_value TEXT NOT NULL,
  label TEXT NOT NULL,
  confidence DECIMAL(3,2) DEFAULT 1.0,
  source TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE watchlists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_isolation" ON watchlists USING (org_id = current_setting('app.current_org_id')::uuid);

## 11. Alert Deduplication + Correlation Agent (/lib/agents/l1/correlator.ts)
- SHA256 fingerprint every normalized alert
- Within 5-minute window + same src_ip + same dst_ip + same rule → collapse to 1 alert
- Brute force grouping: 5+ failed auth alerts on same host within 10min → create incident group
- Rule-based incident creation: configurable patterns per org
- Cluster naming: LLM generates human-readable incident name from cluster context

## 12. Update Wazuh Webhook (/app/api/webhooks/wazuh/route.ts)
- After ingesting Wazuh alert, immediately trigger enrichment pipeline
- Pass enriched alert to L1 agent chain
- Return 200 fast (don't await full chain) — process async
- Alert ID returned immediately, processing happens in background

## 13. UI: Enrichment Display (/app/dashboard/alerts/[id]/page.tsx)
- Show all enrichment data on alert detail page
- IP enrichment: geo map pin, reputation scores, ASN info
- Domain enrichment: WHOIS, age, DGA score, VT detections
- Hash enrichment: VT detection count, malware family if known
- Asset info: criticality badge, network zone badge, data classification tags
- User info: department, risk score, privileged badge if applicable
- Severity with breakdown: base score + each modifier applied + final score
- Design: glassmorphism cards, IBM Plex Mono for IOC values, Inter for labels
- 4px border-radius buttons, #7c6af7 primary color, #00d4aa accent

## FINAL STEPS:
1. Update existing L1 agent to use new enrichment orchestrator
2. Ensure all new code is fully typed (no `any` without comment explaining why)
3. Add all new env vars to .env.example
4. Run npm run build — fix ALL errors
5. Run npm run build again — ZERO errors required
6. Create SPRINT1_COMPLETE.md documenting: what was built, what APIs are called, cache TTLs, known limitations
7. DO NOT COMMIT until build is completely clean