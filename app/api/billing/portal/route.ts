import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { Paddle, Environment } from '@paddle/paddle-node-sdk';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get customer ID from profiles
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('billing_customer_id')
    .eq('id', user.id)
    .single();

  if (profileError || !profile?.billing_customer_id) {
    return NextResponse.json(
      { error: 'No billing profile found. Please subscribe first.' },
      { status: 404 }
    );
  }

  try {
    const paddle = new Paddle(process.env.PADDLE_API_KEY!, {
      environment: (process.env.NEXT_PUBLIC_PADDLE_ENV as Environment) || Environment.sandbox,
    });

    // 1. Fetch active/trialing subscriptions for this customer
    const subscriptionCollection = paddle.subscriptions.list({
      customerId: [profile.billing_customer_id],
      status: ['active', 'trialing'],
    });
    
    const subscriptions = await subscriptionCollection.next();
    const subscriptionIds = subscriptions.map((s: any) => s.id);

    if (subscriptionIds.length === 0) {
      return NextResponse.json(
        { error: 'No active subscription found to manage.' },
        { status: 404 }
      );
    }

    // 2. Create portal session with the specific subscription IDs
    const portalSession = await paddle.customerPortalSessions.create(
      profile.billing_customer_id,
      subscriptionIds
    );

    return NextResponse.json({ url: portalSession.urls.general });
  } catch (error: any) {
    console.error('Paddle Portal Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate portal link' },
      { status: 500 }
    );
  }
}
