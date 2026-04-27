import { BaseConnector, ConnectorAction, ActionResult } from './base';

export class ConnectorRegistry {
  private static instance: ConnectorRegistry;
  private connectors: Map<string, BaseConnector> = new Map();

  private constructor() {}

  public static getInstance(): ConnectorRegistry {
    if (!ConnectorRegistry.instance) {
      ConnectorRegistry.instance = new ConnectorRegistry();
    }
    return ConnectorRegistry.instance;
  }

  public register(connector: BaseConnector): void {
    this.connectors.set(connector.id, connector);
  }

  public get(id: string): BaseConnector | undefined {
    return this.connectors.get(id);
  }

  public listByOrg(organizationId: string): BaseConnector[] {
    return Array.from(this.connectors.values()).filter(
      c => c.organizationId === organizationId
    );
  }

  public remove(id: string): void {
    this.connectors.delete(id);
  }

  public async executeAction(connectorId: string, action: ConnectorAction): Promise<ActionResult> {
    const connector = this.get(connectorId);
    if (!connector) {
      throw new Error(`Connector ${connectorId} not found in registry`);
    }
    return await connector.executeAction(action);
  }
}

export const registry = ConnectorRegistry.getInstance();
