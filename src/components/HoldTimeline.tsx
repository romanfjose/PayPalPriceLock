"use client";

import { useState } from "react";
import type { PriceLockDeal } from "@/lib/types";

export default function HoldTimeline({
  deals,
  onDecision,
}: {
  deals: PriceLockDeal[];
  onDecision: (dealId: string, decision: "CAPTURE" | "VOID" | "REFUND_DROP") => void;
}) {
  const [selectedDealId, setSelectedDealId] = useState<string>(deals[0]?.id || "deal_sony_xm5");
  const [dayOffsets, setDayOffsets] = useState<Record<string, number>>({});
  const [simulatedDrops, setSimulatedDrops] = useState<Record<string, number>>({});

  const selectedDeal = deals.find((d) => d.id === selectedDealId) ?? deals[0];

  const extendHoldWindow = (id: string) => {
    setDayOffsets((prev) => ({ ...prev, [id]: (prev[id] || 0) + 3 }));
  };

  const simulatePriceTick = (deal: PriceLockDeal) => {
    const nextDrop = (simulatedDrops[deal.id] || 0) + 15;
    setSimulatedDrops((prev) => ({ ...prev, [deal.id]: nextDrop }));
  };

  return (
    <div className="flex flex-col gap-4">
      {/* 2-Second Plain-English Summary Strip */}
      <div className="rounded-xl border border-[var(--pl-border)] bg-[var(--pl-surface)] p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-3 py-0.5 text-xs font-bold text-amber-800 dark:text-amber-300">
              ⏱ Bryntum-Architecture Hold & Return-Window Scheduler
            </span>
            <p className="mt-1.5 text-sm font-medium">
              <strong>WHAT HAPPENED:</strong> Every PayPal <code>AUTHORIZE</code> hold is scheduled as a time-bounded dependency chain: <strong>Hold Window (Days 1–7)</strong> → <strong>Channel3 Price-Drop Trigger</strong> → <strong>14-Day Price-Match & Return Shield</strong>. If a hold expires without hitting your target price, PriceLock auto-voids it (<code>$0.00</code> charged).
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-semibold">
            <span className="rounded-lg border border-emerald-600/30 bg-emerald-600/10 px-3 py-1.5 text-emerald-800 dark:text-emerald-300">
              {deals.filter((d) => d.status === "AUTHORIZED_HOLD").length} Active Holds Scheduled
            </span>
            <span className="rounded-lg border border-purple-600/30 bg-purple-600/10 px-3 py-1.5 text-purple-800 dark:text-purple-300">
              100% Auto-Void Protection
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Gantt / Scheduler Grid */}
      <div className="overflow-hidden rounded-xl border border-[var(--pl-border)] bg-[var(--pl-surface)] shadow-sm">
        <div className="grid grid-cols-12 border-b border-[var(--pl-border)] bg-black/[0.03] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-[var(--pl-muted)] dark:bg-white/[0.03]">
          <div className="col-span-4">PayPal Resource & SKU</div>
          <div className="col-span-6">
            <div className="flex justify-between">
              <span>Nov 6</span>
              <span>Nov 10</span>
              <span className="text-emerald-700 dark:text-emerald-400">Today (Nov 11)</span>
              <span>Nov 16 (Hold Expiry)</span>
              <span>Nov 24 (Return Cutoff)</span>
            </div>
          </div>
          <div className="col-span-2 text-right">Agent Schedule Action</div>
        </div>

        <div className="divide-y divide-[var(--pl-border)]">
          {deals.map((d, idx) => {
            const extraDays = dayOffsets[d.id] || 0;
            const dropAmt = simulatedDrops[d.id] || 0;
            const effectivePrice = Math.max(49, d.channel3VerifiedPrice - dropAmt);
            const isSelected = selectedDeal?.id === d.id;

            return (
              <div
                key={d.id}
                onClick={() => setSelectedDealId(d.id)}
                className={`grid cursor-pointer grid-cols-12 items-center gap-3 px-4 py-3.5 transition ${
                  isSelected ? "bg-emerald-600/[0.06]" : "hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
                }`}
              >
                <div className="col-span-4 pr-2">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-black/10 px-1.5 py-0.5 font-mono text-[10px] font-bold dark:bg-white/10">
                      {d.paypal.orderId.slice(0, 10)}
                    </span>
                    <span className="truncate text-xs font-bold">{d.title}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-[11px] text-[var(--pl-muted)]">
                    <span>Floor: <strong>${effectivePrice.toFixed(2)}</strong></span>
                    <span>•</span>
                    <span className="text-emerald-700 dark:text-emerald-400">
                      Saved ${(d.totalSavedUsd + dropAmt).toFixed(2)}
                    </span>
                    {d.splitCrew && (
                      <span className="rounded bg-purple-600/15 px-1.5 py-0.5 text-[10px] font-semibold text-purple-700 dark:text-purple-300">
                        4-Way Crew Split
                      </span>
                    )}
                  </div>
                </div>

                {/* Timeline Track */}
                <div className="col-span-6 relative h-11 rounded-lg border border-[var(--pl-border)] bg-black/[0.02] p-1.5 dark:bg-white/[0.02]">
                  {/* Today Vertical Marker */}
                  <div className="absolute top-0 bottom-0 left-[44%] w-0.5 bg-emerald-600/60" />

                  <div className="flex h-full items-center gap-1">
                    {/* Bar 1: Hold Authorization */}
                    <div
                      className={`flex h-7 items-center justify-between rounded px-2 text-[10px] font-bold text-white shadow-xs transition-all ${
                        d.status === "AUTHORIZED_HOLD"
                          ? "bg-amber-600"
                          : d.status === "CAPTURED_AT_TARGET"
                          ? "bg-emerald-700"
                          : d.status === "VOIDED_EXPIRED"
                          ? "bg-zinc-500"
                          : "bg-teal-700"
                      }`}
                      style={{
                        marginLeft: `${(idx * 5) % 18}%`,
                        width: `${Math.min(52, 34 + extraDays * 3)}%`,
                      }}
                    >
                      <span className="truncate">
                        {d.status === "AUTHORIZED_HOLD"
                          ? `HOLD $${effectivePrice.toFixed(0)} (${7 + extraDays}d)`
                          : d.status === "CAPTURED_AT_TARGET"
                          ? `CAPTURED $${effectivePrice.toFixed(0)}`
                          : d.status === "VOIDED_EXPIRED"
                          ? "VOIDED ($0)"
                          : `REFUNDED -$${d.strippedDarkPatternUsd}`}
                      </span>
                      <span>→</span>
                    </div>

                    {/* Dependency Connector + Bar 2: Return & Price-Protection Window */}
                    <div className="flex h-6 flex-1 items-center rounded border border-dashed border-emerald-600/50 bg-emerald-600/10 px-2 text-[10px] font-semibold text-emerald-800 dark:text-emerald-300">
                      <span className="truncate">
                        Channel3 Return & Price-Drop Shield (14d)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="col-span-2 flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => simulatePriceTick(d)}
                    title="Simulate Channel3 detecting a $15 price drop"
                    className="rounded border border-[var(--pl-border)] px-2 py-1 text-[11px] font-semibold hover:bg-black/5 dark:hover:bg-white/5"
                  >
                    📉 -$15 Drop
                  </button>
                  <button
                    type="button"
                    onClick={() => extendHoldWindow(d.id)}
                    title="Extend PayPal Hold Window by +3 days"
                    className="rounded border border-[var(--pl-border)] px-2 py-1 text-[11px] font-semibold hover:bg-black/5 dark:hover:bg-white/5"
                  >
                    +3d
                  </button>
                  {d.status === "AUTHORIZED_HOLD" && (
                    <button
                      type="button"
                      onClick={() => onDecision(d.id, "CAPTURE")}
                      className="rounded bg-emerald-700 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-emerald-800"
                    >
                      Capture
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Deal Dependency Inspector & Multiparty Crew Split */}
      {selectedDeal && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-[var(--pl-border)] bg-[var(--pl-surface)] p-4">
            <h3 className="text-sm font-bold">
              Price Trajectory & Hold Dependency: {selectedDeal.title}
            </h3>
            <p className="mt-1 text-xs text-[var(--pl-muted)]">
              PayPal Order <code>{selectedDeal.paypal.orderId}</code> • Expires{" "}
              <code>{selectedDeal.paypal.expiresAt.slice(0, 10)}</code>
            </p>
            <div className="mt-3 grid grid-cols-4 gap-2 text-center text-xs">
              {selectedDeal.priceHistory.map((pt) => (
                <div
                  key={pt.dayLabel}
                  className="rounded-lg border border-[var(--pl-border)] bg-black/[0.02] p-2 dark:bg-white/[0.02]"
                >
                  <div className="text-[11px] font-semibold text-[var(--pl-muted)]">{pt.dayLabel}</div>
                  <div className="mt-1 text-xs line-through opacity-60">${pt.firstStoreCheckout.toFixed(0)}</div>
                  <div className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                    ${pt.channel3Lowest.toFixed(0)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-[var(--pl-border)] bg-[var(--pl-surface)] p-4">
            <h3 className="text-sm font-bold">
              {selectedDeal.splitCrew
                ? "Multiparty Group Split-Hold Crew (Zero Fronting)"
                : "Automated Hold Expiration & Return-Window Rules"}
            </h3>
            {selectedDeal.splitCrew ? (
              <div className="mt-2.5 grid grid-cols-2 gap-2 text-xs">
                {selectedDeal.splitCrew.map((m) => (
                  <div
                    key={m.handle}
                    className="flex items-center justify-between rounded-lg border border-[var(--pl-border)] p-2"
                  >
                    <div>
                      <div className="font-bold">{m.name}</div>
                      <div className="font-mono text-[10px] text-[var(--pl-muted)]">{m.paypalAuthId}</div>
                    </div>
                    <span className="rounded bg-emerald-600/15 px-2 py-0.5 font-bold text-emerald-800 dark:text-emerald-300">
                      ${m.shareAmount.toFixed(2)} {m.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <ul className="mt-2.5 space-y-1.5 text-xs text-[var(--pl-muted)]">
                <li>
                  • <strong>Gate 1 (Pre-Capture):</strong> PayPal holds ${selectedDeal.channel3VerifiedPrice.toFixed(2)} via <code>Orders v2 AUTHORIZE</code>. Zero funds leave buyer wallet until Channel3 confirms stock & price.
                </li>
                <li>
                  • <strong>Gate 2 (Post-Capture 14d Shield):</strong> If Channel3 spots a lower price before{" "}
                  <code>{selectedDeal.paypal.returnWindowEndsAt.slice(0, 10)}</code>, PriceLock triggers a partial diff refund via <code>POST /v2/payments/captures/&#123;id&#125;/refund</code>.
                </li>
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
