"use client";

import { useMemo } from "react";
import { Background, Controls, Edge, Handle, MarkerType, Node, NodeProps, Position, ReactFlow } from "@xyflow/react";
import { ArrowDown, ArrowUpRight, GitBranch, MousePointer2 } from "lucide-react";
import { NormalizedTransaction } from "@/types/ckb";
import { identifyKnownScript } from "@/lib/knownScripts";
import { truncateHex } from "@/lib/formatters";

interface CellVisualizerProps {
  tx: NormalizedTransaction;
  onSelectCell?: (type: "input" | "output", index: number) => void;
  selectedCell?: { type: "input" | "output"; index: number } | null;
}

type CellNodeData = {
  direction: "input" | "output";
  index: number;
  capacity: string;
  description: string;
  selected: boolean;
  onSelect?: CellVisualizerProps["onSelectCell"];
};

function CellNode({ data }: NodeProps<Node<CellNodeData>>) {
  const isInput = data.direction === "input";
  return (
    <div className={data.direction}>
      <Handle type={isInput ? "source" : "target"} position={isInput ? Position.Right : Position.Left} />
      <button type="button" className={`graph-node ${data.direction} ${data.selected ? "is-selected" : ""}`} onClick={() => data.onSelect?.(data.direction, data.index)} aria-label={`Inspect ${data.direction} ${data.index}: ${data.capacity}`}>
        <span className="graph-node-label">{isInput ? "Input" : "Output"} #{data.index}<span>{isInput ? "Spent" : "Created"}</span></span>
        <span className="graph-node-value block">{data.capacity}</span>
        <span className="graph-node-meta block" title={data.description}>{data.description}</span>
      </button>
    </div>
  );
}

function TransactionNode({ data }: NodeProps<Node<{ hash: string }>>) {
  return <div className="graph-tx-node">
    <Handle type="target" position={Position.Left} />
    <GitBranch size={22} strokeWidth={1.5} />
    <p>Transaction</p>
    <span title={data.hash}>{truncateHex(data.hash, 6, 6)}</span>
    <Handle type="source" position={Position.Right} />
  </div>;
}

const nodeTypes = { cell: CellNode, transaction: TransactionNode };

export function CellVisualizer({ tx, onSelectCell, selectedCell }: CellVisualizerProps) {
  const { nodes, edges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    const totalHeight = (Math.max(tx.inputs.length, tx.outputs.length, 1) - 1) * 128;
    const centerY = totalHeight / 2;
    nodes.push({ id: "transaction", type: "transaction", position: { x: 325, y: centerY }, data: { hash: tx.hash } });

    for (const direction of ["input", "output"] as const) {
      const cells = direction === "input" ? tx.inputs : tx.outputs;
      const color = direction === "input" ? "#a59570" : "#81b990";
      cells.forEach((entry, i) => {
        const cell = "outPoint" in entry ? entry.cell : entry;
        const isCellbase = "isCellbase" in entry && entry.isCellbase;
        const description = isCellbase ? "Block reward source" : !cell ? "Previous cell unavailable" : cell.type ? identifyKnownScript(cell.type)?.name ?? "Custom type script" : "CKB capacity";
        const id = `${direction}-${entry.index}`;
        nodes.push({ id, type: "cell", position: { x: direction === "input" ? 0 : 635, y: cells.length === 1 ? centerY : i * totalHeight / (cells.length - 1) }, data: {
          direction, index: entry.index, capacity: cell?.capacityCkb ?? (isCellbase ? "Block reward" : "Unavailable"), description,
          selected: selectedCell?.type === direction && selectedCell.index === entry.index,
          onSelect: onSelectCell,
        } });
        edges.push({ id: `edge-${id}`, source: direction === "input" ? id : "transaction", target: direction === "input" ? "transaction" : id,
          style: { stroke: color, strokeWidth: 1.4 }, markerEnd: { type: MarkerType.ArrowClosed, color, width: 15, height: 15 },
        });
      });
    }
    return { nodes, edges };
  }, [tx, selectedCell, onSelectCell]);

  return <section className="surface" aria-labelledby="cell-flow-title">
    <div className="panel-heading">
      <div><h2 id="cell-flow-title">Follow the cell flow</h2><p>Existing cells in. Newly created cells out.</p></div>
      <div className="graph-legend"><span><i className="legend-dot input" />Spent inputs</span><span><i className="legend-dot" />Created outputs</span></div>
    </div>
    <div className="graph-canvas">
      <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} fitView fitViewOptions={{ padding: .15 }} minZoom={.15} maxZoom={1.5} nodesDraggable={false} nodesConnectable={false} zoomOnScroll={false} colorMode="dark">
        <Background color="#344b3b" gap={20} size={.7} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
    <div className="mobile-cell-flow">
      {(["input", "output"] as const).map((direction) => {
        const cells = direction === "input" ? tx.inputs : tx.outputs;
        return <div key={direction}>
          {direction === "output" && <div className="mobile-flow-transition"><ArrowDown size={17} /><span><GitBranch size={15} />Transaction</span><ArrowDown size={17} /></div>}
          <div className="mobile-group-label">{cells.length} {direction === "input" ? "spent inputs" : "created outputs"}</div>
          {cells.slice(0, 3).map((entry) => {
            const cell = "outPoint" in entry ? entry.cell : entry;
            const isCellbase = "isCellbase" in entry && entry.isCellbase;
            return <button type="button" key={entry.index} className={`mobile-flow-cell ${direction}`} onClick={() => onSelectCell?.(direction, entry.index)}><span>{direction === "input" ? "Input" : "Output"} #{entry.index}</span><strong>{cell?.capacityCkb ?? (isCellbase ? "Block reward" : "Unavailable")}</strong><ArrowUpRight size={14} /></button>;
          })}
          {cells.length > 3 && <button type="button" className="text-button mt-3" onClick={() => onSelectCell?.(direction, cells[0].index)}>View all {cells.length} {direction}s<ArrowUpRight size={13} /></button>}
        </div>;
      })}
    </div>
    <div className="graph-footer"><MousePointer2 size={12} />Select any cell to explore its details.</div>
  </section>;
}
