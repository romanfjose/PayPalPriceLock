"use client";

import { useState } from "react";
import type { RaceComparisonResult } from "@/lib/types";
import type { ApimaticValidationReport } from "@/lib/apimatic-context";

const PRESET_QUERIES = [
  "Sony WH-1000XM5 Wireless Headphones",
  "Breville Barista Express Espresso Machine",
  "Big Agnes Copper Spur 4-Person Tent",
  "LG UltraGear 32 4K OLED Monitor",
  "Fujifilm X100VI Digital Camera",
];

export default function RaceView({
  initialRace,
  initialApimatic,
}: {
  initialRace: RaceComparisonResult;
  initialApimatic: ApimaticValidationReport;
}) {
  const [race, setRace] = useState<RaceComparisonResult>(initialRace);
  const [apimatic, setApimatic] = useState<ApimaticValidationReport>(initialApimatic);
  const [query, setQuery] = useState(initialRace.skuTitle);
  const [running, setRunning] = useState(false);

  const executeRace = async (q: string) => {
    setRunning(true);
    setQuery(q);
    try {
      const res = await fetch("/api/race", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      });
      const data = (await res.json()) as {
        ok: boolean;
        race?: RaceComparisonResult;
        apimatic?: ApimaticValidationReport;
      };
      if (data.race) setRace(data.race);
      if (data.apimatic) setApimatic(data.apimatic);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Executive Race Summary */}
      <div className="pl-card-elevated rounded-2xl p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--pl-accent-soft)] px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Head-to-Head Checkout Execution Race
            </span>
            <h2 className="mt-2 text-xl font-extrabold tracking-tight">
              Same Prompt. Two Shopping Agents. ${race.priceLockAgent.netSavingsUsd.toFixed(2)} Spread.
            </h2>
            <p className="mt-1.5 text-xs leading-relaxed text-[var(--pl-muted)]">
              On <strong>{race.skuTitle}</strong>, an unprotected LLM shopping agent accepts the first sponsored cart (
              <strong className="font-mono text-red-600 dark:text-red-400">
                ${race.naiveAgent.totalChargedUsd.toFixed(2)}
              </strong>
              ), triggers a hidden +${race.naiveAgent.trickedAddonsUsd.toFixed(2)} warranty injection, and fails PayPal Orders v2 schema validation (`HTTP 422`). PriceLock strips the trap, checks 25,000+ Channel3 retailers, and compiles a strict{" "}
              <strong>APIMatic PayPal Server SDK v2</strong> hold at{" "}
              <strong className="font-mono text-emerald-700 dark:text-emerald-400">
                ${race.priceLockAgent.totalLockedUsd.toFixed(2)}
              </strong>
              .
            </p>
          </div>
          <button
            id="btn-run-race"
            type="button"
            disabled={running}
            onClick={() => executeRace(query)}
            className="cursor-pointer rounded-xl bg-[#0F172A] px-4 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-[#1E293B] disabled:opacity-50 dark:bg-[#10B981] dark:text-[#06130E]"
          >
            {running ? "Running Live Race..." : "Re-Run Live Bot Race"}
          </button>
        </div>

        {/* Preset Race Selector */}
        <div className="mt-4 flex flex-wrap items-center gap-1.5 border-t border-[var(--pl-border)] pt-3.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--pl-muted)]">
            Test Any SKU:
          </span>
          {PRESET_QUERIES.map((preset) => (
            <button
              key={preset}
              type="button"
              disabled={running}
              onClick={() => executeRace(preset)}
              className={`cursor-pointer rounded-lg border px-3 py-1 text-xs font-semibold transition ${
                query === preset
                  ? "border-[#0070E0] bg-[var(--pl-paypal-soft)] text-[var(--pl-paypal)]"
                  : "border-[var(--pl-border)] bg-[var(--pl-surface-muted)] text-[var(--pl-ink-secondary)] hover:border-[var(--pl-border-strong)]"
              }`}
            >
              {preset}
            </button>
          ))}
        </div>
      </div>

      {/* Left vs Right Race Arena */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* LEFT PANE: NAIVE AGENT */}
        <div className="pl-card rounded-2xl border-red-500/30 p-5">
          <div className="flex items-center justify-between border-b border-[var(--pl-border)] pb-3.5">
            <div>
              <span className="rounded-md bg-[var(--pl-danger-soft)] px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase text-red-700 dark:text-red-300">
                UNPROTECTED SHOPPING BOT
              </span>
              <h3 className="mt-1.5 text-base font-extrabold">{race.naiveAgent.retailerChosen}</h3>
            </div>
            <div className="text-right">
              <div className="text-[11px] font-medium text-[var(--pl-muted)]">Charged Immediately</div>
              <div className="font-mono text-2xl font-extrabold text-red-600 dark:text-red-400">
                ${race.naiveAgent.totalChargedUsd.toFixed(2)}
              </div>
            </div>
          </div>

          <div className="mt-4 space-y-2 text-xs">
            <div className="flex justify-between rounded-xl border border-[var(--pl-border)] bg-[var(--pl-surface-muted)] px-3.5 py-2.5">
              <span>Sponsored Store Listed Price</span>
              <strong className="font-mono">${race.naiveAgent.basePriceUsd.toFixed(2)}</strong>
            </div>
            <div className="flex justify-between rounded-xl border border-red-500/20 bg-[var(--pl-danger-soft)] px-3.5 py-2.5 text-red-800 dark:text-red-300">
              <span>Auto-Checked Dark-Pattern Warranty</span>
              <strong className="font-mono">+${race.naiveAgent.trickedAddonsUsd.toFixed(2)}</strong>
            </div>
            <div className="flex justify-between rounded-xl border border-[var(--pl-border)] bg-[var(--pl-surface-muted)] px-3.5 py-2.5">
              <span>Step-3 Checkout Drip Handling Fee</span>
              <strong className="font-mono">+${race.naiveAgent.dripFeesUsd.toFixed(2)}</strong>
            </div>

            <div className="rounded-xl bg-[#0F141C] p-3.5 font-mono text-[11px] leading-relaxed text-slate-300">
              <div className="font-bold text-red-400">[DOM PROMPT INJECTION FOLLOWED]</div>
              <div className="mt-0.5 text-slate-400">{race.naiveAgent.promptInjectionFollowed}</div>
              <div className="mt-2 font-bold text-amber-300">[CANARY HONEYPOT EXFILTRATION]</div>
              <div className="mt-0.5 break-all text-slate-400">
                Leaked <code>{race.naiveAgent.canaryTokenExfiltrated}</code> → {race.naiveAgent.sinkholeInterceptedUrl}
              </div>
              <div className="mt-2 font-bold text-red-400">[UNASSISTED LLM PAYPAL API CALL]</div>
              <div className="text-slate-300">HTTP 422 UNPROCESSABLE_ENTITY ({race.naiveAgent.sdkPayloadStatus})</div>
            </div>
          </div>
        </div>

        {/* RIGHT PANE: PRICELOCK PROTECTED ENGINE */}
        <div className="pl-card-elevated rounded-2xl border-emerald-500/40 p-5">
          <div className="flex items-center justify-between border-b border-[var(--pl-border)] pb-3.5">
            <div>
              <span className="rounded-md bg-[var(--pl-accent-soft)] px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase text-emerald-800 dark:text-emerald-300">
                PRICELOCK SURGEON • PROTECTED
              </span>
              <h3 className="mt-1.5 text-base font-extrabold">{race.priceLockAgent.retailerChosen}</h3>
            </div>
            <div className="text-right">
              <div className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                PayPal Hold (Saves ${race.priceLockAgent.netSavingsUsd.toFixed(2)})
              </div>
              <div className="font-mono text-2xl font-extrabold text-emerald-700 dark:text-emerald-400">
                ${race.priceLockAgent.totalLockedUsd.toFixed(2)}
              </div>
            </div>
          </div>

          <div className="mt-4 space-y-2 text-xs">
            <div className="flex justify-between rounded-xl border border-[var(--pl-border)] bg-[var(--pl-surface-muted)] px-3.5 py-2.5">
              <span>Channel3 Verified Floor ({race.priceLockAgent.channel3SearchCount} retailers checked)</span>
              <strong className="font-mono">${race.priceLockAgent.basePriceUsd.toFixed(2)}</strong>
            </div>
            <div className="flex justify-between rounded-xl border border-emerald-500/25 bg-[var(--pl-accent-soft)] px-3.5 py-2.5 text-emerald-900 dark:text-emerald-200">
              <span>Dark-Pattern Add-Ons &amp; Drip Fees Stripped</span>
              <strong className="font-mono">-${race.priceLockAgent.strippedAddonsUsd.toFixed(2)} ($0.00)</strong>
            </div>
            <div className="flex justify-between rounded-xl border border-[var(--pl-border)] bg-[var(--pl-surface-muted)] px-3.5 py-2.5">
              <span>Canary Credential &amp; Sinkhole Guard</span>
              <strong className="font-mono text-emerald-700 dark:text-emerald-400">
                {race.priceLockAgent.canaryStatus}
              </strong>
            </div>

            <div className="rounded-xl bg-[#0B1512] p-3.5 font-mono text-[11px] leading-relaxed text-emerald-100">
              <div className="font-bold text-emerald-400">
                [PAYPAL ORDERS V2 AUTHORIZE • APIMATIC SDK VALIDATED]
              </div>
              <div className="mt-0.5">
                Order: <code>{race.priceLockAgent.paypalOrderId}</code> • Auth:{" "}
                <code>{race.priceLockAgent.paypalAuthorizationId}</code>
              </div>
              <div className="mt-1.5 break-all text-emerald-200/80">
                SHA-256: <code>{race.priceLockAgent.receiptHash}</code>
              </div>
              <div className="mt-1 break-all text-emerald-300/70">
                Ed25519: <code>{race.priceLockAgent.signatureEd25519.slice(0, 58)}...</code>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* APIMatic Context Plugin Compiler Diff */}
      <div id="btn-toggle-apimatic" className="pl-card rounded-2xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="rounded-full bg-[var(--pl-paypal-soft)] px-3 py-1 font-mono text-[11px] font-bold text-[var(--pl-paypal)]">
              APIMatic Context Grounding • {apimatic.sdkVersion}
            </span>
            <h3 className="mt-1.5 text-sm font-extrabold">
              Deterministic PayPal Server SDK v2 Compiler ({apimatic.openapiPath})
            </h3>
          </div>
          <span className="rounded-lg bg-[var(--pl-accent-soft)] px-3 py-1 font-mono text-xs font-bold text-emerald-800 dark:text-emerald-300">
            {apimatic.naiveLlmHallucinationsCaught.length} Legacy v1 Hallucinations Blocked
          </span>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="space-y-2 text-xs">
            {apimatic.naiveLlmHallucinationsCaught.map((h) => (
              <div
                key={h.field}
                className="rounded-xl border border-[var(--pl-border)] bg-[var(--pl-surface-muted)] p-3"
              >
                <div className="flex items-center justify-between">
                  <code className="font-mono font-bold text-red-600 dark:text-red-400">{h.field}</code>
                  <span className="rounded bg-amber-500/20 px-2 py-0.5 font-mono text-[10px] font-bold">
                    {h.severity}
                  </span>
                </div>
                <div className="mt-1 text-[11px] text-[var(--pl-muted)]">
                  <strong>Naive LLM:</strong> {h.naiveHallucination}
                </div>
                <div className="mt-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                  <strong>APIMatic SDK v2:</strong> {h.apimaticCorrection}
                </div>
              </div>
            ))}
          </div>
          <pre className="overflow-x-auto rounded-xl bg-[#0F141C] p-4 font-mono text-[11px] leading-relaxed text-emerald-200">
            {apimatic.compiledSdkSnippet}
          </pre>
        </div>
      </div>
    </div>
  );
}
