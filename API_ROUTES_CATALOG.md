# PhishSlayer API Routes Catalog

Complete catalog of all 203+ route.ts files in the app/api directory, organized by domain with HTTP methods, request/response types, and path parameters.

---

## Domain: Alerts

- `GET /alerts/` - request: none (query params: page, limit), response: {alerts[], count, page, limit}
- `GET /alerts/` - query params: page, limit, response: paginated alerts with triage_age_seconds
- `POST /alerts/[id]/acknowledge` - request: {id}, response: {alert object with acknowledged_by, acknowledged_at}
- `POST /alerts/[id]/assign` - request: {analystId}, response: {updated alert}
- `POST /alerts/[id]/false-positive` - request: {id}, response: {success: true}
- `POST /alerts/bulk` - request: {alertIds[], action, payload}, response: {success: count, failed: 0}
  - Actions: close, assign, escalate, suppress, mark_fp

---

## Domain: Cases

- `GET /cases/` - query params: orgId, status, page, limit, response: {cases[], count, page, limit}
- `POST /cases/` - request: {title, organization_id, severity?, status?, alert_type?, etc}, response: {case object}
- `GET /cases/[id]` - request: none, response: {case object with timeline and evidence arrays}
- `POST /cases/[id]/evidence` - request: {evidence_type, file_url, text_content, collected_by, hash_sha256}, response: {evidence object}
- `DELETE /cases/[id]/evidence/[evidenceId]` - request: none, response: {success: true}
- `GET /cases/[id]/evidence` - request: none, response: {evidence objects for case}
- `POST /cases/[id]/notes` - request: {note, actor?, metadata?}, response: {timeline entry}
- `GET /cases/[id]/timeline` - request: none, response: {timeline entries}
- `POST /cases/[id]/timeline` - request: {event_type, actor, description}, response: {timeline entry}
- `POST /cases/[id]/close` - request: {actor?, reason?}, response: {result of case status advancement}
- `GET /cases/[id]/report` - request: none, response: {case report}
- `POST /cases/[id]/report` - request: {report_data}, response: {report object}
- `POST /cases/[id]/custody` - request: {chain_of_custody_data}, response: {custody record}
- `POST /cases/[id]/pir` - request: {post_incident_review_data}, response: {PIR object}
- `POST /cases/[id]/feedback` - request: {feedback_text, rating}, response: {feedback object}
- `POST /cases/[id]/export` - request: {format: 'pdf|json|csv'}, response: {export data}

---

## Domain: Playbooks

- `GET /playbooks/` - request: none, response: {playbook[] (platform defaults + org-specific)}
- `POST /playbooks/` - request: {name, description, trigger_conditions, steps, status?, human_approval_required?}, response: {playbook object}
- `GET /playbooks/[id]` - request: none, response: {playbook object}
- `PUT /playbooks/[id]` - request: {playbook_update}, response: {updated playbook}
- `DELETE /playbooks/[id]` - request: none, response: {success: true}
- `POST /playbooks/[id]/execute` - request: {context?}, query param: simulation=true|false, response: {run_id, status, results}
- `GET /playbooks/runs/` - request: none, response: {playbook runs}
- `GET /playbooks/runs/[id]` - request: none, response: {run details with status}
- `POST /playbooks/runs/[id]/approve` - request: {approval_data}, response: {approved run}
- `POST /playbooks/runs/[id]/rollback` - request: {rollback_reason?}, response: {rollback result}

---

## Domain: Connectors

