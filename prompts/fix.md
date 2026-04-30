@GEMINI.md @graph.md
New session. Read files. State sprint. Check existing intel tables. BUILD MUST PASS.
USE SUPABASE CONNECTOR FOR ALL MIGRATIONS.

Sprint 11: Threat Actor Profiles + Campaign Tracker.

PART 1 — ACTOR DATABASE
/lib/intel/actor-profiles.ts
Embed 30 actor profiles as TypeScript const:
Lazarus, APT28, APT29, APT41, FIN7, FIN8, Carbanak, Conti, LockBit, Cl0p, ALPHV, Scattered Spider, Lapsus$, Kimsuky, Patchwork, SideWinder, Turla, Gamaredon, Sandworm, Fancy Bear, Charming Kitten, MuddyWater, OilRig, APT33, APT35, APT15, APT10, ThreatConnect, Equation Group, DarkSide.
Per actor: {id, name, country, target_sectors[], mitre_techniques[], malware_families[], description}.

Check/Create threat_actors table:
id(UUID), org_id(RLS), actor_id(string matches TS const), match_confidence(decimal), first_seen, last_seen, associated_incidents(UUID[]).

PART 2 — ACTOR MATCHING ENGINE
/lib/intel/actor-matcher.ts
async function matchActor(orgId: string, techniques: string[]): Promise<ActorMatch[]>
1. For each embedded actor: calculate Jaccard similarity = (intersection of techniques) / (union of techniques).
2. If similarity > 0.3: return as match with confidence score.
3. Sort by confidence desc.

PART 3 — CAMPAIGN TRACKER
Check/Create campaigns table:
id(UUID), org_id(RLS), name, actor_id(string), status('active'|'dormant'|'concluded'), iocs(JSONB), linked_cases(UUID[]), linked_alerts(UUID[]), first_seen, last_seen, tlp.

/lib/intel/campaign-tracker.ts
async function checkCampaignLink(orgId: string, alert: any): Promise<void>
1. Extract IOCs from alert (IPs, domains, hashes).
2. Query existing campaigns for matching IOCs (JSONB contains).
3. If match found: UPDATE campaign, add alert_id to linked_alerts.
4. If no match but actor confidence > 0.7: CREATE new campaign, name = "{Actor Name} Campaign - {Date}".

PART 4 — ROUTES
GET /api/intel/actors — list all embedded actors with match status for org (auth+org).
GET /api/intel/campaigns — list campaigns (auth+org).
GET /api/intel/campaigns/[id] — campaign detail with timeline (auth+org).

FINAL: npm run build. git commit -m "feat(intel): Sprint 11 threat actor profiles, Jaccard matching, campaign tracker". git push.