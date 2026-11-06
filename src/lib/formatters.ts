import { CellOutput, ParsedCellData, Script } from "@/types/ckb";

/**
 * Validates a CKB Transaction Hash.
 * Accepts:
 * - 64 hex characters without '0x'
 * - 66 characters starting with '0x' followed by 64 hex characters
 */
export function validateTxHash(rawHash: string): {
  isValid: boolean;
  normalized?: string;
  errorMessage?: string;
} {
  if (!rawHash || typeof rawHash !== "string") {
    return {
      isValid: false,
      errorMessage: "Transaction hash cannot be empty.",
    };
  }

  const trimmed = rawHash.trim();

  let hexOnly = trimmed;
  if (trimmed.startsWith("0x") || trimmed.startsWith("0X")) {
    hexOnly = trimmed.slice(2);
  }

  if (hexOnly.length !== 64) {
    return {
      isValid: false,
      errorMessage: `Invalid length: Expected 64 hex characters (32 bytes), but got ${hexOnly.length}.`,
    };
  }

  const hexRegex = /^[0-9a-fA-F]{64}$/;
  if (!hexRegex.test(hexOnly)) {
    return {
      isValid: false,
      errorMessage: "Transaction hash contains invalid non-hexadecimal characters.",
    };
  }

  return {
    isValid: true,
    normalized: `0x${hexOnly.toLowerCase()}`,
  };
}

/**
 * 1 CKB = 100,000,000 Shannons (10^8).
 * Formats Shannons to human-readable CKB with commas, without floating point inaccuracies.
 */
export function formatCapacity(shannonsInput: bigint | string | number): {
  shannons: string;
  ckbDecimal: string;
  formattedCkb: string;
} {
  let shannonsBig: bigint;
  try {
    if (typeof shannonsInput === "bigint") {
      shannonsBig = shannonsInput;
    } else if (typeof shannonsInput === "string") {
      const clean = shannonsInput.trim();
      if (clean.startsWith("0x") || clean.startsWith("0X")) {
        shannonsBig = BigInt(clean);
      } else {
        shannonsBig = BigInt(clean);
      }
    } else {
      shannonsBig = BigInt(Math.floor(shannonsInput));
    }
  } catch {
    return {
      shannons: "0",
      ckbDecimal: "0.00",
      formattedCkb: "0.00 CKB",
    };
  }

  const isNegative = shannonsBig < 0n;
  const absVal = isNegative ? -shannonsBig : shannonsBig;

  const CKB_UNIT = 100_000_000n;
  const wholeCkb = absVal / CKB_UNIT;
  const remainderShannons = absVal % CKB_UNIT;

  // Format remainder to exactly 8 decimal digits, then trim trailing zeroes but keep at least 2 decimals
  const remainderStr = remainderShannons.toString().padStart(8, "0");
  const trimmedRemainder = remainderStr.replace(/0+$/, "");
  const decimalPart = trimmedRemainder.length === 0 ? "00" : trimmedRemainder.length === 1 ? `${trimmedRemainder}0` : trimmedRemainder;

  // Add thousand commas to whole part
  const wholeFormatted = wholeCkb.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const sign = isNegative ? "-" : "";

  const ckbDecimal = `${sign}${wholeCkb}.${decimalPart}`;
  const formattedCkb = `${sign}${wholeFormatted}.${decimalPart} CKB`;

  return {
    shannons: shannonsBig.toString(),
    ckbDecimal,
    formattedCkb,
  };
}

/**
 * Helper to calculate occupied capacity in Shannons for a cell.
 * In CKB, 1 byte of serialized cell size requires 1 CKB (100,000,000 Shannons).
 *
 * Formula:
 * - 8 bytes: capacity uint64
 * - data bytes length
 * - lock script: 32 (code_hash) + 1 (hash_type) + args length
 * - type script (if present): 32 (code_hash) + 1 (hash_type) + args length
 */
export function calculateOccupiedCapacity(output: CellOutput, dataHex: string): bigint {
  const getScriptBytes = (s: Script | null | undefined): number => {
    if (!s) return 0;
    const argsHex = s.args.startsWith("0x") ? s.args.slice(2) : s.args;
    const argsBytes = Math.ceil(argsHex.length / 2);
    return 32 + 1 + argsBytes;
  };

  const cleanData = dataHex.startsWith("0x") ? dataHex.slice(2) : dataHex;
  const dataBytes = Math.ceil(cleanData.length / 2);

  const totalBytes = 8 + dataBytes + getScriptBytes(output.lock) + getScriptBytes(output.type);
  return BigInt(totalBytes) * 100_000_000n;
}

/**
 * Parses raw cell data hex into human-readable analysis:
 * - Byte length
 * - Printable ASCII/UTF-8 string (if printable)
 * - Possible sUDT/xUDT 128-bit little endian token amount
 */
export function parseCellData(dataHex: string, hasTypeScript: boolean = false): ParsedCellData {
  const cleanHex = (dataHex || "0x").trim();
  const raw = cleanHex.startsWith("0x") ? cleanHex.slice(2) : cleanHex;
  const byteLength = Math.ceil(raw.length / 2);

  if (byteLength === 0) {
    return {
      hex: "0x",
      byteLength: 0,
      asciiText: null,
      isPrintable: false,
      typeGuess: "empty",
    };
  }

  // Try decoding as ASCII / UTF-8
  let asciiText: string | null = null;
  let isPrintable = false;

  try {
    const bytes = new Uint8Array(byteLength);
    for (let i = 0; i < byteLength; i++) {
      bytes[i] = parseInt(raw.slice(i * 2, i * 2 + 2), 16);
    }

    const decoded = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    // Check if characters are mostly printable
    const printableChars = decoded.replace(/[\x20-\x7E\t\n\r]/g, "");
    if (printableChars.length === 0 && decoded.trim().length > 0) {
      asciiText = decoded;
      isPrintable = true;
    }
  } catch {
    asciiText = null;
    isPrintable = false;
  }

  // Check for sUDT / xUDT pattern: at least 16 bytes (128-bit uint little endian)
  let typeGuess: ParsedCellData["typeGuess"] = "custom_binary";
  let parsedAmount: string | undefined = undefined;

  if (hasTypeScript && byteLength >= 16) {
    try {
      // First 16 bytes in little-endian order
      const u128Hex = raw.slice(0, 32);
      let amountBig = 0n;
      for (let i = 0; i < 16; i++) {
        const byte = BigInt(parseInt(u128Hex.slice(i * 2, i * 2 + 2), 16));
        amountBig |= byte << BigInt(i * 8);
      }
      typeGuess = "sudt_xudt_amount";
      parsedAmount = amountBig.toString();
    } catch {
      // Ignore conversion error
    }
  }

  return {
    hex: cleanHex.startsWith("0x") ? cleanHex : `0x${cleanHex}`,
    byteLength,
    asciiText,
    isPrintable,
    typeGuess,
    parsedAmount,
  };
}

/**
 * Truncate long hex strings for display: 0x1234...abcd
 */
export function truncateHex(hex: string, frontChars: number = 6, endChars: number = 4): string {
  if (!hex) return "";
  if (hex.length <= frontChars + endChars + 3) return hex;
  return `${hex.slice(0, frontChars)}...${hex.slice(-endChars)}`;
}
