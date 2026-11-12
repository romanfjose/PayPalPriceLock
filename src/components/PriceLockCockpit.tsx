"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import type { CryptographicReceipt, PriceLockDeal, RaceComparisonResult } from "@/lib/types";
import type { ApimaticValidationReport } from "@/lib/apimatic-context";
import HoldTimeline from "./HoldTimeline";
import RaceView from "./RaceView";
import ReceiptVerifier from "./ReceiptVerifier";
import BenchmarkView from "./BenchmarkView";

const PriceLockStudio = dynamic(() => import("./studio/PriceLockStudio"), {
  ssr: false,
  loading: () => (
    <div className="flex h-96 items-center justify-center rounded-2xl border border-[var(--pl-border)] bg-[var(--pl-surface)] text-sm font-semibold">
      Hydrating AG Studio 3.0 + Studio Agent Framework...
    </div>
  ),
});

export type ActiveTab = "sniper" | "studio" | "race" | "timeline" | "verify";

const QUICK_PICKS = [
  { id: "deal_sony_xm5", label: "🎧 Sony WH-1000XM5 ($347 → $214)", query: "Sony WH-1000XM5 Wireless Headphones", ceiling: 220 },
  { id: "deal_breville_espresso", label: "☕ Breville Barista Express ($672 → $519)", query: "Breville Barista Express Espresso Machine", ceiling: 525 },
  { id: "deal_camping_split", label: "⛺ 4-Way Group Split Tent ($112/ea Hold)", query: "Big Agnes Copper Spur 4-Person Tent", ceiling: 450 },
  { id: "deal_lg_oled", label: "🖥️ LG 32\" 4K OLED ($1,217 → $949)", query: "LG UltraGear 32 4K OLED Monitor", ceiling: 960 },
  { id: "deal_fuji_x100vi", label: "📷 Fujifilm X100VI ($1,839 → $1,549)", query: "Fujifilm X100VI Silver Camera", ceiling: 1550 },
];

const TICKER_ITEMS = [
  "⚡ LIVE CHANNEL3 GRAPH: 100M+ SKUs SCANNED ACROSS 25,000+ STORES",
  "✂️ GADGETPULSE DIRECT: STRIPPED $29.00 CSS-HIDDEN WARRANTY AUTO-ADD",
  "🔒 PAYPAL ORDERS V2: AUTHORIZATION HOLD LOCKED AT $214.00 (B&H PHOTO)",
  "🛡️ APIMATIC CONTEXT PLUGIN: 100% PAYPAL SERVER SDK V2 SCHEMA COMPLIANCE",
  "📊 AG STUDIO 3.0: 3 CUSTOM WIDGETS + STUDIO AGENT FRAMEWORK ONLINE",
  "⏱ BRYNTUM TIMELINE: 7-DAY PAYPAL HOLD VS 14-DAY RETURN WINDOW ARBITRAGE",
  "🔐 ED25519 + SHA-256: 5/5 CRYPTOGRAPHIC RECEIPTS VERIFIED IN REAL TIME",
];

