import crypto from "crypto";

// Symmetric encryption for secrets at rest (org Anthropic keys).
// AES-256-GCM with a 32-byte key derived from KEY_ENCRYPTION_SECRET.
// Stored format: base64(iv).base64(authTag).base64(ciphertext)

function getKey(): Buffer {
  const secret = process.env.KEY_ENCRYPTION_SECRET;
  if (!secret) throw new Error("KEY_ENCRYPTION_SECRET is not set");
  // Derive a stable 32-byte key from whatever length the secret is.
  return crypto.createHash("sha256").update(secret).digest();
}

export function encryptSecret(plaintext: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getKey(), iv);
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString("base64"), tag.toString("base64"), ct.toString("base64")].join(".");
}

export function decryptSecret(stored: string): string {
  const [ivB64, tagB64, ctB64] = stored.split(".");
  if (!ivB64 || !tagB64 || !ctB64) throw new Error("malformed ciphertext");
  const decipher = crypto.createDecipheriv("aes-256-gcm", getKey(), Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(ctB64, "base64")), decipher.final()]).toString("utf8");
}

export function last4(s: string): string {
  return s.slice(-4);
}
