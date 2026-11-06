"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Navbar } from "@/components/Navbar";
import { SearchBar, VERIFIED_TESTNET_SAMPLES } from "@/components/SearchBar";
import { TransactionOverview } from "@/components/TransactionOverview";
import { CellVisualizer } from "@/components/CellVisualizer";
import { CellInspector } from "@/components/CellInspector";
import { ScriptInspectorModal } from "@/components/ScriptInspectorModal";
import { SettingsModal, NETWORKS } from "@/components/SettingsModal";
import { EducationalGuide } from "@/components/EducationalGuide";
import {
  NormalizedTransaction,
  NetworkConfig,
  Script,
} from "@/types/ckb";
import { fetchRawTransaction, fetchTipBlockNumber } from "@/services/ckbRpc";
import { normalizeTransaction } from "@/services/txParser";
import { validateTxHash } from "@/lib/formatters";
import {
  Boxes,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

export default function HomePage() {
  const [network, setNetwork] = useState<NetworkConfig>(NETWORKS[0]); // Testnet default
  const [txHash, setTxHash] = useState<string>("");
  const [transaction, setTransaction] = useState<NormalizedTransaction | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [educationalMode, setEducationalMode] = useState<boolean>(true);
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
  const [tipBlock, setTipBlock] = useState<string | null>(null);

  // Script Modal state
  const [inspectingScript, setInspectingScript] = useState<{
    script: Script;
    role: "lock" | "type";
  } | null>(null);

  // Selected cell highlight between graph and inspector
  const [selectedCell, setSelectedCell] = useState<{
    type: "input" | "output";
    index: number;
  } | null>(null);

  // Fetch tip block number on mount & when network changes
  useEffect(() => {
    let active = true;
    const loadTip = async () => {
      try {
        const tip = await fetchTipBlockNumber({ rpcUrl: network.rpcUrl });
        if (active) setTipBlock(tip);
      } catch {
        if (active) setTipBlock(null);
      }
    };
    loadTip();
    return () => {
      active = false;
    };
  }, [network]);

  // Load transaction logic
  const handleInspectTransaction = useCallback(
    async (hashToSearch: string) => {
      const validation = validateTxHash(hashToSearch);
      if (!validation.isValid || !validation.normalized) {
        setError(validation.errorMessage || "Invalid transaction hash.");
        return;
      }

      const targetHash = validation.normalized;
      setTxHash(targetHash);
      setIsLoading(true);
      setError(null);
      setSelectedCell(null);

      try {
        const raw = await fetchRawTransaction(targetHash, {
          rpcUrl: network.rpcUrl,
        });

        if (!raw || !raw.transaction) {
          setError(
            `Transaction ${targetHash} was not found on ${network.name}. It might not exist, could still be propagating, or was pruned.`
          );
          setTransaction(null);
          setIsLoading(false);
          return;
        }

        const normalized = await normalizeTransaction(raw, {
          rpcUrl: network.rpcUrl,
        });

        setTransaction(normalized);
      } catch (err: unknown) {
        const errorObj = err as Error;
        setError(
          `RPC Error: ${
            errorObj?.message || "Failed to fetch transaction data from CKB node."
          }`
        );
        setTransaction(null);
      } finally {
        setIsLoading(false);
      }
    },
    [network]
  );

  // Auto-load initial verified sample transaction on first visit for instant interactivity
  useEffect(() => {
    const defaultSample = VERIFIED_TESTNET_SAMPLES[0].hash;
    const timer = setTimeout(() => {
      void handleInspectTransaction(defaultSample);
    }, 0);
    return () => clearTimeout(timer);
  }, [handleInspectTransaction]);

  const handleSelectCellFromGraph = (type: "input" | "output", index: number) => {
    setSelectedCell({ type, index });
    const inspectorElem = document.getElementById("cell-inspector-section");
    if (inspectorElem) {
      inspectorElem.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Navbar */}
      <Navbar
        currentNetwork={network}
        onSelectNetwork={setNetwork}
        onOpenSettings={() => setSettingsOpen(true)}
        educationalMode={educationalMode}
        onToggleEducationalMode={() => setEducationalMode(!educationalMode)}
        tipBlock={tipBlock}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Hero & Search Header */}
        <section className="space-y-4">
          <div className="max-w-3xl space-y-2">
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
              Explore CKB Transactions & <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400">
                Understand the Cell Model
              </span>
            </h1>
            <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
              A developer-focused explorer for Nervos CKB. Inspect live inputs and outputs,
              calculate state capacities, analyze Lock & Type scripts, and visualize state transitions.
            </p>
          </div>

          <SearchBar
            onSearch={handleInspectTransaction}
            isLoading={isLoading}
            initialHash={txHash}
          />
        </section>

        {/* Error Notification */}
        {error && (
          <div className="p-4 rounded-2xl bg-red-950/40 border border-red-500/40 text-red-300 flex items-start gap-3 shadow-lg animate-in fade-in">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1 text-sm space-y-1">
              <p className="font-semibold text-red-200">Transaction Query Failed</p>
              <p className="text-xs text-red-300/90 leading-relaxed">{error}</p>
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleInspectTransaction(txHash)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-red-900/60 hover:bg-red-800 text-xs text-white font-medium cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Retry Query</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSettingsOpen(true)}
                  className="text-xs text-red-400 hover:text-red-300 underline cursor-pointer"
                >
                  Check RPC Node Settings
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading Skeleton */}
        {isLoading && (
          <div className="space-y-6 animate-pulse">
            <div className="h-44 rounded-2xl bg-slate-900/60 border border-slate-800" />
            <div className="h-96 rounded-2xl bg-slate-900/60 border border-slate-800" />
            <div className="h-64 rounded-2xl bg-slate-900/60 border border-slate-800" />
          </div>
        )}

        {/* Transaction Content */}
        {!isLoading && transaction && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* 1. Transaction Overview Header */}
            <TransactionOverview
              tx={transaction}
              network={network}
              educationalMode={educationalMode}
            />

            {/* 2. Interactive Cell Graph Visualizer */}
            <CellVisualizer
              tx={transaction}
              onSelectCell={handleSelectCellFromGraph}
              selectedCell={selectedCell}
            />

            {/* 3. Detailed Cell Inspector */}
            <section id="cell-inspector-section">
              <CellInspector
                tx={transaction}
                onInspectScript={(script, role) =>
                  setInspectingScript({ script, role })
                }
                selectedCell={selectedCell}
                educationalMode={educationalMode}
              />
            </section>
          </div>
        )}

        {/* Educational Mode Permanent Resource Guide */}
        {educationalMode && (
          <section className="pt-4">
            <EducationalGuide />
          </section>
        )}
      </main>

      {/* Script Inspector Modal */}
      <ScriptInspectorModal
        script={inspectingScript?.script || null}
        role={inspectingScript?.role || null}
        onClose={() => setInspectingScript(null)}
      />

      {/* Network / RPC Settings Modal */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        currentNetwork={network}
        onSaveNetwork={(newNet) => {
          setNetwork(newNet);
          if (txHash) {
            handleInspectTransaction(txHash);
          }
        }}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/60 py-8 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Boxes className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold text-slate-300">CKB Cell Inspector</span>
            <span>— Open-Source Developer Explorer</span>
          </div>
          <div className="flex items-center gap-6">
            <a
              href="https://github.com/nervosnetwork/ckb"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-emerald-400 transition-colors"
            >
              Nervos CKB Core
            </a>
            <a
              href="https://docs.nervos.org"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-emerald-400 transition-colors"
            >
              Nervos Docs
            </a>
            <a
              href="https://talk.nervos.org"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-emerald-400 transition-colors"
            >
              CKB Community
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
