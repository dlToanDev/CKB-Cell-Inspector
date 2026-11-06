"use client";

import React from "react";
import {
  X,
  Lock,
  FileCode2,
  ExternalLink,
  ShieldCheck,
  Cpu,
  AlertTriangle,
  BookOpen,
} from "lucide-react";
import { Script } from "@/types/ckb";
import { identifyKnownScript, SCRIPT_ROLE_EXPLANATIONS } from "@/lib/knownScripts";
import { CopyButton } from "./CopyButton";

interface ScriptInspectorModalProps {
  script: Script | null;
  role: "lock" | "type" | null;
  onClose: () => void;
}

export function ScriptInspectorModal({
  script,
  role,
  onClose,
}: ScriptInspectorModalProps) {
  if (!script || !role) return null;

  const knownInfo = identifyKnownScript(script);
  const roleExplanation = SCRIPT_ROLE_EXPLANATIONS[role];
  const hashTypeExplanation =
    SCRIPT_ROLE_EXPLANATIONS.hashType[
      script.hash_type as keyof typeof SCRIPT_ROLE_EXPLANATIONS.hashType
    ] || `Custom hash type: ${script.hash_type}`;

  const argsByteLength = Math.ceil(
    script.args.replace(/^0x/i, "").length / 2
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-slate-100 max-h-[90vh] overflow-y-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl border ${
                role === "lock"
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : "bg-purple-500/10 text-purple-400 border-purple-500/20"
              }`}
            >
              {role === "lock" ? (
                <Lock className="w-5 h-5" />
              ) : (
                <FileCode2 className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-white">
                  {role === "lock" ? "Lock Script Inspector" : "Type Script Inspector"}
                </h2>
                <span
                  className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                    role === "lock"
                      ? "bg-emerald-500/20 text-emerald-300"
                      : "bg-purple-500/20 text-purple-300"
                  }`}
                >
                  {role} position
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Detailed structural breakdown and CKB-VM execution semantics
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Script Identity Card */}
        {knownInfo ? (
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-xs font-semibold">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Identified: {knownInfo.name}</span>
              </span>
              <a
                href={knownInfo.docUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 underline"
              >
                <span>RFC Documentation</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {knownInfo.description}
            </p>
            <div className="pt-2 border-t border-slate-900 text-xs text-slate-400 flex items-center gap-2">
              <span className="font-semibold text-slate-300">Expected args format:</span>
              <code className="text-emerald-300 font-mono text-[11px] bg-slate-900 px-1.5 py-0.5 rounded">
                {knownInfo.typicalArgs}
              </code>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Custom / Unregistered Script</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              This code_hash does not match known CKB system scripts (SECP256k1, DAO, Omnilock, etc.).
              In CKB&apos;s permissionless model, developers can deploy any arbitrary RISC-V binary.
              <strong> CKB Cell Inspector does not fabricate or guess custom script internals without verified source code.</strong>
            </p>
          </div>
        )}

        {/* Script Fields Detailed Breakdown */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Script Structure (Fields)
          </h3>

          <div className="space-y-2">
            {/* code_hash */}
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">1. code_hash (32 bytes)</span>
                <CopyButton text={script.code_hash} label="code_hash" />
              </div>
              <p className="font-mono text-xs text-white break-all">{script.code_hash}</p>
              <p className="text-[11px] text-slate-500">
                Points to the executable RISC-V binary code cell located via <code>cell_deps</code>.
              </p>
            </div>

            {/* hash_type */}
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">2. hash_type</span>
                <span className="px-2 py-0.5 rounded bg-slate-900 text-emerald-400 font-mono text-xs border border-slate-800">
                  {script.hash_type}
                </span>
              </div>
              <p className="text-xs text-slate-300">{hashTypeExplanation}</p>
            </div>

            {/* args */}
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">
                  3. args ({argsByteLength} bytes)
                </span>
                <CopyButton text={script.args} label="args" />
              </div>
              <p className="font-mono text-xs text-white break-all max-h-24 overflow-y-auto">
                {script.args || "0x"}
              </p>
              <p className="text-[11px] text-slate-500">
                Input arguments passed directly into the RISC-V binary&apos;s <code>main(argc, argv)</code> function at execution time.
              </p>
            </div>
          </div>
        </div>

        {/* Structural Role Explanation */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
          <div className="flex items-center gap-2 font-semibold text-slate-200">
            <BookOpen className="w-4 h-4 text-emerald-400" />
            <span>{roleExplanation.title}</span>
          </div>

          <div className="space-y-1.5 text-slate-300 leading-relaxed">
            <p><strong>Core Purpose:</strong> {roleExplanation.summary}</p>
            <p><strong>When executed:</strong> {roleExplanation.executionRule}</p>
            <p className="text-emerald-300 font-mono text-[11px]">💡 Analogy: {roleExplanation.analogy}</p>
          </div>
        </div>

        {/* CKB-VM Execution Model */}
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs space-y-2">
          <div className="flex items-center gap-2 font-semibold text-slate-300">
            <Cpu className="w-4 h-4 text-teal-400" />
            <span>How CKB-VM Executes This Script</span>
          </div>
          <p className="text-slate-400 leading-relaxed">
            The script runs inside a pure 64-bit RISC-V virtual machine (CKB-VM).
            The script inspects the transaction via CKB system calls (syscalls).
            If the program executes and exits with return code <code>0</code>, the verification succeeds.
            Any non-zero exit code or running out of execution cycles causes the transaction to be immediately rejected!
          </p>
        </div>

        {/* Close Button */}
        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-white transition-colors cursor-pointer"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
}
