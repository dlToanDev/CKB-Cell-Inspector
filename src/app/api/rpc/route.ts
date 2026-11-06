import { NextRequest, NextResponse } from "next/server";

/**
 * Server-side CKB RPC Proxy Route
 * Proxies requests to CKB RPC nodes (e.g. testnet.ckb.dev) to prevent
 * CORS issues, header restrictions, and client IP rate-limiting.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { method, params = [], rpcUrl } = body;

    const targetUrl =
      rpcUrl ||
      process.env.NEXT_PUBLIC_CKB_RPC_URL ||
      "https://testnet.ckb.dev/rpc";

    if (!method || typeof method !== "string") {
      return NextResponse.json(
        { jsonrpc: "2.0", error: { code: -32600, message: "Invalid method" }, id: 1 },
        { status: 400 }
      );
    }

    const ckbPayload = {
      id: body.id || 1,
      jsonrpc: "2.0",
      method,
      params,
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "CKB-Cell-Inspector/1.0 (Developer Explorer)",
      },
      body: JSON.stringify(ckbPayload),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return NextResponse.json(
        {
          jsonrpc: "2.0",
          error: {
            code: response.status,
            message: `CKB Node HTTP Error: ${response.statusText}`,
          },
          id: body.id || 1,
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: unknown) {
    const err = error as Error;
    const isTimeout = err?.name === "AbortError";
    return NextResponse.json(
      {
        jsonrpc: "2.0",
        error: {
          code: isTimeout ? -32000 : -32603,
          message: isTimeout
            ? "CKB RPC request timed out (15s limit)"
            : `Failed to connect to CKB RPC: ${err?.message || String(error)}`,
        },
        id: 1,
      },
      { status: isTimeout ? 504 : 502 }
    );
  }
}