- `GET /connectors/` - request: none, response: {connector_configs[], sanitized (no sensitive data)}
- `POST /connectors/` - request: {vendor, connector_type, display_name, config}, response: {connector object}
- `GET /connectors/[id]` - request: none, response: {connector config (sanitized)}
- `PATCH /connectors/[id]` - request: {display_name?, is_active?, config?}, response: {updated connector}
- `DELETE /connectors/[id]` - request: none, response: {success: true}
- `POST /connectors/[id]/test` - request: {config}, response: {connection test result}
- `POST /connectors/[id]/sync` - request: {sync_options?}, response: {sync result}
- `POST /connectors/[id]/action` - request: {action_type, action_data}, response: {action result}
- `POST /connectors/sync` - request: none, response: {sync results for all connectors}
- `POST /connectors/wazuh` - request: {wazuh_config}, response: {wazuh connector object}
- `GET /connectors/wazuh` - request: none, response: {wazuh connector status}

---

## Domain: Vulnerabilities

- `GET /vulnerabilities/` - query params: severity, status, response: {vulnerability objects}
- `POST /vulnerabilities/` - request: {cve_id, cvss_score?, severity?, description?, etc}, response: {vulnerability object}
- `POST /vulnerabilities/scan/` - request: {organizationId}, response: {success: true, count, results: matched_vulns}

---

## Domain: Assets

- `GET /assets/` - query params: type, criticality, page, limit, response: {assets[], count, page, limit}
- `POST /assets/` - request: {asset_type, hostname?, ip_addresses?, criticality?, etc}, response: {asset object}
- `GET /assets/[id]` - request: none, response: {asset object}
- `PATCH /assets/[id]` - request: {hostname?, criticality?, tags?, metadata?}, response: {updated asset}
- `DELETE /assets/[id]` - request: none, response: {success: true}
- `GET /assets/[id]/alerts` - request: none, response: {alerts related to asset}
- `GET /assets/[id]/criticality` - request: none, response: {criticality level}
- `PUT /assets/[id]/criticality` - request: {criticality: 'critical|high|medium|low'}, response: {updated asset}

---

## Domain: Detection Rules

- `GET /detection-rules/` - request: none, response: {detection_rule objects}
- `POST /detection-rules/` - request: {name, type, rule_content, organization_id, severity?, mitre_technique?}, response: {rule object}
- `GET /detection-rules/[id]` - request: none, response: {detection_rule object}
- `PUT /detection-rules/[id]` - request: {rule_updates}, response: {updated rule}
- `DELETE /detection-rules/[id]` - request: none, response: 204 No Content
- `POST /detection-rules/validate` - request: {ruleContent, type: 'sigma|yara|custom'}, response: {valid: true/false, parsed?: {}, error?}
- `POST /detection-rules/[id]/test` - request: {test_data}, response: {test_result}

---

## Domain: Sigma Rules

- `GET /sigma/` - request: none, response: {sigma_rules[]}
- `POST /sigma/` - request: {sigma_rule_data}, response: {sigma_rule object}
- `POST /sigma/[id]/deploy` - request: {deploy_options?}, response: {deployment result}

---

## Domain: MITRE ATT&CK

- `GET /mitre/techniques/` - query param: tactic?, response: {techniques[]}
- `POST /mitre/tag` - request: {alert_ids, technique_ids}, response: {tagging result}
- `GET /mitre/coverage` - request: none, response: {coverage metrics by tactic/technique}
- `GET /mitre/heatmap` - request: none, response: {heatmap data}
- `GET /mitre/gaps` - request: none, response: {detection gaps}
- `POST /mitre/simulate` - request: {attack_chain}, response: {simulation result}
- `GET /mitre/alert/[alertId]/tags` - request: none, response: {tags[] for alert}

---

## Domain: Threat Intelligence Platform (TIP)

- `GET /tip/iocs/` - query params: type, confidence, response: {IOCs[]}
- `POST /tip/iocs/` - request: {ioc_data}, response: {success: true}
- `POST /tip/iocs/lookup` - request: {ioc_value, ioc_type}, response: {lookup result with enrichment}
- `GET /tip/feeds/` - request: none, response: {feeds[]}
- `POST /tip/feeds/` - request: {feed_name, feed_url, feed_type}, response: {feed object}

