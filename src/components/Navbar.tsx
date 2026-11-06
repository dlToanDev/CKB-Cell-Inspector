"use client";

import { ArrowUpRight, Box, ChevronDown, BookOpen, Search } from "lucide-react";
import { NetworkConfig } from "@/types/ckb";

interface NavbarProps {
  currentNetwork: NetworkConfig;
  onOpenSettings: () => void;
  guideOpen: boolean;
  onNavigate: (view: "explorer" | "guide") => void;
}

export function Navbar({ currentNetwork, onOpenSettings, guideOpen, onNavigate }: NavbarProps) {
  return (
    <header className="site-header">
      <div className="site-container header-inner">
        <button type="button" className="brand" onClick={() => onNavigate("explorer")} aria-label="Cell Inspector home">
          <span className="brand-mark"><Box size={23} strokeWidth={1.6} /></span>
          <span>cell<span className="text-[var(--muted-foreground)]">inspector</span></span>
          <span className="brand-tag">CKB</span>
        </button>
        <nav className="header-nav" aria-label="Main navigation">
          <button type="button" className={`nav-link ${!guideOpen ? "is-active" : ""}`} onClick={() => onNavigate("explorer")} aria-current={!guideOpen ? "page" : undefined}>
            <Search size={15} /><span>Explorer</span>
          </button>
          <button type="button" className={`nav-link ${guideOpen ? "is-active" : ""}`} onClick={() => onNavigate("guide")} aria-current={guideOpen ? "page" : undefined}>
            <BookOpen size={15} /><span>Learn</span>
          </button>
        </nav>
        <div className="header-actions">
          <a href="https://docs.nervos.org" target="_blank" rel="noopener noreferrer" className="docs-link">Docs <ArrowUpRight size={14} /></a>
          <button type="button" onClick={onOpenSettings} className="network-button" aria-label={`Network settings: ${currentNetwork.name}`}>
            <span className="status-dot" />
            <span>{currentNetwork.id === "custom" ? "Custom node" : currentNetwork.id === "testnet" ? "Testnet" : "Mainnet"}</span>
            <ChevronDown size={13} />
          </button>
        </div>
      </div>
    </header>
  );
}
