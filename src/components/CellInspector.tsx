"use client";

import { useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Box, ChevronDown, Database, FileCode2, Lock } from "lucide-react";
import { NormalizedTransaction, ResolvedInputCell, ResolvedOutputCell, Script } from "@/types/ckb";
import { identifyKnownScript } from "@/lib/knownScripts";
import { formatCapacity, truncateHex } from "@/lib/formatters";
import { CopyButton } from "./CopyButton";

interface CellInspectorProps {
  tx: NormalizedTransaction;
  onInspectScript: (script: Script, role: "lock" | "type") => void;
  selectedCell?: { type: "input" | "output"; index: number } | null;
}

export function CellInspector({ tx, onInspectScript, selectedCell }: CellInspectorProps) {
  const [activeTab, setActiveTab] = useState<"input" | "output">(selectedCell?.type ?? "output");
  const [expandedIndex, setExpandedIndex] = useState<number | null>(selectedCell?.index ?? null);
  const cells = activeTab === "input" ? tx.inputs : tx.outputs;

  return (
    <section className="surface cell-inspector" aria-labelledby="cell-inspector-title">
      <div className="panel-heading">
        <div><h2 id="cell-inspector-title" tabIndex={-1}>Explore cells</h2><p>Select a cell to see its capacity, scripts and data.</p></div>
        <div className="view-switch cell-tab-switch" aria-label="Cell type">
          {(["input", "output"] as const).map((type) => <button key={type} type="button" aria-pressed={activeTab === type} className={activeTab === type ? "is-active" : ""} onClick={() => { setActiveTab(type); setExpandedIndex(null); }}>
            {type === "input" ? "Inputs" : "Outputs"}<span className="count-badge">{type === "input" ? tx.inputs.length : tx.outputs.length}</span>
          </button>)}
        </div>
      </div>
      <div className="cell-list">
        {cells.length === 0 && <p className="empty-cells">No {activeTab} cells in this transaction.</p>}
        {cells.map((entry) => {
          const input = activeTab === "input" ? entry as ResolvedInputCell : null;
          const cell = input ? input.cell : entry as ResolvedOutputCell;
          const isOpen = expandedIndex === entry.index;
          const outpoint = input ? `${input.outPoint.txHash}:${input.outPoint.index}` : `${tx.hash}:${entry.index}`;
          const panelId = `cell-${activeTab}-${entry.index}`;
          const typeName = cell?.type ? identifyKnownScript(cell.type)?.name ?? "Custom type" : "CKB capacity";

          return <article key={`${activeTab}-${entry.index}`} className={`cell-row ${isOpen ? "is-expanded" : ""}`}>
            <button type="button" className="cell-row-summary" aria-expanded={isOpen} aria-controls={panelId} onClick={() => setExpandedIndex(isOpen ? null : entry.index)}>
              <span className={`cell-direction ${activeTab}`}>{activeTab === "input" ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}</span>
              <span className="cell-row-name"><strong>{activeTab === "input" ? "Input" : "Output"} #{entry.index}</strong><span>{input?.isCellbase ? "Block reward source" : !cell ? "Previous cell unavailable" : typeName}</span></span>
              <span className="cell-row-capacity">{cell?.capacityCkb ?? (input?.isCellbase ? "Cellbase" : "Unavailable")}</span>
              <ChevronDown size={16} className="row-chevron" />
            </button>
            {isOpen && <div id={panelId} className="cell-row-body">
              {input?.isCellbase ? <p className="inline-notice">This transaction issues a block reward. Its input is a consensus placeholder and does not spend a previous cell.</p> : !cell ? <p className="inline-notice">{input?.errorMessage ?? "This node cannot resolve the previous output. Try a node with full transaction history."}</p> : <>
                <dl className="detail-grid cell-capacity-details">
                  <div><dt>Capacity</dt><dd>{cell.capacityCkb}</dd></div>
                  <div><dt>Occupied capacity</dt><dd>{cell.occupiedCapacityShannons != null ? formatCapacity(cell.occupiedCapacityShannons).formattedCkb : "Unavailable"}</dd></div>
                  <div><dt>Outpoint</dt><dd className="flex min-w-0 items-center gap-2"><span className="truncate font-mono text-xs" title={outpoint}>{truncateHex(outpoint, 12, 8)}</span><CopyButton text={outpoint} /></dd></div>
                  <div><dt>{input ? "Since" : "Created by"}</dt><dd className="font-mono text-xs">{input?.since ?? truncateHex(tx.hash, 10, 8)}</dd></div>
                </dl>
                <div className="script-links">
                  <button type="button" onClick={() => onInspectScript(cell.lock, "lock")}><Lock size={16} /><span><strong>Lock script</strong><small>{identifyKnownScript(cell.lock)?.name ?? "Custom lock"}</small></span><ArrowUpRight size={15} /></button>
                  {cell.type ? <button type="button" onClick={() => onInspectScript(cell.type!, "type")}><FileCode2 size={16} /><span><strong>Type script</strong><small>{identifyKnownScript(cell.type)?.name ?? "Custom type"}</small></span><ArrowUpRight size={15} /></button> : <div className="no-type"><Box size={16} /><span>No type script<small>Stores CKB capacity</small></span></div>}
                </div>
                <details className="cell-data-details"><summary><Database size={14} />Cell data<span>{cell.data.byteLength} bytes</span><ChevronDown size={14} /></summary>
                  {cell.data.asciiText && cell.data.isPrintable && <p className="data-preview">{cell.data.asciiText}</p>}
                  {cell.data.parsedAmount && <p className="data-preview">Decoded token amount: {cell.data.parsedAmount}</p>}
                  <div className="raw-data"><pre>{cell.data.hex}</pre><CopyButton text={cell.data.hex} /></div>
                </details>
              </>}
            </div>}
          </article>;
        })}
      </div>
    </section>
  );
}
