"use client";

import React from "react";
import {
  CheckCircle2,
  Clock,
  XCircle,
  HelpCircle,
  Cpu,
  Coins,
  ArrowRightLeft,
  ExternalLink,
  Layers,
  Database,
  FileCode,
  ShieldCheck,
} from "lucide-react";
import { NormalizedTransaction, NetworkConfig } from "@/types/ckb";
import { CopyButton } from "./CopyButton";
import { truncateHex } from "@/lib/formatters";

interface TransactionOverviewProps {
  tx: NormalizedTransaction;
  network: NetworkConfig;
  educationalMode?: boolean;
}

export function TransactionOverview({
  tx,
  network,
  educationalMode = false,
}: TransactionOverviewProps) {
  const getStatusBadge = () => {
    switch (tx.status) {
      case "committed":
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-500/40 text-xs font-semibold uppercase tracking-wider shadow-[0_0_12px_rgba(16,185,129,0.2)]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Committed</span>
          </div>
        );
      case "pending":
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/80 text-amber-400 border border-amber-500/40 text-xs font-semibold uppercase tracking-wider">
            <Clock className="w-3.5 h-3.5 animate-spin" />
            <span>Pending (In Pool)</span>
          </div>
        );
      case "proposed":
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-950/80 text-blue-400 border border-blue-500/40 text-xs font-semibold uppercase tracking-wider">
            <Clock className="w-3.5 h-3.5" />
            <span>Proposed</span>
          </div>
        );
      case "rejected":
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-950/80 text-red-400 border border-red-500/40 text-xs font-semibold uppercase tracking-wider">
            <XCircle className="w-3.5 h-3.5" />
            <span>Rejected</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700 text-xs font-semibold uppercase tracking-wider">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>{tx.status}</span>
          </div>
        );
    }
  };

  const explorerTxUrl = `${network.explorerUrl}/transaction/${tx.hash}`;
  const explorerBlockUrl = tx.blockHash
    ? `${network.explorerUrl}/block/${tx.blockHash}`
    : null;

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-6">
      {/* Top Header: Hash & Badges */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div className="space-y-1.5 overflow-hidden">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Transaction Hash
            </span>
            {tx.isCellbase && (
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
                Cellbase Mint
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 max-w-full">
            <span className="font-mono text-sm sm:text-base font-semibold text-white break-all">
              {tx.hash}
            </span>
            <CopyButton text={tx.hash} label="Hash" />
            <a
              href={explorerTxUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
              title="View on Nervos Explorer"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {getStatusBadge()}
        </div>
      </div>

      {/* Grid of Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Block Info */}
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              <span>Block Height</span>
            </span>
            {tx.txIndex !== null && tx.txIndex !== undefined && (
              <span className="text-[10px] font-mono text-slate-500">
                Index: #{tx.txIndex}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 pt-1">
            {tx.blockNumber !== null && tx.blockNumber !== undefined ? (
              <>
                <span className="font-mono text-base font-semibold text-white">
                  #{tx.blockNumber.toLocaleString()}
                </span>
                {explorerBlockUrl && (
                  <a
                    href={explorerBlockUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-400 hover:text-emerald-400"
                    title="View block on explorer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </>
            ) : (
              <span className="text-sm text-slate-500 italic">Unconfirmed (Mempool)</span>
            )}
          </div>
          {tx.blockHash && (
            <p className="text-[11px] font-mono text-slate-500 truncate" title={tx.blockHash}>
              {truncateHex(tx.blockHash, 10, 8)}
            </p>
          )}
        </div>

        {/* CKB-VM Cycles */}
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-teal-400" />
              <span>CKB-VM Cycles</span>
            </span>
            <span className="text-[10px] text-slate-500">Max: 3.5B</span>
          </div>
          <div className="flex items-baseline gap-2 pt-1">
            <span className="font-mono text-base font-semibold text-teal-300">
              {tx.cycles !== null && tx.cycles !== undefined
                ? tx.cycles.toLocaleString()
                : "N/A"}
            </span>
            {tx.cycles && (
              <span className="text-[11px] text-slate-400">cycles</span>
            )}
          </div>
          <p className="text-[11px] text-slate-500">
            RISC-V CPU execution budget
          </p>
        </div>

        {/* Transaction Fee */}
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <ArrowRightLeft className="w-3.5 h-3.5 text-cyan-400" />
              <span>Transaction Fee</span>
            </span>
          </div>
          <div className="flex items-baseline gap-2 pt-1">
            {tx.isCellbase ? (
              <span className="text-sm font-medium text-amber-400">
                0.00 CKB (Block Reward)
              </span>
            ) : tx.feeCkb ? (
              <span className="font-mono text-base font-semibold text-cyan-300">
                {tx.feeCkb}
              </span>
            ) : (
              <span className="text-sm text-slate-500 italic">
                {tx.hasUnavailableInputs ? "Inputs unindexed" : "Calculating..."}
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 font-mono">
            {tx.feeShannons !== null && tx.feeShannons !== undefined
              ? `${tx.feeShannons.toLocaleString()} Shannons`
              : "Difference (Inputs - Outputs)"}
          </p>
        </div>

        {/* Total Output Capacity */}
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <Coins className="w-3.5 h-3.5 text-emerald-400" />
              <span>Total Output Capacity</span>
            </span>
          </div>
          <div className="flex items-baseline gap-2 pt-1">
            <span className="font-mono text-base font-semibold text-emerald-400">
              {tx.totalOutputCapacityCkb}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 font-mono">
            Across {tx.outputs.length} created cell{tx.outputs.length === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      {/* Dependencies & Witnesses Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-950/40 border border-slate-800/60 text-slate-300">
          <FileCode className="w-4 h-4 text-purple-400 shrink-0" />
          <span>
            <strong className="text-white font-mono">{tx.cellDeps.length}</strong> Cell Dep{tx.cellDeps.length === 1 ? "" : "s"} (Loaded Scripts)
          </span>
        </div>

        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-950/40 border border-slate-800/60 text-slate-300">
          <Database className="w-4 h-4 text-blue-400 shrink-0" />
          <span>
            <strong className="text-white font-mono">{tx.headerDeps.length}</strong> Header Dep{tx.headerDeps.length === 1 ? "" : "s"}
          </span>
        </div>

        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-950/40 border border-slate-800/60 text-slate-300">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            <strong className="text-white font-mono">{tx.witnessesCount}</strong> Witness Signature{tx.witnessesCount === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      {/* Educational Context Callout */}
      {educationalMode && (
        <div className="p-4 rounded-xl bg-teal-950/30 border border-teal-500/30 text-xs text-teal-200 space-y-2 animate-in fade-in">
          <div className="flex items-center gap-2 font-semibold text-teal-300">
            <Coins className="w-4 h-4" />
            <span>CKB Cell Model Primer: State Transition & Capacity Conservation</span>
          </div>
          <p className="leading-relaxed text-teal-100/90">
            In Nervos CKB, transactions do not simply modify account balances like Ethereum. Instead,
            a transaction <strong>consumes and destroys live Input Cells</strong> and <strong>creates new Output Cells</strong>.
            The total capacity of the destroyed inputs MUST be greater than or equal to the total capacity of the created outputs.
            The difference (<code>Σ(Inputs) - Σ(Outputs)</code>) is collected by the miner as the transaction fee!
          </p>
          {tx.isCellbase && (
            <p className="text-amber-300/90 leading-relaxed font-mono">
              ⚠️ Note: This is a <strong>Cellbase Transaction</strong>. Cellbase transactions are the exception to capacity conservation:
              they generate newly minted CKB (block reward + secondary issuance) out of thin air to incentivize miners!
            </p>
          )}
        </div>
      )}
    </div>
  );
}
