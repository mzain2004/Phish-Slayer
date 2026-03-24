import crypto from 'crypto';

// ── Paddle Environment Config ─────────────────────────────────────────
export const PADDLE_API_KEY = process.env.PADDLE_API_KEY || '';
export const PADDLE_WEBHOOK_SECRET = process.env.PADDLE_WEBHOOK_SECRET || '';
export const PADDLE_SOC_PRO_PRICE_ID = process.env.PADDLE_SOC_PRO_PRICE_ID || '';
export const PADDLE_CC_PRICE_ID = process.env.PADDLE_CC_PRICE_ID || '';

// ── Webhook Signature Verification ────────────────────────────────────
// Paddle Billing sends a `Paddle-Signature` header with format:
//   ts=<timestamp>;h1=<hmac_sha256_hex>
// We reconstruct the signed payload as `${ts}:${rawBody}` and compare.

interface VerifyResult {
  valid: boolean;
  error?: string;
}

export function verifyPaddleWebhook(
  rawBody: string,
  signatureHeader: string
): VerifyResult {
  if (!PADDLE_WEBHOOK_SECRET) {
    return { valid: false, error: 'PADDLE_WEBHOOK_SECRET not configured' };
  }

  if (!signatureHeader) {
    return { valid: false, error: 'Missing Paddle-Signature header' };
  }

  try {
    // Parse ts and h1 from header
    const parts = signatureHeader.split(';');
    const tsEntry = parts.find((p) => p.startsWith('ts='));
    const h1Entry = parts.find((p) => p.startsWith('h1='));

    if (!tsEntry || !h1Entry) {
      return { valid: false, error: 'Malformed Paddle-Signature header' };
    }

    const ts = tsEntry.replace('ts=', '');
    const expectedSignature = h1Entry.replace('h1=', '');

    // Reconstruct signed payload
    const signedPayload = `${ts}:${rawBody}`;
    const computedSignature = crypto
      .createHmac('sha256', PADDLE_WEBHOOK_SECRET)
      .update(signedPayload)
      .digest('hex');

    // Timing-safe comparison
    const isValid = crypto.timingSafeEqual(
      Buffer.from(computedSignature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );

    return { valid: isValid };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Signature verification failed';
    return { valid: false, error: message };
  }
}
