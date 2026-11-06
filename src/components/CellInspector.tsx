"use client";

import React, { useState } from "react";
import {
  NormalizedTransaction,
  ResolvedInputCell,
  ResolvedOutputCell,
  Script,
} from "@/types/ckb";
import { identifyKnownScript } from "@/lib/knownScripts";
import { formatCapacity, truncateHex } from "@/lib/formatters";
import { CopyButton } from "./CopyButton";
import {
  Lock,
  FileCode2,
  Database,
  Coins,
  ShieldCheck,
  Sparkles,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

interface CellInspectorProps {
  tx: NormalizedTransaction;
  onInspectScript: (script: Script, role: "lock" | "type") => void;
  selectedCell?: { type: "input" | "output"; index: number } | null;
  educationalMode?: boolean;
}

export function CellInspector({
  tx,
  onInspectScript,
  selectedCell,
  educationalMode = false,
}: CellInspectorProps) {
  const [activeTab, setActiveTab] = useState<"inputs" | "outputs">(
    selectedCell?.type === "input" ? "inputs" : "outputs"
  );
  const [prevSelectedCell, setPrevSelectedCell] = useState(selectedCell);

  // Sync tab during render when selectedCell prop changes
  if (selectedCell !== prevSelectedCell) {
    setPrevSelectedCell(selectedCell);
    if (selectedCell) {
      setActiveTab(selectedCell.type === "input" ? "inputs" : "outputs");
    }
  }

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-6">
      {/* Header and Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-400" />
            <span>Cell Inspector</span>
          </h2>
          <p className="text-xs text-slate-400">
            Inspect individual Cell outpoints, capacity, lock scripts, type scripts, and binary data
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab("inputs")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all cursor-pointer ${
              activeTab === "inputs"
                ? "bg-amber-950/80 text-amber-300 border border-amber-500/40 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>Inputs (Consumed)</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-[10px] font-mono">
              {tx.inputs.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("outputs")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all cursor-pointer ${
              activeTab === "outputs"
                ? "bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Outputs (Created)</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-[10px] font-mono">
              {tx.outputs.length}
            </span>
          </button>
        </div>
      </div>

      {/* Inputs List */}
      {activeTab === "inputs" && (
        <div className="space-y-4">
          {tx.inputs.map((inputCell) => {
            const isSelected =
              selectedCell?.type === "input" && selectedCell?.index === inputCell.index;

            return (
              <InputCellCard
                key={inputCell.index}
                input={inputCell}
                isSelected={isSelected}
                onInspectScript={onInspectScript}
                educationalMode={educationalMode}
              />
            );
          })}
        </div>
      )}

      {/* Outputs List */}
      {activeTab === "outputs" && (
        <div className="space-y-4">
          {tx.outputs.map((outputCell) => {
            const isSelected =
              selectedCell?.type === "output" && selectedCell?.index === outputCell.index;

            return (
              <OutputCellCard
                key={outputCell.index}
                output={outputCell}
                txHash={tx.hash}
                isSelected={isSelected}
                onInspectScript={onInspectScript}
                educationalMode={educationalMode}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------
// Input Cell Card Component
// ----------------------------------------------------------------------

interface InputCellCardProps {
  input: ResolvedInputCell;
  isSelected: boolean;
  onInspectScript: (script: Script, role: "lock" | "type") => void;
  educationalMode: boolean;
}

function InputCellCard({
  input,
  isSelected,
  onInspectScript,
  educationalMode,
}: InputCellCardProps) {
  const [dataExpanded, setDataExpanded] = useState(false);

  if (input.isCellbase) {
    return (
      <div
        className={`p-5 rounded-xl border transition-all ${
          isSelected
            ? "bg-amber-950/20 border-amber-500 ring-1 ring-amber-500/30"
            : "bg-slate-950/50 border-slate-800"
        }`}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-amber-400">
              Input #{input.index} (Cellbase Input)
            </span>
            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
              Consensus Null Outpoint
            </span>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Since: {input.since}
          </span>
        </div>

        <div className="mt-4 p-4 rounded-xl bg-amber-950/30 border border-amber-500/20 text-xs text-amber-200 space-y-2">
          <p className="font-semibold text-amber-300">
            🌱 Cellbase Generation (Coinbase in Bitcoin terminology)
          </p>
          <p className="text-amber-100/90 leading-relaxed">
            This input does NOT reference any previous transaction. The outpoint hash is 32 zero bytes (
            <code>0x000...000</code>) with index <code>0xffffffff</code>. In CKB consensus, the cellbase transaction
            is created by the miner who mined this block to collect block reward, secondary issuance, and transaction fees.
          </p>
        </div>
      </div>
    );
  }

  const cell = input.cell;
  const knownLock = identifyKnownScript(cell?.lock);
  const knownType = identifyKnownScript(cell?.type);

  return (
    <div
      className={`p-5 rounded-xl border transition-all space-y-4 ${
        isSelected
          ? "bg-slate-900 border-amber-500 ring-2 ring-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.2)]"
          : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
      }`}
    >
      {/* Top OutPoint header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-amber-400">
            Input #{input.index}
          </span>
          <span className="text-xs text-slate-400">Previous Outpoint:</span>
          <span className="font-mono text-xs text-slate-200 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
            {truncateHex(input.outPoint.txHash, 10, 8)} #{input.outPoint.index}
          </span>
          <CopyButton
            text={`${input.outPoint.txHash}:${input.outPoint.index}`}
            label="Outpoint"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 font-mono">Since: {input.since}</span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded font-semibold uppercase ${
              input.status === "resolved"
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : "bg-red-500/10 text-red-400 border border-red-500/20"
            }`}
          >
            {input.status}
          </span>
        </div>
      </div>

      {cell ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Capacity Section */}
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/60 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5 font-medium text-slate-300">
                <Coins className="w-4 h-4 text-emerald-400" />
                <span>Capacity Consumed</span>
              </span>
              <span className="font-mono text-slate-500 text-[11px]">
                {cell.capacityShannons.toLocaleString()} Shannons
              </span>
            </div>
            <p className="text-lg font-bold font-mono text-emerald-400">
              {cell.capacityCkb}
            </p>
            {cell.occupiedCapacityShannons && (
              <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Occupied State Capacity:</span>
                <span className="font-mono text-slate-300">
                  {formatCapacity(cell.occupiedCapacityShannons).formattedCkb}
                </span>
              </div>
            )}
          </div>

          {/* Lock Script Card */}
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/60 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-300">
                <Lock className="w-4 h-4 text-emerald-400" />
                <span>Lock Script (Owner)</span>
              </div>
              <button
                type="button"
                onClick={() => onInspectScript(cell.lock, "lock")}
                className="text-xs text-emerald-400 hover:text-emerald-300 underline font-medium cursor-pointer"
              >
                Inspect Lock →
              </button>
            </div>

            {knownLock && (
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-xs font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{knownLock.name}</span>
              </div>
            )}

            <div className="space-y-1 font-mono text-xs">
              <div className="flex items-center justify-between text-slate-400 text-[11px]">
                <span>code_hash:</span>
                <div className="flex items-center gap-1">
                  <span>{truncateHex(cell.lock.code_hash, 8, 6)}</span>
                  <CopyButton text={cell.lock.code_hash} />
                </div>
              </div>
              <div className="flex items-center justify-between text-slate-400 text-[11px]">
                <span>hash_type:</span>
                <span className="text-slate-300">{cell.lock.hash_type}</span>
              </div>
              <div className="flex items-center justify-between text-slate-400 text-[11px]">
                <span>args ({Math.ceil(cell.lock.args.replace("0x", "").length / 2)} bytes):</span>
                <div className="flex items-center gap-1">
                  <span>{truncateHex(cell.lock.args, 8, 6)}</span>
                  <CopyButton text={cell.lock.args} />
                </div>
              </div>
            </div>
          </div>

          {/* Type Script Card (if present) */}
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/60 space-y-2.5 lg:col-span-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-300">
                <FileCode2 className="w-4 h-4 text-purple-400" />
                <span>Type Script (Contract Logic)</span>
              </div>
              {cell.type && (
                <button
                  type="button"
                  onClick={() => onInspectScript(cell.type!, "type")}
                  className="text-xs text-purple-400 hover:text-purple-300 underline font-medium cursor-pointer"
                >
                  Inspect Type →
                </button>
              )}
            </div>

            {cell.type ? (
              <div className="space-y-2">
                {knownType && (
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 text-xs font-semibold">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{knownType.name}</span>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono text-xs">
                  <div className="p-2 rounded bg-slate-950/80 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">code_hash</span>
                    <span className="truncate block" title={cell.type.code_hash}>
                      {truncateHex(cell.type.code_hash, 6, 6)}
                    </span>
                  </div>
                  <div className="p-2 rounded bg-slate-950/80 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">hash_type</span>
                    <span>{cell.type.hash_type}</span>
                  </div>
                  <div className="p-2 rounded bg-slate-950/80 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">args</span>
                    <span className="truncate block" title={cell.type.args}>
                      {truncateHex(cell.type.args, 6, 6)}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">
                None (Pure Capacity Cell — No Type Script logic applied)
              </p>
            )}
          </div>

          {/* Cell Data Preview */}
          <div className="lg:col-span-2 p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-xs space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="flex items-center gap-1.5 font-medium">
                <Database className="w-3.5 h-3.5 text-cyan-400" />
                <span>Cell Data ({cell.data.byteLength} bytes)</span>
              </span>
              <button
                type="button"
                onClick={() => setDataExpanded(!dataExpanded)}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-0.5 cursor-pointer"
              >
                {dataExpanded ? "Collapse" : "Expand Raw Hex"}
                {dataExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>
            </div>

            {cell.data.isPrintable && cell.data.asciiText && (
              <div className="p-2 rounded bg-cyan-950/30 border border-cyan-500/20 text-cyan-300 font-mono text-xs">
                <span className="text-[10px] text-cyan-400 block uppercase font-semibold">ASCII Preview:</span>
                &ldquo;{cell.data.asciiText}&rdquo;
              </div>
            )}

            {cell.data.parsedAmount && (
              <div className="p-2 rounded bg-purple-950/30 border border-purple-500/20 text-purple-300 font-mono text-xs">
                <span className="text-[10px] text-purple-400 block uppercase font-semibold">Decoded UDT Amount:</span>
                {cell.data.parsedAmount}
              </div>
            )}

            {dataExpanded ? (
              <div className="relative mt-2">
                <pre className="p-3 rounded-lg bg-slate-900 border border-slate-800 font-mono text-[11px] text-slate-300 break-all whitespace-pre-wrap max-h-32 overflow-y-auto">
                  {cell.data.hex}
                </pre>
                <div className="absolute top-2 right-2">
                  <CopyButton text={cell.data.hex} />
                </div>
              </div>
            ) : (
              <p className="font-mono text-[11px] text-slate-500 truncate">
                {truncateHex(cell.data.hex, 24, 16)}
              </p>
            )}
          </div>
          {educationalMode && (
            <div className="lg:col-span-2 p-2.5 rounded-lg bg-teal-950/20 border border-teal-500/20 text-[11px] text-teal-300">
              💡 <strong>Input Cell Lifecycle:</strong> This cell was live on chain until this transaction consumed and destroyed it. Its Lock Script ran to verify the spender&apos;s signature.
            </div>
          )}
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 space-y-1">
          <p className="font-medium text-slate-300">Previous Cell Output Unavailable</p>
          <p className="text-slate-500">
            {input.errorMessage || "The referenced transaction was not found in the current RPC node index."}
          </p>
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------
// Output Cell Card Component
// ----------------------------------------------------------------------

interface OutputCellCardProps {
  output: ResolvedOutputCell;
  txHash: string;
  isSelected: boolean;
  onInspectScript: (script: Script, role: "lock" | "type") => void;
  educationalMode: boolean;
}

function OutputCellCard({
  output,
  txHash,
  isSelected,
  onInspectScript,
  educationalMode,
}: OutputCellCardProps) {
  const [dataExpanded, setDataExpanded] = useState(false);
  const knownLock = identifyKnownScript(output.lock);
  const knownType = identifyKnownScript(output.type);

  return (
    <div
      className={`p-5 rounded-xl border transition-all space-y-4 ${
        isSelected
          ? "bg-slate-900 border-emerald-500 ring-2 ring-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
          : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
      }`}
    >
      {/* Top OutPoint header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-emerald-400">
            Output #{output.index}
          </span>
          <span className="text-xs text-slate-400">Generated Outpoint:</span>
          <span className="font-mono text-xs text-slate-200 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
            {truncateHex(txHash, 10, 8)} #{output.index}
          </span>
          <CopyButton text={`${txHash}:${output.index}`} label="Outpoint" />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-[10px] px-2 py-0.5 rounded font-semibold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Live Output
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Capacity Section */}
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/60 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5 font-medium text-slate-300">
              <Coins className="w-4 h-4 text-emerald-400" />
              <span>Created Capacity</span>
            </span>
            <span className="font-mono text-slate-500 text-[11px]">
              {output.capacityShannons.toLocaleString()} Shannons
            </span>
          </div>
          <p className="text-lg font-bold font-mono text-emerald-400">
            {output.capacityCkb}
          </p>
          {output.occupiedCapacityShannons && (
            <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Occupied State Rent:</span>
              <span className="font-mono text-slate-300">
                {formatCapacity(output.occupiedCapacityShannons).formattedCkb}
              </span>
            </div>
          )}
        </div>

        {/* Lock Script Card */}
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/60 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-300">
              <Lock className="w-4 h-4 text-emerald-400" />
              <span>Lock Script (New Owner)</span>
            </div>
            <button
              type="button"
              onClick={() => onInspectScript(output.lock, "lock")}
              className="text-xs text-emerald-400 hover:text-emerald-300 underline font-medium cursor-pointer"
            >
              Inspect Lock →
            </button>
          </div>

          {knownLock && (
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{knownLock.name}</span>
            </div>
          )}

          <div className="space-y-1 font-mono text-xs">
            <div className="flex items-center justify-between text-slate-400 text-[11px]">
              <span>code_hash:</span>
              <div className="flex items-center gap-1">
                <span>{truncateHex(output.lock.code_hash, 8, 6)}</span>
                <CopyButton text={output.lock.code_hash} />
              </div>
            </div>
            <div className="flex items-center justify-between text-slate-400 text-[11px]">
              <span>hash_type:</span>
              <span className="text-slate-300">{output.lock.hash_type}</span>
            </div>
            <div className="flex items-center justify-between text-slate-400 text-[11px]">
              <span>args ({Math.ceil(output.lock.args.replace("0x", "").length / 2)} bytes):</span>
              <div className="flex items-center gap-1">
                <span>{truncateHex(output.lock.args, 8, 6)}</span>
                <CopyButton text={output.lock.args} />
              </div>
            </div>
          </div>
        </div>

        {/* Type Script Card (if present) */}
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/60 space-y-2.5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-300">
              <FileCode2 className="w-4 h-4 text-purple-400" />
              <span>Type Script (Contract Rules)</span>
            </div>
            {output.type && (
              <button
                type="button"
                onClick={() => onInspectScript(output.type!, "type")}
                className="text-xs text-purple-400 hover:text-purple-300 underline font-medium cursor-pointer"
              >
                Inspect Type →
              </button>
            )}
          </div>

          {output.type ? (
            <div className="space-y-2">
              {knownType && (
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 text-xs font-semibold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{knownType.name}</span>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono text-xs">
                <div className="p-2 rounded bg-slate-950/80 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">code_hash</span>
                  <span className="truncate block" title={output.type.code_hash}>
                    {truncateHex(output.type.code_hash, 6, 6)}
                  </span>
                </div>
                <div className="p-2 rounded bg-slate-950/80 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">hash_type</span>
                  <span>{output.type.hash_type}</span>
                </div>
                <div className="p-2 rounded bg-slate-950/80 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">args</span>
                  <span className="truncate block" title={output.type.args}>
                    {truncateHex(output.type.args, 6, 6)}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">
              None (Pure Capacity Cell — No Type Script logic applied)
            </p>
          )}
        </div>

        {/* Cell Data Preview */}
        <div className="lg:col-span-2 p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="flex items-center gap-1.5 font-medium">
              <Database className="w-3.5 h-3.5 text-cyan-400" />
              <span>Cell Data ({output.data.byteLength} bytes)</span>
            </span>
            <button
              type="button"
              onClick={() => setDataExpanded(!dataExpanded)}
              className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-0.5 cursor-pointer"
            >
              {dataExpanded ? "Collapse" : "Expand Raw Hex"}
              {dataExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>
          </div>

          {output.data.isPrintable && output.data.asciiText && (
            <div className="p-2 rounded bg-cyan-950/30 border border-cyan-500/20 text-cyan-300 font-mono text-xs">
              <span className="text-[10px] text-cyan-400 block uppercase font-semibold">ASCII Preview:</span>
              &ldquo;{output.data.asciiText}&rdquo;
            </div>
          )}

          {output.data.parsedAmount && (
            <div className="p-2 rounded bg-purple-950/30 border border-purple-500/20 text-purple-300 font-mono text-xs">
              <span className="text-[10px] text-purple-400 block uppercase font-semibold">Decoded UDT Amount:</span>
              {output.data.parsedAmount}
            </div>
          )}

          {dataExpanded ? (
            <div className="relative mt-2">
              <pre className="p-3 rounded-lg bg-slate-900 border border-slate-800 font-mono text-[11px] text-slate-300 break-all whitespace-pre-wrap max-h-32 overflow-y-auto">
                {output.data.hex}
              </pre>
              <div className="absolute top-2 right-2">
                <CopyButton text={output.data.hex} />
              </div>
            </div>
          ) : (
            <p className="font-mono text-[11px] text-slate-500 truncate">
              {truncateHex(output.data.hex, 24, 16)}
            </p>
          )}
        </div>
        {educationalMode && (
          <div className="lg:col-span-2 p-2.5 rounded-lg bg-teal-950/20 border border-teal-500/20 text-[11px] text-teal-300">
            💡 <strong>Output Cell Lifecycle:</strong> This cell was newly created and is now a live UTXO cell on CKB, waiting for its owner&apos;s Lock Script to spend it in a future transaction.
          </div>
        )}
      </div>
    </div>
  );
}
