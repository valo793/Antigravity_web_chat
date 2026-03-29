import crypto from "crypto";

/**
 * Verify webhook signature using HMAC SHA-256.
 * Header format: "sha256=<hex_signature>"
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string | null,
  secret: string
): boolean {
  if (!signature) return false;

  const parts = signature.split("=");
  if (parts.length !== 2 || parts[0] !== "sha256") return false;

  const providedSignature = parts[1];
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(payload, "utf-8")
    .digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(providedSignature, "hex"),
      Buffer.from(expectedSignature, "hex")
    );
  } catch {
    return false;
  }
}

/**
 * Validate webhook timestamp (max 5 min age) to prevent replay attacks.
 */
export function validateWebhookTimestamp(
  timestamp: string,
  maxAgeSeconds = 300
): boolean {
  const webhookTime = new Date(timestamp).getTime();
  if (isNaN(webhookTime)) return false;

  const now = Date.now();
  const age = Math.abs(now - webhookTime);
  return age <= maxAgeSeconds * 1000;
}
