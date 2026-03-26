import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

interface EmailPayload {
  type: string;
  userEmail: string;
  name?: string;
  message?: string;
}

export async function POST(request: Request) {
  try {
    const payload: EmailPayload = await request.json();

    const { type, userEmail, name, message } = payload;

    if (!type || !userEmail) {
      return NextResponse.json(
        { error: "Missing required fields (type, userEmail)" },
        { status: 400 }
      );
    }

    // Configure Nodemailer transporter
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_APP_PASS,
      },
      tls: {
          rejectUnauthorized: false
      }
    });

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
      <p>${message ? message.replace(/\\n/g, '<br/>') : "No message provided."}</p>
    `;

    // Send the email
    await transporter.sendMail({
      from: `"Phish-Slayer Platform" <${process.env.SMTP_USER}>`,
      to: process.env.SUPPORT_EMAIL,
      subject: subject,
      text: textBody,
      html: htmlBody,
    });

    return NextResponse.json({ success: true, message: "Email sent successfully" });
  } catch (error) {
    console.error("Nodemailer error:", error);
    return NextResponse.json(
      { error: "Failed to send email. Please try again later." },
      { status: 500 }
    );
  }
}
