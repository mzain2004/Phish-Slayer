import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const bodySchema = z.object({
  plan: z.enum(['pro', 'enterprise']),
  billingPeriod: z.enum(['monthly', 'annual']),
});

const PRICE_MAP: Record<string, string | undefined> = {
  pro_monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_FLEET,
  pro_annual: process.env.NEXT_PUBLIC_STRIPE_PRICE_FLEET_ANNUAL,
  enterprise_monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE,
  enterprise_annual: process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE_ANNUAL,
};

export async function POST(request: Request) {
  try {
    // Check if Stripe is configured
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      return NextResponse.json(
        { error: 'Payments are not yet configured.' },
        { status: 503 }
      );
    }

    // Auth check
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse body
    let rawBody: unknown;
    try { rawBody = await request.json(); } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const validation = bodySchema.safeParse(rawBody);
    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid plan or billing period' }, { status: 400 });
    }

    const { plan, billingPeriod } = validation.data;
    const priceKey = `${plan}_${billingPeriod}`;
    const priceId = PRICE_MAP[priceKey];

    if (!priceId) {
      return NextResponse.json(
        { error: `Price ID not configured for ${priceKey}` },
        { status: 503 }
      );
    }

    // Fetch existing Stripe customer ID to prevent duplicates
    const { data: profile } = await supabase.from('profiles').select('stripe_customer_id').eq('id', user.id).single();
    let customerId = profile?.stripe_customer_id;

    // Dynamic Stripe import to avoid build errors when not installed
    const stripe = (await import('stripe')).default;
    const stripeClient = new stripe(stripeKey);

    if (!customerId) {
        const customer = await stripeClient.customers.create({
            email: user.email,
            metadata: { supabase_id: user.id }
        });
        customerId = customer.id;
        await supabase.from('profiles').update({ stripe_customer_id: customerId }).eq('id', user.id);
    }

    const session = await stripeClient.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/dashboard?upgraded=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/pricing`,
      metadata: {
        userId: user.id,
        plan,
        billingPeriod,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error('Stripe checkout error:', err);
    return NextResponse.json({ error: 'Checkout failed' }, { status: 500 });
  }
}
