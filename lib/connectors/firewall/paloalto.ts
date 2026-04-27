import { BaseConnector, NormalizedEvent, ConnectorAction, ActionResult, ConnectorType } from '../base';

export class PaloAltoConnector extends BaseConnector {
  id: string;
  name: string;
  vendor: string = 'paloalto';
  type: ConnectorType = 'firewall';
  organizationId: string;

  constructor(config: any, organizationId: string, id: string, name: string) {
    super(config, organizationId);
    this.id = id;
    this.name = name;
    this.organizationId = organizationId;
  }

  private async getApiKey(): Promise<string> {
    const { hostname, username, password } = this.config;
    const url = `https://${hostname}/api/?type=keygen&user=${username}&password=${password}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Palo Alto Auth Failed');
    const text = await response.text();
    // Simplified XML parsing for API key
    const match = text.match(/<key>(.*)<\/key>/);
    if (!match) throw new Error('Could not parse Palo Alto API Key');
    return match[1];
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.getApiKey();
      return true;
    } catch {
      return false;
    }
  }

  async pullEvents(since: Date): Promise<NormalizedEvent[]> {
    return await this.withRetry(async () => {
      const { hostname } = this.config;
      const apiKey = await this.getApiKey();
      const url = `https://${hostname}/api/?type=log&log-type=threat&key=${apiKey}&nlogs=20`;

      const response = await fetch(url);
      if (!response.ok) throw new Error(`Palo Alto Log Pull Failed: ${response.statusText}`);
      const text = await response.text();
      // In a real implementation, we would use an XML parser here.
      // For now, we'll return an empty list or mock some data if we had a parser.
      return []; 
    });
  }

  async executeAction(action: ConnectorAction): Promise<ActionResult> {
    return await this.withRetry(async () => {
      const { hostname, vsys = 'vsys1' } = this.config;
      const apiKey = await this.getApiKey();

      if (action.type === 'block_ip') {
        const xpath = `/config/devices/entry[@name='localhost.localdomain']/vsys/entry[@name='${vsys}']/address`;
        const element = `<entry name='phishslayer_block_${action.target}'><ip-netmask>${action.target}</ip-netmask></entry>`;
        const url = `https://${hostname}/api/?type=config&action=set&key=${apiKey}&xpath=${encodeURIComponent(xpath)}&element=${encodeURIComponent(element)}`;

        const response = await fetch(url, { method: 'POST' });
        return { success: response.ok, message: response.statusText, timestamp: new Date() };
      }

      throw new Error(`Action ${action.type} not supported by Palo Alto`);
    });
  }
}