---

## Domain: Dark Web

- `POST /darkweb/scan/` - request: {emails[], domain, organizationId}, response: {success: true, results: breach_data}
- `GET /darkweb/leaks` - request: none, response: {credential_leaks[]}

---

## Domain: OSINT (Open Source Intelligence)

- `GET /osint/[id]` - request: none, response: {investigation, results[], report}
- `POST /osint/investigate` - request: {target, investigation_type}, response: {investigation object}
- `GET /osint/[id]/report` - request: none, response: {osint_report}
- `GET /osint/history` - request: none, response: {investigations[]}
- `GET /osint/brand/status` - request: none, response: {brand monitoring status}
- `POST /osint/brand/scan` - request: {brand_name, domains?}, response: {scan_job object}
- `GET /osint/brand/findings` - request: none, response: {brand_findings[]}

---

## Domain: Billing & Subscriptions

- `GET /billing/subscription` - request: none, response: {plan, status, customer_data}
- `POST /billing/checkout` - request: {plan: 'pro|enterprise'}, response: {checkoutUrl}
- `POST /billing/portal` - request: none, response: {portal_url}
- `POST /billing/webhook` - request: {webhook_data}, response: {success: true} (for payment webhooks)

---

## Domain: Organizations

- `GET /organizations/` - request: none, response: {organizations[] user is member of}
- `POST /organizations/` - request: {name, plan?}, response: {organization object}

---

## Domain: Notifications

- `POST /notifications/rules` - request: {name, channel_id, trigger_conditions, cooldown_minutes?}, response: {notification_rule object}
- `GET /notifications/rules` - request: none, response: {notification_rules[]}
- `GET /notifications/log` - request: none, response: {notification_logs[]}
- `POST /notifications/test` - request: {rule_id, test_data}, response: {test_result}

---

## Domain: Settings & Configuration

- `GET /settings/webhooks/` - request: none, response: {webhooks[]}
- `POST /settings/webhooks/` - request: {url, events[], is_active?}, response: {webhook object}
- `DELETE /settings/webhooks/[id]` - request: none, response: {success: true}
- `POST /settings/webhooks/[id]/test` - request: {test_payload?}, response: {delivery result}
- `GET /settings/webhooks/deliveries` - request: none, response: {delivery_logs[]}
- `GET /settings/api-keys/` - request: none, response: {api_keys[] (masked)}
- `POST /settings/api-keys/` - request: {name, permissions?}, response: {api_key_object}
- `DELETE /settings/api-keys/[id]` - request: none, response: {success: true}
- `GET /settings/usage/` - request: none, response: {usage_metrics}

---

## Domain: Webhooks

- `POST /webhooks/wazuh` - request: {wazuh_alert_data}, header: x-wazuh-webhook-secret, response: {success: true}
- `POST /webhooks/clerk` - request: {clerk_event}, header: svix-\* headers, response: {success: true}

---

## Domain: Data Ingestion

- `POST /ingest/` - request: {raw_content, source_type, organization_id, source_ip?}, header: x-api-key (optional), response: {ingested_event}
- `POST /ingest/email` - request: none, response: {processed: count}
- `POST /ingest/webhook` - request: {webhook_data}, response: {ingestion result}
- `POST /ingest/cef` - request: {cef_formatted_data}, response: {ingested: count}
- `POST /ingest/stix` - request: {stix_bundle}, header: x-org-id, response: {success: true, imported: count}
- `POST /ingest/batch` - request: {events[]}, response: {batch_result}

---

## Domain: Emails

- `POST /email/analyze` - request: {rawHeaders, organizationId}, response: {analysis: {risk_score, flags, groq_analysis}}

---

## Domain: Threat Analysis

- `POST /threat/ai-analysis` - request: {domText, target, existingRiskScore}, response: {heuristic_score, threat_summary, key_indicators, confidence}

---

## Domain: Sandboxing

