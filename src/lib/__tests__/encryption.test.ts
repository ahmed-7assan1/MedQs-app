import { describe, it, expect, beforeAll } from "vitest";
import { encryptKey, decryptKey, maskKey } from "@/lib/encryption";

beforeAll(() => {
  process.env.ENCRYPTION_KEY = "abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789";
});

describe("encryptKey / decryptKey", () => {
  it("encrypts and decrypts roundtrip", () => {
    const original = "sk-proj-test-key-12345";
    const stored = encryptKey(original);
    expect(stored).toBeTruthy();
    expect(stored).not.toBe(original);

    const parsed = JSON.parse(stored);
    expect(parsed).toHaveProperty("encrypted");
    expect(parsed).toHaveProperty("iv");
    expect(parsed).toHaveProperty("tag");

    const decrypted = decryptKey(stored);
    expect(decrypted).toBe(original);
  });

  it("produces different ciphertext each time (random IV)", () => {
    const key = "same-key";
    const a = encryptKey(key);
    const b = encryptKey(key);
    expect(a).not.toBe(b);
  });

  it("throws when ENCRYPTION_KEY is missing", () => {
    const saved = process.env.ENCRYPTION_KEY;
    delete process.env.ENCRYPTION_KEY;
    expect(() => encryptKey("test")).toThrow("ENCRYPTION_KEY");
    process.env.ENCRYPTION_KEY = saved;
  });
});

describe("maskKey", () => {
  it("masks last 4 chars only", () => {
    expect(maskKey("sk-proj-1234567890abcdef")).toBe("********************cdef");
  });

  it("returns empty for null/undefined/empty", () => {
    expect(maskKey(null)).toBe("");
    expect(maskKey(undefined)).toBe("");
    expect(maskKey("")).toBe("");
  });

  it("handles short keys", () => {
    const result = maskKey("abc");
    expect(result).toBe("****abc");
  });
});
