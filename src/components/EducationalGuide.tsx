"use client";

import React, { useState } from "react";
import {
  GraduationCap,
  Boxes,
  Database,
  Lock,
  Cpu,
  Coins,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  BookOpen,
  LucideIcon,
} from "lucide-react";

interface GuideTopic {
  id: string;
  title: string;
  badge: string;
  icon: LucideIcon;
  summary: string;
  details: string[];
  docLink?: { title: string; url: string };
}

const TOPICS: GuideTopic[] = [
  {
    id: "cell-model",
    title: "1. The CKB Cell Model vs Ethereum & Bitcoin",
    badge: "Architecture",
    icon: Boxes,
    summary:
      "A generalization of Bitcoin's UTXO model that turns every unspent output into a programmable, stateful container called a 'Cell'.",
    details: [
      "In Ethereum's Account Model, smart contracts own the storage, and transactions mutate shared state on-chain, leading to state contention and concurrency bottlenecks.",
      "In CKB's Cell Model, state is first-class: users directly own their Cells. A transaction consumes old cells and generates new cells.",
      "Off-chain computation, on-chain verification: Computation happens locally on the user's machine; the blockchain only validates whether the state transition adheres to script rules.",
    ],
    docLink: {
      title: "RFC 0002: CKB Cell Model Specification",
      url: "https://github.com/nervosnetwork/rfcs/blob/master/rfcs/0002-ckb/0002-ckb.md",
    },
  },
  {
    id: "capacity",
    title: "2. Capacity as Storage & Currency (State Rent)",
    badge: "Economics",
    icon: Coins,
    summary:
      "CKB capacity isn't just a medium of exchange; 1 CKB represents the right to store 1 Byte of permanent state on the Nervos blockchain.",
    details: [
      "1 CKB = 100,000,000 Shannons (10^8 Shannons).",
      "Occupied Capacity: A cell requires enough capacity to hold its 8-byte capacity field, its lock script, optional type script, and binary data.",
      "Free Capacity: Any capacity above the occupied byte count can be freely transferred or unlocked.",
      "When a cell is consumed and destroyed, 100% of its stored CKB is refunded and can be re-allocated or transferred!",
    ],
    docLink: {
      title: "CKB Economic Model Whitepaper",
      url: "https://github.com/nervosnetwork/rfcs/blob/master/rfcs/0015-ckb-cryptoeconomics/0015-ckb-cryptoeconomics.md",
    },
  },
  {
    id: "lock-vs-type",
    title: "3. Lock Script vs Type Script: Two-Phase Verification",
    badge: "Smart Contracts",
    icon: Lock,
    summary:
      "CKB separates ownership authentication (Lock) from state transition validation (Type).",
    details: [
      "Lock Script: Determines WHO can spend/destroy this cell. Runs ONLY when the cell is an input in a transaction.",
      "Type Script: Determines WHAT rules govern the creation, modification, or destruction of this cell. Runs on BOTH input cells and output cells in the transaction.",
      "Example: In a token contract (xUDT), the Type Script verifies that the total sum of tokens in outputs equals the sum of tokens in inputs (preventing arbitrary printing), while each user's Lock Script signs off on spending their specific balance.",
    ],
    docLink: {
      title: "RFC 0022: Transaction Structure & Scripts",
      url: "https://github.com/nervosnetwork/rfcs/blob/master/rfcs/0022-transaction-structure/0022-transaction-structure.md",
    },
  },
  {
    id: "ckb-vm",
    title: "4. CKB-VM: RISC-V Bare-Metal Execution",
    badge: "Virtual Machine",
    icon: Cpu,
    summary:
      "Unlike EVM or WASM, CKB-VM is a pure 64-bit RISC-V hardware CPU emulator, bringing true cryptographic agility to smart contracts.",
    details: [
      "Any language that compiles to RISC-V (Rust, C, C++, Zig, AssemblyScript) runs natively on CKB-VM.",
      "Cryptographic Agility: Because CKB-VM simulates an actual hardware chip, modern cryptography (RSA, Secp256k1, Ed25519, BLS, Post-Quantum, WebAuthn/Passkeys) can be implemented directly as user scripts without waiting for hard-fork opcode updates.",
      "Deterministic Cycles: Every RISC-V instruction consumes an exact, deterministic cycle cost. If a transaction exceeds the block cycle limit (3.5B cycles), it halts.",
    ],
    docLink: {
      title: "RFC 0003: CKB-VM Specification",
      url: "https://github.com/nervosnetwork/rfcs/blob/master/rfcs/0003-ckb-vm/0003-ckb-vm.md",
    },
  },
  {
    id: "cellbase",
    title: "5. Cellbase Transactions: Where New CKB Comes From",
    badge: "Consensus",
    icon: Database,
    summary:
      "The first transaction of every block, generating block rewards and secondary issuance for miners.",
    details: [
      "Inputs: Contains a single consensus-defined null input with tx_hash 0x000...000 and index 0xffffffff.",
      "Outputs: The miner's payout address, containing base block reward + transaction fees collected from other transactions in that block.",
      "Because it mints new tokens into existence, input capacity is defined as 0, breaking the standard input = output + fee conservation equation.",
    ],
    docLink: {
      title: "Nervos CKB Consensus Protocol (NC-Max)",
      url: "https://docs.nervos.org/docs/basics/glossary/#cellbase-transaction",
    },
  },
];

