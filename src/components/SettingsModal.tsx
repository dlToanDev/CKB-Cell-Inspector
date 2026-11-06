"use client";

import { useRef, useState } from "react";
import { Check, LoaderCircle, Radio, TriangleAlert } from "lucide-react";
import { NetworkConfig } from "@/types/ckb";
import { fetchTipBlockNumber } from "@/services/ckbRpc";
import { Dialog } from "./Dialog";

export const NETWORKS: NetworkConfig[] = [
  { id: "testnet", name: "CKB Testnet (Pudge)", rpcUrl: "https://testnet.ckb.dev/rpc", explorerUrl: "https://pudge.explorer.nervos.org" },
  { id: "mainnet", name: "CKB Mainnet (Mirana)", rpcUrl: "https://mainnet.ckb.dev/rpc", explorerUrl: "https://explorer.nervos.org" },
];

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentNetwork: NetworkConfig;
  onSaveNetwork: (network: NetworkConfig) => void;
}

export function SettingsModal({ isOpen, onClose, currentNetwork, onSaveNetwork }: SettingsModalProps) {
  const [selectedId, setSelectedId] = useState(currentNetwork.id);
  const [customRpcUrl, setCustomRpcUrl] = useState(currentNetwork.id === "custom" ? currentNetwork.rpcUrl : "http://127.0.0.1:8114");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const testVersion = useRef(0);
  if (!isOpen) return null;

  const targetNetwork = selectedId === "custom" ? { id: "custom" as const, name: "Custom Node", rpcUrl: customRpcUrl.trim(), explorerUrl: "" } : NETWORKS.find((network) => network.id === selectedId)!;
  let validUrl = false;
  try { validUrl = ["http:", "https:"].includes(new URL(targetNetwork.rpcUrl).protocol); } catch { /* Invalid URLs cannot be saved or tested. */ }

  const resetTest = () => { testVersion.current++; setTestResult(null); setTesting(false); };
  const testConnection = async () => {
    const version = ++testVersion.current;
    setTesting(true);
    setTestResult(null);
    try {
      const tip = await fetchTipBlockNumber({ rpcUrl: targetNetwork.rpcUrl });
      if (testVersion.current === version) setTestResult({ success: true, message: `Connected · Block #${parseInt(tip, 16).toLocaleString()}` });
    } catch (error) {
      if (testVersion.current === version) setTestResult({ success: false, message: error instanceof Error ? error.message : "Could not connect to this node." });
    } finally {
      if (testVersion.current === version) setTesting(false);
    }
  };

  return <Dialog title="Choose a network" description="Search transactions on the network you select." onClose={onClose}>
    <fieldset className="network-options"><legend className="sr-only">CKB network</legend>
      {([...NETWORKS, { id: "custom", name: "Custom node" }] as const).map((option) => <label key={option.id} className={`network-option ${selectedId === option.id ? "is-selected" : ""}`}>
        <input type="radio" name="network" value={option.id} checked={selectedId === option.id} onChange={() => { setSelectedId(option.id); resetTest(); }} />
        <span><strong>{option.id === "testnet" ? "Testnet" : option.id === "mainnet" ? "Mainnet" : option.name}</strong><small>{option.id === "testnet" ? "For testing and learning" : option.id === "mainnet" ? "The live Nervos network" : "Connect to your own RPC endpoint"}</small></span>
        {selectedId === option.id && <Check size={16} />}
      </label>)}
    </fieldset>
    {selectedId === "custom" && <div className="custom-rpc"><label htmlFor="custom-rpc">RPC endpoint</label><input id="custom-rpc" type="url" value={customRpcUrl} onChange={(event) => { setCustomRpcUrl(event.target.value); resetTest(); }} placeholder="https://your-ckb-node.example/rpc" spellCheck={false} aria-invalid={!validUrl} aria-describedby={!validUrl ? "rpc-url-error" : undefined} />{!validUrl && <p id="rpc-url-error" className="mt-2 text-xs text-red-300">Enter a complete http:// or https:// URL.</p>}</div>}
    {testResult && <p role="status" className={`connection-result ${testResult.success ? "is-success" : "is-error"}`}>{testResult.success ? <Check size={15} /> : <TriangleAlert size={15} />}<span>{testResult.message}</span></p>}
    <div className="dialog-actions"><button type="button" className="text-button" onClick={testConnection} disabled={testing || !validUrl}>{testing ? <LoaderCircle size={14} className="animate-spin" /> : <Radio size={14} />}{testing ? "Connecting…" : "Test connection"}</button><button type="button" disabled={!validUrl} className="primary-button" onClick={() => { onSaveNetwork(targetNetwork); onClose(); }}>Save network</button></div>
  </Dialog>;
}