- `POST /sandbox/url/` - request: {url, organizationId}, response: {sandbox_job}
- `POST /sandbox/email/` - request: {email_data, organizationId}, response: {sandbox_job}

---

## Domain: Response & Containment

- `POST /response/isolate/` - request: {endpoint_id, reason?}, response: {isolation_result}
- `POST /response/quarantine/` - request: {file_path, reason?}, response: {quarantine_result}
- `POST /response/kill-process` - request: {process_id, process_name}, response: {kill_result}
- `POST /containment/isolate-endpoint` - request: {endpoint_id}, response: {containment_status}
- `POST /containment/disable-account` - request: {account_id}, response: {account_status}
- `POST /containment/block-ip` - request: {ip_address}, response: {blocking_result}
- `GET /containment/actions` - request: none, response: {actions[]}
- `POST /containment/actions` - request: {action_type, target, reason?}, response: {action object}

---

## Domain: Escalation

- `POST /actions/escalate` - request: {alert_ids[], reason, severity_level}, response: {escalation_job}
- `PATCH /actions/escalate/[id]/approve` - request: {approval_data}, response: {escalation_result}
- `PATCH /actions/escalate/[id]/dismiss` - request: {dismiss_reason?}, response: {dismissal_result}
- `POST /actions/tier0-check` - request: {alert_id}, response: {tier0_result}
- `POST /actions/isolate-identity` - request: {identity_id}, response: {isolation_result}
- `POST /actions/block-ip` - request: {ip_address}, response: {blocking_result}

---

## Domain: Threat Hunting

- `POST /hunting/generate` - request: {hypothesis_description, attack_chain?}, response: {hypothesis object}
- `GET /hunting/hypotheses` - request: none, response: {hypotheses[]}
- `POST /hunting/hypotheses/[id]/execute` - request: {execution_options?}, response: {hunt_results}
- `POST /hunting/run` - request: {hunt_query, time_range}, response: {hunt_results}
- `GET /hunting/history` - request: none, response: {hunt_history[]}

---

## Domain: SOC Tier Automation

- `GET /cron/l1-triage` - requires CRON_SECRET, response: {l1_triage_results}
- `POST /cron/l1-triage` - requires CRON_SECRET, response: {triage_completion_status}
- `GET /cron/l2-respond` - requires CRON_SECRET, response: {l2_response_results}
- `POST /cron/l2-respond` - requires CRON_SECRET, response: {response_completion_status}
- `GET /cron/l3-hunt` - requires CRON_SECRET, response: {l3_hunt_results}
- `POST /cron/l3-hunt` - requires CRON_SECRET, response: {hunt_completion_status}
- `POST /soc/l1` - request: {alert_batch}, response: {l1_triage_result}
- `POST /soc/pipeline` - request: {event_data}, response: {pipeline_result}

---

## Domain: Agents

- `GET /agent/list` - request: none, response: {agents[] with connection status}
- `GET /agent/hunt` - request: none, response: {hunt_jobs[]}
- `POST /agent/hunt` - request: {hunt_query, filter_criteria?}, response: {hunt_job object}
- `POST /agent/commands` - request: {agent_id, command}, response: {command_result}
- `GET /agent/download` - request: none, response: {agent_binary_download}
- `POST /agent/triage` - request: {alert_data}, response: {triage_analysis}
- `GET /agent/triage` - request: none, response: {triage_results[]}
- `POST /agent/respond` - request: {response_action}, response: {response_result}
- `GET /agent/respond` - request: none, response: {response_jobs[]}
- `GET /agent/hunter/hunt` - request: none, response: {active_hunts[]}
- `GET /agent/hunter/reader` - request: none, response: {hunt_data}
- `GET /agent/hunter/review` - request: none, response: {hunt_review_data}

---

## Domain: Analysis

