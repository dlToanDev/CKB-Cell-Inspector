import { RawGetTransactionResponse } from "@/types/ckb";

export const DEFAULT_TESTNET_RPC = "https://testnet.ckb.dev/rpc";
export const DEFAULT_MAINNET_RPC = "https://mainnet.ckb.dev/rpc";

export interface RpcCallConfig {
  rpcUrl?: string;
  useProxy?: boolean;
  timeoutMs?: number;
}

/**
 * Executes a JSON-RPC request to a CKB node.
 * Uses the Next.js internal `/api/rpc` proxy in browser environments
 * to avoid CORS restrictions and User-Agent blocking, or direct HTTP in Node/SSR.
 */
export async function callCkbRpc<T = unknown>(
  method: string,
  params: unknown[] = [],
  config: RpcCallConfig = {}
): Promise<T> {
  const rpcUrl = config.rpcUrl || DEFAULT_TESTNET_RPC;
  const isBrowser = typeof window !== "undefined";
  const shouldProxy = config.useProxy ?? isBrowser;
  const timeoutMs = config.timeoutMs ?? 15000;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    let endpoint = rpcUrl;
    let payload: Record<string, unknown>;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (shouldProxy) {
      // Send via internal API proxy
      endpoint = "/api/rpc";
      payload = {
        id: Math.floor(Math.random() * 100000),
        jsonrpc: "2.0",
        method,
        params,
        rpcUrl,
      };
    } else {
      // Direct RPC (Node / test runner)
      payload = {
        id: 1,
        jsonrpc: "2.0",
        method,
        params,
      };
      headers["User-Agent"] = "CKB-Cell-Inspector/1.0 (Developer Explorer)";
    }

    const res = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    const json = (await res.json()) as { error?: { code: number; message: string }; result: T };
    if (json.error) {
      throw new Error(`RPC Error (${json.error.code}): ${json.error.message}`);
    }

    return json.result;
  } catch (err: unknown) {
    clearTimeout(timer);
    const error = err as Error;
    if (error?.name === "AbortError") {
      throw new Error(`RPC Request timed out after ${timeoutMs}ms.`);
    }
    throw err;
  }
}

/**
 * Fetch a transaction by hash.
 */
export async function fetchRawTransaction(
  txHash: string,
  config?: RpcCallConfig
): Promise<RawGetTransactionResponse | null> {
  return await callCkbRpc<RawGetTransactionResponse | null>(
    "get_transaction",
    [txHash],
    config
  );
}

/**
 * Fetch tip block number.
 */
export async function fetchTipBlockNumber(config?: RpcCallConfig): Promise<string> {
  return await callCkbRpc<string>("get_tip_block_number", [], config);
}

/**
 * Fetch blockchain info (chain name: "ckb_testnet" or "ckb").
 */
export async function fetchBlockchainInfo(
  config?: RpcCallConfig
): Promise<{ chain: string }> {
  return await callCkbRpc<{ chain: string }>("get_blockchain_info", [], config);
}
