import { randomUUID } from 'crypto';

export interface STIXObject {
  type: string;
  id: string;
  spec_version: string;
  created: string;
  modified: string;
  [key: string]: unknown;
}

export interface STIXBundle {
  type: 'bundle';
  id: string;
  spec_version: '2.1';
  created: string;
  objects: STIXObject[];
}

export interface NativeSIEMFormat {
  event_id: string;
  timestamp: string;
  target: string;
  verdict: 'clean' | 'malicious' | 'suspicious';
  risk_score: number;
  ai_heuristic_score: number;
  combined_risk_score: number;
  threat_category: string;
  ai_summary: string;
  whois: {
    registrar: string;
    domain_age_days: number;
    creation_date: string;
    expiry_date: string;
  };
  ssl: {
    issuer: string;
    valid_from: string;
    valid_to: string;
    days_remaining: number;
    is_valid: boolean;
  };
  dns: {
    has_mx: boolean;
    has_spf: boolean;
    has_dmarc: boolean;
  };
  open_ports: number[];
  manipulation_tactics: string[];
  credential_harvesting_signals: string[];
  virustotal_engines_flagged: number;
  scanned_by: string;
  scan_id: string;
}

export interface PhishSlayerSIEMPayload {
  stix: STIXBundle;
  native: NativeSIEMFormat;
  meta: {
    source: 'phish-slayer';
    version: '3.0';
    exported_at: string;
    exported_by: string;
  };
}

function stixId(type: string): string {
  return `${type}--${randomUUID()}`;
}

export function formatAsSTIX(data: NativeSIEMFormat): STIXBundle {
  const now = new Date().toISOString();
  const objects: STIXObject[] = [];

  // Identity — phish-slayer tool
  const identityId = stixId('identity');
  objects.push({
    type: 'identity',
    id: identityId,
    spec_version: '2.1',
    created: now,
    modified: now,
    name: 'Phish-Slayer',
    identity_class: 'system',
    description: 'Automated phishing and malware threat detection platform',
  });

  // Indicator — the malicious target
  const indicatorId = stixId('indicator');
  objects.push({
    type: 'indicator',
    id: indicatorId,
    spec_version: '2.1',
    created: now,
    modified: now,
    name: `Phishing indicator: ${data.target}`,
    description: data.ai_summary,
    pattern: `[domain-name:value = '${data.target}']`,
    pattern_type: 'stix',
    valid_from: data.timestamp,
    labels: ['malicious-activity', 'phishing'],
    confidence: Math.min(100, data.combined_risk_score),
    indicator_types: ['malicious-activity'],
  });

  // Threat actor if high risk
  if (data.risk_score >= 70) {
    const actorId = stixId('threat-actor');
    objects.push({
      type: 'threat-actor',
      id: actorId,
      spec_version: '2.1',
      created: now,
      modified: now,
      name: `Phishing operator (${data.target})`,
      description: `Threat actor associated with ${data.threat_category} activity on ${data.target}`,
      threat_actor_types: ['criminal'],
      sophistication: data.risk_score >= 90 ? 'expert' : 'intermediate',
    });

    // Relationship
    objects.push({
      type: 'relationship',
      id: stixId('relationship'),
      spec_version: '2.1',
      created: now,
      modified: now,
      relationship_type: 'indicates',
      source_ref: indicatorId,
      target_ref: actorId,
    });
  }

  // Relationship: detected-by
  objects.push({
    type: 'relationship',
    id: stixId('relationship'),
    spec_version: '2.1',
    created: now,
    modified: now,
    relationship_type: 'detected-by',
    source_ref: indicatorId,
    target_ref: identityId,
  });

  return {
    type: 'bundle',
    id: stixId('bundle'),
    spec_version: '2.1',
    created: now,
    objects,
  };
}

export function buildSIEMPayload(
  scanData: any,
  deepScanData: any,
  heuristicData: any,
  userEmail: string
): PhishSlayerSIEMPayload {
  const whoisData = deepScanData?.whois || {};
  const sslData = deepScanData?.ssl || {};
  const dnsData = deepScanData?.dns || {};
  const portData = scanData?.port_patrol || {};

  const creationDate = whoisData.creation_date || '';
  const domainAgeDays = creationDate
    ? Math.floor((Date.now() - new Date(creationDate).getTime()) / 86400000)
    : 0;

  const sslValidTo = sslData.valid_to || sslData.validTo || '';
  const daysRemaining = sslValidTo
    ? Math.floor((new Date(sslValidTo).getTime() - Date.now()) / 86400000)
    : 0;

  const native: NativeSIEMFormat = {
    event_id: scanData?.id || randomUUID(),
    timestamp: scanData?.date || new Date().toISOString(),
    target: scanData?.target || '',
    verdict: scanData?.verdict || 'suspicious',
    risk_score: scanData?.risk_score || 0,
    ai_heuristic_score: heuristicData?.heuristicScore || 0,
    combined_risk_score: heuristicData?.combinedRiskScore || scanData?.risk_score || 0,
    threat_category: scanData?.threat_category || 'Unknown',
    ai_summary: scanData?.ai_summary || '',
    whois: {
      registrar: whoisData.registrar || 'Unknown',
      domain_age_days: domainAgeDays,
      creation_date: creationDate,
      expiry_date: whoisData.expiry_date || '',
    },
    ssl: {
      issuer: sslData.issuer || sslData.issuerOrg || 'Unknown',
      valid_from: sslData.valid_from || sslData.validFrom || '',
      valid_to: sslValidTo,
      days_remaining: daysRemaining,
      is_valid: sslData.valid !== false,
    },
    dns: {
      has_mx: !!dnsData.mx_records?.length,
      has_spf: !!dnsData.spf,
      has_dmarc: !!dnsData.dmarc,
    },
    open_ports: (portData.openPorts || []).map((p: any) => p.port),
    manipulation_tactics: heuristicData?.manipulationTactics || [],
    credential_harvesting_signals: heuristicData?.credentialHarvestingSignals || [],
    virustotal_engines_flagged: scanData?.malicious_count || 0,
    scanned_by: userEmail,
    scan_id: scanData?.id || '',
  };

  const stix = formatAsSTIX(native);

  return {
    stix,
    native,
    meta: {
      source: 'phish-slayer',
      version: '3.0',
      exported_at: new Date().toISOString(),
      exported_by: userEmail,
    },
  };
}
