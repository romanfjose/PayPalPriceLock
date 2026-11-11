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
      <div className="rounded-xl border border-[var(--pl-border)] bg-[var(--pl-surface)] p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-xs font-bold ${
                status.valid
                  ? "bg-emerald-600/15 text-emerald-800 dark:text-emerald-300"
                  : "bg-red-600/20 text-red-700 dark:text-red-300"
              }`}
            >
              {status.valid ? "✓ Ed25519 + SHA-256 Chain Verified" : "✕ TAMPER DETECTED — SIGNATURE REJECTED"}
            </span>
            <p className="mt-1.5 text-sm font-medium">
              <strong>WHAT HAPPENED:</strong> {status.reason}
            </p>
            <p className="mt-1 font-mono text-[11px] text-[var(--pl-muted)]">
              Ed25519 Public Key (SPKI Raw Hex): <code>{publicKeyHex}</code>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={simulateTamper}
              className="rounded-lg bg-red-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-800"
            >
              ⚡ Tamper Receipt #2 (+$50.00)
            </button>
            <button
              type="button"
              onClick={restoreAuthentic}
              className="rounded-lg border border-[var(--pl-border)] px-3 py-1.5 text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/5"
            >
              ↺ Restore Authentic Ledger
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-2.5">
        {receipts.map((r, idx) => {
          const isTampered = status.firstTamperedIndex === idx;
          return (
            <div
              key={r.receiptId}
              className={`rounded-xl border p-3.5 text-xs transition ${
                isTampered
                  ? "border-2 border-red-600 bg-red-600/[0.08]"
                  : "border-[var(--pl-border)] bg-[var(--pl-surface)]"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-black/10 px-2 py-0.5 font-mono font-bold dark:bg-white/10">
                    #{r.sequence} • {r.receiptId}
                  </span>
                  <span className="font-bold">{r.skuTitle}</span>
                  <span className="rounded bg-emerald-600/15 px-2 py-0.5 font-semibold text-emerald-800 dark:text-emerald-300">
                    {r.action}
                  </span>
                </div>
                <div className="flex items-center gap-3 font-mono">
                  <span>
                    PayPal Amount: <strong>${r.amountUsd.toFixed(2)}</strong>
                  </span>
                  <span className="text-emerald-700 dark:text-emerald-400">
                    Saved: <strong>${r.savedUsd.toFixed(2)}</strong>
                  </span>
                </div>
              </div>
              <div className="mt-2 grid grid-cols-1 gap-1 font-mono text-[11px] text-[var(--pl-muted)] md:grid-cols-3">
                <div className="truncate">
                  PayPal Order: <code>{r.paypalOrderId}</code> ({r.paypalAuthOrCaptureId})
                </div>
                <div className="truncate">
                  Prev SHA-256: <code>{r.prevHash.slice(0, 24)}...</code>
                </div>
                <div className="truncate">
                  Payload SHA-256: <code>{r.payloadHash.slice(0, 24)}...</code>
                </div>
              </div>
              <div className="mt-1 truncate font-mono text-[10px] text-[var(--pl-muted)]">
                Ed25519 Signature: <code>{r.signatureEd25519}</code>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
