import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

interface EmailPayload {
  type?: string;
  userEmail?: string;
  email?: string;
  name?: string;
  message?: string;
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    const payload: EmailPayload = await request.json();

    const type = payload.type || "Newsletter Subscription";
    const userEmail = (payload.email || payload.userEmail || "")
      .trim()
      .toLowerCase();
    const name = payload.name;
    const message = payload.message;

    if (!userEmail) {
      return NextResponse.json(
        { error: "Email is required." },
        { status: 400 },
      );
    }

    if (!emailRegex.test(userEmail)) {
      return NextResponse.json(
        { error: "Invalid email address." },
        { status: 400 },
      );
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    const supabase = await createClient();

    const saveFallback = async () => {
      const { error } = await supabase.from("waitlist").upsert(
        { email: userEmail, tier: "newsletter" },
        { onConflict: "email" },
      );

      if (error && error.code !== "23505") {
        console.error("Communications fallback error:", error);
      }

      return NextResponse.json({ success: true, message: "Thanks! You'll hear from us soon." });
    };

    if (!resendApiKey) {
      return saveFallback();
    }

    const resend = new Resend(resendApiKey);

    // Dynamic subject line based on the type of form submitted
    let subject = `[Phish-Slayer] New Inquiry: ${type.toUpperCase()}`;
    if (name) {
      subject += ` from ${name}`;
    }

    // Construct the email body
    const textBody = `
New ${type} received.

From: ${name || "Anonymous"} (${userEmail})

Message:
${message || "No message provided."}
    `;

    const htmlBody = `
      <h3>New ${type} Submission</h3>
      <p><strong>From:</strong> ${name || "Anonymous"} (${userEmail})</p>
      <p><strong>Message:</strong></p>
      <p>${message ? message.replace(/\\n/g, "<br/>") : "No message provided."}</p>
    `;

    // Send the email
    const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
    const toEmail = process.env.SUPPORT_EMAIL || "support@phishslayer.tech";

    try {
      const { error: sendError } = await resend.emails.send({
        from: `Phish-Slayer Platform <${fromEmail}>`,
        to: toEmail,
        subject: subject,
        text: textBody,
        html: htmlBody,
      });

      if (sendError) {
        console.error("Resend error:", sendError);
        return saveFallback();
      }
    } catch (emailError) {
      console.error("Email send exception:", emailError);
      return saveFallback();
    }

    return NextResponse.json({
      success: true,
      message: "Thanks! You'll hear from us soon.",
    });
  } catch (error) {
    console.error("Communications route error:", error);
    return NextResponse.json(
      { error: "Invalid request payload." },
      { status: 400 },
    );
  }
}
