Task: Build complete Threat Intel Feeds system for PhishSlayer SOC platform

Read ONLY these files:
lib/soc/types.ts
lib/soc/enrichment/index.ts
lib/soc/sigma/generator.ts

Do not read any other file.

Requirements:

1. Update lib/soc/types.ts to add these types:

ThreatIntelEntry with fields: id string, source enum otx or misp or internal,
ioc_type enum ip or domain or hash or email or url, value string,
threat_type string, confidence number 0-100, severity enum low or medium or high or critical,
tags string array, mitre_techniques string array, first_seen Date, last_seen Date,
expiry Date or null, active boolean, raw_data jsonb, case_id string or null

OTXPulse with fields: id string, name string, description string,
tags string array, indicators OTXIndicator array, created Date, modified Date

OTXIndicator with fields: type string, indicator string, description string or null

MISPEvent with fields: id string, info string, threat_level_id string,
attributes MISPAttribute array, tags string array, date string

MISPAttribute with fields: type string, value string, comment string or null,
to_ids boolean, timestamp string

ThreatIntelStats with fields: total_indicators number, active_indicators number,
sources_breakdown Record of string to number, last_sync_otx Date or null,
last_sync_misp Date or null, top_threat_types string array,
indicators_added_24h number

2. Create lib/soc/intel/otx.ts for AlienVault OTX integration:

OTX_BASE_URL constant: https://otx.alienvault.com/api/v1
OTX_API_KEY from process.env.OTX_API_KEY — if not set log warning and return empty array gracefully

Function fetchOTXPulses taking days_back number default 7 returning OTXPulse array:
GET https://otx.alienvault.com/api/v1/pulses/subscribed?limit=50&modified_since={date}
Header X-OTX-API-KEY from process.env.OTX_API_KEY
date is ISO string of now minus days_back days
Extract pulses array from response
Return OTXPulse array

Function fetchOTXIndicatorsForIP taking ip string returning ThreatIntelEntry or null:
GET https://otx.alienvault.com/api/v1/indicators/IPv4/{ip}/general
If pulse_info.count greater than 0 return ThreatIntelEntry with source otx
confidence based on pulse count: 1 pulse is 40, 2-5 pulses is 70, more than 5 is 90
Return null if no pulses found

Function fetchOTXIndicatorsForDomain taking domain string returning ThreatIntelEntry or null:
GET https://otx.alienvault.com/api/v1/indicators/domain/{domain}/general
Same confidence logic as IP lookup

Function syncOTXFeed taking supabase client returning number count of new entries:
Call fetchOTXPulses with days_back 1 for daily sync
For each pulse for each indicator:
Check if value already exists in threat_intel table
If not exists: insert new ThreatIntelEntry with source otx
If exists: update last_seen and raw_data
Return count of new entries inserted

3. Create lib/soc/intel/misp.ts for MISP integration:

MISP_URL from process.env.MISP_URL — if not set return empty gracefully
MISP_API_KEY from process.env.MISP_API_KEY — if not set return empty gracefully

Function fetchMISPEvents taking limit number default 100 returning MISPEvent array:
GET {MISP_URL}/events/index.json
Header Authorization from process.env.MISP_API_KEY
Header Accept application/json
Extract events array
Return MISPEvent array

Function syncMISPFeed taking supabase client returning number:
Call fetchMISPEvents
For each event for each attribute where to_ids is true:
Map MISP attribute type to our ioc_type:
ip-src and ip-dst map to ip
domain and hostname map to domain
md5 and sha1 and sha256 map to hash
email-src maps to email
url maps to url
Skip unknown types
Check threat_intel table for existing entry
Upsert with source misp and confidence 75 default
Return count of new entries

4. Create lib/soc/intel/internal.ts for internal threat intel from cases:

Function buildInternalIntel taking supabase client returning number:
Query ioc_store table where malicious is true and confidence_score greater than 70
For each IOC: upsert into threat_intel table with source internal
Set confidence from confidence_score, set case_id reference
This creates internal intel from analyst-confirmed malicious IOCs
Return count of entries synced

Function checkInternalIntel taking value string and ioc_type string and supabase client:
Query threat_intel table where value equals input and source is internal and active is true
Return ThreatIntelEntry or null

5. Create lib/soc/intel/index.ts as main intel router:

Export function syncAllFeeds taking supabase client returning ThreatIntelStats:
Run otxSync, mispSync, internalSync in sequence
Log results: OTX added {n}, MISP added {n}, Internal added {n}
Update last_sync timestamps in a intel_sync_log table
Return ThreatIntelStats

Export function checkIOCAgainstIntel taking value string and ioc_type string and supabase client:
Query threat_intel table where value equals input and active is true
Return ThreatIntelEntry or null
This is called by enrichment pipeline to cross-reference against known threats

Export function getIntelStats taking supabase client returning ThreatIntelStats:
Query threat_intel table for counts by source and ioc_type
Return ThreatIntelStats object

6. Update lib/soc/enrichment/index.ts:
Import checkIOCAgainstIntel from lib/soc/intel/index
In enrichIOC function: before calling external APIs check internal intel first
If internal intel hit found with confidence above 80: return immediately with cached result
This means known-bad IOCs resolve instantly without burning API quota

7. Create supabase/migrations/20260424000007_intel.sql:

ALTER TABLE public.threat_intel ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'internal';
ALTER TABLE public.threat_intel ADD COLUMN IF NOT EXISTS ioc_type TEXT;
ALTER TABLE public.threat_intel ADD COLUMN IF NOT EXISTS confidence INTEGER DEFAULT 50;
ALTER TABLE public.threat_intel ADD COLUMN IF NOT EXISTS expiry TIMESTAMPTZ;
ALTER TABLE public.threat_intel ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;
ALTER TABLE public.threat_intel ADD COLUMN IF NOT EXISTS case_id UUID;
ALTER TABLE public.threat_intel ADD COLUMN IF NOT EXISTS mitre_techniques TEXT[];
ALTER TABLE public.threat_intel ADD COLUMN IF NOT EXISTS raw_data JSONB;

CREATE TABLE IF NOT EXISTS public.intel_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL,
  entries_added INTEGER DEFAULT 0,
  entries_updated INTEGER DEFAULT 0,
  sync_duration_ms INTEGER,
  error TEXT,
  synced_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.intel_sync_log ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'intel_sync_log' AND policyname = 'intel_sync_log_policy') THEN
    CREATE POLICY "intel_sync_log_policy" ON public.intel_sync_log USING (auth.jwt() IS NOT NULL);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_threat_intel_value ON public.threat_intel(value);
CREATE INDEX IF NOT EXISTS idx_threat_intel_source ON public.threat_intel(source);
CREATE INDEX IF NOT EXISTS idx_threat_intel_active ON public.threat_intel(active);

8. Create app/api/intel/sync/route.ts:
POST endpoint to manually trigger full feed sync
Auth required, protect with admin check
Call syncAllFeeds and return ThreatIntelStats
Add dynamic and runtime exports

9. Create app/api/intel/stats/route.ts:
GET endpoint returning current intel stats
Auth required
Call getIntelStats and return result
Add dynamic and runtime exports

10. Update cron route to sync intel feeds daily at 01:00 UTC before hunts run:
Add call to syncAllFeeds in cron handler before huntEngine.scheduleHunts
This ensures fresh intel is available when hunts run at 02:00 UTC

Run npm run build, fix all errors.
Commit: feat: complete threat intel feeds OTX MISP internal store, push.  