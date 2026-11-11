import type { AgDataSourcesDefinition, AgFieldDefinition, AgFormat } from "ag-studio";
import type { PriceLockDeal } from "@/lib/types";

type FieldSpec = [id: string, name: string, format: AgFormat, hide?: boolean];

const fields = (specs: FieldSpec[]): AgFieldDefinition[] =>
  specs.map(([id, name, format, hide]) => ({ id, name, format, ...(hide && { hide }) }));

export function buildPriceLockStudioData(deals: PriceLockDeal[]): AgDataSourcesDefinition {
  const dealRows = deals.map((d) => ({
    id: d.id,
    sku: d.sku,
    title: d.title,
    category: d.category,
    naiveStore: d.naiveStoreName,
    bestRetailer: d.bestRetailer,
    msrpPrice: d.msrpPrice,
    naiveCheckoutTotal: d.naiveCheckoutTotal,
    strippedDarkPatternUsd: d.strippedDarkPatternUsd,
    channel3VerifiedPrice: d.channel3VerifiedPrice,
    targetHoldPrice: d.targetHoldPrice,
    totalSavedUsd: d.totalSavedUsd,
    status: d.status,
    darkPatternQuote: d.darkPatternQuote,
    darkPatternCategory: d.darkPatternCategory,
    paypalOrderId: d.paypal.orderId,
    paypalAuthId: d.paypal.authorizationId,
    receiptHash: d.receipt.payloadHash.slice(0, 16),
    createdAt: d.paypal.createdAt.slice(0, 10),
  }));

  const flowRows = deals.flatMap((d) => [
    {
      dealId: d.id,
      skuTitle: d.title,
      category: d.category,
      stage1Origin: "1. Naive Store Checkout",
      stage2Surgeon: "2. Channel3 + DOM Surgeon",
      stage3Outcome: "Saved via PriceLock",
      amount: d.totalSavedUsd,
    },
    {
      dealId: d.id,
      skuTitle: d.title,
      category: d.category,
      stage1Origin: "1. Naive Store Checkout",
      stage2Surgeon: "2. Channel3 + DOM Surgeon",
      stage3Outcome:
        d.status === "AUTHORIZED_HOLD"
          ? "Held in PayPal (Auth)"
          : d.status === "CAPTURED_AT_TARGET"
          ? "Captured at Target Floor"
          : "Refunded / Protected",
      amount: d.channel3VerifiedPrice,
    },
  ]);

  return {
    description:
      "PriceLock consumer shopping protection ledger joining PayPal Orders v2 authorization holds, Channel3 25,000-retailer price comparisons, stripped checkout dark patterns, and Ed25519 receipts.",
    sources: [
      {
        id: "deals",
        name: "PriceLock Protected Purchases",
        description: "One row per shopping mission locked or settled through PayPal Sandbox.",
        data: dealRows,
        fields: fields([
          ["id", "Deal ID", "textFormat", true],
          ["sku", "SKU", "textFormat"],
          ["title", "Product", "textFormat"],
          ["category", "Category", "textFormat"],
          ["naiveStore", "First Ad Store", "textFormat"],
          ["bestRetailer", "Channel3 Verified Store", "textFormat"],
          ["msrpPrice", "MSRP", "currencyFormat"],
          ["naiveCheckoutTotal", "Naive Store Checkout", "currencyFormat"],
          ["strippedDarkPatternUsd", "Dark Pattern Stripped", "currencyFormat"],
          ["channel3VerifiedPrice", "Channel3 Locked Price", "currencyFormat"],
          ["targetHoldPrice", "PayPal Hold Ceiling", "currencyFormat"],
          ["totalSavedUsd", "Total Saved", "currencyFormat"],
          ["status", "PayPal Status", "textFormat"],
          ["darkPatternQuote", "Intercepted Trap Quote", "textFormat"],
          ["darkPatternCategory", "Trap Type", "textFormat"],
          ["paypalOrderId", "PayPal Order ID", "textFormat"],
          ["paypalAuthId", "PayPal Auth ID", "textFormat"],
          ["receiptHash", "Ed25519 Receipt Hash", "textFormat"],
          ["createdAt", "Date", "dateFormat"],
        ]),
      },
      {
        id: "flows",
        name: "Money Flow Stages",
        description: "Sankey stages mapping naive checkout ask to Channel3 savings and PayPal holds.",
        data: flowRows,
        fields: fields([
          ["dealId", "Deal ID", "textFormat", true],
          ["skuTitle", "Product", "textFormat"],
          ["category", "Category", "textFormat"],
          ["stage1Origin", "Checkout Origin", "textFormat"],
          ["stage2Surgeon", "Surgeon Engine", "textFormat"],
          ["stage3Outcome", "Money Outcome", "textFormat"],
          ["amount", "Amount USD", "currencyFormat"],
        ]),
      },
    ],
    relationships: [
      {
        id: "flows-to-deals",
        source: { tableId: "flows", fieldId: "dealId" },
        target: { tableId: "deals", fieldId: "id" },
        type: "many-to-one",
      },
    ],
    expressions: [
      {
        id: "savingsRate",
        name: "Savings % vs Naive Checkout",
        description: "Total dollars saved divided by naive checkout total.",
        format: "percentageFormat",
        isMeasure: true,
        expression: {
          operator: "divide",
          inputs: [
            { id: "deals.totalSavedUsd", aggregation: "sum" },
            { id: "deals.naiveCheckoutTotal", aggregation: "sum" },
          ],
        },
      },
    ],
  } as AgDataSourcesDefinition;
}