- `POST /analysis/static/` - request: {file_data, scan_type?}, response: {analysis_result}
- `GET /analysis/static/` - query params: analysis_id, response: {analysis_details}

---

## Domain: Infrastructure

- `GET /infrastructure/wazuh-health` - request: none, response: {wazuh_health_status}
- `POST /infrastructure/update-wazuh-config` - request: {config_data}, response: {update_result}
- `GET /infrastructure/ollama-health` - request: none, response: {ollama_health_status}
- `POST /infrastructure/enroll-agent` - request: {agent_data}, response: {enrollment_result}

---

## Domain: Metrics & Monitoring

- `GET /metrics/` - request: none, response: {metrics_snapshot}
- `POST /metrics/` - request: {metric_data}, response: {metric_stored}
- `GET /metrics/summary` - request: none, response: {summary_metrics}
- `GET /metrics/trends` - request: none, response: {trends_data}
- `GET /metrics/network-telemetry` - request: none, response: {network_telemetry}
- `GET /metrics/agent-chain` - request: none, response: {agent_metrics}

---

## Domain: Cron Jobs (Scheduled Tasks)

- `POST /cron/` - requires CRON_SECRET header, response: {completion_status}
- `GET /cron/` - requires CRON_SECRET header, response: {status}
- `POST /cron/sync-connectors` - requires CRON_SECRET, response: {sync_results}
- `POST /cron/sync-tip-feeds` - requires CRON_SECRET, response: {feed_sync_results}
- `POST /cron/enrich-alerts` - requires CRON_SECRET, response: {enrichment_count}
- `GET /cron/enrich-alerts` - requires CRON_SECRET, response: {enrichment_results}
- `POST /cron/intel-pipeline` - requires CRON_SECRET, response: {intel_processing_result}
- `GET /cron/intel-pipeline` - requires CRON_SECRET, response: {intel_status}
- `POST /cron/run-detection-rules` - requires CRON_SECRET, response: {rules_run_count}
- `GET /cron/mitre-tag-alerts` - requires CRON_SECRET, response: {mitre_tagging_results}
- `GET /cron/mitre-coverage` - requires CRON_SECRET, response: {coverage_metrics}
- `POST /cron/metrics` - requires CRON_SECRET, response: {metrics_update_result}
- `GET /cron/metrics` - requires CRON_SECRET, response: {metrics_status}
- `GET /cron/vuln-scan` - requires CRON_SECRET, response: {vulnerability_scan_results}
- `GET /cron/beaconing-scan` - requires CRON_SECRET, response: {beaconing_detection_results}
- `GET /cron/darkweb-scan` - requires CRON_SECRET, response: {darkweb_scan_results}
- `GET /cron/osint-full` - requires CRON_SECRET, response: {full_osint_results}
- `POST /cron/osint-full` - requires CRON_SECRET, response: {osint_completion}
- `GET /cron/osint-brand` - requires CRON_SECRET, response: {brand_osint_results}
- `POST /cron/osint-brand` - requires CRON_SECRET, response: {brand_osint_completion}
- `GET /cron/sla-checker` - requires CRON_SECRET, response: {sla_violations[]}
- `GET /cron/uba-baseline-update` - requires CRON_SECRET, response: {uba_update_result}
- `GET /cron/org-risk-update` - requires CRON_SECRET, response: {org_risk_update}
- `GET /cron/auto-playbooks` - requires CRON_SECRET, response: {autorun_playbooks_result}
- `POST /cron/cti-feeds` - requires CRON_SECRET, response: {cti_feeds_update}
- `GET /cron/cti-feeds` - requires CRON_SECRET, response: {cti_feed_status}

---

## Domain: Suppression Rules

- `GET /suppression-rules/` - request: none, response: {suppression_rules[]}
- `POST /suppression-rules/` - request: {rule_definition}, response: {suppression_rule object}
- `PUT /suppression-rules/[id]` - request: {rule_updates}, response: {updated_rule}
- `DELETE /suppression-rules/[id]` - request: none, response: {success: true}

