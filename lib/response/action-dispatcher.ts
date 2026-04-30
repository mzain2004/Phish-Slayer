import { ActionType, PlaybookStep, ActionResult } from './playbook-types';

export async function dispatchStep(step: PlaybookStep, context: any): Promise<ActionResult> {
    const { type, config } = step;
    console.log(`[ActionDispatcher] Dispatching step: ${type} for context:`, context.id || context.alert_id);

    try {
        switch (type) {
            case 'block_ip':
                return await handleBlockIp(config, context);
            case 'isolate_host':
                return await handleIsolateHost(config, context);
            case 'disable_account':
                return await handleDisableAccount(config, context);
            case 'notify':
                return await handleNotify(config, context);
            case 'human_approval':
                return { status: 'awaiting_approval', output: { message: 'Awaiting human approval' } };
            case 'wait':
                const seconds = config.seconds || 60;
                await new Promise(resolve => setTimeout(resolve, seconds * 1000));
                return { status: 'success', output: { waited_seconds: seconds } };
            default:
                console.warn(`[ActionDispatcher] Unhandled action type: ${type}`);
                return { status: 'failed', output: {}, error: `Unhandled action type: ${type}` };
        }
    } catch (error: any) {
        console.error(`[ActionDispatcher] Error executing ${type}:`, error);
        return { status: 'failed', output: {}, error: error.message };
    }
}

async function handleBlockIp(config: any, context: any): Promise<ActionResult> {
    const ip = config.ip || context.source_ip || context.ip;
    if (!ip) return { status: 'failed', output: {}, error: 'No IP provided for block_ip' };

    console.log(`[ActionDispatcher] WOULD BLOCK IP: ${ip}`);
    // Future: Call Firewall Connector
    return { status: 'success', output: { ip, message: 'IP block initiated (simulated)' } };
}

async function handleIsolateHost(config: any, context: any): Promise<ActionResult> {
    const hostId = config.host_id || context.agent_id || context.host_id;
    if (!hostId) return { status: 'failed', output: {}, error: 'No Host ID provided for isolate_host' };

    console.log(`[ActionDispatcher] WOULD ISOLATE HOST: ${hostId}`);
    // Future: Call EDR Connector
    return { status: 'success', output: { host_id: hostId, message: 'Host isolation initiated (simulated)' } };
}

async function handleDisableAccount(config: any, context: any): Promise<ActionResult> {
    const userId = config.user_id || context.user_id || context.affected_user;
    if (!userId) return { status: 'failed', output: {}, error: 'No User ID provided for disable_account' };

    console.log(`[ActionDispatcher] WOULD DISABLE ACCOUNT: ${userId}`);
    // Future: Call Identity Connector (Okta/AD)
    return { status: 'success', output: { user_id: userId, message: 'Account disable initiated (simulated)' } };
}

async function handleNotify(config: any, context: any): Promise<ActionResult> {
    const channel = config.channel || 'slack';
    const message = config.message || `Response Action Triggered: ${context.title || 'Manual Action'}`;

    console.log(`[ActionDispatcher] NOTIFY (${channel}): ${message}`);
    // Future: Call Notification Engine
    return { status: 'success', output: { channel, message: 'Notification sent' } };
}
