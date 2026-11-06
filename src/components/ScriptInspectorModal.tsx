"use client";

import { ArrowUpRight, ChevronDown, FileCode2, Lock } from "lucide-react";
import { Script } from "@/types/ckb";
import { identifyKnownScript, SCRIPT_ROLE_EXPLANATIONS } from "@/lib/knownScripts";
import { CopyButton } from "./CopyButton";
import { Dialog } from "./Dialog";

interface ScriptInspectorModalProps {
  script: Script | null;
  role: "lock" | "type" | null;
  onClose: () => void;
}

export function ScriptInspectorModal({ script, role, onClose }: ScriptInspectorModalProps) {
  if (!script || !role) return null;
  const known = identifyKnownScript(script);
  const explanation = SCRIPT_ROLE_EXPLANATIONS[role];
  const hashExplanation = SCRIPT_ROLE_EXPLANATIONS.hashType[script.hash_type as keyof typeof SCRIPT_ROLE_EXPLANATIONS.hashType] ?? script.hash_type;

  return <Dialog title={role === "lock" ? "Lock script" : "Type script"} description={role === "lock" ? "Defines who can spend this cell." : "Defines the rules this cell must follow."} onClose={onClose}>
    <div className="script-identity">{role === "lock" ? <Lock size={18} /> : <FileCode2 size={18} />}<span>{known?.name ?? "Custom script"}</span>{known && <a href={known.docUrl} target="_blank" rel="noopener noreferrer" className="icon-button" aria-label="Open script documentation"><ArrowUpRight size={16} /></a>}</div>
    {!known && <p className="script-description">This script is not in the registry. Its fields are shown below; its behavior requires verified source code.</p>}
    <dl className="script-fields">
      <div><dt>Code hash <CopyButton text={script.code_hash} /></dt><dd>{script.code_hash}</dd></div>
      <div><dt>Hash type</dt><dd>{script.hash_type}</dd></div>
      <div><dt>Arguments <span>{Math.ceil(script.args.replace(/^0x/i, "").length / 2)} bytes</span><CopyButton text={script.args} /></dt><dd>{script.args || "0x"}</dd></div>
    </dl>
    <details className="script-explanation"><summary>Understand this script<ChevronDown size={14} /></summary>
      {known && <p>{known.description}</p>}
      <p>{explanation.summary}</p><p>{explanation.executionRule}</p><p>{hashExplanation}</p>
      {known && <p><strong>Expected arguments:</strong> {known.typicalArgs}</p>}
    </details>
  </Dialog>;
}
