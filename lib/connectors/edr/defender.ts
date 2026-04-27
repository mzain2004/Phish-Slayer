import { BaseConnector, NormalizedEvent, ConnectorAction, ActionResult, ConnectorType } from '../base';

export class DefenderConnector extends BaseConnector {
  id: string;
  name: string;
  vendor: string = 'microsoft';
  type: ConnectorType = 'edr';
  organizationId: string;

  constructor(config: any, organizationId: string, id: string, name: string) {
    super(config, organizationId);
    this.id = id;
    this.name = name;
    this.organizationId = organizationId;
  }

  private async getAccessToken(): Promise<string> {
    const { tenantId, clientId, clientSecret } = this.config;
    const url = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
    const params = new URLSearchParams();
    params.append('client_id', clientId);
    params.append('client_secret', clientSecret);
    params.append('grant_type', 'client_credentials');
    params.append('scope', 'https://api.securitycenter.microsoft.com/.default');

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
    });

    if (!response.ok) throw new Error('Microsoft Auth Failed');
    const data = await response.json();
    return data.access_token;
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.getAccessToken();
      return true;
    } catch {
      return false;
    }
  }

  async pullEvents(since: Date): Promise<NormalizedEvent[]> {
    return await this.withRetry(async () => {
      const token = await this.getAccessToken();
      const response = await fetch(`https://api.securitycenter.microsoft.com/api/alerts?$filter=alertCreationTime ge ${since.toISOString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) throw new Error(`Defender Pull Failed: ${response.statusText}`);
      const data = await response.json();
      return (data.value || []).map((a: any) => this.normalize(a));
    });
  }

  async executeAction(action: ConnectorAction): Promise<ActionResult> {
    return await this.withRetry(async () => {
      const token = await this.getAccessToken();
      let url = '';
      let body = {};

      switch (action.type) {
        case 'isolate_host':
          url = `https://api.securitycenter.microsoft.com/api/machines/${action.target}/isolate`;
          body = { Comment: 'Isolated by PhishSlayer' };
          break;
        case 'block_ip':
          url = `https://api.securitycenter.microsoft.com/api/indicators`;
          body = { 
            indicatorValue: action.target,
            indicatorType: 'IpAddress',
            action: 'Block',
            title: 'Blocked by PhishSlayer'
          };
          break;
        default:
          throw new Error(`Action ${action.type} not supported by Defender`);
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      return { success: response.ok, message: response.statusText, timestamp: new Date() };
    });
  }

  private normalize(raw: any): NormalizedEvent {
    return {
      id: raw.id,
      source: 'Microsoft Defender for Endpoint',
      sourceType: 'edr',
      organizationId: this.organizationId,
      timestamp: new Date(raw.alertCreationTime),
      severity: this.mapSeverity(raw.severity),
      rawPayload: raw,
      normalizedFields: {
        title: raw.title,
        hostname: raw.computerDnsName,
        user: raw.lastExternalId,
        filePath: raw.evidence?.[0]?.filePath,
        hash: raw.evidence?.[0]?.sha256
      }
    };
  }

  private mapSeverity(s: string): 'critical' | 'high' | 'medium' | 'low' | 'info' {
    const sev = s.toLowerCase();
    if (sev === 'informational') return 'info';
    if (['low', 'medium', 'high', 'critical'].includes(sev)) return sev as any;
    return 'info';
  }
}
