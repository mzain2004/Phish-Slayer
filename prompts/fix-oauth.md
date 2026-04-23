Task: Build complete IOC Enrichment Pipeline for PhishSlayer SOC platform

Read ONLY these files:
lib/soc/enrichment/index.ts
lib/soc/types.ts
lib/soc/enrichment/ip.ts

Do not read any other file.

Requirements:

1. Update lib/soc/types.ts to add these enrichment types if not present:

EnrichmentResult with fields: ioc_type ip or domain or hash or email or url,
value string, malicious boolean, confidence_score number 0-100,
sources EnrichmentSource array, cached boolean, enriched_at Date,
raw_data jsonb, tags string array, country string or null,
asn string or null, threat_type string or null

EnrichmentSource with fields: name string, malicious boolean or null,
score number or null, raw jsonb or null, error string or null

2. Rewrite lib/soc/enrichment/ip.ts for IP enrichment:

Function enrichIP taking ip string and supabase client returning EnrichmentResult:

Check ioc_store table first — if same IP enriched in last 24 hours return cached result with cached true

Call these 4 sources in parallel using Promise.allSettled:

Source 1 VirusTotal: GET https://www.virustotal.com/api/v3/ip_addresses/{ip}
Header x-apikey from process.env.VIRUSTOTAL_API_KEY
Extract: malicious count from last_analysis_stats, country, asn, tags
Mark malicious if malicious count is greater than 2

Source 2 AbuseIPDB: GET https://api.abuseipdb.com/api/v2/check?ipAddress={ip}&maxAgeInDays=90
Header Key from process.env.ABUSEIPDB_API_KEY
Extract: abuseConfidenceScore, countryCode, isp, usageType, totalReports
Mark malicious if abuseConfidenceScore is greater than 25

Source 3 IPInfo: GET https://ipinfo.io/{ip}/json — no auth needed for 50k/mo free
Extract: country, org, hostname, bogon flag
Mark bogon IPs as non-malicious automatically

Source 4 Shodan: GET https://api.shodan.io/shodan/host/{ip}?key={key} — no key needed for basic
Use https://internetdb.shodan.io/{ip} instead — completely free no key required
Extract: ports, tags, cpes, vulns array
Mark malicious if vulns array is not empty

Combine all source results:
Final malicious true if 2 or more sources say malicious
Final confidence_score as weighted average: VirusTotal 40 percent, AbuseIPDB 40 percent, Shodan 10 percent, IPInfo 10 percent

Upsert result into ioc_store table with enrichment jsonb, malicious bool, confidence_score, first_seen, last_seen

3. Create lib/soc/enrichment/domain.ts for domain enrichment:

Function enrichDomain taking domain string and supabase client returning EnrichmentResult:

Check ioc_store cache first — same 24 hour rule

Call these 3 sources in parallel using Promise.allSettled:

Source 1 VirusTotal: GET https://www.virustotal.com/api/v3/domains/{domain}
Header x-apikey from process.env.VIRUSTOTAL_API_KEY
Extract: malicious count from last_analysis_stats, categories, creation_date, registrar
Mark malicious if malicious count is greater than 2

Source 2 WHOIS via whoisjson: GET https://whoisjson.com/api/v1/whois?domain={domain} — free no key
Extract: registrar, creation_date, expiry_date, registrant_country
Flag if domain created less than 30 days ago — newly registered domain is suspicious

Source 3 DNS history via SecurityTrails free: GET https://api.securitytrails.com/v1/domain/{domain} — skip if no key
If SECURITYTRAILS_API_KEY not in env skip this source gracefully with no error

Final malicious true if VirusTotal says malicious OR domain is newly registered plus VirusTotal score above 0

Upsert into ioc_store

4. Create lib/soc/enrichment/hash.ts for file hash enrichment:

Function enrichHash taking hash string and supabase client returning EnrichmentResult:

Check ioc_store cache first

Call these 2 sources in parallel:

Source 1 VirusTotal: GET https://www.virustotal.com/api/v3/files/{hash}
Header x-apikey from process.env.VIRUSTOTAL_API_KEY
Extract: malicious count, file type, file names, tags, signature info
Mark malicious if malicious count is greater than 3

Source 2 MalwareBazaar: POST https://mb-api.abuse.ch/api/v1/
Body: query=get_info&hash={hash} — completely free no key needed
Extract: file_type, file_name, tags, signature, first_seen
Mark malicious if query_status is ok meaning hash found in database

Final malicious true if either source says malicious

Upsert into ioc_store

5. Create lib/soc/enrichment/email.ts for email header enrichment:

Function enrichEmail taking email string and supabase client returning EnrichmentResult:

Check if email is in ioc_store cache

Extract domain from email address after @ symbol
Call enrichDomain on the extracted domain

Additionally check these:
SPF: Use dns.promises.resolveTxt on domain — look for v=spf1 record
DKIM: Use dns.promises.resolveTxt on selector._domainkey.domain — check if record exists
DMARC: Use dns.promises.resolveTxt on _dmarc.domain — check policy p=reject or p=quarantine

Spoofing risk score:
Add 30 points if no SPF record found
Add 30 points if no DMARC record found
Add 20 points if DMARC policy is none not reject or quarantine
Add 20 points if domain is newly registered under 30 days

Mark malicious if spoofing risk score is above 60 or domain enrichment says malicious

Upsert into ioc_store

6. Rewrite lib/soc/enrichment/index.ts as main enrichment router:

Export function enrichIOC taking ioc IOC and supabase client returning EnrichmentResult:
Route to enrichIP if type is ip
Route to enrichDomain if type is domain
Route to enrichHash if type is hash
Route to enrichEmail if type is email
For url type: extract domain from URL and call enrichDomain

Export function enrichBatch taking iocs IOC array and supabase client returning EnrichmentResult array:
Process all IOCs in parallel using Promise.allSettled
Return results array maintaining same order as input
Log total enrichment time and cache hit rate to console

Export function getEnrichmentSummary taking EnrichmentResult array:
Return malicious_count, suspicious_count where confidence above 50,
clean_count, cache_hit_rate, top_threats array of malicious results sorted by confidence

Run npm run build, fix all errors.
Commit: feat: complete IOC enrichment pipeline all sources, push.