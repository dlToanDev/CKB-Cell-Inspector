"use client";

import React, { useState } from "react";
import { Search, ArrowRight, X, AlertTriangle, LoaderCircle } from "lucide-react";
import { validateTxHash } from "@/lib/formatters";

export interface SampleTx {
  label: string;
  category: "transfer" | "multi_io" | "cellbase";
  description: string;
  hash: string;
}

export const VERIFIED_TESTNET_SAMPLES: SampleTx[] = [
  {
    label: "Simple transfer",
    category: "transfer",
    description: "Standard CKB transfer (1 input -> 3 outputs)",
    hash: "0x70a97a4634d7c615e342e9479144784a30ea5ccbb579bf223af42d418f80cc7d",
  },
  {
    label: "Multiple cells",
    category: "multi_io",
    description: "Multiple inputs & outputs state transition",
    hash: "0xb600f410267ad6daa90afda3845bb1dcefaeddc1352cceaaa818df92390996a5",
  },
  {
    label: "Block reward",
    category: "cellbase",
    description: "Block minting transaction with null outpoint",
    hash: "0x920e3e1dabd3f32e3c6964ad8dd8f05335a3461b2f76855910eafb5d268e4cd5",
  },
];

interface SearchBarProps {
  onSearch: (hash: string) => void;
  isLoading: boolean;
  initialHash?: string;
  showSamples?: boolean;
}

export function SearchBar({ onSearch, isLoading, initialHash = "", showSamples = true }: SearchBarProps) {
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
    if (validation) setValidation(null);
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
    <div className="search-area">
      <form onSubmit={handleSubmit} role="search" aria-label="Find a CKB transaction">
        <div className={`search-box ${validation && !validation.isValid ? "has-error" : ""}`}>
          <Search className="search-icon" size={20} aria-hidden="true" />
          <label htmlFor="transaction-hash" className="sr-only">Transaction hash</label>
          <input
            id="transaction-hash"
            type="text"
            value={inputVal}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder="Paste a transaction hash…"
            disabled={isLoading}
            autoComplete="off"
            spellCheck={false}
            aria-invalid={validation ? !validation.isValid : undefined}
            aria-describedby={validation && !validation.isValid ? "search-error" : undefined}
          />

          <div className="search-actions">
            {inputVal && !isLoading && (
              <button
                type="button"
                onClick={handleClear}
                className="icon-button"
                aria-label="Clear transaction hash"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            <button
              type="submit"
              disabled={isLoading || !inputVal.trim()}
              className="primary-button search-submit"
              aria-label={isLoading ? "Loading transaction" : "Inspect transaction"}
            >
              {isLoading ? (
                <>
                  <LoaderCircle size={16} className="animate-spin" />
                  <span className="search-button-label">Loading</span>
                </>
              ) : (
                <>
                  <span className="search-button-label">Inspect</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Validation feedback message */}
        {validation && !validation.isValid && validation.errorMessage && (
          <div id="search-error" role="alert" className="mt-3 flex items-center gap-2 text-xs text-red-300">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>{validation.errorMessage}</span>
          </div>
        )}
      </form>

      {/* Verified Samples Bar */}
      {showSamples && <div className="sample-bar">
        <span className="sample-label">Try an example</span>

        {VERIFIED_TESTNET_SAMPLES.map((sample) => (
          <button
            key={sample.hash}
            type="button"
            onClick={() => handleSelectSample(sample)}
            disabled={isLoading}
            className="sample-button"
            title={`Testnet: ${sample.description}`}
          >
            <span
              className="sample-dot"
            />
            <span className="font-medium">{sample.label}</span>
          </button>
        ))}
      </div>}
    </div>
  );
}