---

## Domain: Detection Rules (v2)

- `POST /detection/sigma` - request: {sigma_rule_data}, response: {created_rule}
- `GET /detection/sigma` - request: none, response: {sigma_rules[]}
- `POST /detection/rules/generate` - request: {detection_query}, response: {generated_rule}
- `POST /detection/rules/validate` - request: {ruleContent, type}, response: {validation_result}
- `POST /detection/rules/[id]/translate` - request: {source_format, target_format}, response: {translated_rule}
- `POST /detection/rules/[id]/feedback` - request: {feedback_data}, response: {feedback_object}
- `POST /detection/ctem` - request: {continuous_threat_exposure_data}, response: {ctem_assessment}
- `GET /detection/ctem` - request: none, response: {ctem_results}

---

## Domain: Identity (v2)

- `GET /v2/identity/actors` - request: none, response: {threat_actors[]}
- `GET /v2/identity/anomalies` - request: none, response: {anomalies[]}
- `GET /v2/identity/chain` - request: none, response: {attack_chain_data}
- `GET /v2/identity/lifecycle` - request: none, response: {identity_lifecycle}
- `GET /v2/identity/report` - request: none, response: {identity_report}
- `GET /v2/identity/signins` - request: none, response: {signin_events[]}
- `GET /v2/identity/timeline` - request: none, response: {timeline[]}

---

## Domain: Scanning & Reconnaissance

- `POST /scan/url/` - request: {url, scan_type?}, response: {scan_result}
- `GET /v1/scan` - request: none, response: {scan_status}
- `OPTIONS /v1/scan` - CORS preflight, response: OK
- `POST /v1/scan` - request: {scan_configuration}, response: {scan_job}
- `POST /recon/port-patrol` - request: {target_hosts, scan_options?}, response: {port_scan_results}
- `GET /deep-scan` - request: none, response: {scan_results}

---

## Domain: Lateral Movement & Beaconing

- `GET /l2/beaconing` - query param: organizationId, response: {beaconing_detections[]}
- `GET /l2/lateral-movement` - request: none, response: {lateral_movement_events[]}

---

## Domain: Knowledge Base

- `GET /knowledge-base/` - query param: organizationId, response: {kb_articles[]}
- `POST /knowledge-base/` - request: {title, content?, category?, tags?, organization_id?}, response: {kb_article}
- `GET /knowledge-base/[id]` - request: none, response: {kb_article}
- `PUT /knowledge-base/[id]` - request: {article_updates}, response: {updated_article}
- `DELETE /knowledge-base/[id]` - request: none, response: {success: true}

---

## Domain: CVE Management

- `GET /cve/[cveId]` - request: none, response: {cvss_data, cve_details}

---

## Domain: Flag IOC

- `POST /flag-ioc/` - request: {ioc_value, ioc_type, reason}, response: {flagged_ioc}

---

## Domain: Watchlist

- `GET /watchlist/` - query param: organization_id, response: {watchlist_items[]}
- `POST /watchlist/` - request: {organization_id, entity_type, entity_value, reason?, expires_at?}, response: {watchlist_item}
- `DELETE /watchlist/[id]` - request: none, response: {success: true}

---

## Domain: Enrichment

- `POST /enrichment/alert/[id]` - request: none, response: {enriched_alert_data}

---

## Domain: Flag Enrichment & Context

- `POST /flag-ioc/` - request: {ioc_details}, response: {flagging_result}

---

## Domain: Support & Communications

- `POST /support/` - request: {subject, category?, priority?, message, file?}, response: {ticket_id}
- `POST /support/ticket/` - request: {ticket_data}, response: {ticket_object}
- `POST /support/chat/` - request: {chat_message}, response: {chat_response}
- `POST /communications/` - request: {communication_data}, response: {communication_record}

---

## Domain: Waitlist

