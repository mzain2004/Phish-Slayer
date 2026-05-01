export interface Integration {
    id: string;
    name: string;
    vendor: string;
    category: 'edr' | 'siem' | 'firewall' | 'identity' | 'email' | 'cloud' | 'vulnerability' | 'ticketing' | 'threat_intel' | 'network' | 'syslog';
    description: string;
    required_env_vars: string[];
    required_plan: 'free' | 'pro' | 'enterprise';
    capabilities: string[];
    status: 'ga' | 'beta' | 'coming_soon';
    is_bidirectional: boolean;
}

const REGISTRY: Integration[] = [
    // EDR
    { id: 'crowdstrike', name: 'Falcon Insight', vendor: 'CrowdStrike', category: 'edr', description: 'Next-gen AV and endpoint detection.', required_env_vars: ['CS_CLIENT_ID', 'CS_CLIENT_SECRET'], required_plan: 'pro', capabilities: ['alert_ingest', 'host_isolation', 'process_kill'], status: 'ga', is_bidirectional: true },
    { id: 'sentinelone', name: 'Singularity XDR', vendor: 'SentinelOne', category: 'edr', description: 'Autonomous endpoint protection.', required_env_vars: ['S1_API_TOKEN', 'S1_URL'], required_plan: 'pro', capabilities: ['alert_ingest', 'host_isolation'], status: 'ga', is_bidirectional: true },
    { id: 'carbon_black', name: 'Carbon Black Cloud', vendor: 'VMware', category: 'edr', description: 'Endpoint sensing and response.', required_env_vars: ['CB_API_KEY', 'CB_ORG_KEY'], required_plan: 'enterprise', capabilities: ['alert_ingest', 'quarantine'], status: 'beta', is_bidirectional: true },
    { id: 'defender_edr', name: 'Defender for Endpoint', vendor: 'Microsoft', category: 'edr', description: 'Enterprise endpoint security.', required_env_vars: ['MS_TENANT_ID', 'MS_CLIENT_ID', 'MS_CLIENT_SECRET'], required_plan: 'pro', capabilities: ['alert_ingest', 'machine_isolation'], status: 'ga', is_bidirectional: true },

    // SIEM
    { id: 'splunk', name: 'Splunk Enterprise', vendor: 'Splunk', category: 'siem', description: 'Data-to-everything platform.', required_env_vars: ['SPLUNK_URL', 'SPLUNK_TOKEN'], required_plan: 'pro', capabilities: ['log_ingest', 'search_execution'], status: 'ga', is_bidirectional: true },
    { id: 'qradar', name: 'QRadar', vendor: 'IBM', category: 'siem', description: 'Security intelligence platform.', required_env_vars: ['QRADAR_URL', 'QRADAR_TOKEN'], required_plan: 'enterprise', capabilities: ['log_ingest'], status: 'beta', is_bidirectional: false },
    { id: 'sentinel', name: 'Microsoft Sentinel', vendor: 'Microsoft', category: 'siem', description: 'Cloud-native SIEM and SOAR.', required_env_vars: ['MS_WORKSPACE_ID', 'MS_SHARED_KEY'], required_plan: 'pro', capabilities: ['log_ingest', 'incident_sync'], status: 'ga', is_bidirectional: true },
    { id: 'elastic_siem', name: 'Elastic Security', vendor: 'Elastic', category: 'siem', description: 'Limitless XDR and SIEM.', required_env_vars: ['ELASTIC_URL', 'ELASTIC_API_KEY'], required_plan: 'pro', capabilities: ['log_ingest', 'search_execution'], status: 'ga', is_bidirectional: true },
    { id: 'logrhythm', name: 'LogRhythm', vendor: 'LogRhythm', category: 'siem', description: 'NextGen SIEM platform.', required_env_vars: ['LR_API_URL', 'LR_TOKEN'], required_plan: 'enterprise', capabilities: ['log_ingest'], status: 'coming_soon', is_bidirectional: false },

    // Firewall
    { id: 'palo_alto', name: 'PAN-OS', vendor: 'Palo Alto Networks', category: 'firewall', description: 'Next-generation firewalls.', required_env_vars: ['PAN_URL', 'PAN_API_KEY'], required_plan: 'pro', capabilities: ['block_ip', 'block_domain'], status: 'ga', is_bidirectional: true },
    { id: 'fortinet', name: 'FortiGate', vendor: 'Fortinet', category: 'firewall', description: 'Enterprise firewall platform.', required_env_vars: ['FORTI_URL', 'FORTI_TOKEN'], required_plan: 'pro', capabilities: ['block_ip'], status: 'beta', is_bidirectional: true },
    { id: 'cisco_asa', name: 'Cisco ASA', vendor: 'Cisco', category: 'firewall', description: 'Adaptive Security Appliance.', required_env_vars: ['CISCO_URL', 'CISCO_USER', 'CISCO_PASS'], required_plan: 'enterprise', capabilities: ['block_ip'], status: 'beta', is_bidirectional: true },
    { id: 'aws_sg', name: 'AWS Security Groups', vendor: 'Amazon', category: 'firewall', description: 'VPC virtual firewalls.', required_env_vars: ['AWS_ACCESS_KEY', 'AWS_SECRET_KEY', 'AWS_REGION'], required_plan: 'free', capabilities: ['modify_rules'], status: 'ga', is_bidirectional: true },
    { id: 'azure_nsg', name: 'Azure NSG', vendor: 'Microsoft', category: 'firewall', description: 'Network Security Groups.', required_env_vars: ['AZURE_TENANT_ID', 'AZURE_CLIENT_ID', 'AZURE_SECRET'], required_plan: 'free', capabilities: ['modify_rules'], status: 'ga', is_bidirectional: true },

    // Identity
    { id: 'active_directory', name: 'Active Directory', vendor: 'Microsoft', category: 'identity', description: 'On-prem identity services.', required_env_vars: ['AD_LDAP_URL', 'AD_USER', 'AD_PASS'], required_plan: 'enterprise', capabilities: ['disable_user', 'force_password_reset'], status: 'beta', is_bidirectional: true },
    { id: 'azure_ad', name: 'Entra ID', vendor: 'Microsoft', category: 'identity', description: 'Cloud identity and access.', required_env_vars: ['MS_TENANT_ID', 'MS_CLIENT_ID', 'MS_CLIENT_SECRET'], required_plan: 'free', capabilities: ['disable_user', 'revoke_sessions'], status: 'ga', is_bidirectional: true },
    { id: 'okta', name: 'Okta Identity Cloud', vendor: 'Okta', category: 'identity', description: 'Enterprise identity management.', required_env_vars: ['OKTA_URL', 'OKTA_TOKEN'], required_plan: 'pro', capabilities: ['disable_user', 'clear_sessions'], status: 'ga', is_bidirectional: true },
    { id: 'cyberark', name: 'CyberArk PAM', vendor: 'CyberArk', category: 'identity', description: 'Privileged access management.', required_env_vars: ['CYBERARK_URL', 'CYBERARK_APP_ID'], required_plan: 'enterprise', capabilities: ['rotate_credentials'], status: 'coming_soon', is_bidirectional: true },

    // Email
    { id: 'o365', name: 'Office 365 Email', vendor: 'Microsoft', category: 'email', description: 'Cloud email services.', required_env_vars: ['MS_TENANT_ID', 'MS_CLIENT_ID', 'MS_CLIENT_SECRET'], required_plan: 'free', capabilities: ['ingest_emails', 'quarantine_message', 'delete_message'], status: 'ga', is_bidirectional: true },
    { id: 'google_workspace', name: 'Google Workspace', vendor: 'Google', category: 'email', description: 'Gmail and productivity suite.', required_env_vars: ['GCP_PROJECT_ID', 'GCP_SERVICE_ACCOUNT_JSON'], required_plan: 'free', capabilities: ['ingest_emails', 'quarantine_message'], status: 'beta', is_bidirectional: true },

    // Cloud
    { id: 'aws_guardduty', name: 'Amazon GuardDuty', vendor: 'Amazon', category: 'cloud', description: 'Intelligent threat detection.', required_env_vars: ['AWS_ACCESS_KEY', 'AWS_SECRET_KEY', 'AWS_REGION'], required_plan: 'pro', capabilities: ['alert_ingest'], status: 'ga', is_bidirectional: false },
    { id: 'azure_defender', name: 'Defender for Cloud', vendor: 'Microsoft', category: 'cloud', description: 'Cloud security posture management.', required_env_vars: ['AZURE_TENANT_ID', 'AZURE_CLIENT_ID', 'AZURE_SECRET', 'AZURE_SUBSCRIPTION_ID'], required_plan: 'pro', capabilities: ['alert_ingest'], status: 'ga', is_bidirectional: false },
    { id: 'gcp_scc', name: 'Security Command Center', vendor: 'Google', category: 'cloud', description: 'Security and risk management.', required_env_vars: ['GCP_PROJECT_ID', 'GCP_SERVICE_ACCOUNT_JSON'], required_plan: 'enterprise', capabilities: ['alert_ingest'], status: 'beta', is_bidirectional: false },

    // Vulnerability
    { id: 'nessus', name: 'Tenable.io', vendor: 'Tenable', category: 'vulnerability', description: 'Vulnerability management.', required_env_vars: ['TENABLE_ACCESS_KEY', 'TENABLE_SECRET_KEY'], required_plan: 'pro', capabilities: ['vuln_ingest', 'trigger_scan'], status: 'ga', is_bidirectional: true },
    { id: 'qualys', name: 'Qualys VMDR', vendor: 'Qualys', category: 'vulnerability', description: 'Vulnerability detection and response.', required_env_vars: ['QUALYS_URL', 'QUALYS_USER', 'QUALYS_PASS'], required_plan: 'enterprise', capabilities: ['vuln_ingest'], status: 'beta', is_bidirectional: false },
    { id: 'rapid7', name: 'InsightVM', vendor: 'Rapid7', category: 'vulnerability', description: 'Vulnerability assessment.', required_env_vars: ['R7_URL', 'R7_API_KEY'], required_plan: 'pro', capabilities: ['vuln_ingest'], status: 'coming_soon', is_bidirectional: false },

    // Ticketing
    { id: 'jira', name: 'Jira Software', vendor: 'Atlassian', category: 'ticketing', description: 'Issue and project tracking.', required_env_vars: ['JIRA_URL', 'JIRA_EMAIL', 'JIRA_API_TOKEN'], required_plan: 'free', capabilities: ['create_ticket', 'update_ticket', 'sync_comments'], status: 'ga', is_bidirectional: true },
    { id: 'servicenow', name: 'ServiceNow ITSM', vendor: 'ServiceNow', category: 'ticketing', description: 'IT service management.', required_env_vars: ['SNOW_URL', 'SNOW_USER', 'SNOW_PASS'], required_plan: 'enterprise', capabilities: ['create_incident', 'update_incident'], status: 'beta', is_bidirectional: true },
    { id: 'pagerduty', name: 'PagerDuty', vendor: 'PagerDuty', category: 'ticketing', description: 'Incident response platform.', required_env_vars: ['PD_ROUTING_KEY'], required_plan: 'free', capabilities: ['trigger_incident', 'resolve_incident'], status: 'ga', is_bidirectional: true },
    { id: 'opsgenie', name: 'Opsgenie', vendor: 'Atlassian', category: 'ticketing', description: 'Modern incident management.', required_env_vars: ['OPSGENIE_API_KEY'], required_plan: 'pro', capabilities: ['trigger_alert'], status: 'beta', is_bidirectional: false },

    // Threat Intel
    { id: 'misp', name: 'MISP', vendor: 'MISP Project', category: 'threat_intel', description: 'Open source threat intelligence.', required_env_vars: ['MISP_URL', 'MISP_API_KEY'], required_plan: 'free', capabilities: ['ioc_ingest', 'ioc_publish'], status: 'ga', is_bidirectional: true },
    { id: 'opencti', name: 'OpenCTI', vendor: 'Filigran', category: 'threat_intel', description: 'Cyber threat intelligence platform.', required_env_vars: ['OCTI_URL', 'OCTI_TOKEN'], required_plan: 'pro', capabilities: ['ioc_ingest', 'report_ingest'], status: 'beta', is_bidirectional: false },
    { id: 'threatconnect', name: 'ThreatConnect', vendor: 'ThreatConnect', category: 'threat_intel', description: 'Threat intel platform.', required_env_vars: ['TC_URL', 'TC_ACCESS_ID', 'TC_SECRET_KEY'], required_plan: 'enterprise', capabilities: ['ioc_ingest'], status: 'coming_soon', is_bidirectional: false },

    // Network
    { id: 'darktrace', name: 'Darktrace', vendor: 'Darktrace', category: 'network', description: 'Cyber AI loop.', required_env_vars: ['DT_URL', 'DT_PUBLIC_TOKEN', 'DT_PRIVATE_TOKEN'], required_plan: 'enterprise', capabilities: ['alert_ingest', 'model_breaches'], status: 'beta', is_bidirectional: false },
    { id: 'extrahop', name: 'Reveal(x)', vendor: 'ExtraHop', category: 'network', description: 'Network detection and response.', required_env_vars: ['EH_URL', 'EH_API_KEY'], required_plan: 'enterprise', capabilities: ['alert_ingest', 'pcap_retrieval'], status: 'coming_soon', is_bidirectional: true },
    { id: 'zeek', name: 'Zeek', vendor: 'Zeek Project', category: 'network', description: 'Network security monitor.', required_env_vars: ['ZEEK_LOG_PATH'], required_plan: 'free', capabilities: ['log_ingest'], status: 'ga', is_bidirectional: false },

    // Syslog
    { id: 'wazuh', name: 'Wazuh', vendor: 'Wazuh', category: 'syslog', description: 'Open source XDR and SIEM.', required_env_vars: ['WAZUH_URL', 'WAZUH_USER', 'WAZUH_PASS'], required_plan: 'free', capabilities: ['alert_ingest', 'agent_management', 'active_response'], status: 'ga', is_bidirectional: true },
    { id: 'generic_syslog', name: 'Generic Syslog', vendor: 'Open Source', category: 'syslog', description: 'Standard syslog receiver.', required_env_vars: ['SYSLOG_PORT', 'SYSLOG_PROTOCOL'], required_plan: 'free', capabilities: ['log_ingest'], status: 'ga', is_bidirectional: false }
];

export function getAllIntegrations(): Integration[] {
    return REGISTRY;
}

export function getByCategory(category: Integration['category']): Integration[] {
    return REGISTRY.filter(i => i.category === category);
}

export function getIntegration(id: string): Integration | undefined {
    return REGISTRY.find(i => i.id === id);
}