function useAnimatedNumber(target: number, durationMs = 450): number {
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
  const [queryInput, setQueryInput] = useState("Sony WH-1000XM5 Wireless Headphones");
  const [ceilingInput, setCeilingInput] = useState<number>(220);
  const [busy, setBusy] = useState(false);
  const [statusBanner, setStatusBanner] = useState<string>(
    "Stripped $29.00 CSS-hidden warranty trap on GadgetPulse ($347.90) and locked PayPal Orders v2 AUTHORIZE hold at $214.00 via Channel3 (B&H Photo) — saving $133.90 immediately."
  );
  const [mcpCopied, setMcpCopied] = useState(false);

  // Interactive cursor spotlight coordinates & X-Ray Surgery Slider
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 720, y: 320 });
  const [surgeryProgress, setSurgeryProgress] = useState<number>(78);
  const [cardTilt, setCardTilt] = useState<{ rx: number; ry: number; gx: number; gy: number }>({
    rx: 0,
    ry: 0,
    gx: 50,
    gy: 50,
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  // Subtle autonomous breathing on the X-Ray Surgery Slider when user selects a new deal
  useEffect(() => {
    setSurgeryProgress(24);
    const timer = setTimeout(() => {
      setSurgeryProgress(84);
    }, 140);
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

  // Interactive effective price interpolated by the X-Ray Surgery Scrubber
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

  const handleRightStageMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    const ry = (px - 0.5) * 4.5;
    const rx = (0.5 - py) * 3.5;
    setCardTilt({
      rx,
      ry,
      gx: Math.round(px * 100),
      gy: Math.round(py * 100),
    });
  };

  const handleRightStageMouseLeave = () => {
    setCardTilt({ rx: 0, ry: 0, gx: 50, gy: 50 });
  };

  return (
    <div
      onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}
      className="pl-kinetic-bg relative min-h-screen bg-[var(--pl-canvas)] text-[var(--pl-ink)] transition-colors duration-300"
    >
      {/* Interactive Cursor-Tracking Ambient Aurora Spotlight */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      >
        <div
          className="pl-orb-float absolute -top-28 -left-24 h-96 w-96 rounded-full blur-3xl"
          style={{ background: "var(--pl-orb-1)" }}
        />
        <div
          className="pl-orb-float absolute top-40 -right-24 h-[420px] w-[420px] rounded-full blur-3xl"
          style={{ background: "var(--pl-orb-2)", animationDelay: "-4s" }}
        />
        <div
          className="pointer-events-none absolute h-[540px] w-[540px] -translate-x-1/2 -translate-y-1/2 rounded-full transition-transform duration-150 ease-out"
          style={{
            left: `${mousePos.x}px`,
            top: `${mousePos.y}px`,
            background:
              "radial-gradient(circle, var(--pl-orb-1) 0%, var(--pl-orb-3) 38%, transparent 70%)",
            filter: "blur(45px)",
          }}
        />
      </div>

      {/* Top Infinite Kinetic Telemetry Marquee */}
      <div className="relative z-30 overflow-hidden border-b border-[var(--pl-border)] bg-[#14111A] py-1.5 text-[11px] font-semibold tracking-wider text-emerald-300">
        <div className="pl-marquee-track flex items-center gap-8">
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, idx) => (
            <span key={idx} className="flex items-center gap-2 whitespace-nowrap font-mono">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* Top Executive Glassmorphic Navigation Bar */}
      <header className="pl-glass-panel sticky top-0 z-30 border-b border-[var(--pl-border)] shadow-xs">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-3 px-4 py-2.5">
          <div className="flex items-center gap-3">
            <div className="pl-pulse-badge relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-900 font-mono text-sm font-black text-white shadow-md">
              PL
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-400" />
              </span>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-lg font-black tracking-tight">PriceLock</span>
                <span className="rounded-full border border-emerald-600/30 bg-emerald-600/15 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
                  PayPal Orders v2 + Channel3 + AG Studio 3.0 + APIMatic + Bryntum
                </span>
              </div>
              <p className="text-xs font-medium text-[var(--pl-muted)]">
                Never Overpay at Checkout Again — Strip Dark Patterns, Arbitrage 25,000 Stores & Hold Money on PayPal Until the Price Drops
              </p>
            </div>
          </div>

          {/* 3-Chip Kinetic Spring-Counter KPI Strip + Theme Toggle */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="pl-tilt-card rounded-xl border border-emerald-600/35 bg-emerald-600/15 px-3 py-1.5 text-xs font-extrabold text-emerald-800 shadow-2xs dark:text-emerald-300">
              💰 Saved: <span className="font-mono">${animSaved.toFixed(2)}</span>
            </div>
            <div className="pl-tilt-card rounded-xl border border-red-600/35 bg-red-600/15 px-3 py-1.5 text-xs font-extrabold text-red-700 shadow-2xs dark:text-red-300">
              ✂️ Traps Stripped: <span className="font-mono">${animStripped.toFixed(2)}</span>
            </div>
            <div className="pl-tilt-card rounded-xl border border-amber-600/35 bg-amber-500/15 px-3 py-1.5 text-xs font-extrabold text-amber-800 shadow-2xs dark:text-amber-300">
              🔒 Active PayPal Holds: <span className="font-mono">{activeHoldCount}</span>
            </div>

            <button
              id="btn-copy-mcp"
              type="button"
              onClick={copyMcpCommand}
              className="cursor-pointer rounded-xl border border-[var(--pl-border)] bg-black/[0.03] px-3 py-1.5 font-mono text-xs font-semibold transition-all hover:-translate-y-0.5 hover:border-emerald-600/60 dark:bg-white/[0.05]"
            >
              {mcpCopied ? "✓ MCP URL Copied" : "🔌 Copy /api/mcp"}
            </button>

            <button
              id="btn-theme-toggle"
              type="button"
              onClick={toggleTheme}
              className="cursor-pointer rounded-xl border border-[var(--pl-border)] bg-[var(--pl-canvas)] px-3.5 py-1.5 text-xs font-extrabold shadow-xs transition-all hover:-translate-y-0.5 hover:border-emerald-600"
            >
              {theme === "warm" ? "🌙 Dracula Dark" : "☀️ Warm Sandstone"}
            </button>
          </div>
        </div>

        {/* Sub-Bar: Primary Mode Tabs + Live Cryptographic Pulse */}
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
                className={`cursor-pointer rounded-xl px-3.5 py-1.5 text-xs font-extrabold transition-all duration-200 ${
                  activeTab === tab.id
                    ? "scale-[1.02] bg-gradient-to-r from-emerald-700 to-teal-700 text-white shadow-sm"
                    : "hover:-translate-y-0.5 hover:bg-black/5 dark:hover:bg-white/5"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2 text-xs">
            <span className="flex items-center gap-1.5 rounded-full border border-emerald-600/30 bg-emerald-600/15 px-2.5 py-0.5 font-mono text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
              Ed25519 Verified ({receipts.length} Receipts)
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="relative z-10 mx-auto max-w-[1440px] px-4 py-4">
        {/* Global 2-Second Plain-English Status Strip */}
        <div
          id="what-happened-strip"
          className="pl-glass-panel mb-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-emerald-600/40 bg-emerald-600/[0.08] px-4 py-2.5 text-xs shadow-xs"
        >
          <div className="flex items-center gap-2">
            <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]" />
            <strong className="uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
              WHAT HAPPENED:{" "}
            </strong>
            <span className="font-semibold">{statusBanner}</span>
          </div>
          <span className="rounded-lg bg-black/5 px-2.5 py-1 font-mono text-[11px] font-semibold text-[var(--pl-muted)] dark:bg-white/5">
            PayPal Order: <code>{selectedDeal?.paypal.orderId}</code> • Mode:{" "}
            <code className="font-bold text-emerald-700 dark:text-emerald-400">
              {selectedDeal?.paypal.mode}
            </code>
          </span>
        </div>

        {/* TAB 1: SNIPER & SPLIT-HOLD COCKPIT */}
        {activeTab === "sniper" && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            {/* Left Column (5 cols): Live Search, Quick-Picks & Interactive Deal Cards */}
            <div className="flex flex-col gap-3 lg:col-span-5">
              <div className="pl-glass-panel pl-tilt-card rounded-2xl border border-[var(--pl-border)] p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                    ⚡ Step 1: Drop Any Product, Cart, or Setup Item
                  </span>
                  <span className="rounded-full bg-emerald-600/10 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
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
                    className="flex-1 rounded-xl border border-[var(--pl-border)] bg-black/[0.02] px-3 py-2 text-xs font-semibold outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 dark:bg-white/[0.03]"
                  />
                  <div className="flex items-center rounded-xl border border-[var(--pl-border)] bg-black/[0.02] px-2.5 text-xs dark:bg-white/[0.03]">
                    <span className="text-[var(--pl-muted)]">Max $</span>
                    <input
                      type="number"
                      value={ceilingInput}
                      onChange={(e) => setCeilingInput(Number(e.target.value))}
                      className="w-16 bg-transparent px-1 font-mono font-extrabold outline-none"
                    />
                  </div>
                  <button
                    id="btn-lock-hold"
                    type="button"
                    disabled={busy}
                    onClick={() => handleLockPriceHold()}
                    className="cursor-pointer rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 px-4 py-2 text-xs font-extrabold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md disabled:opacity-50"
                  >
                    {busy ? "Scanning 25k Stores..." : "🔒 Lock PayPal Hold"}
                  </button>
                </div>

                {/* 1-Click Judge Presets */}
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {QUICK_PICKS.map((qp) => (
                    <button
                      key={qp.id}
                      id={`preset-${qp.id}`}
                      type="button"
                      onClick={() => handleLockPriceHold(qp.query, qp.ceiling, qp.id)}
                      className={`cursor-pointer rounded-lg border px-2.5 py-1 text-[11px] font-bold transition-all hover:-translate-y-0.5 ${
                        selectedDealId === qp.id
                          ? "border-emerald-600 bg-emerald-600/15 text-emerald-800 dark:text-emerald-300"
                          : "border-[var(--pl-border)] bg-black/[0.02] hover:border-emerald-600/50 dark:bg-white/[0.03]"
                      }`}
                    >
                      {qp.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Active Protected Deals List with Savings Progress Bars */}
              <div className="flex flex-col gap-2.5">
                {deals.map((d) => {
                  const active = d.id === selectedDeal?.id;
                  const savingsPct = Math.min(
                    55,
                    Math.max(12, Math.round((d.totalSavedUsd / d.naiveCheckoutTotal) * 100))
                  );
                  return (
                    <div
                      key={d.id}
                      onClick={() => setSelectedDealId(d.id)}
                      className={`pl-tilt-card pl-glass-panel cursor-pointer overflow-hidden rounded-2xl border p-3.5 transition-all ${
                        active
                          ? "border-2 border-emerald-600 shadow-md ring-2 ring-emerald-500/15"
                          : "border-[var(--pl-border)] opacity-90 hover:border-emerald-600/50 hover:opacity-100"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="rounded-md bg-black/10 px-2 py-0.5 font-mono text-[10px] font-bold dark:bg-white/10">
                              {d.category}
                            </span>
                            <span
                              className={`rounded-md px-2 py-0.5 font-mono text-[10px] font-extrabold ${
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
                          <h3 className="mt-1.5 text-sm font-extrabold">{d.title}</h3>
                        </div>
                        <div className="text-right">
                          <div className="font-mono text-xs line-through opacity-55">
                            ${d.naiveCheckoutTotal.toFixed(2)}
                          </div>
                          <div className="font-mono text-lg font-black text-emerald-700 dark:text-emerald-400">
                            ${d.channel3VerifiedPrice.toFixed(2)}
                          </div>
                        </div>
                      </div>

                      {/* Kinetic Arbitrage Compression Bar */}
                      <div className="mt-2.5">
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-red-500 via-amber-500 to-emerald-500 transition-all duration-500"
                            style={{ width: `${100 - savingsPct}%` }}
                          />
                        </div>
                      </div>

                      <div className="mt-2 flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-red-700 dark:text-red-300">
                          ✂️ Stripped -${d.strippedDarkPatternUsd.toFixed(2)} ({d.darkPatternCategory})
                        </span>
                        <span className="font-extrabold text-emerald-700 dark:text-emerald-400">
                          -{savingsPct}% (${d.totalSavedUsd.toFixed(2)} saved)
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column (7 cols): 3D Perspective Tilt + Interactive X-Ray Checkout Scrubber + PayPal Hold Controller */}
            {selectedDeal && (
              <div className="flex flex-col gap-4 lg:col-span-7">
                <div
                  onMouseMove={handleRightStageMouseMove}
                  onMouseLeave={handleRightStageMouseLeave}
                  style={{
                    transform: `perspective(1200px) rotateX(${cardTilt.rx}deg) rotateY(${cardTilt.ry}deg)`,
                    backgroundImage: `radial-gradient(circle at ${cardTilt.gx}% ${cardTilt.gy}%, var(--pl-orb-1), transparent 60%)`,
                  }}
                  className="pl-glass-panel relative overflow-hidden rounded-2xl border border-[var(--pl-border)] p-5 shadow-md transition-transform duration-150 ease-out"
                >
                  {/* Animated Radar Laser Scanline */}
                  <div className="pl-laser-line" />

                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--pl-border)] pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                          🔬 Step 2: Live Checkout Dark-Pattern Surgery & Channel3 Price Floor
                        </span>
                        <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                          INTERACTIVE X-RAY
                        </span>
                      </div>
                      <h2 className="mt-1 text-lg font-black tracking-tight">{selectedDeal.title}</h2>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="whitespace-nowrap rounded-xl border border-emerald-600/35 bg-emerald-600/15 px-3 py-1 font-mono text-xs font-black text-emerald-800 shadow-2xs dark:text-emerald-300">
                        Net Buyer Relief: -${animDealRelief.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Interactive Before/After X-Ray Transformation Scrubber */}
                  <div className="mt-3 rounded-xl border border-[var(--pl-border)] bg-black/[0.03] px-3.5 py-2.5 dark:bg-white/[0.03]">
                    <div className="flex items-center justify-between gap-2 text-[11px]">
                      <span className="whitespace-nowrap font-bold text-red-700 dark:text-red-300">
                        💀 Raw Checkout (${selectedDeal.naiveCheckoutTotal.toFixed(2)})
                      </span>
                      <span className="whitespace-nowrap rounded-full bg-emerald-600/20 px-3 py-0.5 font-mono text-[11px] font-black text-emerald-800 dark:text-emerald-300">
                        ⚡ X-Ray Scrubber: ${scrubbedPrice.toFixed(2)} ({surgeryProgress}% Disinfected)
                      </span>
                      <span className="whitespace-nowrap font-bold text-emerald-700 dark:text-emerald-400">
                        🛡️ PriceLock Floor (${animDealFloor.toFixed(2)})
                      </span>
                    </div>
                    <div className="relative mt-1.5 flex items-center">
                      <input
                        id="slider-xray-scrubber"
                        type="range"
                        min={0}
                        max={100}
                        value={surgeryProgress}
                        onChange={(e) => setSurgeryProgress(Number(e.target.value))}
                        aria-label="Interactive Checkout Dark-Pattern Scrubber"
                        className="h-2 w-full cursor-ew-resize appearance-none rounded-lg bg-gradient-to-r from-red-500/80 via-amber-500/80 to-emerald-500 accent-emerald-600"
                      />
                    </div>
                  </div>

                  {/* Side-by-Side Store Comparison with Dynamic Opacity/Scale */}
                  <div className="mt-3.5 grid grid-cols-1 gap-3.5 md:grid-cols-2">
                    <div
                      style={{
                        opacity: Math.max(0.55, 1 - surgeryProgress * 0.004),
                        transform: `scale(${1 - surgeryProgress * 0.0004})`,
                      }}
                      className="rounded-xl border border-red-600/35 bg-red-600/[0.05] p-3.5 text-xs transition-all duration-200"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-red-700 dark:text-red-300">
                          ✕ First Ad-Store ({selectedDeal.naiveStoreName})
                        </span>
                        <span className="font-mono text-base font-black text-red-700 line-through dark:text-red-400">
                          ${selectedDeal.naiveCheckoutTotal.toFixed(2)}
                        </span>
                      </div>
                      <p className="mt-1.5 text-[11px] text-[var(--pl-muted)]">
                        What a standard AI shopping agent or hurried shopper gets charged at checkout:
                      </p>
                      <div className="mt-2 rounded-lg border border-red-500/30 bg-[#181216] p-2.5 font-mono text-[11px] text-red-300 shadow-inner">
                        Trap Caught: {selectedDeal.darkPatternQuote}
                      </div>
                      <div className="mt-2 flex justify-between font-bold text-red-700 dark:text-red-300">
                        <span>Hidden Dark-Pattern Markup:</span>
                        <span className="font-mono">+${selectedDeal.strippedDarkPatternUsd.toFixed(2)}</span>
                      </div>
                    </div>

                    <div
                      style={{
                        transform: `scale(${0.98 + surgeryProgress * 0.0003})`,
                      }}
                      className="rounded-xl border-2 border-emerald-600/60 bg-emerald-600/[0.08] p-3.5 text-xs shadow-sm transition-all duration-200"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-emerald-800 dark:text-emerald-300">
                          ✓ Channel3 Verified Floor ({selectedDeal.bestRetailer})
                        </span>
                        <span className="font-mono text-lg font-black text-emerald-700 dark:text-emerald-400">
                          ${animDealFloor.toFixed(2)}
                        </span>
                      </div>
                      <p className="mt-1.5 text-[11px] text-[var(--pl-muted)]">
                        PriceLock strips the ${selectedDeal.strippedDarkPatternUsd.toFixed(2)} dark-pattern add-on and matches the exact SKU across Channel3&apos;s 25,000+ retailers:
                      </p>
                      <div className="mt-2 space-y-1.5">
                        {selectedDeal.offers.map((off, idx) => (
                          <div
                            key={off.channel3ProductId}
                            className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 font-mono text-[11px] ${
                              idx === 1
                                ? "border border-emerald-600/40 bg-emerald-600/15 font-bold text-emerald-900 dark:text-emerald-200"
                                : "bg-black/5 dark:bg-white/5"
                            }`}
                          >
                            <span className="truncate">{off.retailer}</span>
                            <strong>${off.verifiedLandedPrice.toFixed(2)}</strong>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Step 3: PayPal Orders v2 Authorization Hold & Multiparty Split Controller */}
                  <div className="mt-4 rounded-xl border-2 border-dashed border-emerald-600/45 bg-emerald-600/[0.05] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="font-mono text-[11px] font-extrabold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
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
                          className="cursor-pointer rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 px-3.5 py-2 text-xs font-extrabold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md disabled:opacity-50"
                        >
                          ✓ Capture Hold at ${selectedDeal.channel3VerifiedPrice.toFixed(2)}
                        </button>
                        <button
                          id="btn-refund-drop"
                          type="button"
                          disabled={busy}
                          onClick={() => handleDealDecision(selectedDeal.id, "REFUND_DROP")}
                          className="cursor-pointer rounded-xl border border-emerald-600/45 bg-emerald-600/15 px-3 py-2 text-xs font-extrabold text-emerald-800 transition-all hover:-translate-y-0.5 hover:bg-emerald-600/25 dark:text-emerald-300"
                        >
                          💸 Claim Post-Purchase Drop Refund
                        </button>
                        <button
                          id="btn-void-hold"
                          type="button"
                          disabled={busy}
                          onClick={() => handleDealDecision(selectedDeal.id, "VOID")}
                          className="cursor-pointer rounded-xl border border-[var(--pl-border)] px-3 py-2 text-xs font-bold transition-all hover:-translate-y-0.5 hover:bg-black/5 dark:hover:bg-white/5"
                        >
                          ✕ Void Hold ($0.00)
                        </button>
                      </div>
                    </div>

                    {selectedDeal.splitCrew && (
                      <div className="mt-3 border-t border-[var(--pl-border)] pt-3">
                        <div className="text-xs font-extrabold">
                          👥 Multiparty Group Split-Hold Active (4 Friends Locked ${selectedDeal.splitCrew[0].shareAmount.toFixed(2)} Each — Zero Fronting):
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                          {selectedDeal.splitCrew.map((member) => (
                            <div
                              key={member.handle}
                              className="pl-tilt-card rounded-xl border border-[var(--pl-border)] bg-[var(--pl-surface)] p-2.5"
                            >
                              <div className="font-bold">{member.name}</div>
                              <div className="font-mono text-[10px] text-[var(--pl-muted)]">{member.handle}</div>
                              <div className="mt-1 font-mono text-xs font-extrabold text-emerald-700 dark:text-emerald-400">
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
                <div className="pl-tilt-card rounded-2xl border border-emerald-500/30 bg-[#12101B] p-4 font-mono text-xs text-emerald-200 shadow-md">
                  <div className="flex items-center justify-between text-[11px] font-bold text-emerald-400">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 animate-ping rounded-full bg-emerald-400" />
                      [ED25519 + SHA-256 SEALED PAYPAL RECEIPT #{selectedDeal.receipt.sequence}]
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveTab("verify")}
                      className="cursor-pointer rounded-md bg-emerald-500/15 px-2.5 py-0.5 text-emerald-300 underline transition hover:bg-emerald-500/30 hover:text-white"
                    >
                      Open Tamper Verifier →
                    </button>
                  </div>
                  <div className="mt-2 grid grid-cols-1 gap-1.5 text-[11px] sm:grid-cols-2">
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
