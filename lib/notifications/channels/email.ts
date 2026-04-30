import nodemailer from 'nodemailer';

export async function sendEmail(config: any, event: any) {
    const transporter = nodemailer.createTransport({
        host: config.smtp_host,
        port: config.smtp_port || 587,
        secure: config.smtp_secure || false,
        auth: {
            user: config.smtp_user,
            pass: config.smtp_pass
        }
    });

    const mailOptions = {
        from: config.from_email || 'alerts@phishslayer.ai',
        to: config.to_emails,
        subject: `[${event.severity.toUpperCase()}] PhishSlayer Alert: ${event.event_type}`,
        text: event.message,
        html: `
            <h3>${event.severity.toUpperCase()} Alert Detected</h3>
            <p><strong>Message:</strong> ${event.message}</p>
            <ul>
                <li><strong>Type:</strong> ${event.event_type}</li>
                <li><strong>Alert ID:</strong> ${event.alert_id || 'N/A'}</li>
                <li><strong>Case ID:</strong> ${event.case_id || 'N/A'}</li>
            </ul>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
    } catch (error: any) {
        console.error('[EmailSender] Failed to send email:', error.message);
        throw error;
    }
}