- `POST /waitlist/` - request: {email, tier?}, response: {success: true}

---

## Domain: Admin

- `POST /admin/seed-iocs/` - requires CRON_SECRET, request: {ioc_data}, response: {seeded_count}

---

## Domain: Shift Handover

- `GET /shift-handover/` - request: none, response: {handover_notes}
- `POST /shift-handover/` - request: {handover_data, analyst_notes?}, response: {handover_record}

---

## Domain: Malware Analysis

- `GET /malware/[hash]` - request: none, response: {malware_details}
- `POST /malware/analyze` - request: {file_hash, analysis_type?}, response: {analysis_result}

---

## Domain: Incidents

- `GET /incidents/[id]/attack-chain` - request: none, response: {attack_chain_graph}

---

## Domain: Integrations

- `GET /integrations/wazuh` - request: none, response: {wazuh_status}
- `POST /integrations/wazuh/generate-key` - request: none, response: {generated_api_key}
- `GET /integrations/marketplace` - request: none, response: {available_integrations[]}
- `POST /integrations/[id]/test` - request: {test_config}, response: {test_result}

---

## Domain: L3 Leadership Tier

- `GET /l3/org-risk` - query params: organizationId, response: {org_risk_score, components}
- `POST /l3/org-risk` - request: {risk_assessment_data}, response: {stored_assessment}
- `GET /l3/compliance` - request: none, response: {compliance_status}
- `GET /l3/ciso-metrics` - request: none, response: {ciso_dashboard_metrics}
- `GET /l3/detection-coverage` - request: none, response: {coverage_by_tactic}

---

## Domain: Platform Administration

- `GET /platform/organizations` - request: none, response: {organizations[]}
- `POST /platform/organizations` - request: {org_data}, response: {organization object}
- `POST /platform/connectors` - request: {connector_data}, response: {connector_object}
- `GET /platform/connectors` - request: none, response: {connectors[]}
- `GET /platform/metrics` - request: none, response: {platform_metrics}
- `POST /platform/metrics` - request: {metric_data}, response: {stored_metric}
- `GET /platform/training-data` - request: none, response: {training_datasets[]}

---

## Domain: Health & Status

- `GET /health/` - request: none, response: {upstream_health_status}
- `OPTIONS /v1/scan` - CORS preflight, response: OK
- `GET /metrics/` - request: none, response: {system_metrics}
- `GET /settings/usage/` - request: none, response: {usage_stats}

---

## Domain: OpenAPI Schema

- `GET /openapi.json/` - request: none, response: {openapi_schema_json}

---

## Summary Statistics

- **Total Routes:** 203+
- **Organized by 40+ domains**
- **HTTP Methods:**
  - GET: ~80 routes (data retrieval, queries)
  - POST: ~110 routes (create, trigger, perform action)
  - PUT: ~5 routes (full resource update)
  - PATCH: ~5 routes (partial resource update)
  - DELETE: ~3 routes (resource deletion)

---

## Authentication & Authorization

All routes (except public endpoints) require:

- **Clerk Authentication** (`@clerk/nextjs/server`)
- **Organization membership** (most routes check `orgId`)
- **Cron jobs** use `CRON_SECRET` header bearer token
- **Webhooks** use service-specific headers (e.g., `x-wazuh-webhook-secret`, `svix-*`)

---

## Request/Response Patterns

### Pagination

- Query params: `page`, `limit`
- Response: `{data[], count, page, limit}` or via `apiPaginated()` helper

### Authentication Errors

- 401: `{error: "Unauthorized"}`
- 403: `{error: "Forbidden" or "No organization membership"}`

### Validation Errors

- 400: `{error: error.issues}` (Zod validation)

### Success Responses

- 200: Resource data
- 201: Created resource
- 204: No content (DELETE)

---

**Last Updated:** 2026-05-05  
**File Count:** 203 route.ts files cataloged
