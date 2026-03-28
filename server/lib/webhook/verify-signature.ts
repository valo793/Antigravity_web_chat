import crypto from 'crypto';

/**
 * Verify webhook signature using HMAC SHA-256
 * Expects header format: "sha256=<hex_signature>"
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string | undefined,
  secret: string
): boolean {
  if (!signature) {
    return false;
  }

  // Extract hex signature from header (format: "sha256=xxx")
  const parts = signature.split('=');
  if (parts.length !== 2 || parts[0] !== 'sha256') {
    return false;
  }

  const providedSignature = parts[1];

  // Calculate expected signature
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  // Constant-time comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(providedSignature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Extract and validate webhook timestamp to prevent replay attacks
 * Timestamp should be within 5 minutes of current time
 */
export function validateWebhookTimestamp(timestamp: string | number, maxAgeSeconds = 300): boolean {
  const webhookTime = typeof timestamp === 'string' ? parseInt(timestamp, 10) : timestamp;
  const now = Math.floor(Date.now() / 1000);
  const age = Math.abs(now - webhookTime);

  return age <= maxAgeSeconds;
}
