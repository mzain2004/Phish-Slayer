import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { validateEvent } from "@polar-sh/sdk/webhooks";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

type BillingPlan =
  | "free"
  | "pro_monthly"
  | "pro_annual"
  | "enterprise_monthly"
  | "enterprise_annual";

function planFromProductId(productId: string | null | undefined): BillingPlan {
  if (!productId) return "free";

  if (productId === process.env.POLAR_SOC_PRO_MONTHLY_ID) return "pro_monthly";
  if (productId === process.env.POLAR_SOC_PRO_ANNUAL_ID) return "pro_annual";
  if (productId === process.env.POLAR_CC_MONTHLY_ID)
    return "enterprise_monthly";
  if (productId === process.env.POLAR_CC_ANNUAL_ID) return "enterprise_annual";
  if (productId === process.env.POLAR_FREE_PRODUCT_ID) return "free";

  return "free";
}

function extractProductId(data: any): string {
  return (
    data?.productId ||
    data?.product_id ||
    data?.product?.id ||
    data?.product?.productId ||
    ""
  );
}

function extractUserId(data: any): string | null {
  const direct = data?.metadata?.userId || data?.metadata?.user_id;
  if (typeof direct === "string" && direct.length > 0) {
    return direct;
  }
  return null;
}

function extractCustomerExternalId(data: any): string | null {
  const externalId = data?.customer?.externalId || data?.customer?.external_id;
  if (typeof externalId === "string" && externalId.length > 0) {
    return externalId;
  }
  return null;
}

export async function POST(request: Request) {
  if (!process.env.POLAR_WEBHOOK_SECRET) {
    console.error("CRITICAL ERROR: POLAR_WEBHOOK_SECRET is not defined in environment variables.");
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }

  const client = adminClient();
  const webhookSecret = process.env.POLAR_WEBHOOK_SECRET;

  try {
    const body = await request.text();
    const headers = Object.fromEntries(request.headers.entries());

    let event: any;
    try {
      event = validateEvent(body, headers, webhookSecret);
    } catch (error) {
      console.error("Invalid Polar webhook signature", error);
      return NextResponse.json({ received: true });
    }

    // Idempotency check: deduplicate by event id
    const eventId = event?.id ?? event?.data?.id ?? null;
    if (eventId) {
      const { data: existing } = await adminClient()
        .from("webhook_events")
        .select("event_id")
        .eq("event_id", eventId)
        .maybeSingle();
      if (existing) {
        return NextResponse.json({ received: true }, { status: 200 });
      }
    }

    const type = event?.type;
    const data = event?.data || {};

    if (!eventId) {
      console.error("Polar webhook missing event ID");
      return NextResponse.json({ error: "Missing event ID" }, { status: 400 });
    }

    // Idempotency check
    const { data: existingEvent } = await client
      .from("webhook_events")
      .select("event_id")
      .eq("event_id", eventId)
      .maybeSingle();

    if (existingEvent) {
      console.info(`Webhook event ${eventId} already processed. Skipping.`);
      return NextResponse.json({ received: true });
    }

    // Insert event ID for idempotency before processing
    await client.from("webhook_events").insert({
      event_id: eventId,
      event_type: type,
    });

    if (type === "checkout.created") {
      console.info("Polar checkout created", { id: data?.id || null });
      return NextResponse.json({ received: true });
    }

    if (type === "subscription.created" || type === "subscription.updated") {
      const productId = extractProductId(data);
      const plan = planFromProductId(productId);
      const userIdFromMetadata =
        extractUserId(data) || extractCustomerExternalId(data);

      let userId = userIdFromMetadata;
      if (!userId && data?.id) {
        const { data: existingSub } = await client
          .from("subscriptions")
          .select("user_id")
          .eq("polar_subscription_id", data.id)
          .maybeSingle();
        userId = (existingSub?.user_id as string | undefined) || null;
      }

      if (!userId) {
        // Email fallback removed — security risk. Ensure all Polar checkouts set metadata.userId
        console.warn("Webhook ignored: Missing metadata user_id/externalId for subscription update", {
          eventId,
        });
        return NextResponse.json({ received: true });
      }

      const updatePayload = {
        subscription_tier: plan,
        polar_customer_id:
          data.customerId || data.customer_id || data?.customer?.id || null,
        subscription_status: data.status || "active",
      };

      const polarCustomerId = data.customerId || data.customer_id || data?.customer?.id;
      if (!polarCustomerId) {
        console.error("Webhook rejected: Missing polar customer ID", { eventId });
        return NextResponse.json({ error: "Missing customer ID" }, { status: 400 });
      }

      await client.from("profiles").update(updatePayload).eq("billing_customer_id", polarCustomerId);
    }

    if (type === "subscription.canceled" || type === "subscription.revoked") {
      const polarCustomerId = data.customerId || data.customer_id || data?.customer?.id;

      if (!polarCustomerId) {
        console.error("Webhook rejected: Missing polar customer ID for subscription cancellation", { eventId });
        return NextResponse.json({ error: "Missing customer ID" }, { status: 400 });
      }

      const updatePayload = {
        subscription_status: "canceled",
        subscription_tier: "free",
      };

      await client.from("profiles").update(updatePayload).eq("billing_customer_id", polarCustomerId);
    }
  } catch (error) {
    console.error("Polar webhook processing error", error);
  }

  return NextResponse.json({ received: true });
}
