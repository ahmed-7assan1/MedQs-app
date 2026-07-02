import { describe, it, expect, beforeAll } from "vitest";
import { resolveBestKey, getNoKeyErrorMessage } from "@/lib/byok-resolver";
import { encryptKey } from "@/lib/encryption";

beforeAll(() => {
  process.env.ENCRYPTION_KEY = "abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789";
});

describe("resolveBestKey", () => {
  it("returns null when user is null", () => {
    expect(resolveBestKey(null, "gemini")).toBeNull();
  });

  it("returns user personal key (encrypted)", () => {
    const encrypted = encryptKey("AIza-test-key");
    const user = { personalGeminiKey: encrypted, adminAiKeys: null };
    const result = resolveBestKey(user, "gemini");
    expect(result).not.toBeNull();
    expect(result!.key).toBe("AIza-test-key");
    expect(result!.source).toBe("user");
  });

  it("returns user personal key (legacy plaintext)", () => {
    const user = { personalGeminiKey: "AIza-plain-key", adminAiKeys: null };
    const result = resolveBestKey(user, "gemini");
    expect(result).not.toBeNull();
    expect(result!.key).toBe("AIza-plain-key");
    expect(result!.source).toBe("user");
  });

  it("falls back to admin key when user key is missing", () => {
    const encrypted = encryptKey("admin-key-123");
    const user = {
      personalGeminiKey: null,
      adminAiKeys: { encryptedGeminiKey: encrypted },
    };
    const result = resolveBestKey(user, "gemini");
    expect(result).not.toBeNull();
    expect(result!.key).toBe("admin-key-123");
    expect(result!.source).toBe("admin");
  });

  it("returns null when no key found anywhere", () => {
    const user = { personalGeminiKey: null, adminAiKeys: null };
    expect(resolveBestKey(user, "gemini")).toBeNull();
  });

  it("returns null for unknown provider", () => {
    const user = { personalGeminiKey: "some-key", adminAiKeys: null };
    expect(resolveBestKey(user, "nonexistent" as any)).toBeNull();
  });
});

describe("getNoKeyErrorMessage", () => {
  it("generates user-friendly message", () => {
    const msg = getNoKeyErrorMessage("gemini");
    expect(msg).toContain("Gemini");
    expect(msg).toContain("Settings → AI");
  });
});
