import { NextRequest, NextResponse } from 'next/server';
import { verifyPaddleWebhook, PADDLE_SOC_PRO_PRICE_ID, PADDLE_CC_PRICE_ID } from '@/lib/paddle';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Paddle Billing webhook events
interface PaddleWebhookEvent {
  event_type: string;
  data: {
    id: string;                    // subscription ID
    customer_id: string;
    items: Array<{
      price: {
        id: string;
      };
    }>;
    custom_data?: {
      email?: string;
    };
    status?: string;
  };
}

async function fireDiscordWebhook(message: string) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) return;
  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        embeds: [{
          title: '💳 Paddle Billing Alert',
          description: message,
          color: 16776960, // Yellow
          footer: { text: 'Phish-Slayer Billing System' },
          timestamp: new Date().toISOString(),
        }],
      }),
    });
  } catch (err) {
    console.error('Discord webhook failed:', err);
  }
}

async function findUserByEmail(email: string) {
  // List all auth users and find by email (Supabase admin API)
  const { data, error } = await supabaseAdmin.auth.admin.listUsers();
  if (error || !data?.users) return null;
  const authUser = data.users.find((u) => u.email === email);
  if (!authUser) return null;
  return authUser;
}

async function findUserByBillingCustomerId(billingCustomerId: string) {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id, subscription_tier')
    .eq('billing_customer_id', billingCustomerId)
    .single();
  if (error || !data) return null;
  return data;
}

export async function POST(request: NextRequest) {
  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return NextResponse.json({ error: 'Failed to read body' }, { status: 400 });
  }

  // Verify webhook signature
  const signature = request.headers.get('paddle-signature') || '';
  const verification = verifyPaddleWebhook(rawBody, signature);

  if (!verification.valid) {
    console.error('Paddle webhook signature invalid:', verification.error);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  let event: PaddleWebhookEvent;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  console.log(`[Paddle Webhook] Event: ${event.event_type}`);

  try {
    switch (event.event_type) {
      case 'subscription.created': {
        const subscriptionId = event.data.id;
        const priceId = event.data.items?.[0]?.price?.id;
        const customerId = event.data.customer_id;

        // Determine tier from price ID
        let newTier: string;
        if (priceId === PADDLE_SOC_PRO_PRICE_ID) {
          newTier = 'soc_pro';
        } else if (priceId === PADDLE_CC_PRICE_ID) {
          newTier = 'command_control';
        } else {
          console.warn(`[Paddle Webhook] Unknown price ID: ${priceId}`);
          return NextResponse.json({ received: true });
        }

        // Look up customer email via Paddle API
        const paddleApiKey = process.env.PADDLE_API_KEY;
        let customerEmail = '';
        if (paddleApiKey && customerId) {
          try {
            const res = await fetch(`https://api.paddle.com/customers/${customerId}`, {
              headers: { 'Authorization': `Bearer ${paddleApiKey}` },
            });
            const customerData = await res.json();
            customerEmail = customerData?.data?.email || '';
          } catch (err) {
            console.error('[Paddle Webhook] Failed to fetch customer from Paddle:', err);
          }
        }

        if (!customerEmail) {
          console.error('[Paddle Webhook] No email found for customer:', customerId);
          await fireDiscordWebhook(`⚠️ Subscription created but no email found. Customer ID: ${customerId}, Subscription: ${subscriptionId}`);
          return NextResponse.json({ received: true });
        }

        // Find user in Supabase by email
        const authUser = await findUserByEmail(customerEmail);
        if (!authUser) {
          console.error('[Paddle Webhook] No Supabase user found for email:', customerEmail);
          await fireDiscordWebhook(`⚠️ Paid subscription but no matching user! Email: ${customerEmail}, Tier: ${newTier}`);
          return NextResponse.json({ received: true });
        }

        // Update user profile
        const { error: updateError } = await supabaseAdmin
          .from('profiles')
          .update({
            subscription_tier: newTier,
            billing_customer_id: subscriptionId,
          })
          .eq('id', authUser.id);

        if (updateError) {
          console.error('[Paddle Webhook] Failed to update profile:', updateError);
          return NextResponse.json({ error: 'DB update failed' }, { status: 500 });
        }

        console.log(`[Paddle Webhook] Upgraded ${customerEmail} to ${newTier}`);
        await fireDiscordWebhook(`✅ New subscription! ${customerEmail} → ${newTier} (${subscriptionId})`);
        break;
      }

      case 'subscription.canceled': {
        const subscriptionId = event.data.id;
        const profile = await findUserByBillingCustomerId(subscriptionId);

        if (!profile) {
          console.warn('[Paddle Webhook] No user found for cancelled subscription:', subscriptionId);
          return NextResponse.json({ received: true });
        }

        const { error: downgradeError } = await supabaseAdmin
          .from('profiles')
          .update({ subscription_tier: 'recon' })
          .eq('id', profile.id);

        if (downgradeError) {
          console.error('[Paddle Webhook] Failed to downgrade:', downgradeError);
          return NextResponse.json({ error: 'DB update failed' }, { status: 500 });
        }

        console.log(`[Paddle Webhook] Downgraded ${profile.id} to recon`);
        await fireDiscordWebhook(`🔻 Subscription cancelled. User ${profile.id} downgraded to Recon.`);
        break;
      }

      case 'subscription.past_due': {
        const subscriptionId = event.data.id;
        const profile = await findUserByBillingCustomerId(subscriptionId);

        let userIdentifier = subscriptionId;
        if (profile) {
          // Try to fetch email for alert
          const { data: authData } = await supabaseAdmin.auth.admin.getUserById(profile.id);
          userIdentifier = authData?.user?.email || profile.id;
        }

        console.warn(`[Paddle Webhook] Subscription past due: ${subscriptionId}`);
        await fireDiscordWebhook(`⚠️ PAST DUE — Subscription ${subscriptionId} for user ${userIdentifier}. Payment failed.`);
        break;
      }

      default:
        console.log(`[Paddle Webhook] Unhandled event: ${event.event_type}`);
    }
  } catch (err) {
    console.error('[Paddle Webhook] Processing error:', err);
    return NextResponse.json({ error: 'Internal processing error' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
