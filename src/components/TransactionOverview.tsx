"use client";

import { ArrowUpRight, ArrowRight, Check, ChevronDown, CircleHelp, Clock3, XCircle } from "lucide-react";
import { NormalizedTransaction, NetworkConfig } from "@/types/ckb";
import { CopyButton } from "./CopyButton";
import { truncateHex } from "@/lib/formatters";

interface TransactionOverviewProps {
  tx: NormalizedTransaction;
  network: NetworkConfig;
}

export function TransactionOverview({ tx, network }: TransactionOverviewProps) {
  const status = {
    committed: { label: "Confirmed", icon: Check, tone: "confirmed" },
    pending: { label: "Pending", icon: Clock3, tone: "pending" },
    proposed: { label: "Proposed", icon: Clock3, tone: "pending" },
    rejected: { label: "Rejected", icon: XCircle, tone: "rejected" },
    unknown: { label: "Unknown", icon: CircleHelp, tone: "unknown" },
  }[tx.status];
  const StatusIcon = status.icon;

  return (
    <section className="surface transaction-overview" aria-label="Transaction summary">
      <div className="transaction-heading">
        <div className="min-w-0">
          <div className="eyebrow mb-2">{tx.isCellbase ? "Block reward transaction" : "Transaction"}</div>
          <div className="transaction-hash">
            <span title={tx.hash}>{truncateHex(tx.hash, 12, 10)}</span>
            <CopyButton text={tx.hash} />
            {network.id !== "custom" && <a href={`${network.explorerUrl}/transaction/${tx.hash}`} target="_blank" rel="noopener noreferrer" className="icon-button" aria-label="View transaction on Nervos Explorer"><ArrowUpRight size={17} /></a>}
          </div>
        </div>
        <span className={`status-badge ${status.tone}`}><StatusIcon size={13} />{status.label}</span>
      </div>
      <dl className="transaction-metrics">
        <div><dt>Output capacity</dt><dd>{tx.totalOutputCapacityCkb}</dd></div>
        <div><dt>Network fee</dt><dd>{tx.isCellbase ? "Not applicable" : tx.feeCkb ?? "Unavailable"}</dd></div>
        <div><dt>Cell flow</dt><dd className="flex items-center gap-2">{tx.inputs.length} <span className="metric-unit">in</span><ArrowRight size={15} className="text-[var(--muted-foreground)]" />{tx.outputs.length} <span className="metric-unit">out</span></dd></div>
      </dl>
      {tx.hasUnavailableInputs && <p className="inline-notice">Some input cells are unavailable. The network fee cannot be calculated.</p>}
      {tx.statusReason && <p className="inline-notice break-words">{tx.statusReason}</p>}
      <details className="transaction-details">
        <summary>Transaction details <ChevronDown size={14} /></summary>
        <dl className="detail-grid">
          <div><dt>Block height</dt><dd>{tx.blockNumber != null ? `#${tx.blockNumber.toLocaleString()}` : "Not yet included"}</dd></div>
          <div><dt>VM cycles</dt><dd>{tx.cycles?.toLocaleString() ?? "Unavailable"}</dd></div>
          <div><dt>Version / index</dt><dd>{tx.version} / {tx.txIndex ?? "—"}</dd></div>
          <div><dt>Dependencies / headers</dt><dd>{tx.cellDeps.length} / {tx.headerDeps.length}</dd></div>
          <div><dt>Witnesses</dt><dd>{tx.witnessesCount}</dd></div>
          <div><dt>Input capacity</dt><dd>{tx.isCellbase ? "Block reward" : tx.hasUnavailableInputs ? "Partially resolved" : tx.totalInputCapacityCkb ?? "Unavailable"}</dd></div>
          <div className="sm:col-span-2"><dt>Full transaction hash</dt><dd className="break-all font-mono text-xs">{tx.hash}</dd></div>
          {tx.blockHash && <div className="sm:col-span-2"><dt>Block hash</dt><dd className="flex min-w-0 items-center gap-2"><span className="break-all font-mono text-xs">{tx.blockHash}</span><CopyButton text={tx.blockHash} /></dd></div>}
        </dl>
      </details>
    </section>
  );
}
