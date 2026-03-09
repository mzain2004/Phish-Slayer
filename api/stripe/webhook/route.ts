import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import Stripe from 'stripe';
import { revalidatePath } from 'next/cache';

// Admin Supabase client to bypass Row Level Security for background webhooks
const getSupabaseAdmin = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
};

// Zod schema to validate the metadata passed during checkout
const CheckoutMetadataSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  tier: z.enum(['free', 'pro', 'enterprise']).optional().default('pro')
});

export async function POST(req: Request) {
  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error: any) {
    console.error('Stripe webhook signature verification failed:', error.message);
    return NextResponse.json({ error: `Webhook Error: ${error.message}` }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        // Ensure metadata is valid
        const metadata = CheckoutMetadataSchema.parse(session.metadata || {});
        
        // Update user profile in Supabase
        const { error } = await supabase
          .from('profiles')
          .update({
            tier: metadata.tier,
            stripe_customer_id: session.customer as string,
            subscription_status: 'active'
          })
          .eq('id', metadata.userId);

        if (error) {
          console.error('Supabase update error (checkout.session.completed):', error);
          throw new Error('Failed to update user profile tier.');
        }

        console.log(`Successfully upgraded user ${metadata.userId} to ${metadata.tier} tier.`);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        // Find the user by stripe_customer_id and ensure their subscription is active
        const { data: profile, error: fetchError } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (fetchError || !profile) {
          console.error('Could not find user with this Stripe Customer ID:', customerId);
          // Don't fail the webhook; maybe it's an old invoice or unlinked account
          break;
        }

        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            subscription_status: 'active'
          })
          .eq('id', profile.id);

        if (updateError) {
          console.error('Supabase update error (invoice.payment_succeeded):', updateError);
          throw new Error('Failed to renew subscription status.');
        }

        console.log(`Successfully renewed subscription for user ${profile.id}.`);
        break;
      }

      default:
        console.log(`Unhandled Stripe event type: ${event.type}`);
    }

    // Attempt to purge cache for the dashboard to reflect new subscription limits/tier
    revalidatePath('/dashboard');

    return NextResponse.json({ received: true }, { status: 200 });

  } catch (error: any) {
    console.error('Webhook processing error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid checkout metadata', details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
