"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import type { CryptographicReceipt, PriceLockDeal, RaceComparisonResult } from "@/lib/types";
import type { ApimaticValidationReport } from "@/lib/apimatic-context";
import HoldTimeline from "./HoldTimeline";
import RaceView from "./RaceView";
import ReceiptVerifier from "./ReceiptVerifier";
import BenchmarkView from "./BenchmarkView";

const PriceLockStudio = dynamic(() => import("./studio/PriceLockStudio"), {
  ssr: false,
  loading: () => (
    <div className="flex h-96 items-center justify-center rounded-xl border border-[var(--pl-border)] bg-[var(--pl-surface)] text-sm font-semibold">
      Hydrating AG Studio 3.0 + Studio Agent Framework...
    </div>
  ),
});

export type ActiveTab = "sniper" | "studio" | "race" | "timeline" | "verify";

const QUICK_PICKS = [
  { label: "🎧 Sony WH-1000XM5 ($347 → $214)", query: "Sony WH-1000XM5 Wireless Headphones", ceiling: 220 },
  { label: "☕ Breville Barista Express ($672 → $519)", query: "Breville Barista Express Espresso Machine", ceiling: 525 },
  { label: "⛺ 4-Way Group Split Tent ($112/ea Hold)", query: "Big Agnes Copper Spur 4-Person Tent", ceiling: 450 },
  { label: "🖥️ LG 32\" 4K OLED ($1,217 → $949)", query: "LG UltraGear 32 4K OLED Monitor", ceiling: 960 },
  { label: "📷 Fujifilm X100VI ($1,839 → $1,549)", query: "Fujifilm X100VI Silver Camera", ceiling: 1550 },
];

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
  const [queryInput, setQueryInput] = useState("Sony WH-1000XM5 Wireless Headphones");
  const [ceilingInput, setCeilingInput] = useState<number>(220);
  const [busy, setBusy] = useState(false);
  const [statusBanner, setStatusBanner] = useState<string>(
    "Stripped $29.00 CSS-hidden warranty trap on GadgetPulse ($347.90) and locked PayPal Orders v2 AUTHORIZE hold at $214.00 via Channel3 (B&H Photo) — saving $133.90 immediately."
  );
  const [mcpCopied, setMcpCopied] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "warm" ? "dark" : "warm"));
  };

  const selectedDeal = deals.find((d) => d.id === selectedDealId) ?? deals[0];
  const totalSavedUsd = deals.reduce((s, d) => s + d.totalSavedUsd, 0);
  const totalStrippedUsd = deals.reduce((s, d) => s + d.strippedDarkPatternUsd, 0);
  const activeHoldCount = deals.filter((d) => d.status === "AUTHORIZED_HOLD").length;

  const handleLockPriceHold = async (customQuery?: string, customCeiling?: number) => {
    const q = customQuery ?? queryInput;
    const c = customCeiling ?? ceilingInput;
    setBusy(true);
    setQueryInput(q);
    if (customCeiling) setCeilingInput(customCeiling);

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
            ? `PayPal Authorization ${data.deal.paypal.authorizationId} CAPTURED (${data.deal.paypal.captureId}) at verified floor $${data.deal.channel3VerifiedPrice.toFixed(2)} — Ed25519 receipt #${data.receipt.sequence} sealed.`
            : decision === "VOID"
            ? `PayPal Authorization ${data.deal.paypal.authorizationId} VOIDED — $0.00 charged to buyer wallet.`
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

  return (
    <div className="min-h-screen bg-[var(--pl-canvas)] text-[var(--pl-ink)] transition-colors">
      {/* Top Executive Navigation Bar */}
      <header className="sticky top-0 z-30 border-b border-[var(--pl-border)] bg-[var(--pl-surface)]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-3 px-4 py-2.5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-700 font-mono text-sm font-black text-white shadow-xs">
              PL
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold tracking-tight">PriceLock</span>
                <span className="rounded bg-emerald-600/20 px-2 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                  PayPal Orders v2 + Channel3 + AG Studio 3.0 + APIMatic + Bryntum
                </span>
              </div>
              <p className="text-xs text-[var(--pl-muted)]">
                Never Overpay at Checkout Again — Strip Dark Patterns, Arbitrage 25,000 Stores & Hold Money on PayPal Until the Price Drops
              </p>
            </div>
          </div>

          {/* 3-Chip Executive KPI Strip + Theme Toggle */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="rounded-lg border border-emerald-600/35 bg-emerald-600/15 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">
              💰 Saved: ${totalSavedUsd.toFixed(2)}
            </div>
            <div className="rounded-lg border border-red-600/35 bg-red-600/15 px-2.5 py-1 text-xs font-bold text-red-700 dark:text-red-300">
              ✂️ Traps Stripped: ${totalStrippedUsd.toFixed(2)}
            </div>
            <div className="rounded-lg border border-amber-600/35 bg-amber-500/15 px-2.5 py-1 text-xs font-bold text-amber-800 dark:text-amber-300">
              🔒 Active PayPal Holds: {activeHoldCount}
            </div>

            <button
              id="btn-copy-mcp"
              type="button"
              onClick={copyMcpCommand}
              className="rounded-lg border border-[var(--pl-border)] bg-black/[0.03] px-2.5 py-1.5 font-mono text-xs font-semibold transition hover:border-emerald-600/50 dark:bg-white/[0.04]"
            >
              {mcpCopied ? "✓ MCP URL Copied" : "🔌 Copy /api/mcp"}
            </button>

            <button
              id="btn-theme-toggle"
              type="button"
              onClick={toggleTheme}
              className="rounded-lg border border-[var(--pl-border)] bg-[var(--pl-canvas)] px-3 py-1.5 text-xs font-bold shadow-2xs transition hover:border-emerald-600"
            >
              {theme === "warm" ? "🌙 Dracula Dark" : "☀️ Warm Sandstone"}
            </button>
          </div>
        </div>

        {/* Sub-Bar: Primary Mode Tabs + 2-Second Plain-English Verdict */}
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-2 border-t border-[var(--pl-border)] px-4 py-2">
          <nav className="flex flex-wrap items-center gap-1.5" aria-label="Cockpit Views">
            {[
              { id: "sniper", label: "🎯 1. PriceLock Sniper & Split-Hold Cockpit" },
              { id: "studio", label: "📊 2. AG Studio 3.0 + Agent Framework" },
              { id: "race", label: "⚔️ 3. Side-by-Side /race + APIMatic SDK" },
              { id: "timeline", label: "⏱ 4. Bryntum Hold & Return Timeline" },
              { id: "verify", label: "🛡️ 5. Ed25519 Receipts & 120-Run Benchmark" },
            ].map((tab) => (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                type="button"
                onClick={() => setActiveTab(tab.id as ActiveTab)}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                  activeTab === tab.id
                    ? "bg-emerald-700 text-white shadow-xs"
                    : "hover:bg-black/5 dark:hover:bg-white/5"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2 text-xs">
            <span className="rounded bg-emerald-600/20 px-2 py-0.5 font-mono text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
              Ed25519 Verified ({receipts.length} Receipts)
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="mx-auto max-w-[1440px] px-4 py-4">
        {/* Global 2-Second Plain-English Status Strip */}
        <div
          id="what-happened-strip"
          className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-600/35 bg-emerald-600/[0.08] px-4 py-2.5 text-xs"
        >
          <div>
            <strong className="uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
              WHAT HAPPENED:{" "}
            </strong>
            <span className="font-medium">{statusBanner}</span>
          </div>
          <span className="font-mono text-[11px] text-[var(--pl-muted)]">
            PayPal Order: <code>{selectedDeal?.paypal.orderId}</code> • Mode:{" "}
            <code>{selectedDeal?.paypal.mode}</code>
          </span>
        </div>

        {/* TAB 1: SNIPER & SPLIT-HOLD COCKPIT */}
        {activeTab === "sniper" && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            {/* Left Column (5 cols): Live Search, Quick-Picks & Deal Feed */}
            <div className="flex flex-col gap-3 lg:col-span-5">
              <div className="rounded-xl border border-[var(--pl-border)] bg-[var(--pl-surface)] p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                    ⚡ Step 1: Drop Any Product, Cart, or Setup Item
                  </span>
                  <span className="font-mono text-[11px] text-[var(--pl-muted)]">
                    Channel3 100M+ SKU Graph
                  </span>
                </div>

                <div className="mt-2.5 flex gap-2">
                  <input
                    id="input-sniper-query"
                    type="text"
                    value={queryInput}
                    onChange={(e) => setQueryInput(e.target.value)}
                    placeholder="Paste product name, SKU, or wishlist item..."
                    className="flex-1 rounded-lg border border-[var(--pl-border)] bg-transparent px-3 py-2 text-xs font-medium outline-none focus:border-emerald-600"
                  />
                  <div className="flex items-center rounded-lg border border-[var(--pl-border)] px-2 text-xs">
                    <span className="text-[var(--pl-muted)]">Max $</span>
                    <input
                      type="number"
                      value={ceilingInput}
                      onChange={(e) => setCeilingInput(Number(e.target.value))}
                      className="w-16 bg-transparent px-1 font-mono font-bold outline-none"
                    />
                  </div>
                  <button
                    id="btn-lock-hold"
                    type="button"
                    disabled={busy}
                    onClick={() => handleLockPriceHold()}
                    className="rounded-lg bg-emerald-700 px-3.5 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-800 disabled:opacity-50"
                  >
                    {busy ? "Locking..." : "🔒 Lock PayPal Hold"}
                  </button>
                </div>

                {/* 1-Click Judge Presets */}
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {QUICK_PICKS.map((qp) => (
                    <button
                      key={qp.label}
                      type="button"
                      onClick={() => handleLockPriceHold(qp.query, qp.ceiling)}
                      className="rounded-md border border-[var(--pl-border)] bg-black/[0.02] px-2 py-1 text-[11px] font-semibold transition hover:border-emerald-600/50 dark:bg-white/[0.03]"
                    >
                      {qp.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Active Protected Deals List */}
              <div className="flex flex-col gap-2">
                {deals.map((d) => {
                  const active = d.id === selectedDeal?.id;
                  return (
                    <div
                      key={d.id}
                      onClick={() => setSelectedDealId(d.id)}
                      className={`cursor-pointer rounded-xl border p-3.5 transition ${
                        active
                          ? "border-2 border-emerald-600 bg-[var(--pl-surface)] shadow-sm"
                          : "border-[var(--pl-border)] bg-[var(--pl-surface)]/80 hover:border-emerald-600/40"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="rounded bg-black/10 px-1.5 py-0.5 font-mono text-[10px] font-bold dark:bg-white/10">
                              {d.category}
                            </span>
                            <span
                              className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                                d.status === "AUTHORIZED_HOLD"
                                  ? "bg-amber-500/20 text-amber-800 dark:text-amber-300"
                                  : d.status === "CAPTURED_AT_TARGET"
                                  ? "bg-emerald-600/20 text-emerald-800 dark:text-emerald-300"
                                  : d.status === "VOIDED_EXPIRED"
                                  ? "bg-zinc-500/20 text-zinc-500"
                                  : "bg-teal-600/20 text-teal-800 dark:text-teal-300"
                              }`}
                            >
                              {d.status}
                            </span>
                          </div>
                          <h3 className="mt-1 text-sm font-bold">{d.title}</h3>
                        </div>
                        <div className="text-right">
                          <div className="text-xs line-through opacity-60">
                            ${d.naiveCheckoutTotal.toFixed(2)}
                          </div>
                          <div className="text-base font-extrabold text-emerald-700 dark:text-emerald-400">
                            ${d.channel3VerifiedPrice.toFixed(2)}
                          </div>
                        </div>
                      </div>

                      <div className="mt-2 flex items-center justify-between border-t border-[var(--pl-border)] pt-2 text-[11px]">
                        <span className="text-red-700 dark:text-red-300">
                          ✂️ Stripped -${d.strippedDarkPatternUsd.toFixed(2)} ({d.darkPatternCategory})
                        </span>
                        <span className="font-bold text-emerald-700 dark:text-emerald-400">
                          Saved ${d.totalSavedUsd.toFixed(2)} via {d.bestRetailer}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column (7 cols): Kinetic Before/After Checkout Surgeon + PayPal Hold Controller */}
            {selectedDeal && (
              <div className="flex flex-col gap-4 lg:col-span-7">
                {/* Kinetic Before vs After Transformation Card */}
                <div className="rounded-xl border border-[var(--pl-border)] bg-[var(--pl-surface)] p-4 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--pl-border)] pb-3">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                        🔬 Step 2: Live Checkout Dark-Pattern Surgery & Channel3 Price Floor
                      </span>
                      <h2 className="mt-0.5 text-lg font-extrabold">{selectedDeal.title}</h2>
                    </div>
                    <span className="rounded-lg bg-emerald-600/15 px-3 py-1 text-sm font-extrabold text-emerald-800 dark:text-emerald-300">
                      Net Buyer Relief: -${selectedDeal.totalSavedUsd.toFixed(2)}
                    </span>
                  </div>

                  {/* Side-by-Side Store Comparison */}
                  <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="rounded-xl border border-red-600/35 bg-red-600/[0.04] p-3.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-red-700 dark:text-red-300">
                          ✕ First Ad-Store ({selectedDeal.naiveStoreName})
                        </span>
                        <span className="text-base font-extrabold text-red-700 dark:text-red-400">
                          ${selectedDeal.naiveCheckoutTotal.toFixed(2)}
                        </span>
                      </div>
                      <p className="mt-2 text-[11px] text-[var(--pl-muted)]">
                        What a standard AI shopping agent or hurried shopper gets charged at checkout:
                      </p>
                      <div className="mt-2 rounded bg-black/85 p-2 font-mono text-[11px] text-red-300">
                        Trap Caught: {selectedDeal.darkPatternQuote}
                      </div>
                      <div className="mt-2 flex justify-between font-semibold text-red-700 dark:text-red-300">
                        <span>Hidden Dark-Pattern Markup:</span>
                        <span>+${selectedDeal.strippedDarkPatternUsd.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="rounded-xl border-2 border-emerald-600/50 bg-emerald-600/[0.06] p-3.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-emerald-800 dark:text-emerald-300">
                          ✓ Channel3 Verified Floor ({selectedDeal.bestRetailer})
                        </span>
                        <span className="text-base font-extrabold text-emerald-700 dark:text-emerald-400">
                          ${selectedDeal.channel3VerifiedPrice.toFixed(2)}
                        </span>
                      </div>
                      <p className="mt-2 text-[11px] text-[var(--pl-muted)]">
                        PriceLock strips the ${selectedDeal.strippedDarkPatternUsd.toFixed(2)} dark-pattern add-on and matches the exact SKU across Channel3&apos;s 25,000+ retailers:
                      </p>
                      <div className="mt-2 space-y-1">
                        {selectedDeal.offers.map((off) => (
                          <div
                            key={off.channel3ProductId}
                            className="flex items-center justify-between rounded bg-black/5 px-2 py-1 font-mono text-[11px] dark:bg-white/5"
                          >
                            <span className="truncate">{off.retailer}</span>
                            <strong>${off.verifiedLandedPrice.toFixed(2)}</strong>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Step 3: PayPal Orders v2 Authorization Hold & Multiparty Split Controller */}
                  <div className="mt-4 rounded-xl border-2 border-dashed border-emerald-600/40 bg-emerald-600/[0.04] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                          🏦 Step 3: PayPal Orders v2 Authorization Hold • {selectedDeal.paypal.orderId}
                        </span>
                        <div className="mt-0.5 text-xs text-[var(--pl-muted)]">
                          Auth ID: <code>{selectedDeal.paypal.authorizationId}</code> • Custom ID Receipt Fingerprint:{" "}
                          <code>{selectedDeal.paypal.customIdFingerprint}</code>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          id="btn-capture-hold"
                          type="button"
                          disabled={busy}
                          onClick={() => handleDealDecision(selectedDeal.id, "CAPTURE")}
                          className="rounded-lg bg-emerald-700 px-3.5 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-800 disabled:opacity-50"
                        >
                          ✓ Capture Hold at ${selectedDeal.channel3VerifiedPrice.toFixed(2)}
                        </button>
                        <button
                          id="btn-refund-drop"
                          type="button"
                          disabled={busy}
                          onClick={() => handleDealDecision(selectedDeal.id, "REFUND_DROP")}
                          className="rounded-lg border border-emerald-600/40 bg-emerald-600/10 px-3 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-600/20 dark:text-emerald-300"
                        >
                          💸 Claim Post-Purchase Drop Refund
                        </button>
                        <button
                          id="btn-void-hold"
                          type="button"
                          disabled={busy}
                          onClick={() => handleDealDecision(selectedDeal.id, "VOID")}
                          className="rounded-lg border border-[var(--pl-border)] px-3 py-2 text-xs font-bold hover:bg-black/5 dark:hover:bg-white/5"
                        >
                          ✕ Void Hold ($0.00)
                        </button>
                      </div>
                    </div>

                    {selectedDeal.splitCrew && (
                      <div className="mt-3 border-t border-[var(--pl-border)] pt-3">
                        <div className="text-xs font-bold">
                          👥 Multiparty Group Split-Hold Active (4 Friends Locked ${selectedDeal.splitCrew[0].shareAmount.toFixed(2)} Each — Zero Fronting):
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                          {selectedDeal.splitCrew.map((member) => (
                            <div
                              key={member.handle}
                              className="rounded-lg border border-[var(--pl-border)] bg-[var(--pl-surface)] p-2"
                            >
                              <div className="font-bold">{member.name}</div>
                              <div className="font-mono text-[10px] text-[var(--pl-muted)]">{member.handle}</div>
                              <div className="mt-1 font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400">
                                ${member.shareAmount.toFixed(2)} • {member.status}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Live Cryptographic Receipt Seal Preview */}
                <div className="rounded-xl border border-[var(--pl-border)] bg-[#14121A] p-3.5 font-mono text-xs text-emerald-200 shadow-sm">
                  <div className="flex items-center justify-between text-[11px] text-emerald-400">
                    <span>[ED25519 + SHA-256 SEALED PAYPAL RECEIPT #{selectedDeal.receipt.sequence}]</span>
                    <button
                      type="button"
                      onClick={() => setActiveTab("verify")}
                      className="underline hover:text-white"
                    >
                      Open Tamper Verifier →
                    </button>
                  </div>
                  <div className="mt-1.5 grid grid-cols-1 gap-1 text-[11px] sm:grid-cols-2">
                    <div className="truncate">
                      Receipt ID: <code>{selectedDeal.receipt.receiptId}</code> ({selectedDeal.receipt.action})
                    </div>
                    <div className="truncate">
                      PayPal Order: <code>{selectedDeal.paypal.orderId}</code>
                    </div>
                    <div className="truncate">
                      SHA-256 Hash: <code>{selectedDeal.receipt.payloadHash}</code>
                    </div>
                    <div className="truncate">
                      Ed25519 Sig: <code>{selectedDeal.receipt.signatureEd25519.slice(0, 44)}...</code>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: AG STUDIO 3.0 + AGENT FRAMEWORK */}
        {activeTab === "studio" && (
          <PriceLockStudio
            deals={deals}
            isDark={theme === "dark"}
            onDecision={handleDealDecision}
          />
        )}

        {/* TAB 3: SIDE-BY-SIDE /RACE + APIMATIC SDK COMPILER */}
        {activeTab === "race" && (
          <RaceView initialRace={initialRace} initialApimatic={initialApimatic} />
        )}

        {/* TAB 4: BRYNTUM HOLD & RETURN TIMELINE */}
        {activeTab === "timeline" && (
          <HoldTimeline deals={deals} onDecision={handleDealDecision} />
        )}

        {/* TAB 5: ED25519 RECEIPT VERIFIER & 120-RUN BENCHMARK */}
        {activeTab === "verify" && (
          <div className="flex flex-col gap-6">
            <ReceiptVerifier initialReceipts={receipts} publicKeyHex={publicKeyHex} />
            <BenchmarkView />
          </div>
        )}
      </main>
    </div>
  );
}
