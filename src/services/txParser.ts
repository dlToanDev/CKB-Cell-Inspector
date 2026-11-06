import {
  CellInput,
  RawGetTransactionResponse,
  NormalizedTransaction,
  ResolvedInputCell,
  ResolvedOutputCell,
} from "@/types/ckb";
import {
  calculateOccupiedCapacity,
  formatCapacity,
  parseCellData,
} from "@/lib/formatters";
import { fetchRawTransaction, RpcCallConfig } from "./ckbRpc";

export const NULL_TX_HASH =
  "0x0000000000000000000000000000000000000000000000000000000000000000";
export const CELLBASE_INDEX_HEX = "0xffffffff";

/**
 * Checks whether an input is a Cellbase input.
 */
export function isCellbaseInput(input: CellInput): boolean {
  if (!input || !input.previous_output) return false;
  const hash = input.previous_output.tx_hash.toLowerCase();
  const idx = input.previous_output.index.toLowerCase();
  return (
    (hash === NULL_TX_HASH || hash === "0x0") &&
    (idx === CELLBASE_INDEX_HEX || idx === "0xffffffff" || idx === "-1")
  );
}

/**
 * Parses a hex number or integer into a JS number safely.
 */
function parseHexOrDec(val: string | number | undefined | null): number | null {
  if (val === undefined || val === null) return null;
  if (typeof val === "number") return val;
  try {
    const clean = val.trim();
    if (clean.startsWith("0x") || clean.startsWith("0X")) {
      return Number(BigInt(clean));
    }
    return Number(clean);
  } catch {
    return null;
  }
}

/**
 * Resolves input cells by fetching their previous transactions.
 * Optimizes RPC requests by batching / deduplicating by previous tx_hash.
 */
export async function resolveInputs(
  inputs: CellInput[],
  config?: RpcCallConfig
): Promise<ResolvedInputCell[]> {
  // Step 1: Detect which inputs need RPC fetching
  const resolvedList: ResolvedInputCell[] = [];
  const hashesToFetch = new Set<string>();

  for (let i = 0; i < inputs.length; i++) {
    const inp = inputs[i];
    const isCellbase = isCellbaseInput(inp);
    const rawIdxHex = inp.previous_output?.index || "0x0";
    const parsedIdx = parseHexOrDec(rawIdxHex) ?? 0;

    if (isCellbase) {
      resolvedList.push({
        index: i,
        outPoint: {
          txHash: inp.previous_output.tx_hash,
          index: parsedIdx,
          rawIndexHex: rawIdxHex,
        },
        since: inp.since,
        sinceDescription: "Cellbase Block Reward (No previous transaction)",
        isCellbase: true,
        status: "cellbase",
      });
    } else {
      resolvedList.push({
        index: i,
        outPoint: {
          txHash: inp.previous_output.tx_hash,
          index: parsedIdx,
          rawIndexHex: rawIdxHex,
        },
        since: inp.since,
        isCellbase: false,
        status: "resolving",
      });
      if (inp.previous_output?.tx_hash) {
        hashesToFetch.add(inp.previous_output.tx_hash);
      }
    }
  }

  // Step 2: Fetch unique previous transactions
  const txCache = new Map<string, RawGetTransactionResponse | null>();
  const hashList = Array.from(hashesToFetch);

  // Concurrency pool (limit 4 concurrent requests to be polite to testnet nodes)
  const CONCURRENCY = 4;
  for (let i = 0; i < hashList.length; i += CONCURRENCY) {
    const chunk = hashList.slice(i, i + CONCURRENCY);
    await Promise.all(
      chunk.map(async (hash) => {
        try {
          const resp = await fetchRawTransaction(hash, config);
          txCache.set(hash, resp);
        } catch {
          txCache.set(hash, null);
        }
      })
    );
  }

  // Step 3: Populate input cell information from the fetched transactions
  for (const item of resolvedList) {
    if (item.isCellbase) continue;

    const prevTx = txCache.get(item.outPoint.txHash);
    if (!prevTx || !prevTx.transaction) {
      item.status = "unavailable";
      item.errorMessage = "Previous transaction output unavailable on RPC node.";
      continue;
    }

    const targetOutput = prevTx.transaction.outputs?.[item.outPoint.index];
    const targetData = prevTx.transaction.outputs_data?.[item.outPoint.index] || "0x";

    if (!targetOutput) {
      item.status = "unavailable";
      item.errorMessage = `Output index #${item.outPoint.index} not found in previous transaction.`;
      continue;
    }

    const capacityBig = BigInt(targetOutput.capacity);
    const parsedData = parseCellData(targetData, !!targetOutput.type);
    const occupiedCap = calculateOccupiedCapacity(targetOutput, targetData);

    item.status = "resolved";
    item.cell = {
      capacityShannons: capacityBig,
      capacityCkb: formatCapacity(capacityBig).formattedCkb,
      lock: targetOutput.lock,
      type: targetOutput.type,
      data: parsedData,
      occupiedCapacityShannons: occupiedCap,
    };
  }

  return resolvedList;
}

