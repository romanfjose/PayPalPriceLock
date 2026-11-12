"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import type { CryptographicReceipt, PriceLockDeal, RaceComparisonResult } from "@/lib/types";
import type { ApimaticValidationReport } from "@/lib/apimatic-context";
import {
  BoltRaceIcon,
  GridStudioIcon,
  KeyProofIcon,
  PayPalWordmarkBadge,
  PriceLockLogo,
  ShieldIcon,
} from "./BrandMark";
import HoldTimeline from "./HoldTimeline";
import RaceView from "./RaceView";
import ReceiptVerifier from "./ReceiptVerifier";
import BenchmarkView from "./BenchmarkView";

const PriceLockStudio = dynamic(() => import("./studio/PriceLockStudio"), {
  ssr: false,
  loading: () => (
    <div className="pl-card flex h-96 items-center justify-center rounded-2xl text-sm font-semibold text-[var(--pl-muted)]">
      Loading AG Studio 3.0 Workspace...
    </div>
  ),
});

export type ActiveTab = "sniper" | "studio" | "race" | "timeline" | "verify";

const QUICK_PICKS = [
  {
    id: "deal_sony_xm5",
    shortLabel: "Sony WH-1000XM5",
    delta: "-$133.90",
    query: "Sony WH-1000XM5 Wireless Headphones",
    ceiling: 220,
  },
  {
    id: "deal_breville_espresso",
    shortLabel: "Breville Barista",
    delta: "-$153.50",
    query: "Breville Barista Express Espresso Machine",
    ceiling: 525,
  },
  {
    id: "deal_camping_split",
    shortLabel: "4-Way Split Tent",
    delta: "$112 / ea",
    query: "Big Agnes Copper Spur 4-Person Tent",
    ceiling: 450,
  },
  {
    id: "deal_lg_oled",
    shortLabel: "LG 32\" 4K OLED",
    delta: "-$268.00",
    query: "LG UltraGear 32 4K OLED Monitor",
    ceiling: 960,
  },
  {
    id: "deal_fuji_x100vi",
    shortLabel: "Fujifilm X100VI",
    delta: "-$290.00",
    query: "Fujifilm X100VI Silver Camera",
    ceiling: 1550,
  },
];

