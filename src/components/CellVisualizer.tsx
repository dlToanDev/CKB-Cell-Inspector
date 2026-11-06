"use client";

import React, { useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  Edge,
  Node,
  Position,
  Handle,
  MarkerType,
} from "@xyflow/react";
import {
  NormalizedTransaction,
  ResolvedInputCell,
  ResolvedOutputCell,
} from "@/types/ckb";
import { identifyKnownScript } from "@/lib/knownScripts";
import { truncateHex } from "@/lib/formatters";
import {
  Layers,
  FileCode2,
  CheckCircle2,
  Lock,
} from "lucide-react";

interface CellVisualizerProps {
  tx: NormalizedTransaction;
  onSelectCell?: (type: "input" | "output", index: number) => void;
  selectedCell?: { type: "input" | "output"; index: number } | null;
}

interface InputNodeData {
  cell: ResolvedInputCell;
  isSelected: boolean;
  onSelect?: (type: "input" | "output", index: number) => void;
}

interface TxNodeData {
  tx: NormalizedTransaction;
}

interface OutputNodeData {
  cell: ResolvedOutputCell;
  isSelected: boolean;
  onSelect?: (type: "input" | "output", index: number) => void;
}

// Custom Node: Input Cell (Destroyed / Consumed)
function InputCellNode({ data }: { data: InputNodeData }) {
  const cell = data.cell;
  const isSelected = data.isSelected;
  const knownLock = identifyKnownScript(cell.cell?.lock);
  const knownType = identifyKnownScript(cell.cell?.type);

  return (
    <div
      onClick={() => data.onSelect?.("input", cell.index)}
      className={`min-w-[220px] max-w-[240px] rounded-xl border p-3 cursor-pointer transition-all duration-200 shadow-lg ${
        isSelected
          ? "bg-slate-900 border-amber-500 ring-2 ring-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.25)]"
          : "bg-slate-950/90 border-slate-800 hover:border-amber-500/50 hover:bg-slate-900/90"
      }`}
    >
      <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/80 text-xs">
        <span className="font-semibold text-amber-400 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          Input #{cell.index}
        </span>
        <span className="text-[10px] px-1.5 py-0.5 rounded font-mono uppercase bg-slate-900 text-slate-400 border border-slate-800">
          Consumed
        </span>
      </div>

      <div className="mt-2 space-y-1.5 text-xs">
        {cell.isCellbase ? (
          <div className="p-1.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300 font-mono text-[11px]">
            Cellbase (Null Outpoint)
          </div>
        ) : cell.cell ? (
          <>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-[11px]">Capacity:</span>
              <span className="font-mono font-semibold text-emerald-400">
                {cell.cell.capacityCkb}
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400 flex items-center gap-1">
                <Lock className="w-3 h-3 text-emerald-400" />
                <span>Lock:</span>
              </span>
              <span className="font-medium text-slate-300 truncate max-w-[120px]" title={knownLock?.name || "Custom Lock"}>
                {knownLock ? knownLock.name.split(" ")[0] : "Custom"}
              </span>
            </div>

            {cell.cell.type && (
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400 flex items-center gap-1">
                  <FileCode2 className="w-3 h-3 text-purple-400" />
                  <span>Type:</span>
                </span>
                <span className="font-medium text-purple-300 truncate max-w-[120px]" title={knownType?.name || "Custom Type"}>
                  {knownType ? knownType.name.split(" ")[0] : "Custom"}
                </span>
              </div>
            )}
          </>
        ) : (
          <div className="text-[11px] text-slate-500 italic">
            {cell.errorMessage || "Previous cell unindexed"}
          </div>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!bg-amber-400 !w-2.5 !h-2.5 !border-slate-900"
      />
    </div>
  );
}

// Custom Node: Transaction (State Transition Processor)
function TransactionNode({ data }: { data: TxNodeData }) {
  const tx = data.tx;

  return (
    <div className="min-w-[240px] max-w-[260px] rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-emerald-500/50 p-4 shadow-[0_0_30px_rgba(16,185,129,0.15)] text-center space-y-2.5">
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-emerald-400 !w-3 !h-3 !border-slate-900"
      />

      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider">
        <CheckCircle2 className="w-3 h-3" />
        <span>CKB Transaction</span>
      </div>

      <p className="font-mono text-xs text-white font-semibold truncate px-2" title={tx.hash}>
        {truncateHex(tx.hash, 8, 8)}
      </p>

      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800/80 text-left text-xs">
        <div className="p-1.5 rounded bg-slate-950/80 border border-slate-800">
          <p className="text-[10px] text-slate-500">Cycles</p>
          <p className="font-mono font-medium text-teal-300">
            {tx.cycles ? `${(tx.cycles / 1000).toFixed(1)}k` : "N/A"}
          </p>
        </div>
        <div className="p-1.5 rounded bg-slate-950/80 border border-slate-800">
          <p className="text-[10px] text-slate-500">Miner Fee</p>
          <p className="font-mono font-medium text-cyan-300">
            {tx.feeCkb ? tx.feeCkb.split(" ")[0] : "0.00"}
          </p>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!bg-emerald-400 !w-3 !h-3 !border-slate-900"
      />
    </div>
  );
}

// Custom Node: Output Cell (Created / Live)
function OutputCellNode({ data }: { data: OutputNodeData }) {
  const cell = data.cell;
  const isSelected = data.isSelected;
  const knownLock = identifyKnownScript(cell.lock);
  const knownType = identifyKnownScript(cell.type);

  return (
    <div
      onClick={() => data.onSelect?.("output", cell.index)}
      className={`min-w-[220px] max-w-[240px] rounded-xl border p-3 cursor-pointer transition-all duration-200 shadow-lg ${
        isSelected
          ? "bg-slate-900 border-emerald-500 ring-2 ring-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.25)]"
          : "bg-slate-950/90 border-slate-800 hover:border-emerald-500/50 hover:bg-slate-900/90"
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-emerald-400 !w-2.5 !h-2.5 !border-slate-900"
      />

      <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/80 text-xs">
        <span className="font-semibold text-emerald-400 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Output #{cell.index}
        </span>
        <span className="text-[10px] px-1.5 py-0.5 rounded font-mono uppercase bg-emerald-950/50 text-emerald-300 border border-emerald-500/20">
          Created
        </span>
      </div>

      <div className="mt-2 space-y-1.5 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-slate-400 text-[11px]">Capacity:</span>
          <span className="font-mono font-semibold text-emerald-400">
            {cell.capacityCkb}
          </span>
        </div>

        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-400 flex items-center gap-1">
            <Lock className="w-3 h-3 text-emerald-400" />
            <span>Lock:</span>
          </span>
          <span className="font-medium text-slate-300 truncate max-w-[120px]" title={knownLock?.name || "Custom Lock"}>
            {knownLock ? knownLock.name.split(" ")[0] : "Custom"}
          </span>
        </div>

        {cell.type && (
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400 flex items-center gap-1">
              <FileCode2 className="w-3 h-3 text-purple-400" />
              <span>Type:</span>
            </span>
            <span className="font-medium text-purple-300 truncate max-w-[120px]" title={knownType?.name || "Custom Type"}>
              {knownType ? knownType.name.split(" ")[0] : "Custom"}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5 border-t border-slate-900">
          <span>Data size:</span>
          <span className="font-mono">{cell.data.byteLength} bytes</span>
        </div>
      </div>
    </div>
  );
}

const nodeTypes = {
  inputCell: InputCellNode,
  txCenter: TransactionNode,
  outputCell: OutputCellNode,
};

export function CellVisualizer({
  tx,
  onSelectCell,
  selectedCell,
}: CellVisualizerProps) {
  // Generate nodes & edges dynamically based on tx inputs and outputs
  const { nodes, edges } = useMemo(() => {
    const generatedNodes: Node[] = [];
    const generatedEdges: Edge[] = [];

    const inputCount = Math.max(tx.inputs.length, 1);
    const outputCount = Math.max(tx.outputs.length, 1);
    const maxRows = Math.max(inputCount, outputCount);

    const verticalSpacing = 140;
    const totalHeight = (maxRows - 1) * verticalSpacing;
    const centerTxY = totalHeight / 2;

    // 1. Transaction Node in center
    generatedNodes.push({
      id: "tx-center",
      type: "txCenter",
      position: { x: 380, y: centerTxY },
      data: { tx },
    });

    // 2. Input Cell Nodes (Left column, x: 50)
    tx.inputs.forEach((inp, idx) => {
      const yOffset = (totalHeight / (inputCount > 1 ? inputCount - 1 : 1)) * idx;
      const isSelected =
        selectedCell?.type === "input" && selectedCell?.index === idx;

      generatedNodes.push({
        id: `input-${idx}`,
        type: "inputCell",
        position: { x: 50, y: inputCount === 1 ? centerTxY : yOffset },
        data: {
          cell: inp,
          isSelected,
          onSelect: onSelectCell,
        },
      });

      generatedEdges.push({
        id: `e-in-${idx}`,
        source: `input-${idx}`,
        target: "tx-center",
        animated: true,
        style: { stroke: "#f59e0b", strokeWidth: 2 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: "#f59e0b",
        },
      });
    });

    // 3. Output Cell Nodes (Right column, x: 740)
    tx.outputs.forEach((out, idx) => {
      const yOffset = (totalHeight / (outputCount > 1 ? outputCount - 1 : 1)) * idx;
      const isSelected =
        selectedCell?.type === "output" && selectedCell?.index === idx;

      generatedNodes.push({
        id: `output-${idx}`,
        type: "outputCell",
        position: { x: 740, y: outputCount === 1 ? centerTxY : yOffset },
        data: {
          cell: out,
          isSelected,
          onSelect: onSelectCell,
        },
      });

      generatedEdges.push({
        id: `e-out-${idx}`,
        source: "tx-center",
        target: `output-${idx}`,
        animated: true,
        style: { stroke: "#10b981", strokeWidth: 2 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: "#10b981",
        },
      });
    });

    return { nodes: generatedNodes, edges: generatedEdges };
  }, [tx, selectedCell, onSelectCell]);

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
      {/* Title & Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            <span>Interactive Cell Graph</span>
          </h3>
          <p className="text-xs text-slate-400">
            Visualizes state transition: Consumed Input Cells → Transaction → Created Output Cells
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span>Inputs (Consumed)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span>Outputs (Created)</span>
          </div>
        </div>
      </div>

      {/* Graph Canvas */}
      <div className="h-[440px] w-full rounded-xl overflow-hidden bg-slate-950 border border-slate-800/80 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.2}
          maxZoom={1.5}
        >
          <Background color="#1e293b" gap={16} size={1} />
          <Controls showInteractive={false} />
        </ReactFlow>

        <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-sm border border-slate-800 px-3 py-1.5 rounded-lg text-[11px] text-slate-400 pointer-events-none">
          Click any cell node to inspect its Lock, Type script, and binary data below.
        </div>
      </div>
    </div>
  );
}