/**
 * Normalizes a raw RPC get_transaction response into a rich, structured NormalizedTransaction.
 */
export async function normalizeTransaction(
  rawResp: RawGetTransactionResponse,
  config?: RpcCallConfig
): Promise<NormalizedTransaction> {
  const rawTx = rawResp.transaction;
  const rawStatus = rawResp.tx_status;

  const isCellbase =
    rawTx.inputs.length > 0 && isCellbaseInput(rawTx.inputs[0]);

  // Resolve inputs
  const resolvedInputs = await resolveInputs(rawTx.inputs, config);

  // Parse outputs
  const outputs: ResolvedOutputCell[] = rawTx.outputs.map((out, idx) => {
    const rawData = rawTx.outputs_data?.[idx] || "0x";
    const capacityBig = BigInt(out.capacity);
    const parsedData = parseCellData(rawData, !!out.type);
    const occupiedCap = calculateOccupiedCapacity(out, rawData);

    return {
      index: idx,
      capacityShannons: capacityBig,
      capacityCkb: formatCapacity(capacityBig).formattedCkb,
      lock: out.lock,
      type: out.type,
      data: parsedData,
      occupiedCapacityShannons: occupiedCap,
    };
  });

  // Calculate capacities & fee
  let totalOutputCapacityShannons = 0n;
  for (const out of outputs) {
    totalOutputCapacityShannons += out.capacityShannons;
  }

  let totalInputCapacityShannons: bigint | null = 0n;
  let resolvedInputsCount = 0;
  let hasUnavailableInputs = false;

  if (isCellbase) {
    totalInputCapacityShannons = 0n;
  } else {
    for (const inp of resolvedInputs) {
      if (inp.status === "resolved" && inp.cell) {
        totalInputCapacityShannons = (totalInputCapacityShannons ?? 0n) + inp.cell.capacityShannons;
        resolvedInputsCount++;
      } else {
        hasUnavailableInputs = true;
      }
    }
  }

  let feeShannons: bigint | null = null;
  let feeCkb: string | null = null;

  if (!isCellbase && !hasUnavailableInputs && totalInputCapacityShannons !== null) {
    feeShannons = totalInputCapacityShannons - totalOutputCapacityShannons;
    feeCkb = formatCapacity(feeShannons).formattedCkb;
  }

  const blockNumber = parseHexOrDec(rawStatus.block_number);
  const txIndex = parseHexOrDec(rawStatus.tx_index);
  const cycles = parseHexOrDec(rawResp.cycles);

  return {
    hash: rawTx.hash,
    version: parseHexOrDec(rawTx.version) ?? 0,
    status: rawStatus.status,
    statusReason: rawStatus.reason,
    blockHash: rawStatus.block_hash,
    blockNumber,
    txIndex,
    cycles,
    isCellbase,
    inputs: resolvedInputs,
    outputs,
    cellDeps: rawTx.cell_deps || [],
    headerDeps: rawTx.header_deps || [],
    witnessesCount: rawTx.witnesses?.length || 0,
    totalInputCapacityShannons,
    totalInputCapacityCkb:
      totalInputCapacityShannons !== null
        ? formatCapacity(totalInputCapacityShannons).formattedCkb
        : null,
    totalOutputCapacityShannons,
    totalOutputCapacityCkb: formatCapacity(totalOutputCapacityShannons).formattedCkb,
    feeShannons,
    feeCkb,
    resolvedInputsCount,
    hasUnavailableInputs,
  };
}
