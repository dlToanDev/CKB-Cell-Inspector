"use client";

import React from "react";
import {
  Boxes,
  GraduationCap,
  Settings,
  ExternalLink,
  Activity,
  Layers,
} from "lucide-react";
import { NetworkConfig } from "@/types/ckb";

interface NavbarProps {
  currentNetwork: NetworkConfig;
  onSelectNetwork: (network: NetworkConfig) => void;
  onOpenSettings: () => void;
  educationalMode: boolean;
  onToggleEducationalMode: () => void;
  tipBlock?: string | null;
}

export function Navbar({
  currentNetwork,
  onOpenSettings,
  educationalMode,
  onToggleEducationalMode,
  tipBlock,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 via-teal-500/20 to-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight text-white">
                CKB <span className="text-emerald-400">Cell Inspector</span>
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                MVP
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Interactive Nervos CKB Transaction & Cell Model Explorer
            </p>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2.5 sm:gap-4">
          {/* Tip Block info */}
          {tipBlock && (
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-400">
              <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>Tip:</span>
              <span className="font-mono text-slate-200">#{parseInt(tipBlock, 16).toLocaleString()}</span>
            </div>
          )}

          {/* Educational Mode Toggle */}
          <button
            type="button"
            onClick={onToggleEducationalMode}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer border ${
              educationalMode
                ? "bg-teal-950/80 text-teal-300 border-teal-500/40 shadow-[0_0_12px_rgba(20,184,166,0.25)]"
                : "bg-slate-900 text-slate-400 hover:text-slate-200 border-slate-800"
            }`}
            title="Toggle contextual explanations of CKB Cell Model concepts"
          >
            <GraduationCap
              className={`w-4 h-4 ${
                educationalMode ? "text-teal-400" : "text-slate-400"
              }`}
            />
            <span className="hidden sm:inline">Education Mode</span>
            <span
              className={`text-[10px] px-1 py-0.2 rounded font-bold uppercase ${
                educationalMode
                  ? "bg-teal-500/20 text-teal-300"
                  : "bg-slate-800 text-slate-500"
              }`}
            >
              {educationalMode ? "ON" : "OFF"}
            </span>
          </button>

          {/* Network Badge & Settings */}
          <button
            type="button"
            onClick={onOpenSettings}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800/80 border border-slate-800 text-xs text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping duration-1000" />
            <span className="font-medium">{currentNetwork.name}</span>
            <Settings className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
          </button>

          {/* Docs / GitHub link */}
          <a
            href="https://docs.nervos.org"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden lg:flex items-center gap-1 text-xs text-slate-400 hover:text-emerald-400 transition-colors"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Nervos Docs</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </header>
  );
}
