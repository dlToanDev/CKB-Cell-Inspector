"use client";

import React, { useState } from "react";
import { X, Check, Server, RefreshCw, AlertCircle } from "lucide-react";
import { NetworkConfig } from "@/types/ckb";
import { fetchTipBlockNumber, fetchBlockchainInfo } from "@/services/ckbRpc";

export const NETWORKS: NetworkConfig[] = [
  {
    id: "testnet",
    name: "CKB Testnet (Pudge)",
    rpcUrl: "https://testnet.ckb.dev/rpc",
    explorerUrl: "https://pudge.explorer.nervos.org",
  },
  {
    id: "mainnet",
    name: "CKB Mainnet (Mirana)",
    rpcUrl: "https://mainnet.ckb.dev/rpc",
    explorerUrl: "https://explorer.nervos.org",
  },
];

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentNetwork: NetworkConfig;
  onSaveNetwork: (network: NetworkConfig) => void;
}

export function SettingsModal({
  isOpen,
  onClose,
  currentNetwork,
  onSaveNetwork,
}: SettingsModalProps) {
  const [selectedId, setSelectedId] = useState<string>(currentNetwork.id);
  const [customRpcUrl, setCustomRpcUrl] = useState<string>(
    currentNetwork.id === "custom" ? currentNetwork.rpcUrl : "http://127.0.0.1:8114"
  );
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    tipBlock?: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);

    const targetUrl =
      selectedId === "custom"
        ? customRpcUrl
        : NETWORKS.find((n) => n.id === selectedId)?.rpcUrl || customRpcUrl;

    try {
      const tip = await fetchTipBlockNumber({ rpcUrl: targetUrl });
      const info = await fetchBlockchainInfo({ rpcUrl: targetUrl }).catch(() => null);

      const blockNum = parseInt(tip, 16);
      setTestResult({
        success: true,
        message: `Connected successfully! Chain: ${info?.chain || "CKB Node"}`,
        tipBlock: `Tip block: #${blockNum.toLocaleString()} (${tip})`,
      });
    } catch (err: unknown) {
      const error = err as Error;
      setTestResult({
        success: false,
        message: `Connection failed: ${error?.message || String(err)}`,
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    if (selectedId === "custom") {
      onSaveNetwork({
        id: "custom",
        name: "Custom Node",
        rpcUrl: customRpcUrl.trim(),
        explorerUrl: "https://pudge.explorer.nervos.org",
      });
    } else {
      const found = NETWORKS.find((n) => n.id === selectedId);
      if (found) {
        onSaveNetwork(found);
      }
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Network & RPC Settings</h2>
              <p className="text-xs text-slate-400">
                Configure your Nervos CKB JSON-RPC connection
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Network Selection */}
        <div className="mt-5 space-y-4">
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Select Network Preset
          </label>

          <div className="grid grid-cols-1 gap-2.5">
            {NETWORKS.map((net) => {
              const isSelected = selectedId === net.id;
              return (
                <div
                  key={net.id}
                  onClick={() => {
                    setSelectedId(net.id);
                    setTestResult(null);
                  }}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? "bg-emerald-950/30 border-emerald-500/50 text-white shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                      : "bg-slate-950/50 border-slate-800 text-slate-300 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-3 h-3 rounded-full border ${
                          isSelected
                            ? "bg-emerald-400 border-emerald-300 shadow-[0_0_8px_rgba(52,211,153,0.5)]"
                            : "border-slate-600 bg-transparent"
                        }`}
                      />
                      <span className="font-medium text-sm">{net.name}</span>
                    </div>
                    {net.id === "testnet" && (
                      <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-teal-500/10 text-teal-300 border border-teal-500/20">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 text-xs font-mono text-slate-400 break-all pl-5">
                    {net.rpcUrl}
                  </p>
                </div>
              );
            })}

            {/* Custom option */}
            <div
              onClick={() => {
                setSelectedId("custom");
                setTestResult(null);
              }}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                selectedId === "custom"
                  ? "bg-emerald-950/30 border-emerald-500/50 text-white shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                  : "bg-slate-950/50 border-slate-800 text-slate-300 hover:border-slate-700"
              }`}
            >
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full border ${
                    selectedId === "custom"
                      ? "bg-emerald-400 border-emerald-300"
                      : "border-slate-600 bg-transparent"
                  }`}
                />
                <span className="font-medium text-sm">Custom RPC Node</span>
              </div>
              {selectedId === "custom" && (
                <div className="mt-3 pl-5" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="url"
                    value={customRpcUrl}
                    onChange={(e) => setCustomRpcUrl(e.target.value)}
                    placeholder="http://127.0.0.1:8114"
                    className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Enter the full URL of your local or remote CKB node (e.g. CKB Dev Chain).
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Test connection result */}
          {testResult && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                testResult.success
                  ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
                  : "bg-red-950/40 border-red-500/40 text-red-300"
              }`}
            >
              {testResult.success ? (
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-medium">{testResult.message}</p>
                {testResult.tipBlock && (
                  <p className="text-slate-300 font-mono mt-0.5">{testResult.tipBlock}</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={testing}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700/80 text-xs font-medium text-slate-200 border border-slate-700 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${testing ? "animate-spin" : ""}`} />
            <span>{testing ? "Testing..." : "Test Connection"}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 rounded-xl text-xs font-medium bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold shadow-[0_0_15px_rgba(16,185,129,0.25)] transition-all cursor-pointer"
            >
              Save & Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
