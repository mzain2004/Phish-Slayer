import { BaseConnector, NormalizedEvent, ConnectorAction, ActionResult, ConnectorType } from '../base';

export class FortinetConnector extends BaseConnector {
  id: string;
  name: string;
  vendor: string = 'fortinet';
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
      const { baseUrl, apiToken } = this.config;
      const response = await fetch(`${baseUrl}/api/v2/cmdb/system/status`, {
        headers: { Authorization: `Bearer ${apiToken}` }
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async pullEvents(since: Date): Promise<NormalizedEvent[]> {
    return await this.withRetry(async () => {
      const { baseUrl, apiToken } = this.config;
      const response = await fetch(`${baseUrl}/api/v2/monitor/log/fortiview/statistics`, {
        headers: { Authorization: `Bearer ${apiToken}` }
      });

      if (!response.ok) throw new Error(`Fortinet Pull Failed: ${response.statusText}`);
      const data = await response.json();
      return (data.results || []).map((r: any) => this.normalize(r));
    });
  }

  async executeAction(action: ConnectorAction): Promise<ActionResult> {
    return await this.withRetry(async () => {
      const { baseUrl, apiToken, vdom = 'root' } = this.config;

      if (action.type === 'block_ip') {
        const url = `${baseUrl}/api/v2/cmdb/firewall/address?vdom=${vdom}`;
        const body = {
          name: `phishslayer_block_${action.target}`,
          type: 'ipmask',
          subnet: `${action.target} 255.255.255.255`,
          comment: 'Blocked by PhishSlayer'
        };

        const response = await fetch(url, {
          method: 'POST',
          headers: { 
            Authorization: `Bearer ${apiToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(body)
        });

        return { success: response.ok, message: response.statusText, timestamp: new Date() };
      }

      throw new Error(`Action ${action.type} not supported by Fortinet`);
    });
  }

  private normalize(raw: any): NormalizedEvent {
    return {
      id: raw.id || Math.random().toString(),
      source: 'FortiGate',
      sourceType: 'firewall',
      organizationId: this.organizationId,
      timestamp: new Date(),
      severity: 'medium',
      rawPayload: raw,
      normalizedFields: {
        title: raw.reason || 'Fortinet Log',
        sourceIp: raw.srcip,
        destIp: raw.dstip,
        user: raw.user
      }
    };
  }
}
