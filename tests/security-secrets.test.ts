import { describe, it, expect } from "vitest";
import {
  encryptSecret,
  decryptSecret,
  maskSecret,
  isEncryptedSecret,
} from "@/lib/security/secrets";

// Ensure ELTON_OS_SECRET_KEY is set for tests
process.env.ELTON_OS_SECRET_KEY = "test-secret-key-for-testing-only-32chr";

describe("encryptSecret / decryptSecret", () => {
  it("encrypts and decrypts a simple key", () => {
    const original = "sk-test-api-key-12345";
    const encrypted = encryptSecret(original);
    expect(encrypted).not.toBe(original);
    expect(isEncryptedSecret(encrypted)).toBe(true);
    const decrypted = decryptSecret(encrypted);
    expect(decrypted).toBe(original);
  });

  it("encrypts a DeepSeek-like key", () => {
    const original = "deepseek-abcdef1234567890";
    const encrypted = encryptSecret(original);
    expect(encrypted).not.toBe(original);
    const decrypted = decryptSecret(encrypted);
    expect(decrypted).toBe(original);
  });

  it("encrypts empty string to empty string", () => {
    expect(encryptSecret("")).toBe("");
  });

  it("returns plaintext unchanged if decrypt called on non-encrypted value", () => {
    const result = decryptSecret("sk-plaintext");
    expect(result).toBe("sk-plaintext");
  });

  it("decrypts empty string to empty string", () => {
    expect(decryptSecret("")).toBe("");
  });
});

describe("maskSecret", () => {
  it("masks a plaintext key showing only first 4 and last 4 chars", () => {
    const masked = maskSecret("sk-test-api-key-12345");
    expect(masked).toContain("sk-t");
    expect(masked).toContain("2345");
    expect(masked).toContain("••••");
    expect(masked).not.toContain("test-api-key");
  });

  it("masks short keys with full obfuscation", () => {
    const masked = maskSecret("short");
    expect(masked).toBe("••••");
  });

  it("handles empty string", () => {
    expect(maskSecret("")).toBe("");
  });

  it("masks encrypted values transparently", () => {
    const encrypted = encryptSecret("sk-my-secret-key-9876");
    const masked = maskSecret(encrypted);
    expect(masked).toContain("sk-m");
    expect(masked).toContain("9876");
    expect(masked).not.toContain("secret");
  });
});

describe("isEncryptedSecret", () => {
  it("returns true for encrypted values", () => {
    expect(isEncryptedSecret(encryptSecret("test"))).toBe(true);
  });

  it("returns false for plaintext values", () => {
    expect(isEncryptedSecret("sk-plain")).toBe(false);
    expect(isEncryptedSecret("")).toBe(false);
  });
});
