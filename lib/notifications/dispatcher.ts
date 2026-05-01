import { supabaseAdmin } from '@/lib/supabase/admin';
import { sendSlackMessage } from './channels/slack';
import { sendEmail } from './channels/email';
import { sendPagerDuty } from './channels/pagerduty';
import { sendTeamsMessage } from './channels/teams';
import { getCurrentOnCall } from './on-call';

export async function notify(orgId: string, event: { severity: string, event_type: string, alert_id?: string, case_id?: string, message: string }) {

    try {
        // 1. Fetch active rules
        const { data: rules, error: rulesError } = await supabaseAdmin
            .from('notification_rules')
            .select('*, channel:notification_channels(*)')
            .eq('org_id', orgId)
            .eq('is_active', true);

        if (rulesError || !rules) return;

        for (const rule of rules) {
            const conditions = rule.trigger_conditions;
            
            // Check severity
            if (conditions.severities?.length > 0 && !conditions.severities.includes(event.severity)) continue;
            
            // Check event type
            if (conditions.event_types?.length > 0 && !conditions.event_types.includes(event.event_type)) continue;

            // 2. Cooldown check
            if (rule.cooldown_minutes > 0 && event.alert_id) {
                const { data: recentLog } = await supabaseAdmin
                    .from('notification_logs')
                    .select('id')
                    .eq('rule_id', rule.id)
                    .eq('alert_id', event.alert_id)
                    .gte('sent_at', new Date(Date.now() - rule.cooldown_minutes * 60000).toISOString())
                    .limit(1)
                    .maybeSingle();

                if (recentLog) {
                    continue;
                }
            }

            // 3. Send to channel
            const channel = rule.channel;
            if (!channel || !channel.is_active) continue;

            let status: 'sent' | 'failed' = 'sent';
            let errorMsg = null;

            try {
                switch (channel.type) {
                    case 'slack':
                        await sendSlackMessage(channel.config.webhook_url, event);
                        break;
                    case 'email':
                        await sendEmail(channel.config, event);
                        break;
                    case 'pagerduty':
                        await sendPagerDuty(channel.config.routing_key, event);
                        break;
                    case 'teams':
                        await sendTeamsMessage(channel.config.webhook_url, event);
                        break;
                    default:
                        console.warn(`[NotificationDispatcher] Unsupported channel type: ${channel.type}`);
                        status = 'failed';
                        errorMsg = 'Unsupported channel type';
                }
            } catch (err: any) {
                status = 'failed';
                errorMsg = err.message;
            }

            // 4. Log result
            await supabaseAdmin.from('notification_logs').insert({
                org_id: orgId,
                rule_id: rule.id,
                channel_id: channel.id,
                alert_id: event.alert_id,
                case_id: event.case_id,
                status,
                error_message: errorMsg
            });
        }

        // 5. Critical Escalation to On-Call
        if (event.severity.toLowerCase() === 'critical') {
            const { data: rotations } = await supabaseAdmin.from('on_call_rotations').select('id').eq('org_id', orgId);
            if (rotations) {
                for (const rot of rotations) {
                    const member = await getCurrentOnCall(orgId, rot.id);
                    if (member) {
                        // In a real system, we'd have a direct "Member Notifier" here
                    }
                }
            }
        }

    } catch (error) {
        console.error('[NotificationDispatcher] Fatal error:', error);
    }
}

export const dispatchNotification = notify;
