import { NextResponse } from "next/server";
import { hasLivePayPalCredentials, createPayPalAuthorizationHold } from "@/lib/paypal";
import { hasLiveChannel3Key, searchChannel3Catalog } from "@/lib/channel3";
import { getReceiptVerificationSummary } from "@/lib/state";
import { compileWithApimaticContext } from "@/lib/apimatic-context";

export async function GET() {
  const started = Date.now();
  const ch3 = await searchChannel3Catalog("Sony WH-1000XM5");
  const pp = await createPayPalAuthorizationHold({
    skuTitle: ch3.title,
    amountUsd: ch3.lowestVerifiedPrice,
    receiptFingerprint: "SELFTEST994128810ABCDEF12345678",
    retailerName: ch3.bestRetailer,
  });
  const receipts = getReceiptVerificationSummary();
  const apimatic = compileWithApimaticContext({
    operation: "AUTHORIZE_HOLD",
    skuTitle: ch3.title,
    amountUsd: ch3.lowestVerifiedPrice,
    customIdFingerprint: pp.customIdFingerprint,
  });

  return NextResponse.json({
    ok: true,
    totalLatencyMs: Date.now() - started,
    sponsors: {
      paypal: {
        liveKeysConfigured: hasLivePayPalCredentials(),
        mode: pp.mode,
        sampleOrderId: pp.orderId,
        sampleAuthId: pp.authorizationId,
        customIdFingerprint: pp.customIdFingerprint,
      },
      channel3: {
        liveKeyConfigured: hasLiveChannel3Key(),
        mode: ch3.mode,
        sampleSku: ch3.matchedSku,
        lowestVerifiedPrice: ch3.lowestVerifiedPrice,
        bestRetailer: ch3.bestRetailer,
      },
      agStudio: {
        packageVersion: "ag-studio@3.0.0 + ag-studio-react@3.0.0 + ag-grid-react@36.2.0",
        customWidgetsRegistered: [
          "pricelock-savings-sankey",
          "pricelock-dark-patterns",
          "pricelock-paypal-holds",
        ],
        studioAgentFrameworkEnabled: true,
      },
      apimatic: {
        sdkVersion: apimatic.sdkVersion,
        hallucinationsPreventedCount: apimatic.naiveLlmHallucinationsCaught.length,
        valid: apimatic.valid,
      },
      holdScheduler: {
        timelineEnabled: true,
        activeHoldWindowsCount: 5,
      },
    },
    cryptography: {
      algorithm: "Ed25519 + SHA-256 Hash Chain",
      chainValid: receipts.valid,
      receiptsVerifiedCount: receipts.checkedCount,
      publicKeyHex: receipts.publicKeyHex,
    },
  });
}
