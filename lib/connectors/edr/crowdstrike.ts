import { BaseConnector, NormalizedEvent, ConnectorAction, ActionResult, ConnectorType } from '../base';

export class CrowdStrikeConnector extends BaseConnector {
  id: string;
  name: string;
  vendor: string = 'crowdstrike';
  type: ConnectorType = 'edr';
  organizationId: string;

  constructor(config: any, organizationId: string, id: string, name: string) {
    super(config, organizationId);
    this.id = id;
    this.name = name;
    this.organizationId = organizationId;
  }

  private async getAccessToken(): Promise<string> {
    const { clientId, clientSecret, baseUrl } = this.config;
    const params = new URLSearchParams();
    params.append('client_id', clientId);
    params.append('client_secret', clientSecret);

    const response = await fetch(`${baseUrl}/oauth2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
    });

    if (!response.ok) {
      throw new Error(`CrowdStrike Auth Failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.access_token;
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.getAccessToken();
      return true;
    } catch (error) {
      this.log(`Test connection failed: ${error}`, 'error');
      return false;
    }
  }

  async pullEvents(since: Date): Promise<NormalizedEvent[]> {
    return await this.withRetry(async () => {
      const token = await this.getAccessToken();
      const { baseUrl } = this.config;

      // Query for detects
      const queryResponse = await fetch(`${baseUrl}/detects/queries/detects/v1?filter=created_timestamp:>'${since.toISOString()}'`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!queryResponse.ok) throw new Error(`Query failed: ${queryResponse.statusText}`);
      const queryData = await queryResponse.json();
      const ids = queryData.resources || [];

      if (ids.length === 0) return [];

      // Get detect details
      const detailsResponse = await fetch(`${baseUrl}/detects/entities/detects/v1`, {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ids }),
      });

      if (!detailsResponse.ok) throw new Error(`Details failed: ${detailsResponse.statusText}`);
      const detailsData = await detailsResponse.json();

      return detailsData.resources.map((r: any) => this.normalize(r));
    });
  }

  async executeAction(action: ConnectorAction): Promise<ActionResult> {
    return await this.withRetry(async () => {
      const token = await this.getAccessToken();
      const { baseUrl } = this.config;

      switch (action.type) {
        case 'block_ip':
          const iocResponse = await fetch(`${baseUrl}/iocs/entities/iocs/v1`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ indicators: [{ type: 'ipv4', value: action.target, action: 'prevent' }] }),
          });
          return { success: iocResponse.ok, message: iocResponse.statusText, timestamp: new Date() };

        case 'isolate_host':
          const containmentResponse = await fetch(`${baseUrl}/devices/entities/devices-actions/v2?action_name=contain`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids: [action.target] }),
          });
          return { success: containmentResponse.ok, message: containmentResponse.statusText, timestamp: new Date() };

        default:
          throw new Error(`Action ${action.type} not supported by CrowdStrike`);
      }
    });
  }

  private normalize(raw: any): NormalizedEvent {
    return {
      id: raw.detection_id,
      source: 'CrowdStrike Falcon',
      sourceType: 'edr',
      organizationId: this.organizationId,
      timestamp: new Date(raw.created_timestamp),
      severity: this.mapSeverity(raw.status), // CrowdStrike status/severity mapping
      rawPayload: raw,
      normalizedFields: {
        title: raw.description,
        hostname: raw.device?.hostname,
        user: raw.device?.user_name,
        filePath: raw.behaviors?.[0]?.filepath,
        hash: raw.behaviors?.[0]?.sha256,
      }
    };
  }

  private mapSeverity(csSeverity: string): 'critical' | 'high' | 'medium' | 'low' | 'info' {
    const s = csSeverity.toLowerCase();
    if (s.includes('critical')) return 'critical';
    if (s.includes('high')) return 'high';
    if (s.includes('medium')) return 'medium';
    if (s.includes('low')) return 'low';
    return 'info';
  }
}
