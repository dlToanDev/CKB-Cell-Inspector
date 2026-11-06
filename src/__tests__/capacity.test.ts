import { describe, it, expect } from "vitest";
import {
  formatCapacity,
  calculateOccupiedCapacity,
  parseCellData,
} from "@/lib/formatters";
import { CellOutput } from "@/types/ckb";

describe("Capacity and Shannons Formatting", () => {
  it("converts 100,000,000 Shannons to exactly 1.00 CKB", () => {
    const res = formatCapacity(100_000_000n);
    expect(res.shannons).toBe("100000000");
    expect(res.ckbDecimal).toBe("1.00");
    expect(res.formattedCkb).toBe("1.00 CKB");
  });

  it("formats large capacity with thousands commas correctly", () => {
    // 56915838453 Shannons = 569.15838453 CKB
    const res = formatCapacity(56915838453n);
    expect(res.ckbDecimal).toBe("569.15838453");
    expect(res.formattedCkb).toBe("569.15838453 CKB");
  });

  it("formats hex Shannons string correctly (0xd4074a5f5)", () => {
    const res = formatCapacity("0xd4074a5f5");
    expect(res.formattedCkb).toBe("569.15961333 CKB");
  });

  it("handles 0 Shannons safely", () => {
    const res = formatCapacity(0n);
    expect(res.shannons).toBe("0");
    expect(res.formattedCkb).toBe("0.00 CKB");
  });

  it("formats decimal shannons without losing precision", () => {
    // 1 Shannon = 0.00000001 CKB
    const res = formatCapacity(1n);
    expect(res.ckbDecimal).toBe("0.00000001");
    expect(res.formattedCkb).toBe("0.00000001 CKB");
  });

  it("calculates occupied capacity according to CKB spec", () => {
    // Standard cell: 8 bytes capacity + 0 data bytes + 32 code_hash + 1 hash_type + 20 args = 61 bytes = 61 CKB
    const cell: CellOutput = {
      capacity: "0x1000",
      lock: {
        code_hash: "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
        hash_type: "type",
        args: "0x70dd447182cb7e9f78f10e231376130700209a32", // 20 bytes
      },
      type: null,
    };
    const occupied = calculateOccupiedCapacity(cell, "0x");
    // 8 + 0 + (32 + 1 + 20) = 61 bytes = 6,100,000,000 Shannons = 61 CKB
    expect(occupied).toBe(61n * 100_000_000n);
  });

  it("parses cell data correctly", () => {
    // Empty data
    const empty = parseCellData("0x");
    expect(empty.byteLength).toBe(0);
    expect(empty.typeGuess).toBe("empty");

    // Printable text "Hello CKB" = 48656c6c6f20434b42
    const textData = parseCellData("0x48656c6c6f20434b42");
    expect(textData.byteLength).toBe(9);
    expect(textData.isPrintable).toBe(true);
    expect(textData.asciiText).toBe("Hello CKB");

    // sUDT amount: 16 bytes little endian (1000 tokens)
    // 1000 in hex = 0x03e8 -> little endian: e8 03 00 00 ...
    const sudtHex = "0xe8030000000000000000000000000000";
    const parsedSudt = parseCellData(sudtHex, true);
    expect(parsedSudt.byteLength).toBe(16);
    expect(parsedSudt.typeGuess).toBe("sudt_xudt_amount");
    expect(parsedSudt.parsedAmount).toBe("1000");
  });
});
