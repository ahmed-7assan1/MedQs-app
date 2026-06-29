import { describe, it, expect } from "vitest";
import {
  getCursorPagination,
  getOffsetPagination,
  buildPrismaPagination,
} from "@/lib/pagination";

describe("getOffsetPagination", () => {
  it("returns default page=1, limit=20", () => {
    const params = getOffsetPagination(new URLSearchParams(""));
    expect(params.page).toBe(1);
    expect(params.limit).toBe(20);
  });

  it("parses page and limit from query", () => {
    const params = getOffsetPagination(new URLSearchParams("page=3&limit=10"));
    expect(params.page).toBe(3);
    expect(params.limit).toBe(10);
  });

  it("clamps limit to max 100", () => {
    const params = getOffsetPagination(new URLSearchParams("limit=200"));
    expect(params.limit).toBe(100);
  });

  it("ensures page is at least 1", () => {
    const params = getOffsetPagination(new URLSearchParams("page=0"));
    expect(params.page).toBe(1);
  });

  it("ensures limit is at least 1", () => {
    const params = getOffsetPagination(new URLSearchParams("limit=0"));
    expect(params.limit).toBe(1);
  });
});

describe("getCursorPagination", () => {
  it("returns cursor undefined, limit=20 by default", () => {
    const params = getCursorPagination(new URLSearchParams(""));
    expect(params.cursor).toBeUndefined();
    expect(params.limit).toBe(20);
  });

  it("parses cursor from query", () => {
    const params = getCursorPagination(
      new URLSearchParams("cursor=abc123&limit=50")
    );
    expect(params.cursor).toBe("abc123");
    expect(params.limit).toBe(50);
  });

  it("clamps limit to max 100", () => {
    const params = getCursorPagination(new URLSearchParams("limit=999"));
    expect(params.limit).toBe(100);
  });
});

describe("buildPrismaPagination", () => {
  it("returns correct skip/take", () => {
    const result = buildPrismaPagination({ page: 3, limit: 20 });
    expect(result.skip).toBe(40);
    expect(result.take).toBe(20);
  });
});
