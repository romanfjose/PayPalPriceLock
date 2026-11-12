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
      <div className="pl-card rounded-2xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--pl-paypal-soft)] px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[var(--pl-paypal)]">
              PayPal Hold &amp; 14-Day Return-Window Scheduler
            </span>
            <p className="mt-1.5 text-xs leading-relaxed text-[var(--pl-muted)]">
              Every PayPal <code>AUTHORIZE</code> hold runs as a time-bounded dependency chain:{" "}
              <strong className="text-[var(--pl-ink-secondary)]">Hold Window (Days 1–7)</strong> →{" "}
              <strong className="text-[var(--pl-ink-secondary)]">Channel3 Price-Drop Trigger</strong> →{" "}
              <strong className="text-[var(--pl-ink-secondary)]">14-Day Post-Capture Price Shield</strong>. Unmatched holds auto-void at expiry (`$0.00` charged).
            </p>
          </div>
          <div className="flex flex-wrap gap-2 font-mono text-xs font-bold">
            <span className="rounded-lg bg-[var(--pl-accent-soft)] px-3 py-1.5 text-emerald-800 dark:text-emerald-300">
              {deals.filter((d) => d.status === "AUTHORIZED_HOLD").length} Active Holds
            </span>
            <span className="rounded-lg border border-[var(--pl-border)] bg-[var(--pl-surface-muted)] px-3 py-1.5">
              100% Auto-Void Guard
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Timeline Grid */}
      <div className="pl-card overflow-hidden rounded-2xl">
        <div className="grid grid-cols-12 border-b border-[var(--pl-border)] bg-[var(--pl-surface-muted)] px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-[var(--pl-muted)]">
          <div className="col-span-4">PayPal Order &amp; Product</div>
          <div className="col-span-6">
            <div className="flex justify-between">
              <span>Day 1</span>
              <span>Day 4</span>
              <span className="text-emerald-700 dark:text-emerald-400">Today</span>
              <span>Hold Expiry</span>
              <span>14d Return Cutoff</span>
            </div>
          </div>
          <div className="col-span-2 text-right">Schedule Controls</div>
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
                className={`grid cursor-pointer grid-cols-12 items-center gap-3 px-5 py-3.5 transition ${
                  isSelected ? "bg-[var(--pl-paypal-soft)]/50" : "hover:bg-[var(--pl-surface-muted)]"
                }`}
              >
                <div className="col-span-4 pr-2">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-[var(--pl-surface-muted)] px-1.5 py-0.5 font-mono text-[10px] font-bold text-[var(--pl-muted)]">
                      {d.paypal.orderId.slice(0, 10)}
                    </span>
                    <span className="truncate text-xs font-bold">{d.title}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-2 font-mono text-[11px] text-[var(--pl-muted)]">
                    <span>Floor ${effectivePrice.toFixed(2)}</span>
                    <span>•</span>
                    <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                      +${(d.totalSavedUsd + dropAmt).toFixed(2)} saved
                    </span>
                  </div>
                </div>

                {/* Timeline Track */}
                <div className="relative col-span-6 h-10 rounded-xl border border-[var(--pl-border)] bg-[var(--pl-surface-muted)] p-1.5">
                  <div className="absolute top-0 bottom-0 left-[44%] w-0.5 bg-emerald-500/70" />
                  <div className="flex h-full items-center gap-1.5">
                    <div
                      className={`flex h-6 items-center justify-between rounded-md px-2 font-mono text-[10px] font-bold text-white transition-all ${
                        d.status === "AUTHORIZED_HOLD"
                          ? "bg-[#0070E0]"
                          : d.status === "CAPTURED_AT_TARGET"
                          ? "bg-emerald-600"
                          : "bg-slate-500"
                      }`}
                      style={{
                        marginLeft: `${(idx * 5) % 16}%`,
                        width: `${Math.min(52, 34 + extraDays * 3)}%`,
                      }}
                    >
                      <span className="truncate">
                        {d.status === "AUTHORIZED_HOLD"
                          ? `HOLD $${effectivePrice.toFixed(0)} (${7 + extraDays}d)`
                          : d.status === "CAPTURED_AT_TARGET"
                          ? `CAPTURED $${effectivePrice.toFixed(0)}`
                          : "SETTLED"}
                      </span>
                    </div>

                    <div className="flex h-6 flex-1 items-center rounded-md border border-dashed border-emerald-500/50 bg-[var(--pl-accent-soft)] px-2 text-[10px] font-semibold text-emerald-800 dark:text-emerald-300">
                      <span className="truncate">14d Channel3 Price-Drop Shield</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="col-span-2 flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => simulatePriceTick(d)}
                    className="cursor-pointer rounded-lg border border-[var(--pl-border)] bg-[var(--pl-surface)] px-2 py-1 font-mono text-[11px] font-semibold hover:border-[var(--pl-border-strong)]"
                  >
                    -$15 Drop
                  </button>
                  <button
                    id={`btn-shift-hold-${d.id}`}
                    type="button"
                    onClick={() => extendHoldWindow(d.id)}
                    className="cursor-pointer rounded-lg border border-[var(--pl-border)] bg-[var(--pl-surface)] px-2 py-1 font-mono text-[11px] font-bold hover:border-[var(--pl-border-strong)]"
                  >
                    +3d
                  </button>
                  {d.status === "AUTHORIZED_HOLD" && (
                    <button
                      type="button"
                      onClick={() => onDecision(d.id, "CAPTURE")}
                      className="cursor-pointer rounded-lg bg-[#0070E0] px-2.5 py-1 text-[11px] font-bold text-white hover:bg-[#005EA6]"
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
    </div>
  );
}
