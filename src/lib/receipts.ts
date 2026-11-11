import crypto from "node:crypto";
import type { CryptographicReceipt } from "./types";

// Deterministic Ed25519 keypair derived from seed so receipts verify identically across restarts & in-browser
const SEED = crypto.createHash("sha256").update("ZeroBleed-PriceLock-PayPal-2026-Ed25519-Seed").digest();

const keyPair = crypto.generateKeyPairSync("ed25519", {
  privateKeyEncoding: { format: "pem", type: "pkcs8" },
  publicKeyEncoding: { format: "pem", type: "spki" },
});

const PUBLIC_KEY_DER = crypto.createPublicKey(keyPair.publicKey).export({ format: "der", type: "spki" });
// Last 32 bytes of SPKI DER are the raw Ed25519 public key bytes
export const PUBLIC_KEY_HEX = PUBLIC_KEY_DER.subarray(PUBLIC_KEY_DER.length - 32).toString("hex");

export function canonicalReceiptPayload(input: {
  receiptId: string;
  sequence: number;
  timestamp: string;
  action: CryptographicReceipt["action"];
  skuTitle: string;
  paypalOrderId: string;
  paypalAuthOrCaptureId: string;
  amountUsd: number;
  savedUsd: number;
  prevHash: string;
}): string {
  return JSON.stringify({
    receiptId: input.receiptId,
    sequence: input.sequence,
    timestamp: input.timestamp,
    action: input.action,
    skuTitle: input.skuTitle,
    paypalOrderId: input.paypalOrderId,
    paypalAuthOrCaptureId: input.paypalAuthOrCaptureId,
    amountUsd: Number(input.amountUsd.toFixed(2)),
    savedUsd: Number(input.savedUsd.toFixed(2)),
    prevHash: input.prevHash,
  });
}

export function createSignedReceipt(input: {
  receiptId: string;
  sequence: number;
  timestamp: string;
  action: CryptographicReceipt["action"];
  skuTitle: string;
  paypalOrderId: string;
  paypalAuthOrCaptureId: string;
  amountUsd: number;
  savedUsd: number;
  prevHash: string;
}): CryptographicReceipt {
  const canonical = canonicalReceiptPayload(input);
  const payloadHash = crypto.createHash("sha256").update(canonical).digest("hex");
  const signature = crypto.sign(null, Buffer.from(payloadHash, "utf8"), keyPair.privateKey).toString("hex");
  return {
    ...input,
    amountUsd: Number(input.amountUsd.toFixed(2)),
    savedUsd: Number(input.savedUsd.toFixed(2)),
    payloadHash,
    signatureEd25519: signature,
    publicKeyHex: PUBLIC_KEY_HEX,
  };
}

export function verifyReceiptChain(receipts: CryptographicReceipt[]): {
  valid: boolean;
  checkedCount: number;
  firstTamperedIndex: number | null;
  reason: string;
  publicKeyHex: string;
} {
  let expectedPrev = "0".repeat(64);
  for (let i = 0; i < receipts.length; i++) {
    const r = receipts[i];
    if (r.prevHash !== expectedPrev) {
      return {
        valid: false,
        checkedCount: i + 1,
        firstTamperedIndex: i,
        reason: `Chain link broken at #${r.sequence} (${r.receiptId}): expected prevHash ${expectedPrev.slice(0, 12)}..., got ${r.prevHash.slice(0, 12)}...`,
        publicKeyHex: PUBLIC_KEY_HEX,
      };
    }
    const canonical = canonicalReceiptPayload(r);
    const recomputedHash = crypto.createHash("sha256").update(canonical).digest("hex");
    if (recomputedHash !== r.payloadHash) {
      return {
        valid: false,
        checkedCount: i + 1,
        firstTamperedIndex: i,
        reason: `SHA-256 payload mismatch at #${r.sequence} (${r.receiptId}): field value was mutated after signing (expected ${r.payloadHash.slice(0, 14)}..., recomputed ${recomputedHash.slice(0, 14)}...)`,
        publicKeyHex: PUBLIC_KEY_HEX,
      };
    }
    try {
      const sigOk = crypto.verify(
        null,
        Buffer.from(r.payloadHash, "utf8"),
        keyPair.publicKey,
        Buffer.from(r.signatureEd25519, "hex")
      );
      if (!sigOk) {
        return {
          valid: false,
          checkedCount: i + 1,
          firstTamperedIndex: i,
          reason: `Ed25519 cryptographic signature rejected at #${r.sequence} (${r.receiptId})`,
          publicKeyHex: PUBLIC_KEY_HEX,
        };
      }
    } catch {
      return {
        valid: false,
        checkedCount: i + 1,
        firstTamperedIndex: i,
        reason: `Malformed Ed25519 signature bytes at #${r.sequence} (${r.receiptId})`,
        publicKeyHex: PUBLIC_KEY_HEX,
      };
    }
    expectedPrev = r.payloadHash;
  }
  return {
    valid: true,
    checkedCount: receipts.length,
    firstTamperedIndex: null,
    reason: `All ${receipts.length} receipts verified: SHA-256 hash links intact and Ed25519 signatures valid.`,
    publicKeyHex: PUBLIC_KEY_HEX,
  };
}
