"use client";

import { useState } from "react";
import type { CryptographicReceipt } from "@/lib/types";

export default function ReceiptVerifier({
  initialReceipts,
  publicKeyHex,
}: {
  initialReceipts: CryptographicReceipt[];
  publicKeyHex: string;
}) {
  const [receipts, setReceipts] = useState<CryptographicReceipt[]>(initialReceipts);
  const [status, setStatus] = useState<{
    valid: boolean;
    checkedCount: number;
    firstTamperedIndex: number | null;
    reason: string;
  }>({
    valid: true,
    checkedCount: initialReceipts.length,
    firstTamperedIndex: null,
    reason: `All ${initialReceipts.length} receipts verified: SHA-256 hash links intact and Ed25519 signatures valid.`,
  });

  const runVerification = async (candidateReceipts: CryptographicReceipt[]) => {
    const res = await fetch("/api/receipts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ receipts: candidateReceipts }),
    });
    const data = (await res.json()) as {
      valid: boolean;
      checkedCount: number;
      firstTamperedIndex: number | null;
      reason: string;
    };
    setStatus(data);
  };

  const simulateTamper = async () => {
    const clone = receipts.map((r, idx) =>
      idx === 1 ? { ...r, amountUsd: Number((r.amountUsd + 50).toFixed(2)) } : { ...r }
    );
    setReceipts(clone);
    await runVerification(clone);
  };

  const restoreAuthentic = async () => {
    setReceipts(initialReceipts);
    await runVerification(initialReceipts);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="pl-card-elevated rounded-2xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-mono text-[11px] font-bold uppercase ${
                status.valid
                  ? "bg-[var(--pl-accent-soft)] text-emerald-800 dark:text-emerald-300"
                  : "bg-[var(--pl-danger-soft)] text-red-700 dark:text-red-300"
              }`}
            >
              {status.valid ? "Ed25519 + SHA-256 Chain Intact" : "TAMPER DETECTED — SIGNATURE REJECTED"}
            </span>
            <h2 className="mt-2 text-base font-extrabold">{status.reason}</h2>
            <p className="mt-1 font-mono text-[11px] text-[var(--pl-muted)]">
              Ed25519 Public Key (SPKI Raw Hex): <code>{publicKeyHex}</code>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              id="btn-simulate-tamper"
              type="button"
              onClick={simulateTamper}
              className="cursor-pointer rounded-xl bg-red-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-red-700"
            >
              Simulate +$50 Receipt Tamper
            </button>
            <button
              id="btn-restore-ledger"
              type="button"
              onClick={restoreAuthentic}
              className="cursor-pointer rounded-xl border border-[var(--pl-border)] bg-[var(--pl-surface-muted)] px-3.5 py-2 text-xs font-bold transition hover:border-[var(--pl-border-strong)]"
            >
              Restore Authentic Chain
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
        {receipts.map((r, idx) => {
          const isTampered = status.firstTamperedIndex === idx;
          return (
            <div
              key={r.receiptId}
              className={`rounded-2xl border p-4 text-xs transition ${
                isTampered
                  ? "border-2 border-red-600 bg-[var(--pl-danger-soft)]"
                  : "pl-card"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-[var(--pl-surface-muted)] px-2 py-0.5 font-mono text-[11px] font-bold">
                    #{r.sequence}
                  </span>
                  <span className="font-bold">{r.skuTitle}</span>
                </div>
                <span className="rounded-md bg-[var(--pl-accent-soft)] px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-800 dark:text-emerald-300">
                  {r.action} • ${r.amountUsd.toFixed(2)}
                </span>
              </div>
              <div className="mt-2 space-y-1 font-mono text-[10.5px] text-[var(--pl-muted)]">
                <div className="truncate">
                  Order: <code>{r.paypalOrderId}</code> ({r.paypalAuthOrCaptureId})
                </div>
                <div className="truncate">
                  SHA-256: <code>{r.payloadHash.slice(0, 36)}...</code>
                </div>
                <div className="truncate">
                  Ed25519: <code>{r.signatureEd25519.slice(0, 44)}...</code>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
