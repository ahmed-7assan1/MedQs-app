import { describe, it, expect } from "vitest";
import { z } from "zod";
import { validate } from "@/lib/validation/validate";

const TestSchema = z.object({
  name: z.string().min(1),
  age: z.number().min(0),
});

describe("validate", () => {
  it("returns success with parsed data", () => {
    const result = validate(TestSchema, { name: "Alice", age: 30 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Alice");
      expect(result.data.age).toBe(30);
    }
  });

  it("returns failure response for invalid data", () => {
    const result = validate(TestSchema, { name: "", age: -1 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.response).toBeDefined();
    }
  });

  it("strips unknown keys", () => {
    const result = validate(TestSchema, { name: "Bob", age: 25, extra: true });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).not.toHaveProperty("extra");
    }
  });

  it("coerces string to number when applicable", () => {
    const NumSchema = z.object({ count: z.coerce.number() });
    const result = validate(NumSchema, { count: "42" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.count).toBe(42);
    }
  });
});
