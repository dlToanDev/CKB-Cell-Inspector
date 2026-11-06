"use client";

import React, { useState } from "react";
import { Search, ArrowRight, X, Sparkles, AlertTriangle } from "lucide-react";
import { validateTxHash } from "@/lib/formatters";

export interface SampleTx {
  label: string;
  category: "transfer" | "multi_io" | "cellbase";
  description: string;
  hash: string;
}

export const VERIFIED_TESTNET_SAMPLES: SampleTx[] = [
  {
    label: "Standard Transfer",
    category: "transfer",
    description: "Standard CKB transfer (1 input -> 3 outputs)",
    hash: "0x70a97a4634d7c615e342e9479144784a30ea5ccbb579bf223af42d418f80cc7d",
  },
  {
    label: "Multi-IO Cell Activity",
    category: "multi_io",
    description: "Multiple inputs & outputs state transition",
    hash: "0xb600f410267ad6daa90afda3845bb1dcefaeddc1352cceaaa818df92390996a5",
  },
  {
    label: "Cellbase (Block Reward)",
    category: "cellbase",
    description: "Block minting transaction with null outpoint",
    hash: "0x920e3e1dabd3f32e3c6964ad8dd8f05335a3461b2f76855910eafb5d268e4cd5",
  },
];

interface SearchBarProps {
  onSearch: (hash: string) => void;
  isLoading: boolean;
  initialHash?: string;
}

export function SearchBar({ onSearch, isLoading, initialHash = "" }: SearchBarProps) {
  const [inputVal, setInputVal] = useState(initialHash);
  const [prevHash, setPrevHash] = useState(initialHash);
  const [validation, setValidation] = useState<{
    isValid: boolean;
    errorMessage?: string;
  } | null>(null);

  // Sync state during render if parent's initialHash changed
  if (initialHash !== prevHash) {
    setPrevHash(initialHash);
    setInputVal(initialHash);
    setValidation(initialHash ? { isValid: true } : null);
  }

  const handleInputChange = (val: string) => {
    setInputVal(val);
    if (!val.trim()) {
      setValidation(null);
      return;
    }
    const res = validateTxHash(val);
    setValidation(res);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;

    const res = validateTxHash(inputVal);
    if (!res.isValid) {
      setValidation(res);
      return;
    }

    if (res.normalized) {
      onSearch(res.normalized);
    }
  };

  const handleSelectSample = (sample: SampleTx) => {
    setInputVal(sample.hash);
    setValidation({ isValid: true });
    onSearch(sample.hash);
  };

  const handleClear = () => {
    setInputVal("");
    setValidation(null);
  };

  return (
    <div className="w-full space-y-3">
      {/* Search Input Box */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-center">
          <div className="absolute left-4 text-slate-400">
            <Search className="w-5 h-5" />
          </div>

          <input
            type="text"
            value={inputVal}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder="Enter CKB transaction hash (0x... or 64 hex characters)"
            disabled={isLoading}
            className={`w-full h-14 pl-12 pr-32 rounded-2xl bg-slate-900/90 border font-mono text-sm sm:text-base text-white placeholder-slate-500 shadow-inner transition-all focus:outline-none focus:ring-2 ${
              validation && !validation.isValid
                ? "border-red-500/80 focus:border-red-500 focus:ring-red-500/20"
                : validation && validation.isValid
                ? "border-emerald-500/80 focus:border-emerald-500 focus:ring-emerald-500/20"
                : "border-slate-800 focus:border-emerald-500/80 focus:ring-emerald-500/20"
            }`}
          />

          {/* Right actions: Clear button and Inspect button */}
          <div className="absolute right-2 flex items-center gap-1.5">
            {inputVal && !isLoading && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title="Clear input"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            <button
              type="submit"
              disabled={isLoading || !inputVal.trim()}
              className="flex items-center gap-1.5 px-4 h-10 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-semibold text-xs sm:text-sm shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Loading...</span>
                </>
              ) : (
                <>
                  <span>Inspect</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Validation feedback message */}
        {validation && !validation.isValid && validation.errorMessage && (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-red-400 pl-2 animate-in fade-in">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>{validation.errorMessage}</span>
          </div>
        )}
      </form>

      {/* Verified Samples Bar */}
      <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
        <div className="flex items-center gap-1 text-slate-400 font-medium mr-1">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>Verified Testnet Examples:</span>
        </div>

        {VERIFIED_TESTNET_SAMPLES.map((sample) => (
          <button
            key={sample.hash}
            type="button"
            onClick={() => handleSelectSample(sample)}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer disabled:opacity-50"
            title={`${sample.description} (${sample.hash})`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                sample.category === "cellbase"
                  ? "bg-amber-400"
                  : sample.category === "multi_io"
                  ? "bg-blue-400"
                  : "bg-emerald-400"
              }`}
            />
            <span className="font-medium">{sample.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
