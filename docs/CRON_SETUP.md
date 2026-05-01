# PhishSlayer Azure VM Cron Setup

Since PhishSlayer runs in a Docker environment on an Azure VM, we use the system's `crontab` to trigger scheduled tasks.

## 1. Set Environment Variable
Ensure `CRON_SECRET` is set in your user's shell profile (e.g., `~/.bashrc` or `~/.profile`).

```bash
export CRON_SECRET="your_actual_cron_secret"
```

## 2. Install Crontab Entries
Run `crontab -e` and append the following lines. Replace `/path/to/phishslayer` with the actual absolute path to the project directory on the VM.

```bash
# PhishSlayer Cron Jobs
*/5 * * * *  /path/to/phishslayer/scripts/cron-runner.sh l1_triage
*/10 * * * * /path/to/phishslayer/scripts/cron-runner.sh enrich_alerts
0 */6 * * *  /path/to/phishslayer/scripts/cron-runner.sh cti_feeds
0 */4 * * *  /path/to/phishslayer/scripts/cron-runner.sh osint_brand
0 2 * * *    /path/to/phishslayer/scripts/cron-runner.sh osint_full
0 3 * * *    /path/to/phishslayer/scripts/cron-runner.sh vuln_scan
0 4 * * *    /path/to/phishslayer/scripts/cron-runner.sh metrics
0 5 * * *    /path/to/phishslayer/scripts/cron-runner.sh org_risk_update
*/15 * * * * /path/to/phishslayer/scripts/cron-runner.sh sla_checker
*/30 * * * * /path/to/phishslayer/scripts/cron-runner.sh mitre_tag_alerts
0 6 * * *    /path/to/phishslayer/scripts/cron-runner.sh mitre_coverage
0 1 * * *    /path/to/phishslayer/scripts/cron-runner.sh uba_baseline_update
0 */2 * * *  /path/to/phishslayer/scripts/cron-runner.sh beaconing_scan
0 0 * * *    /path/to/phishslayer/scripts/cron-runner.sh darkweb_scan
*/10 * * * * /path/to/phishslayer/scripts/cron-runner.sh l2_respond
0 * * * *    /path/to/phishslayer/scripts/cron-runner.sh l3_hunt
*/15 * * * * /path/to/phishslayer/scripts/cron-runner.sh run_detection_rules
0 */12 * * * /path/to/phishslayer/scripts/cron-runner.sh sync_connectors
0 */6 * * *  /path/to/phishslayer/scripts/cron-runner.sh sync_tip_feeds
*/10 * * * * /path/to/phishslayer/scripts/cron-runner.sh auto_playbooks
```

## 3. Verify
You can check the logs (if redirection is removed) or check the `notification_logs` / `audit_trail` in the PhishSlayer dashboard to confirm the jobs are running.
