#!/bin/bash

# PhishSlayer Azure Cron Runner
# This script hits internal cron routes via curl.
# Requires CRON_SECRET environment variable to be set.

if [ -z "$CRON_SECRET" ]; then
    echo "CRON_SECRET is not set. Exiting."
    exit 1
fi

BASE_URL="https://phishslayer.tech"

# ── Cron Routes and Schedules ──────────────────────────────────────

# */5 * * * *
function l1_triage() {
    curl -s -X POST "$BASE_URL/api/cron/l1-triage" -H "Authorization: Bearer $CRON_SECRET" > /dev/null 2>&1
}

# */10 * * * *
function enrich_alerts() {
    curl -s -X POST "$BASE_URL/api/cron/enrich-alerts" -H "Authorization: Bearer $CRON_SECRET" > /dev/null 2>&1
}

# 0 */6 * * *
function cti_feeds() {
    curl -s -X POST "$BASE_URL/api/cron/cti-feeds" -H "Authorization: Bearer $CRON_SECRET" > /dev/null 2>&1
}

# 0 */4 * * *
function osint_brand() {
    curl -s -X POST "$BASE_URL/api/cron/osint-brand" -H "Authorization: Bearer $CRON_SECRET" > /dev/null 2>&1
}

# 0 2 * * *
function osint_full() {
    curl -s -X POST "$BASE_URL/api/cron/osint-full" -H "Authorization: Bearer $CRON_SECRET" > /dev/null 2>&1
}

# 0 3 * * *
function vuln_scan() {
    curl -s -X POST "$BASE_URL/api/cron/vuln-scan" -H "Authorization: Bearer $CRON_SECRET" > /dev/null 2>&1
}

# 0 4 * * *
function metrics() {
    curl -s -X POST "$BASE_URL/api/cron/metrics" -H "Authorization: Bearer $CRON_SECRET" > /dev/null 2>&1
}

# 0 5 * * *
function org_risk_update() {
    curl -s -X POST "$BASE_URL/api/cron/org-risk-update" -H "Authorization: Bearer $CRON_SECRET" > /dev/null 2>&1
}

# */15 * * * *
function sla_checker() {
    curl -s -X POST "$BASE_URL/api/cron/sla-checker" -H "Authorization: Bearer $CRON_SECRET" > /dev/null 2>&1
}

# */30 * * * *
function mitre_tag_alerts() {
    curl -s -X POST "$BASE_URL/api/cron/mitre-tag-alerts" -H "Authorization: Bearer $CRON_SECRET" > /dev/null 2>&1
}

# 0 6 * * *
function mitre_coverage() {
    curl -s -X POST "$BASE_URL/api/cron/mitre-coverage" -H "Authorization: Bearer $CRON_SECRET" > /dev/null 2>&1
}

# 0 1 * * *
function uba_baseline_update() {
    curl -s -X POST "$BASE_URL/api/cron/uba-baseline-update" -H "Authorization: Bearer $CRON_SECRET" > /dev/null 2>&1
}

# 0 */2 * * *
function beaconing_scan() {
    curl -s -X POST "$BASE_URL/api/cron/beaconing-scan" -H "Authorization: Bearer $CRON_SECRET" > /dev/null 2>&1
}

# 0 0 * * *
function darkweb_scan() {
    curl -s -X POST "$BASE_URL/api/cron/darkweb-scan" -H "Authorization: Bearer $CRON_SECRET" > /dev/null 2>&1
}

# */10 * * * *
function l2_respond() {
    curl -s -X POST "$BASE_URL/api/cron/l2-respond" -H "Authorization: Bearer $CRON_SECRET" > /dev/null 2>&1
}

# 0 * * * *
function l3_hunt() {
    curl -s -X POST "$BASE_URL/api/cron/l3-hunt" -H "Authorization: Bearer $CRON_SECRET" > /dev/null 2>&1
}

# */15 * * * *
function run_detection_rules() {
    curl -s -X POST "$BASE_URL/api/cron/run-detection-rules" -H "Authorization: Bearer $CRON_SECRET" > /dev/null 2>&1
}

# 0 */12 * * *
function sync_connectors() {
    curl -s -X POST "$BASE_URL/api/cron/sync-connectors" -H "Authorization: Bearer $CRON_SECRET" > /dev/null 2>&1
}

# 0 */6 * * *
function sync_tip_feeds() {
    curl -s -X POST "$BASE_URL/api/cron/sync-tip-feeds" -H "Authorization: Bearer $CRON_SECRET" > /dev/null 2>&1
}

# */10 * * * *
function auto_playbooks() {
    curl -s -X POST "$BASE_URL/api/cron/auto-playbooks" -H "Authorization: Bearer $CRON_SECRET" > /dev/null 2>&1
}

# 0 */3 * * *
function intel_pipeline() {
    curl -s -X POST "$BASE_URL/api/cron/intel-pipeline" -H "Authorization: Bearer $CRON_SECRET" > /dev/null 2>&1
}

# Execute function based on argument
if [ ! -z "$1" ]; then
    "$1"
else
    echo "Usage: $0 [function_name]"
fi
