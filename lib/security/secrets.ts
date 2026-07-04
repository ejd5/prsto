/**
 * PRSTO — Secret management.
 * All API keys stored in the database are encrypted at rest.
 * Uses Node.js native crypto with AES-256-GCM.
 */

import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const ENCRYPTED_PREFIX = "enc:";

/**
 * Resolve the encryption key from env or a dev fallback.
 * In dev, if PRSTO_SECRET_KEY is missing, uses a deterministic dev key
 * and logs a warning. In production, presence is enforced.
 */
export function getSecretKey(): Buffer {
  const envKey = process.env.ELTON_OS_SECRET_KEY;
  if (envKey && envKey.length >= 32) {
    return Buffer.from(envKey.slice(0, 32), "utf-8");
  }
  if (envKey && envKey.length < 32) {
    // Pad if < 32 chars
    return Buffer.from(envKey.padEnd(32, "x"), "utf-8");
  }
  // Dev fallback — deterministic, never for production
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "PRSTO_SECRET_KEY is required in production. " +
      "Set it in .env to a string of at least 32 characters."
    );
  }
  // Dev: warn but use a local-only fallback
  console.warn(
    "[PRSTO] WARNING: PRSTO_SECRET_KEY not set. " +
    "Using dev-only fallback. API keys will NOT be securely encrypted. " +
    "Set PRSTO_SECRET_KEY in .env (min 32 chars)."
  );
  return Buffer.from("dev-only-fallback-key-32chars!!!", "utf-8");
}

/**
 * Encrypt a plaintext API key. Returns string with "enc:" prefix.
 */
export function encryptSecret(plainText: string): string {
  if (!plainText) return "";
  const key = getSecretKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plainText, "utf-8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  // Format: enc:base64(iv):base64(tag):base64(data)
  return `${ENCRYPTED_PREFIX}${iv.toString("base64")}:${tag.toString("base64")}:${encrypted.toString("base64")}`;
}

/**
 * Decrypt an encrypted API key.
 */
export function decryptSecret(cipherText: string): string {
  if (!cipherText) return "";
  if (!cipherText.startsWith(ENCRYPTED_PREFIX)) {
    // Legacy plaintext — return as-is
    return cipherText;
  }
  try {
    const parts = cipherText.slice(ENCRYPTED_PREFIX.length).split(":");
    if (parts.length !== 3) throw new Error("Invalid encrypted format");
    const key = getSecretKey();
    const iv = Buffer.from(parts[0], "base64");
    const tag = Buffer.from(parts[1], "base64");
    const data = Buffer.from(parts[2], "base64");
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
    return decrypted.toString("utf-8");
  } catch {
    // If decryption fails, return original (might be legacy plaintext or wrong key)
    return cipherText;
  }
}

/**
 * Returns true if the value is an encrypted secret.
 */
export function isEncryptedSecret(value: string): boolean {
  return value.startsWith(ENCRYPTED_PREFIX);
}

/**
 * Mask an API key for UI display.
 * Shows only first 4 and last 4 chars.
 */
export function maskSecret(value: string): string {
  if (!value) return "";
  const clean = isEncryptedSecret(value) ? decryptSecret(value) : value;
  if (clean.length <= 8) return "••••";
  return `${clean.slice(0, 4)}••••${clean.slice(-4)}`;
}
