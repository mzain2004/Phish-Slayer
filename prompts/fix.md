@GEMINI.md @graph.md
New session. You are a senior security engineer on PhishSlayer.
Read GEMINI.md and graph.md first. State current sprint.
AUDIT: Check if threat_iocs or ioc_hits tables exist. If not, create. If yes, ALTER missing columns.
BUILD: npm run build must pass.

You are building Sprint 4: Threat Intelligence Feed Ingestion Pipeline.

USE SUPABASE CONNECTOR for migrations.

PART 1 — IOC DATA MODEL
Check/Create threat_iocs table:
- id, ioc_type (ip|domain|url|hash_md5|hash_sha256|email|cve), ioc_value (UNIQUE with type)
- threat_score (0-100), confidence (decimal), tags[], malware_families[]
- sources[], first_seen, last_seen, expires_at, is_active
- NO org_id — this is a GLOBAL threat intel table

Check/Create ioc_hits table:
- id, org_id (RLS), ioc_id (FK), alert_id (FK), hit_at

Check/Create cti_feeds table:
- id, name, feed_type, endpoint_url, auth_config (JSONB), pull_interval, last_pulled_at, is_active

PART 2 — FEED CONNECTORS
/lib/intel/feeds/abuse-ch.ts
Pull MalwareBazaar, URLhaus, ThreatFox APIs. Free, no auth needed.
Extract: hashes, urls, domains, malware families.
Upsert to threat_iocs. If exists: boost confidence by 0.05, merge tags.

/lib/intel/feeds/cisa-kev.ts
GET https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json
Import each CVE as ioc_type='cve'. Set threat_score=95, confidence=0.99.

/lib/intel/feeds/nvd.ts
GET https://services.nvd.nist.gov/rest/json/cves/2.0?pubStartDate={yesterday}
Import CVEs. threat_score = CVSS * 10.

PART 3 — IOC PROCESSING
/lib/intel/ioc-processor.ts
function normalizeIOC(type, value): normalized string
- IPs: strip leading zeros, lowercase
- Domains: lowercase, strip trailing dot
- Hashes: lowercase hex
- Validate formats via regex. Discard invalid.

function deduplicateIOC(ioc): 'created' | 'updated'
- Check if ioc_type + ioc_value exists
- If yes: UPDATE confidence, sources, last_seen
- If no: INSERT

PART 4 — CONFIDENCE DECAY ENGINE
/lib/intel/decay.ts
Daily job: confidence *= 0.95 per run (weekly decay).
If confidence < 0.20: is_active = false.
NEVER decay CISA KEV entries (check tags for 'kev').

PART 5 — IOC LOOKUP SERVICE
/lib/intel/ioc-lookup.ts
function lookupIOC(type, value): ThreatIOC | null
- Query threat_iocs WHERE ioc_type=type AND ioc_value=value AND is_active=true
- Cache result in memory for 5 minutes (Map<string, ThreatIOC>)

Wire this into Sprint 1 enrichment:
- Read lib/agents/enrichment/ip.ts (or wherever IP enrichment lives)
- Add: const ioc = await lookupIOC('ip', ip); if(ioc) add to enrichment data

PART 6 — CRON
/app/api/cron/cti-feeds/route.ts
CRON_SECRET auth. Pull all feeds. Run decay. Log results.

FINAL: npm run build. git commit -m "feat(intel): Sprint 4 threat intel feed ingestion + IOC decay". git push.