export function EducationalGuide() {
  const [expandedId, setExpandedId] = useState<string>("cell-model");

  return (
    <div className="w-full bg-slate-900/90 border border-teal-500/30 rounded-2xl p-5 sm:p-6 shadow-xl space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <span>CKB Developer Educational Guide</span>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-teal-500/20 text-teal-300">
                Concepts
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Interactive deep-dive into the CKB Cell Model, Capacity, Scripts, and CKB-VM
            </p>
          </div>
        </div>

        <a
          href="https://docs.nervos.org"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-950/60 hover:bg-teal-900/80 border border-teal-500/30 text-teal-300 text-xs font-medium transition-colors"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Official Nervos Docs</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* Accordion Topics */}
      <div className="space-y-3">
        {TOPICS.map((topic) => {
          const isExpanded = expandedId === topic.id;
          const Icon = topic.icon;

          return (
            <div
              key={topic.id}
              className={`rounded-xl border transition-all overflow-hidden ${
                isExpanded
                  ? "bg-slate-950/90 border-teal-500/40 shadow-[0_0_15px_rgba(20,184,166,0.1)]"
                  : "bg-slate-950/40 border-slate-800 hover:border-slate-700"
              }`}
            >
              <button
                type="button"
                onClick={() => setExpandedId(isExpanded ? "" : topic.id)}
                className="w-full p-4 text-left flex items-center justify-between gap-4 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg ${
                      isExpanded
                        ? "bg-teal-500/20 text-teal-300"
                        : "bg-slate-900 text-slate-400"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-white">
                        {topic.title}
                      </span>
                      <span className="text-[10px] font-mono uppercase px-2 py-0.2 rounded bg-slate-800 text-slate-400">
                        {topic.badge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                      {topic.summary}
                    </p>
                  </div>
                </div>

                <div className="text-slate-400 shrink-0">
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-teal-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </div>
              </button>

              {isExpanded && (
                <div className="px-5 pb-5 pt-1 border-t border-slate-800/80 text-xs text-slate-300 space-y-3 animate-in fade-in">
                  <div className="space-y-2 pt-2">
                    {topic.details.map((detail, idx) => (
                      <div key={idx} className="flex items-start gap-2.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-400 mt-1.5 shrink-0" />
                        <p className="leading-relaxed text-slate-300">{detail}</p>
                      </div>
                    ))}
                  </div>

                  {topic.docLink && (
                    <div className="pt-2 flex items-center gap-2 text-xs">
                      <span className="text-slate-500">Learn more:</span>
                      <a
                        href={topic.docLink.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-teal-400 hover:text-teal-300 underline font-medium"
                      >
                        <span>{topic.docLink.title}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