function useAnimatedNumber(target: number, durationMs = 420): number {
  const [display, setDisplay] = useState(target);
  const prevRef = useRef(target);

  useEffect(() => {
    const from = prevRef.current;
    const to = target;
    prevRef.current = target;
    if (Math.abs(to - from) < 0.01) {
      setDisplay(to);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(from + (to - from) * eased);
      if (p < 1) {
        raf = requestAnimationFrame(tick);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);

  return display;
}

export default function PriceLockCockpit({
  initialDeals,
  initialReceipts,
  publicKeyHex,
  initialRace,
  initialApimatic,
  defaultTab = "sniper",
}: {
  initialDeals: PriceLockDeal[];
  initialReceipts: CryptographicReceipt[];
  publicKeyHex: string;
  initialRace: RaceComparisonResult;
  initialApimatic: ApimaticValidationReport;
  defaultTab?: ActiveTab;
}) {
  const [theme, setTheme] = useState<"warm" | "dark">("warm");
  const [activeTab, setActiveTab] = useState<ActiveTab>(defaultTab);
  const [deals, setDeals] = useState<PriceLockDeal[]>(initialDeals);
  const [receipts, setReceipts] = useState<CryptographicReceipt[]>(initialReceipts);
  const [selectedDealId, setSelectedDealId] = useState<string>(initialDeals[0]?.id || "deal_sony_xm5");
  const [queryInput, setQueryInput] = useState("Sony WH-1000XM5 Headphones");
  const [ceilingInput, setCeilingInput] = useState<number>(220);
  const [busy, setBusy] = useState(false);
  const [statusBanner, setStatusBanner] = useState<string>(
    "Stripped $29.00 hidden warranty trap on GadgetPulse ($347.90) and locked a $214.00 PayPal Orders v2 hold via Channel3 (B&H Photo)."
  );
  const [mcpCopied, setMcpCopied] = useState(false);
  const [surgeryProgress, setSurgeryProgress] = useState<number>(100);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  // Kinetic transformation reveal whenever a product is selected
  useEffect(() => {
    setSurgeryProgress(18);
    const timer = setTimeout(() => {
      setSurgeryProgress(100);
    }, 120);
    return () => clearTimeout(timer);
  }, [selectedDealId]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "warm" ? "dark" : "warm"));
  };

  const selectedDeal = deals.find((d) => d.id === selectedDealId) ?? deals[0];
  const totalSavedUsd = deals.reduce((s, d) => s + d.totalSavedUsd, 0);
  const totalStrippedUsd = deals.reduce((s, d) => s + d.strippedDarkPatternUsd, 0);
  const activeHoldCount = deals.filter((d) => d.status === "AUTHORIZED_HOLD").length;

  const animSaved = useAnimatedNumber(totalSavedUsd);
  const animStripped = useAnimatedNumber(totalStrippedUsd);
  const animDealFloor = useAnimatedNumber(selectedDeal?.channel3VerifiedPrice ?? 214);
  const animDealRelief = useAnimatedNumber(selectedDeal?.totalSavedUsd ?? 133.9);

  const firstOffer = selectedDeal?.offers[0];
  const naiveListed = firstOffer?.listedPrice ?? (selectedDeal ? selectedDeal.naiveCheckoutTotal - selectedDeal.strippedDarkPatternUsd : 299);
  const naiveShipping = firstOffer?.shippingFee ?? 0;

  const scrubbedPrice = selectedDeal
    ? selectedDeal.naiveCheckoutTotal -
      ((selectedDeal.naiveCheckoutTotal - selectedDeal.channel3VerifiedPrice) * surgeryProgress) / 100
    : 214;

  const handleLockPriceHold = async (customQuery?: string, customCeiling?: number, presetDealId?: string) => {
    const q = customQuery ?? queryInput;
    const c = customCeiling ?? ceilingInput;
    setBusy(true);
    setQueryInput(q);
    if (customCeiling) setCeilingInput(customCeiling);
    if (presetDealId) setSelectedDealId(presetDealId);

    try {
      const res = await fetch("/api/deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CREATE_HOLD",
          query: q,
          targetHoldPrice: c,
        }),
      });
      const data = (await res.json()) as {
        ok: boolean;
        deal?: PriceLockDeal;
        aiAnalysis?: { summary: string };
      };
      if (data.ok && data.deal) {
        setDeals((prev) => [data.deal!, ...prev.filter((x) => x.id !== data.deal!.id)]);
        setReceipts((prev) => [...prev, data.deal!.receipt]);
        setSelectedDealId(data.deal.id);
        setStatusBanner(
          data.aiAnalysis?.summary ||
            `Locked PayPal Orders v2 AUTHORIZE hold (${data.deal.paypal.orderId}) at $${data.deal.channel3VerifiedPrice.toFixed(2)} via ${data.deal.bestRetailer} — saving $${data.deal.totalSavedUsd.toFixed(2)}.`
        );
      }
    } finally {
      setBusy(false);
    }
  };

  const handleDealDecision = async (dealId: string, decision: "CAPTURE" | "VOID" | "REFUND_DROP") => {
    setBusy(true);
    try {
      const res = await fetch("/api/deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "DECIDE_HOLD",
          dealId,
          decision,
        }),
      });
      const data = (await res.json()) as {
        ok: boolean;
        deal?: PriceLockDeal;
        receipt?: CryptographicReceipt;
      };
      if (data.ok && data.deal && data.receipt) {
        setDeals((prev) => prev.map((d) => (d.id === data.deal!.id ? data.deal! : d)));
        setReceipts((prev) => [...prev, data.receipt!]);
        setStatusBanner(
          decision === "CAPTURE"
            ? `PayPal Authorization ${data.deal.paypal.authorizationId} captured (${data.deal.paypal.captureId}) at $${data.deal.channel3VerifiedPrice.toFixed(2)} — Ed25519 receipt #${data.receipt.sequence} sealed.`
            : decision === "VOID"
            ? `PayPal Authorization ${data.deal.paypal.authorizationId} voided — $0.00 charged to your PayPal wallet.`
            : `Claimed post-purchase price-drop partial refund (${data.deal.paypal.refundId}) on PayPal Order ${data.deal.paypal.orderId}.`
        );
      }
    } finally {
      setBusy(false);
    }
  };

  const copyMcpCommand = () => {
    navigator.clipboard?.writeText(
      `claude mcp add --transport http pricelock ${typeof window !== "undefined" ? window.location.origin : "http://localhost:4690"}/api/mcp`
    );
    setMcpCopied(true);
    setTimeout(() => setMcpCopied(false), 2000);
  };

  const navTabs: Array<{ id: ActiveTab; label: string; icon: React.ReactNode }> = [
    { id: "sniper", label: "Checkout Shield", icon: <ShieldIcon className="h-3.5 w-3.5" /> },
    { id: "studio", label: "AG Studio 3.0", icon: <GridStudioIcon className="h-3.5 w-3.5" /> },
    { id: "race", label: "Live Bot Race", icon: <BoltRaceIcon className="h-3.5 w-3.5" /> },
    { id: "verify", label: "Audit & Proof", icon: <KeyProofIcon className="h-3.5 w-3.5" /> },
  ];

  const resolvedNavId: ActiveTab = activeTab === "timeline" ? "verify" : activeTab;

  return (
    <div className="pl-ambient-canvas min-h-screen text-[var(--pl-ink)] transition-colors duration-200">
      {/* Single Clean Executive Navigation Header */}
      <header className="pl-glass-header sticky top-0 z-30 border-b border-[var(--pl-border)]">
        <div className="mx-auto flex max-w-[1360px] items-center justify-between gap-4 px-6 py-3">
          {/* Brand Lockup */}
          <div className="flex items-center gap-3">
            <PriceLockLogo size={36} />
            <div className="flex items-center gap-2.5">
              <span className="text-[19px] font-extrabold tracking-[-0.03em]">PriceLock</span>
              <div className="hidden sm:block">
                <PayPalWordmarkBadge mode={selectedDeal?.paypal.mode} />
              </div>
            </div>
          </div>

          {/* Segmented Navigation Pill */}
          <nav
            className="flex items-center gap-1 rounded-xl border border-[var(--pl-border)] bg-[var(--pl-canvas-subtle)] p-1"
            aria-label="Primary Views"
          >
            {navTabs.map((tab) => {
              const isActive = resolvedNavId === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`tab-${tab.id}`}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex cursor-pointer items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all duration-150 ${
                    isActive
                      ? "bg-[var(--pl-surface)] text-[var(--pl-ink)] shadow-xs"
                      : "text-[var(--pl-muted)] hover:text-[var(--pl-ink)]"
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Utility Strip */}
          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-1.5 rounded-full border border-emerald-500/25 bg-[var(--pl-accent-soft)] px-3 py-1 text-xs font-bold text-emerald-700 xl:flex dark:text-emerald-300">
              <span>Saved</span>
              <span className="font-mono">${animSaved.toFixed(2)}</span>
            </div>

            <button
              id="btn-copy-mcp"
              type="button"
              onClick={copyMcpCommand}
              className="hidden cursor-pointer items-center gap-1.5 rounded-lg border border-[var(--pl-border)] bg-[var(--pl-surface)] px-2.5 py-1.5 font-mono text-[11px] font-semibold text-[var(--pl-ink-secondary)] transition hover:border-[var(--pl-border-strong)] md:flex"
            >
              <span>{mcpCopied ? "Copied /api/mcp" : "MCP Endpoint"}</span>
            </button>

            <button
              id="btn-theme-toggle"
              type="button"
              onClick={toggleTheme}
              className="cursor-pointer rounded-lg border border-[var(--pl-border)] bg-[var(--pl-surface)] px-3 py-1.5 text-xs font-bold text-[var(--pl-ink)] transition hover:border-[var(--pl-border-strong)]"
            >
              {theme === "warm" ? "Obsidian Dark" : "Warm Stone"}
            </button>
          </div>
        </div>
      </header>

      {/* Main Stage */}
      <main className="mx-auto max-w-[1360px] px-6 py-6">
        {/* VIEW 1: VISCERAL @BONES CHECKOUT SHIELD */}
        {activeTab === "sniper" && (
          <div className="pl-animate-in flex flex-col gap-7">
            {/* Above-the-Fold Hero + Live Transformation Receipt */}
            <div className="grid grid-cols-1 items-start gap-7 lg:grid-cols-12">
              {/* Left 5 Columns: Global Category-King Value Proposition + Instant Action */}
              <div className="flex flex-col gap-5 lg:col-span-5 lg:pt-2">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-[var(--pl-border)] bg-[var(--pl-surface)] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--pl-muted)]">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Autonomous Checkout Surgeon
                  </div>
                  <h1 className="mt-3.5 text-[36px] leading-[1.08] font-extrabold tracking-[-0.035em] sm:text-[40px]">
                    Stop paying the hidden checkout tax.
                  </h1>
                  <p className="mt-3 text-[14.5px] leading-relaxed text-[var(--pl-muted)]">
                    Online stores sneak auto-checked warranties into your cart and price identical gear $130 above authorized dealers. Drop any item—PriceLock strips the traps, checks{" "}
                    <strong className="font-semibold text-[var(--pl-ink-secondary)]">25,000+ retailers via Channel3</strong>, and holds your{" "}
                    <strong className="font-semibold text-[var(--pl-ink-secondary)]">PayPal</strong> funds until the real floor hits.
                  </p>
                </div>

                {/* Unified Command Box */}
                <div className="pl-card-elevated rounded-2xl p-4">
                  <label
                    htmlFor="input-sniper-query"
                    className="block text-[11px] font-bold uppercase tracking-[0.07em] text-[var(--pl-muted)]"
                  >
                    Protect Any Product, Cart, or Group Purchase
                  </label>
                  <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                    <input
                      id="input-sniper-query"
                      type="text"
                      value={queryInput}
                      onChange={(e) => setQueryInput(e.target.value)}
                      placeholder="Paste product name or SKU..."
                      className="flex-1 rounded-xl border border-[var(--pl-border)] bg-[var(--pl-surface-muted)] px-3.5 py-2.5 text-[13px] font-semibold outline-none transition focus:border-[#0070E0] focus:bg-[var(--pl-surface)]"
                    />
                    <div className="flex items-center gap-2">
                      <div className="flex items-center rounded-xl border border-[var(--pl-border)] bg-[var(--pl-surface-muted)] px-2.5 py-2.5 text-xs">
                        <span className="text-[var(--pl-muted)]">Max $</span>
                        <input
                          type="number"
                          value={ceilingInput}
                          onChange={(e) => setCeilingInput(Number(e.target.value))}
                          className="w-11 bg-transparent pl-1 font-mono text-[13px] font-bold outline-none"
                        />
                      </div>
                      <button
                        id="btn-lock-hold"
                        type="button"
                        disabled={busy}
                        onClick={() => handleLockPriceHold()}
                        className="cursor-pointer whitespace-nowrap rounded-xl bg-[#0F172A] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#1E293B] disabled:opacity-50 dark:bg-[#10B981] dark:text-[#06130E] dark:hover:bg-[#34D399]"
                      >
                        {busy ? "Scanning 25k..." : "Lock Price Hold"}
                      </button>
                    </div>
                  </div>

                  {/* Clean Instant Product Switcher */}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {QUICK_PICKS.map((qp) => {
                      const active = selectedDealId === qp.id;
                      return (
                        <button
                          key={qp.id}
                          id={`preset-${qp.id}`}
                          type="button"
                          onClick={() => handleLockPriceHold(qp.query, qp.ceiling, qp.id)}
                          className={`flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition ${
                            active
                              ? "border-emerald-600/60 bg-[var(--pl-accent-soft)] text-emerald-800 dark:text-emerald-300"
                              : "border-[var(--pl-border)] bg-[var(--pl-surface-muted)] text-[var(--pl-ink-secondary)] hover:border-[var(--pl-border-strong)]"
                          }`}
                        >
                          <span>{qp.shortLabel}</span>
                          <span className="font-mono text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                            {qp.delta}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Crisp 3-Metric Proof Strip */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="pl-card rounded-xl px-3.5 py-3">
                    <div className="font-mono text-lg font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400">
                      ${animSaved.toFixed(0)}
                    </div>
                    <div className="mt-0.5 text-[11px] font-medium text-[var(--pl-muted)]">
                      Kept in Buyer Wallet
                    </div>
                  </div>
                  <div className="pl-card rounded-xl px-3.5 py-3">
                    <div className="font-mono text-lg font-extrabold tracking-tight">
                      ${animStripped.toFixed(0)}
                    </div>
                    <div className="mt-0.5 text-[11px] font-medium text-[var(--pl-muted)]">
                      Junk Fees Stripped
                    </div>
                  </div>
                  <div className="pl-card rounded-xl px-3.5 py-3">
                    <div className="font-mono text-lg font-extrabold tracking-tight">
                      99.2%
                    </div>
                    <div className="mt-0.5 text-[11px] font-medium text-[var(--pl-muted)]">
                      120-Run Catch Rate
                    </div>
                  </div>
                </div>
              </div>

              {/* Right 7 Columns: The Kinetic Live Checkout Transformation Receipt */}
              {selectedDeal && (
                <div className="pl-card-elevated overflow-hidden rounded-3xl lg:col-span-7">
                  {/* Receipt Top Header */}
                  <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--pl-border)] bg-[var(--pl-surface-muted)] px-6 py-5">
                    <div className="max-w-md">
                      <div className="flex items-center gap-2">
                        <span className="rounded-md border border-[var(--pl-border)] bg-[var(--pl-surface)] px-2 py-0.5 text-[11px] font-semibold text-[var(--pl-muted)]">
                          {selectedDeal.category}
                        </span>
                        <span
                          className={`rounded-md px-2 py-0.5 font-mono text-[10px] font-bold ${
                            selectedDeal.status === "AUTHORIZED_HOLD"
                              ? "bg-[var(--pl-paypal-soft)] text-[var(--pl-paypal)]"
                              : selectedDeal.status === "CAPTURED_AT_TARGET"
                              ? "bg-[var(--pl-accent-soft)] text-emerald-700 dark:text-emerald-300"
                              : "bg-zinc-500/15 text-[var(--pl-muted)]"
                          }`}
                        >
                          {selectedDeal.status.replace(/_/g, " ")}
                        </span>
                      </div>
                      <h2 className="mt-2 text-lg leading-snug font-extrabold tracking-[-0.02em]">
                        {selectedDeal.title}
                      </h2>
                    </div>

                    {/* Giant Buyer Relief Price Lockup */}
                    <div className="text-right">
                      <div className="flex items-baseline justify-end gap-2">
                        <span className="font-mono text-sm font-semibold text-[var(--pl-muted)] line-through">
                          ${selectedDeal.naiveCheckoutTotal.toFixed(2)}
                        </span>
                        <span className="font-mono text-3xl font-extrabold tracking-tight text-[var(--pl-ink)]">
                          ${animDealFloor.toFixed(2)}
                        </span>
                      </div>
                      <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-[var(--pl-accent-soft)] px-2.5 py-0.5 font-mono text-xs font-bold text-emerald-700 dark:text-emerald-300">
                        You keep +${animDealRelief.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  {/* Interactive Transformation Scrubber */}
                  <div className="border-b border-[var(--pl-border)] px-6 py-3.5">
                    <div className="flex items-center justify-between text-xs">
                      <button
                        type="button"
                        onClick={() => setSurgeryProgress(0)}
                        className="cursor-pointer font-semibold text-[var(--pl-muted)] transition hover:text-[var(--pl-ink)]"
                      >
                        Unprotected Checkout (${selectedDeal.naiveCheckoutTotal.toFixed(2)})
                      </button>
                      <span className="font-mono text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                        {surgeryProgress === 100
                          ? `100% Disinfected • Floor Locked at $${animDealFloor.toFixed(2)}`
                          : `Scrubbing Checkout: $${scrubbedPrice.toFixed(2)} (${surgeryProgress}%)`}
                      </span>
                      <button
                        type="button"
                        onClick={() => setSurgeryProgress(100)}
                        className="cursor-pointer font-bold text-emerald-700 dark:text-emerald-400"
                      >
                        PriceLock Floor (${selectedDeal.channel3VerifiedPrice.toFixed(2)})
                      </button>
                    </div>
                    <div className="mt-2">
                      <input
                        id="slider-xray-scrubber"
                        type="range"
                        min={0}
                        max={100}
                        value={surgeryProgress}
                        onChange={(e) => setSurgeryProgress(Number(e.target.value))}
                        aria-label="Checkout Disinfection Scrubber"
                        className="pl-scrubber w-full bg-gradient-to-r from-red-500/40 via-sky-500/40 to-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Surgical Receipt Line-Item Breakdown */}
                  <div className="space-y-2.5 px-6 py-4">
                    {/* Line 1: Cross-Retailer Channel3 Arbitrage */}
                    <div className="flex items-center justify-between rounded-xl border border-[var(--pl-border)] bg-[var(--pl-surface-muted)] px-4 py-3 text-xs">
                      <div>
                        <div className="font-bold text-[var(--pl-ink)]">
                          1. Verified Retailer Arbitrage (Channel3 25,000+ Stores)
                        </div>
                        <div className="mt-0.5 text-[var(--pl-muted)]">
                          Rerouted from <span className="line-through">{selectedDeal.naiveStoreName}</span> to{" "}
                          <strong className="text-[var(--pl-ink-secondary)]">{selectedDeal.bestRetailer}</strong>
                        </div>
                      </div>
                      <div className="text-right font-mono">
                        <div className="text-[11px] text-[var(--pl-muted)] line-through">
                          ${naiveListed.toFixed(2)}
                        </div>
                        <div className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                          ${selectedDeal.channel3VerifiedPrice.toFixed(2)}
                        </div>
                      </div>
                    </div>

                    {/* Line 2: Dark-Pattern & Prompt-Injection Surgery */}
                    <div
                      style={{
                        opacity: surgeryProgress > 40 ? 1 : 0.78,
                      }}
                      className="rounded-xl border border-red-500/20 bg-[var(--pl-danger-soft)] px-4 py-3 text-xs transition"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[var(--pl-ink)]">
                            2. {selectedDeal.darkPatternCategory} Trap
                          </span>
                          <span className="rounded bg-red-600 px-1.5 py-0.5 font-mono text-[10px] font-bold text-white">
                            {surgeryProgress >= 50 ? "STRIPPED" : "DETECTED"}
                          </span>
                        </div>
                        <div className="font-mono">
                          <span className="mr-2 text-[var(--pl-muted)] line-through">
                            +${selectedDeal.strippedDarkPatternUsd.toFixed(2)}
                          </span>
                          <strong className="text-emerald-700 dark:text-emerald-400">$0.00</strong>
                        </div>
                      </div>
                      <div className="mt-1.5 truncate rounded-lg bg-[#0F141C] px-3 py-1.5 font-mono text-[11px] text-slate-300">
                        {selectedDeal.darkPatternQuote}
                      </div>
                    </div>

                    {/* Line 3: Drip Shipping / Group Split */}
                    {selectedDeal.splitCrew ? (
                      <div className="rounded-xl border border-[var(--pl-border)] bg-[var(--pl-surface-muted)] px-4 py-3 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold">
                            3. Multiparty Group Split-Hold (4 Friends Locked — Zero Fronting)
                          </span>
                          <span className="font-mono font-bold text-[var(--pl-paypal)]">
                            4 × ${selectedDeal.splitCrew[0].shareAmount.toFixed(2)}
                          </span>
                        </div>
                        <div className="mt-2 grid grid-cols-4 gap-2">
                          {selectedDeal.splitCrew.map((m) => (
                            <div
                              key={m.handle}
                              className="rounded-lg border border-[var(--pl-border)] bg-[var(--pl-surface)] px-2.5 py-1.5"
                            >
                              <div className="truncate font-bold">{m.name}</div>
                              <div className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400">
                                ${m.shareAmount.toFixed(0)} • {m.status}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between rounded-xl border border-[var(--pl-border)] bg-[var(--pl-surface-muted)] px-4 py-2.5 text-xs">
                        <div>
                          <span className="font-bold">3. Step-3 Checkout Drip Shipping & Handling</span>
                          <span className="ml-2 text-[var(--pl-muted)]">Authorized Direct Fulfillment</span>
                        </div>
                        <div className="font-mono">
                          {naiveShipping > 0 && (
                            <span className="mr-2 text-[var(--pl-muted)] line-through">
                              +${naiveShipping.toFixed(2)}
                            </span>
                          )}
                          <strong className="text-emerald-700 dark:text-emerald-400">FREE ($0.00)</strong>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* PayPal Orders v2 Settlement Bar */}
                  <div className="border-t border-[var(--pl-border)] bg-[var(--pl-surface-muted)] px-6 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 text-xs font-bold">
                          <span className="text-[var(--pl-paypal)]">PayPal Orders v2 Conditional Hold</span>
                          <span className="font-mono text-[11px] text-[var(--pl-muted)]">
                            #{selectedDeal.paypal.orderId}
                          </span>
                        </div>
                        <div className="mt-0.5 text-[11px] text-[var(--pl-muted)]">
                          $0.00 leaves your wallet until target floor hits or you approve capture.
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          id="btn-capture-hold"
                          type="button"
                          disabled={busy}
                          onClick={() => handleDealDecision(selectedDeal.id, "CAPTURE")}
                          className="cursor-pointer rounded-xl bg-[#0070E0] px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-[#005EA6] disabled:opacity-50"
                        >
                          Capture ${selectedDeal.channel3VerifiedPrice.toFixed(2)} Hold
                        </button>
                        <button
                          id="btn-refund-drop"
                          type="button"
                          disabled={busy}
                          onClick={() => handleDealDecision(selectedDeal.id, "REFUND_DROP")}
                          className="cursor-pointer rounded-xl border border-[var(--pl-border-strong)] bg-[var(--pl-surface)] px-3 py-2 text-xs font-bold transition hover:bg-[var(--pl-canvas-subtle)] disabled:opacity-50"
                        >
                          Claim Drop Refund
                        </button>
                        <button
                          id="btn-void-hold"
                          type="button"
                          disabled={busy}
                          onClick={() => handleDealDecision(selectedDeal.id, "VOID")}
                          className="cursor-pointer rounded-xl border border-transparent px-2.5 py-2 text-xs font-semibold text-[var(--pl-muted)] transition hover:text-[var(--pl-ink)] disabled:opacity-50"
                        >
                          Void ($0.00)
                        </button>
                      </div>
                    </div>

                    {/* Compact Live Verdict & Cryptographic Seal Footer */}
                    <div
                      id="what-happened-strip"
                      className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--pl-border)] pt-2.5 text-[11px]"
                    >
                      <div className="flex items-center gap-1.5 text-[var(--pl-ink-secondary)]">
                        <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                        <span className="font-medium">{statusBanner}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveTab("verify")}
                        className="cursor-pointer font-mono font-semibold text-[var(--pl-paypal)] hover:underline"
                      >
                        Ed25519 Receipt #{selectedDeal.receipt.sequence} Verified ({receipts.length}) →
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Below-the-Fold Portfolio Strip: Active Protected Deals */}
            <section className="pt-1">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold tracking-tight">
                    Protected Checkout Portfolio ({deals.length} Items • {activeHoldCount} Active PayPal Holds)
                  </h3>
                  <p className="text-xs text-[var(--pl-muted)]">
                    Select any item to inspect its Channel3 retailer spread, stripped dark patterns, and PayPal hold state.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab("studio")}
                  className="cursor-pointer text-xs font-bold text-[var(--pl-paypal)] hover:underline"
                >
                  Open Multi-Widget Analytics in AG Studio 3.0 →
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {deals.map((d) => {
                  const active = d.id === selectedDeal?.id;
                  const savingsPct = Math.round((d.totalSavedUsd / d.naiveCheckoutTotal) * 100);
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setSelectedDealId(d.id)}
                      className={`pl-card cursor-pointer rounded-2xl p-4 text-left transition ${
                        active
                          ? "ring-2 ring-[#0070E0] border-transparent"
                          : "hover:-translate-y-0.5 hover:border-[var(--pl-border-strong)]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="truncate text-[10px] font-bold uppercase tracking-wider text-[var(--pl-muted)]">
                          {d.category}
                        </span>
                        <span className="rounded-full bg-[var(--pl-accent-soft)] px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                          -{savingsPct}%
                        </span>
                      </div>
                      <div className="mt-2 line-clamp-2 text-xs leading-snug font-bold">
                        {d.title}
                      </div>
                      <div className="mt-3 flex items-baseline justify-between border-t border-[var(--pl-border)] pt-2.5 font-mono">
                        <span className="text-[11px] text-[var(--pl-muted)] line-through">
                          ${d.naiveCheckoutTotal.toFixed(0)}
                        </span>
                        <span className="text-sm font-extrabold text-[var(--pl-ink)]">
                          ${d.channel3VerifiedPrice.toFixed(0)}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          </div>
        )}

        {/* VIEW 2: AG STUDIO 3.0 + AGENT FRAMEWORK */}
        {activeTab === "studio" && (
          <div className="pl-animate-in">
            <PriceLockStudio
              deals={deals}
              isDark={theme === "dark"}
              onDecision={handleDealDecision}
            />
          </div>
        )}

        {/* VIEW 3: SIDE-BY-SIDE BOT RACE + APIMATIC SDK COMPILER */}
        {activeTab === "race" && (
          <div className="pl-animate-in">
            <RaceView initialRace={initialRace} initialApimatic={initialApimatic} />
          </div>
        )}

        {/* VIEW 4: CRYPTOGRAPHIC AUDIT, HOLD WINDOWS & 120-RUN BENCHMARK */}
        {(activeTab === "verify" || activeTab === "timeline") && (
          <div className="pl-animate-in flex flex-col gap-6">
            <ReceiptVerifier initialReceipts={receipts} publicKeyHex={publicKeyHex} />
            <HoldTimeline deals={deals} onDecision={handleDealDecision} />
            <BenchmarkView />
          </div>
        )}
      </main>
    </div>
  );
}
