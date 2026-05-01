import { NextResponse } from "next/server";
import { validateEvent } from "@polar-sh/sdk/webhooks";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const webhookSecret = process.env.POLAR_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("POLAR_WEBHOOK_SECRET is not configured");
    return NextResponse.json({ error: "Configuration error" }, { status: 500 });
  }

  try {
    const rawBody = await request.text();
    const headers = Object.fromEntries(request.headers.entries());

    let event: any;
    try {
      event = validateEvent(rawBody, headers, webhookSecret);
    } catch (error) {
      console.error("Invalid Polar webhook signature", error);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const { type, data } = event;
    console.log(`[PolarWebhook] Received event: ${type}`);

    if (type === 'order.created' || type === 'subscription.active' || type === 'subscription.created') {
      const orgId = data.metadata?.orgId;
      const productId = data.product_id || data.product?.id;
      
      if (orgId) {
        let plan = 'free';
        if (productId === process.env.POLAR_PRO_PRODUCT_ID) plan = 'pro';
        if (productId === process.env.POLAR_ENTERPRISE_PRODUCT_ID) plan = 'enterprise';

        await supabaseAdmin
          .from('organizations')
          .update({ plan })
          .eq('id', orgId);
        
        console.log(`[PolarWebhook] Updated org ${orgId} to plan ${plan}`);
      }
    }

    if (type === 'subscription.canceled' || type === 'subscription.revoked') {
      const orgId = data.metadata?.orgId;
      if (orgId) {
        await supabaseAdmin
          .from('organizations')
          .update({ plan: 'free' })
          .eq('id', orgId);
        
        console.log(`[PolarWebhook] Reset org ${orgId} to free plan`);
      }
    }

    if (type === 'subscription.updated') {
      const orgId = data.metadata?.orgId;
      const productId = data.product_id || data.product?.id;

      if (orgId) {
        let plan = 'free';
        if (productId === process.env.POLAR_PRO_PRODUCT_ID) plan = 'pro';
        if (productId === process.env.POLAR_ENTERPRISE_PRODUCT_ID) plan = 'enterprise';

        await supabaseAdmin
          .from('organizations')
          .update({ plan })
          .eq('id', orgId);
        
        console.log(`[PolarWebhook] Updated org ${orgId} to plan ${plan} via update`);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[PolarWebhook] Processing error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
