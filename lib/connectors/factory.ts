import { BaseConnector } from './base';
import { CrowdStrikeConnector } from './edr/crowdstrike';
import { SentinelOneConnector } from './edr/sentinelone';
import { DefenderConnector } from './edr/defender';
import { CarbonBlackConnector } from './edr/carbonblack';
import { SplunkConnector } from './siem/splunk';
import { ElasticConnector } from './siem/elastic';
import { AzureSentinelConnector } from './siem/sentinel';
import { PaloAltoConnector } from './firewall/paloalto';
import { FortinetConnector } from './firewall/fortinet';
import { PfSenseConnector } from './firewall/pfsense';
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.CONNECTOR_ENCRYPTION_KEY || 'default-key-32-chars-long-1234567';

function decrypt(text: string) {
  try {
    const [ivHex, encryptedHex] = text.split(':');
    if (!ivHex || !encryptedHex) return text;
    const iv = Buffer.from(ivHex, 'hex');
    const encrypted = Buffer.from(encryptedHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch {
    return text;
  }
}

export const SUPPORTED_VENDORS = [
  'crowdstrike', 'sentinelone', 'microsoft', 'carbonblack',
  'splunk', 'elastic', 'paloalto', 'fortinet', 'pfsense'
];

export function createConnector(configRecord: any): BaseConnector {
  const { id, display_name, vendor, organization_id, config, connector_type } = configRecord;

  // Decrypt all config fields
  const decryptedConfig: any = {};
  for (const [key, value] of Object.entries(config)) {
    if (typeof value === 'string' && value.includes(':')) {
      decryptedConfig[key] = decrypt(value);
    } else {
      decryptedConfig[key] = value;
    }
  }

  switch (vendor.toLowerCase()) {
    case 'crowdstrike':
      return new CrowdStrikeConnector(decryptedConfig, organization_id, id, display_name);
    case 'sentinelone':
      return new SentinelOneConnector(decryptedConfig, organization_id, id, display_name);
    case 'microsoft':
      if (connector_type === 'edr') {
        return new DefenderConnector(decryptedConfig, organization_id, id, display_name);
      } else {
        return new AzureSentinelConnector(decryptedConfig, organization_id, id, display_name);
      }
    case 'carbonblack':
      return new CarbonBlackConnector(decryptedConfig, organization_id, id, display_name);
    case 'splunk':
      return new SplunkConnector(decryptedConfig, organization_id, id, display_name);
    case 'elastic':
      return new ElasticConnector(decryptedConfig, organization_id, id, display_name);
    case 'paloalto':
      return new PaloAltoConnector(decryptedConfig, organization_id, id, display_name);
    case 'fortinet':
      return new FortinetConnector(decryptedConfig, organization_id, id, display_name);
    case 'pfsense':
      return new PfSenseConnector(decryptedConfig, organization_id, id, display_name);
    default:
      throw new Error(`Unsupported vendor: ${vendor}`);
  }
}
