import { BaseConnector, NormalizedEvent, ConnectorAction, ActionResult, ConnectorType } from '../base';

export class AzureSentinelConnector extends BaseConnector {
  id: string;
  name: string;
  vendor: string = 'microsoft';
  type: ConnectorType = 'siem';
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
    params.append('scope', 'https://management.azure.com/.default');

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
    });

    if (!response.ok) throw new Error('Azure Auth Failed');
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
      const { subscriptionId, resourceGroup, workspaceName } = this.config;
      
      const url = `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroup}/providers/Microsoft.OperationalInsights/workspaces/${workspaceName}/providers/Microsoft.SecurityInsights/incidents?api-version=2023-02-01-preview&$filter=properties/createdTimeUtc ge ${since.toISOString()}`;

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) throw new Error(`Sentinel Pull Failed: ${response.statusText}`);
      const data = await response.json();
      return (data.value || []).map((i: any) => this.normalize(i));
    });
  }

  async executeAction(action: ConnectorAction): Promise<ActionResult> {
    throw new Error('Azure Sentinel is read-only via this connector');
  }

  private normalize(raw: any): NormalizedEvent {
    const props = raw.properties;
    return {
      id: raw.id,
      source: 'Azure Sentinel',
      sourceType: 'siem',
      organizationId: this.organizationId,
      timestamp: new Date(props.createdTimeUtc),
      severity: this.mapSeverity(props.severity),
      rawPayload: raw,
      normalizedFields: {
        title: props.title,
        description: props.description,
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
