import { BaseConnector, NormalizedEvent, ConnectorAction, ActionResult, ConnectorType } from '../base';

export class PfSenseConnector extends BaseConnector {
  id: string;
  name: string;
  vendor: string = 'pfsense';
  type: ConnectorType = 'firewall';
  organizationId: string;

  constructor(config: any, organizationId: string, id: string, name: string) {
    super(config, organizationId);
    this.id = id;
    this.name = name;
    this.organizationId = organizationId;
  }

  async testConnection(): Promise<boolean> {
    try {
      const { baseUrl, clientId, clientToken } = this.config;
      const response = await fetch(`${baseUrl}/api/v1/system/status`, {
        headers: { 
          'pfSense-Client': clientId,
          'pfSense-Secret': clientToken 
        }
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async pullEvents(since: Date): Promise<NormalizedEvent[]> {
    return await this.withRetry(async () => {
      const { baseUrl, clientId, clientToken } = this.config;
      const response = await fetch(`${baseUrl}/api/v1/firewall/log`, {
        headers: { 
          'pfSense-Client': clientId,
          'pfSense-Secret': clientToken 
        }
      });

      if (!response.ok) throw new Error(`pfSense Pull Failed: ${response.statusText}`);
      const data = await response.json();
      return (data.data || []).map((r: any) => this.normalize(r));
    });
  }

  async executeAction(action: ConnectorAction): Promise<ActionResult> {
    return await this.withRetry(async () => {
      const { baseUrl, clientId, clientToken } = this.config;

      if (action.type === 'block_ip') {
        const url = `${baseUrl}/api/v1/firewall/rule`;
        const body = {
          type: 'block',
          interface: 'wan',
          ipprotocol: 'inet',
          protocol: 'any',
          src: action.target,
          srcport: 'any',
          dst: 'any',
          dstport: 'any',
          descr: 'Blocked by PhishSlayer'
        };

        const response = await fetch(url, {
          method: 'POST',
          headers: { 
            'pfSense-Client': clientId,
            'pfSense-Secret': clientToken,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(body)
        });

        return { success: response.ok, message: response.statusText, timestamp: new Date() };
      }

      throw new Error(`Action ${action.type} not supported by pfSense`);
    });
  }

  private normalize(raw: any): NormalizedEvent {
    return {
      id: Math.random().toString(),
      source: 'pfSense',
      sourceType: 'firewall',
      organizationId: this.organizationId,
      timestamp: new Date(),
      severity: 'medium',
      rawPayload: raw,
      normalizedFields: {
        title: 'pfSense Firewall Log',
        sourceIp: raw.src,
        destIp: raw.dst,
      }
    };
  }
}
