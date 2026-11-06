import { describe, it, expect, vi } from "vitest";
import { normalizeTransaction, NULL_TX_HASH, CELLBASE_INDEX_HEX } from "@/services/txParser";
import { RawGetTransactionResponse } from "@/types/ckb";
import * as ckbRpcModule from "@/services/ckbRpc";

describe("Transaction Parser & Normalization", () => {
  const mockRawResponse: RawGetTransactionResponse = {
    cycles: "0x1a6efa",
    fee: null,
    min_replace_fee: null,
    time_added_to_pool: null,
    transaction: {
      cell_deps: [
        {
          dep_type: "dep_group",
          out_point: {
            index: "0x0",
            tx_hash: "0xf8de3bb47d055cdf460d93a2a6e1b05f7432f9777c8c474abf4eec1d4aee5d37",
          },
        },
      ],
      hash: "0x70a97a4634d7c615e342e9479144784a30ea5ccbb579bf223af42d418f80cc7d",
      header_deps: [],
      inputs: [
        {
          previous_output: {
            index: "0x0",
            tx_hash: "0xd56ae92ff69d52373f98df600805bd6ee5caed693fc9e670acacd6ce358f006f",
          },
          since: "0x0",
        },
      ],
      outputs: [
        {
          capacity: "0x2540be400", // 100 CKB = 10,000,000,000 Shannons
          lock: {
            args: "0x1111111111111111111111111111111111111111",
            code_hash: "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
            hash_type: "type",
          },
          type: null,
        },
      ],
      outputs_data: ["0x"],
      version: "0x0",
      witnesses: ["0x5500000010000000"],
    },
    tx_status: {
      block_hash: "0x010076f529d65f3ebc70db99c7a777bd62a965e9564f988ed77f0c1b4755c9cb",
      block_number: "0x15ea831",
      reason: null,
      status: "committed",
      tx_index: "0x1",
    },
  };

  it("normalizes a standard transaction response with mock resolved inputs", async () => {
    // Mock the previous transaction fetch:
    vi.spyOn(ckbRpcModule, "fetchRawTransaction").mockResolvedValueOnce({
      cycles: null,
      fee: null,
      min_replace_fee: null,
      time_added_to_pool: null,
      transaction: {
        cell_deps: [],
        hash: "0xd56ae92ff69d52373f98df600805bd6ee5caed693fc9e670acacd6ce358f006f",
        header_deps: [],
        inputs: [],
        outputs: [
          {
            capacity: "0x2540c8040", // 100.0004 CKB = 10,000,040,000 Shannons (leaving 40,000 Shannons = 0.0004 CKB fee)
            lock: {
              args: "0x2222222222222222222222222222222222222222",
              code_hash: "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
              hash_type: "type",
            },
            type: null,
          },
        ],
        outputs_data: ["0x"],
        version: "0x0",
        witnesses: [],
      },
      tx_status: {
        status: "committed",
        block_hash: null,
        block_number: null,
        reason: null,
        tx_index: null,
      },
    });

    const parsed = await normalizeTransaction(mockRawResponse);

    expect(parsed.hash).toBe(mockRawResponse.transaction.hash);
    expect(parsed.status).toBe("committed");
    expect(parsed.blockNumber).toBe(22980657); // 0x15ea831 in decimal
    expect(parsed.cycles).toBe(1732346); // 0x1a6efa in decimal
    expect(parsed.isCellbase).toBe(false);

    expect(parsed.inputs.length).toBe(1);
    expect(parsed.inputs[0].status).toBe("resolved");
    expect(parsed.inputs[0].cell?.capacityCkb).toBe("100.0004 CKB");

    expect(parsed.outputs.length).toBe(1);
    expect(parsed.outputs[0].capacityCkb).toBe("100.00 CKB");

    // Fee: 10,000,040,000 - 10,000,000,000 = 40,000 Shannons = 0.0004 CKB
    expect(parsed.feeShannons).toBe(40000n);
    expect(parsed.feeCkb).toBe("0.0004 CKB");
  });

  it("handles Cellbase transaction correctly without trying to fetch previous outpoint", async () => {
    const cellbaseRawResponse: RawGetTransactionResponse = {
      cycles: null,
      fee: null,
      min_replace_fee: null,
      time_added_to_pool: null,
      transaction: {
        cell_deps: [],
        hash: "0x920e3e1dabd3f32e3c6964ad8dd8f05335a3461b2f76855910eafb5d268e4cd5",
        header_deps: [],
        inputs: [
          {
            previous_output: {
              index: CELLBASE_INDEX_HEX,
              tx_hash: NULL_TX_HASH,
            },
            since: "0x15ea819",
          },
        ],
        outputs: [
          {
            capacity: "0xd4074a5f5", // 569.15838453 CKB
            lock: {
              args: "0x70dd447182cb7e9f78f10e231376130700209a32",
              code_hash: "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
              hash_type: "type",
            },
            type: null,
          },
        ],
        outputs_data: ["0x"],
        version: "0x0",
        witnesses: ["0x7f000000"],
      },
      tx_status: {
        block_hash: "0x620af8685f670bd52e981aaa92eb98c5a2fb7c075b464bd7daee3009f0032f64",
        block_number: "0x15ea819",
        reason: null,
        status: "committed",
        tx_index: "0x0",
      },
    };

    const spy = vi.spyOn(ckbRpcModule, "fetchRawTransaction");

    const parsed = await normalizeTransaction(cellbaseRawResponse);

    // Should NOT have made any RPC call for cellbase input
    expect(spy).not.toHaveBeenCalled();
    expect(parsed.isCellbase).toBe(true);
    expect(parsed.inputs[0].isCellbase).toBe(true);
    expect(parsed.inputs[0].status).toBe("cellbase");
    expect(parsed.totalInputCapacityShannons).toBe(0n);
    expect(parsed.totalOutputCapacityCkb).toBe("569.15961333 CKB");
    expect(parsed.feeCkb).toBe(null); // Cellbase transactions mint new tokens
  });

  it("handles unavailable previous output gracefully", async () => {
    vi.spyOn(ckbRpcModule, "fetchRawTransaction").mockResolvedValueOnce(null);

    const parsed = await normalizeTransaction(mockRawResponse);

    expect(parsed.inputs[0].status).toBe("unavailable");
    expect(parsed.inputs[0].errorMessage).toBeDefined();
    expect(parsed.hasUnavailableInputs).toBe(true);
    expect(parsed.feeCkb).toBe(null); // Fee cannot be calculated when inputs are missing
  });
});
