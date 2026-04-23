Task: Create IOC enrichment pipeline

Create these 4 files only:
lib/soc/enrichment/ip.ts using AbuseIPDB free API
lib/soc/enrichment/domain.ts using VirusTotal API key already in env
lib/soc/enrichment/hash.ts using MalwareBazaar free API
lib/soc/enrichment/index.ts exporting enrichIOC function

Cache results in ioc_store table — same IOC enriched once per 24 hours
Do not touch any other file.
Run npm run build, fix errors, commit: feat: IOC enrichment pipeline, push.