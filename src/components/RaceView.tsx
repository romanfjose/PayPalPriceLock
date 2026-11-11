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
    <div className="flex flex-col gap-4">
      {/* 2-Second Plain-English Summary Strip */}
      <div className="rounded-xl border border-[var(--pl-border)] bg-[var(--pl-surface)] p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600/15 px-3 py-0.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
              ⚔️ Side-by-Side Live Execution Race (Unprotected Agent vs. PriceLock)
            </span>
            <p className="mt-1.5 text-sm font-medium">
              <strong>WHAT HAPPENED:</strong> On the exact same shopping prompt (<em>&ldquo;{race.skuTitle}&rdquo;</em>), the{" "}
              <strong className="text-red-700 dark:text-red-400">Naive Shopping Agent</strong> overpaid{" "}
              <strong>${race.naiveAgent.totalChargedUsd.toFixed(2)}</strong>, fell for a{" "}
              <strong>${race.naiveAgent.trickedAddonsUsd.toFixed(2)}</strong> hidden warranty injection, and leaked a Canary token—while{" "}
              <strong className="text-emerald-700 dark:text-emerald-400">PriceLock</strong> stripped the trap, routed via{" "}
              <strong>Channel3</strong>, and locked a verified PayPal Orders v2 hold at{" "}
              <strong>${race.priceLockAgent.totalLockedUsd.toFixed(2)}</strong> (saving{" "}
              <strong>${race.priceLockAgent.netSavingsUsd.toFixed(2)}</strong>).
            </p>
          </div>
        </div>

        {/* Preset Race Selector */}
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[var(--pl-border)] pt-3">
          <span className="text-xs font-bold text-[var(--pl-muted)]">Fire Live Side-by-Side Race:</span>
          {PRESET_QUERIES.map((preset) => (
            <button
              key={preset}
              type="button"
              disabled={running}
              onClick={() => executeRace(preset)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                query === preset
                  ? "bg-emerald-700 text-white"
                  : "border border-[var(--pl-border)] bg-black/[0.02] hover:border-emerald-600/50 dark:bg-white/[0.03]"
              }`}
            >
              {preset}
            </button>
          ))}
        </div>
      </div>

      {/* Left vs Right Race Arena */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* LEFT PANE: NAIVE AGENT */}
        <div className="rounded-xl border-2 border-red-600/40 bg-[var(--pl-surface)] p-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-[var(--pl-border)] pb-3">
            <div>
              <span className="rounded bg-red-600/15 px-2 py-0.5 text-xs font-bold text-red-700 dark:text-red-300">
                ✕ LEFT PANE: Unprotected AI Shopping Bot
              </span>
              <h3 className="mt-1 text-base font-bold">{race.naiveAgent.retailerChosen}</h3>
            </div>
            <div className="text-right">
              <div className="text-xs text-[var(--pl-muted)]">Charged Immediately</div>
              <div className="text-2xl font-extrabold text-red-700 dark:text-red-400">
                ${race.naiveAgent.totalChargedUsd.toFixed(2)}
              </div>
            </div>
          </div>

          <div className="mt-3 space-y-2.5 text-xs">
            <div className="flex justify-between rounded-lg bg-red-600/[0.06] px-3 py-2">
              <span>Inflated Ad-Store Base Price:</span>
              <strong>${race.naiveAgent.basePriceUsd.toFixed(2)}</strong>
            </div>
            <div className="flex justify-between rounded-lg bg-red-600/10 px-3 py-2 text-red-800 dark:text-red-300">
              <span>⚠️ Tricked Dark-Pattern Add-On:</span>
              <strong>+${race.naiveAgent.trickedAddonsUsd.toFixed(2)}</strong>
            </div>
            <div className="flex justify-between rounded-lg bg-red-600/[0.06] px-3 py-2">
              <span>Checkout Drip Handling Fee:</span>
              <strong>+${race.naiveAgent.dripFeesUsd.toFixed(2)}</strong>
            </div>

            <div className="rounded-lg border border-red-600/30 bg-black/90 p-3 font-mono text-[11px] text-red-300">
              <div className="font-bold text-red-400">[DOM PROMPT INJECTION OBEYED BY NAIVE BOT]</div>
              <div className="mt-1">{race.naiveAgent.promptInjectionFollowed}</div>
              <div className="mt-2 font-bold text-amber-300">[CANARY HONEYPOT SINKHOLE ALERT]</div>
              <div className="mt-0.5 break-all">
                Intercepted outbound exfil of <code>{race.naiveAgent.canaryTokenExfiltrated}</code> →{" "}
                {race.naiveAgent.sinkholeInterceptedUrl}
              </div>
              <div className="mt-2 font-bold text-red-400">[UNASSISTED LLM PAYPAL SDK CALL]</div>
              <div>HTTP 422 UNPROCESSABLE_ENTITY ({race.naiveAgent.sdkPayloadStatus})</div>
            </div>
          </div>
        </div>

        {/* RIGHT PANE: PRICELOCK PROTECTED ENGINE */}
        <div className="rounded-xl border-2 border-emerald-600/50 bg-[var(--pl-surface)] p-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-[var(--pl-border)] pb-3">
            <div>
              <span className="rounded bg-emerald-600/15 px-2 py-0.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                ✓ RIGHT PANE: PriceLock Protected Surgeon
              </span>
              <h3 className="mt-1 text-base font-bold">{race.priceLockAgent.retailerChosen}</h3>
            </div>
            <div className="text-right">
              <div className="text-xs text-emerald-700 dark:text-emerald-300">
                PayPal Hold Locked (Saves ${race.priceLockAgent.netSavingsUsd.toFixed(2)})
              </div>
              <div className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-400">
                ${race.priceLockAgent.totalLockedUsd.toFixed(2)}
              </div>
            </div>
          </div>

          <div className="mt-3 space-y-2.5 text-xs">
            <div className="flex justify-between rounded-lg bg-emerald-600/[0.08] px-3 py-2">
              <span>Channel3 Verified Lowest Landed Price ({race.priceLockAgent.channel3SearchCount} stores):</span>
              <strong>${race.priceLockAgent.basePriceUsd.toFixed(2)}</strong>
            </div>
            <div className="flex justify-between rounded-lg bg-emerald-600/15 px-3 py-2 text-emerald-900 dark:text-emerald-200">
              <span>✂️ Dark-Pattern Warranty & Drip Fees Stripped:</span>
              <strong>-${race.priceLockAgent.strippedAddonsUsd.toFixed(2)} ($0.00 charged)</strong>
            </div>
            <div className="flex justify-between rounded-lg bg-emerald-600/[0.08] px-3 py-2">
              <span>Canary Credential Guard & Sinkhole Status:</span>
              <strong className="text-emerald-700 dark:text-emerald-300">
                {race.priceLockAgent.canaryStatus}
              </strong>
            </div>

            <div className="rounded-lg border border-emerald-600/30 bg-[#141917] p-3 font-mono text-[11px] text-emerald-200">
              <div className="font-bold text-emerald-400">
                [PAYPAL ORDERS V2 AUTHORIZE HOLD • APIMATIC SDK VALIDATED]
              </div>
              <div className="mt-1">
                Order ID: <code>{race.priceLockAgent.paypalOrderId}</code> | Auth ID:{" "}
                <code>{race.priceLockAgent.paypalAuthorizationId}</code>
              </div>
              <div className="mt-1 break-all">
                SHA-256 Receipt Hash: <code>{race.priceLockAgent.receiptHash}</code>
              </div>
              <div className="mt-1 break-all text-emerald-300/80">
                Ed25519 Sig: <code>{race.priceLockAgent.signatureEd25519.slice(0, 56)}...</code>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* APIMatic Context Plugin Compiler Diff */}
      <div className="rounded-xl border border-[var(--pl-border)] bg-[var(--pl-surface)] p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="rounded-full bg-purple-600/15 px-3 py-0.5 text-xs font-bold text-purple-800 dark:text-purple-300">
              🔌 APIMatic Context Plugin for PayPal ({apimatic.sdkVersion})
            </span>
            <h3 className="mt-1 text-sm font-bold">
              Zero-Hallucination PayPal Server SDK v2 Compiler ({apimatic.openapiPath})
            </h3>
          </div>
          <span className="rounded bg-emerald-600/15 px-2.5 py-1 text-xs font-bold text-emerald-800 dark:text-emerald-300">
            {apimatic.naiveLlmHallucinationsCaught.length} Fatal v1 Schema Hallucinations Prevented
          </span>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
          <div className="space-y-2 text-xs">
            {apimatic.naiveLlmHallucinationsCaught.map((h) => (
              <div
                key={h.field}
                className="rounded-lg border border-[var(--pl-border)] bg-black/[0.02] p-2.5 dark:bg-white/[0.02]"
              >
                <div className="flex items-center justify-between">
                  <code className="font-bold text-red-700 dark:text-red-400">{h.field}</code>
                  <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold">
                    {h.severity}
                  </span>
                </div>
                <div className="mt-1 text-[11px] text-[var(--pl-muted)]">
                  <strong>Naive LLM:</strong> {h.naiveHallucination}
                </div>
                <div className="mt-0.5 text-[11px] text-emerald-700 dark:text-emerald-400">
                  <strong>APIMatic Fix:</strong> {h.apimaticCorrection}
                </div>
              </div>
            ))}
          </div>
          <pre className="overflow-x-auto rounded-lg bg-[#14121A] p-3 font-mono text-[11px] leading-relaxed text-emerald-200">
            {apimatic.compiledSdkSnippet}
          </pre>
        </div>
      </div>
    </div>
  );
}
