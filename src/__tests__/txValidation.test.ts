import { describe, it, expect } from "vitest";
import { validateTxHash } from "@/lib/formatters";

describe("Transaction Hash Validation", () => {
  const validHashWith0x = "0x70a97a4634d7c615e342e9479144784a30ea5ccbb579bf223af42d418f80cc7d";
  const validHashWithout0x = "70a97a4634d7c615e342e9479144784a30ea5ccbb579bf223af42d418f80cc7d";

  it("accepts valid 66-char hex hash with 0x prefix", () => {
    const res = validateTxHash(validHashWith0x);
    expect(res.isValid).toBe(true);
    expect(res.normalized).toBe(validHashWith0x.toLowerCase());
  });

  it("accepts valid 64-char hex hash without 0x prefix and normalizes it", () => {
    const res = validateTxHash(validHashWithout0x);
    expect(res.isValid).toBe(true);
    expect(res.normalized).toBe(validHashWith0x.toLowerCase());
  });

  it("handles uppercase hex characters correctly", () => {
    const upper = validHashWith0x.toUpperCase().replace("0X", "0x");
    const res = validateTxHash(upper);
    expect(res.isValid).toBe(true);
    expect(res.normalized).toBe(validHashWith0x.toLowerCase());
  });

  it("rejects empty or whitespace-only input", () => {
    expect(validateTxHash("").isValid).toBe(false);
    expect(validateTxHash("   ").isValid).toBe(false);
  });

  it("rejects invalid length hash (too short)", () => {
    const res = validateTxHash("0x1234abcd");
    expect(res.isValid).toBe(false);
    expect(res.errorMessage).toContain("Invalid length");
  });

  it("rejects invalid length hash (too long)", () => {
    const res = validateTxHash(validHashWith0x + "ff");
    expect(res.isValid).toBe(false);
    expect(res.errorMessage).toContain("Invalid length");
  });

  it("rejects non-hexadecimal characters", () => {
    const badChars = validHashWith0x.slice(0, -2) + "zz";
    const res = validateTxHash(badChars);
    expect(res.isValid).toBe(false);
    expect(res.errorMessage).toContain("invalid non-hexadecimal");
  });
});
