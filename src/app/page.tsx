"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Navbar } from "@/components/Navbar";
import { SearchBar } from "@/components/SearchBar";
import { TransactionOverview } from "@/components/TransactionOverview";
import { CellVisualizer } from "@/components/CellVisualizer";
import { CellInspector } from "@/components/CellInspector";
import { ScriptInspectorModal } from "@/components/ScriptInspectorModal";
import { SettingsModal, NETWORKS } from "@/components/SettingsModal";
import { EducationalGuide } from "@/components/EducationalGuide";
import { NormalizedTransaction, NetworkConfig, Script } from "@/types/ckb";
import { fetchRawTransaction, fetchTipBlockNumber } from "@/services/ckbRpc";
import { normalizeTransaction } from "@/services/txParser";
import { validateTxHash } from "@/lib/formatters";
import { ArrowLeft, ArrowRight, ArrowUpRight, Box, Boxes, CircleHelp, GitBranch, Layers2, LoaderCircle, ShieldCheck, TriangleAlert } from "lucide-react";

export default function HomePage() {
  const [network, setNetwork] = useState<NetworkConfig>(NETWORKS[0]);
  const [txHash, setTxHash] = useState("");
  const [transaction, setTransaction] = useState<NormalizedTransaction | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [tip, setTip] = useState<{ rpcUrl: string; block: string } | null>(null);
  const [activePanel, setActivePanel] = useState<"overview" | "cells">("overview");
  const [inspectingScript, setInspectingScript] = useState<{ script: Script; role: "lock" | "type" } | null>(null);
  const [selectedCell, setSelectedCell] = useState<{ type: "input" | "output"; index: number } | null>(null);
  const requestVersion = useRef(0);
  const hasSearch = isLoading || !!transaction || !!error;
  const tipBlock = tip?.rpcUrl === network.rpcUrl ? tip.block : null;

  useEffect(() => {
    let active = true;
    fetchTipBlockNumber({ rpcUrl: network.rpcUrl }).then((block) => {
      if (active) setTip({ rpcUrl: network.rpcUrl, block });
    }).catch(() => { /* The explorer remains usable without tip metadata. */ });
    return () => { active = false; };
  }, [network.rpcUrl]);

  const handleInspectTransaction = useCallback(async (hash: string) => {
    const validation = validateTxHash(hash);
    if (!validation.isValid || !validation.normalized) {
      setError(validation.errorMessage || "Enter a valid transaction hash.");
      return;
    }
    const version = ++requestVersion.current;
    setTxHash(validation.normalized);
    setIsLoading(true);
    setError(null);
    setTransaction(null);
    setSelectedCell(null);
    setActivePanel("overview");
    setInspectingScript(null);
    try {
      const raw = await fetchRawTransaction(validation.normalized, { rpcUrl: network.rpcUrl });
      if (version !== requestVersion.current) return;
      if (!raw?.transaction) throw new Error(`No transaction found on ${network.name}. Check the hash or try another network.`);
      const normalized = await normalizeTransaction(raw, { rpcUrl: network.rpcUrl });
      if (version === requestVersion.current) setTransaction(normalized);
    } catch (err) {
      if (version === requestVersion.current) setError(err instanceof Error ? err.message : "Could not reach this node. Please try again.");
    } finally {
      if (version === requestVersion.current) setIsLoading(false);
    }
  }, [network]);

  const resetSearch = () => {
    requestVersion.current++;
    setTxHash("");
    setTransaction(null);
    setIsLoading(false);
    setError(null);
    setSelectedCell(null);
    setInspectingScript(null);
    setActivePanel("overview");
  };

  const handleNetworkChange = (next: NetworkConfig) => {
    if (next.rpcUrl !== network.rpcUrl || next.id !== network.id) resetSearch();
    setNetwork(next);
  };

  return (
    <div className="app-shell">
      <a href="#main-content" className="skip-link">Skip to content</a>
      <Navbar currentNetwork={network} onOpenSettings={() => setSettingsOpen(true)} guideOpen={guideOpen} onNavigate={(view) => setGuideOpen(view === "guide")} />

      <main id="main-content" className={`site-container main-content ${!guideOpen && !hasSearch ? "is-landing" : ""}`}>
        {guideOpen ? (
          <section className="guide-view">
            <div className="eyebrow">A little knowledge goes a long way</div>
            <h1>Get to know the cell model.</h1>
            <p className="section-description">The building blocks of CKB, at your own pace.</p>
            <EducationalGuide />
            <button type="button" className="text-button mt-6" onClick={() => setGuideOpen(false)}><ArrowLeft size={15} />Back to explorer</button>
          </section>
        ) : (
          <>
            <section className={`explorer-hero ${hasSearch ? "is-compact" : ""}`} aria-labelledby="explorer-title">
              {!hasSearch && <div className="hero-eyebrow"><span className="status-dot" />THE NERVOS CKB EXPLORER</div>}
              {hasSearch && <button type="button" onClick={resetSearch} className="text-button new-search"><ArrowLeft size={14} />New search</button>}
              <h1 id="explorer-title">{hasSearch ? "Transaction explorer" : <>Every cell.<br /><span>A clearer picture.</span></>}</h1>
              <p>{hasSearch ? "Follow the flow. Explore the details that matter." : "See how a transaction moves CKB. One cell at a time."}</p>
              <SearchBar key={network.rpcUrl} onSearch={handleInspectTransaction} isLoading={isLoading} initialHash={txHash} showSamples={network.id === "testnet"} />
              {!hasSearch && <div className="trust-note"><ShieldCheck size={13} /><span>Read-only explorer</span><span className="separator-dot">·</span><span>No wallet needed</span></div>}
            </section>

            {error && <section className="error-panel" role="alert">
              <TriangleAlert size={21} className="shrink-0" />
              <div className="min-w-0 flex-1"><h2>We couldn’t load this transaction.</h2><p className="break-words">{error}</p>
                <div className="mt-4 flex flex-wrap gap-4"><button type="button" onClick={() => handleInspectTransaction(txHash)} className="text-button">Try again <ArrowRight size={14} /></button><button type="button" onClick={() => setSettingsOpen(true)} className="text-button">Network settings</button></div>
              </div>
            </section>}

            {isLoading && <section className="surface loading-panel" role="status" aria-live="polite"><LoaderCircle size={24} className="animate-spin text-[var(--primary)]" /><h2>Following the cells…</h2><p>Fetching the transaction and resolving its inputs.</p><div className="loading-track" /></section>}

            {!isLoading && transaction && <section className="results-view" aria-label="Transaction results">
              <div className="results-toolbar">
                <div className="view-switch" aria-label="Transaction view">
                  <button type="button" aria-pressed={activePanel === "overview"} className={activePanel === "overview" ? "is-active" : ""} onClick={() => setActivePanel("overview")}><GitBranch size={15} />Overview</button>
                  <button type="button" aria-pressed={activePanel === "cells"} className={activePanel === "cells" ? "is-active" : ""} onClick={() => setActivePanel("cells")}><Boxes size={15} />Cells <span className="count-badge">{transaction.inputs.length + transaction.outputs.length}</span></button>
                </div>
                <button type="button" className="text-button help-button" onClick={() => setGuideOpen(true)}><CircleHelp size={14} /><span>How it works</span></button>
              </div>
              {activePanel === "overview" ? <div className="space-y-5">
                <TransactionOverview tx={transaction} network={network} />
                <CellVisualizer tx={transaction} selectedCell={selectedCell} onSelectCell={(type, index) => { setSelectedCell({ type, index }); setActivePanel("cells"); requestAnimationFrame(() => document.getElementById("cell-inspector-title")?.focus()); }} />
              </div> : <CellInspector key={transaction.hash} tx={transaction} selectedCell={selectedCell} onInspectScript={(script, role) => setInspectingScript({ script, role })} />}
            </section>}

            {!hasSearch && <section className="landing-explainer" aria-label="How CKB transactions work">
              <div className="explainer-heading"><span className="eyebrow">A TRANSACTION, MADE SIMPLE</span><button type="button" onClick={() => setGuideOpen(true)} className="text-button">Learn the basics <ArrowUpRight size={14} /></button></div>
              <div className="simple-flow">
                <div className="flow-step"><span className="flow-icon"><Layers2 size={21} strokeWidth={1.5} /></span><div><h2>Inputs</h2><p>Existing cells are spent</p></div></div>
                <ArrowRight className="flow-arrow" size={21} strokeWidth={1.3} />
                <div className="flow-step"><span className="flow-icon flow-icon-accent"><GitBranch size={21} strokeWidth={1.5} /></span><div><h2>Transaction</h2><p>A new state takes shape</p></div></div>
                <ArrowRight className="flow-arrow" size={21} strokeWidth={1.3} />
                <div className="flow-step"><span className="flow-icon"><Box size={21} strokeWidth={1.5} /></span><div><h2>Outputs</h2><p>New cells are created</p></div></div>
              </div>
            </section>}
          </>
        )}
      </main>

      <footer className="site-footer"><div className="site-container footer-inner">
        <div className="flex items-center gap-2"><Box size={14} /><span>Built for the curious. Powered by Nervos.</span></div>
        <div className="footer-right">{tipBlock && <span className="tip-label">Block #{parseInt(tipBlock, 16).toLocaleString()}</span>}<a href="https://github.com/nervosnetwork/ckb" target="_blank" rel="noopener noreferrer">Nervos CKB <ArrowUpRight size={12} /></a></div>
      </div></footer>

      <ScriptInspectorModal script={inspectingScript?.script ?? null} role={inspectingScript?.role ?? null} onClose={() => setInspectingScript(null)} />
      {settingsOpen && <SettingsModal isOpen onClose={() => setSettingsOpen(false)} currentNetwork={network} onSaveNetwork={handleNetworkChange} />}
    </div>
  );
}
