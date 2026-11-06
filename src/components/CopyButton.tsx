"use client";

import React, { useState } from "react";
import { Copy, Check } from "lucide-react";

interface CopyButtonProps {
  text: string;
  label?: string;
  className?: string;
  iconSize?: number;
}

export function CopyButton({
  text,
  label,
  className = "",
  iconSize = 14,
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={copied ? "Copied!" : `Copy ${label || "text"}`}
      aria-label={copied ? "Copied to clipboard" : `Copy ${label || "text"}`}
      className={`inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-md transition-all duration-150 cursor-pointer ${
        copied
          ? "bg-emerald-950/80 text-emerald-400 border border-emerald-500/50"
          : "bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700/60"
      } ${className}`}
    >
      {copied ? (
        <>
          <Check size={iconSize} className="text-emerald-400" />
          <span>Copied!</span>
        </>
      ) : (
        <>
          <Copy size={iconSize} className="text-slate-400 hover:text-slate-200" />
          {label && <span>{label}</span>}
        </>
      )}
    </button>
  );
}
