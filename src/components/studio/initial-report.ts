import type { AgReportState, AgWidgetLayoutState } from "ag-studio";
import { WIDGET_HOLDS, WIDGET_SANKEY, WIDGET_TRAPS } from "./widgets";

const at = (xTrack: number, yTrack: number, xSpan: number, ySpan: number): AgWidgetLayoutState => ({
  xTrack,
  yTrack,
  xSpan,
  ySpan,
});

const sum = (id: string) => ({ id, aggregation: "sum" as const });

const kpi = (titleText: string, fieldId: string) => ({
  type: "value" as const,
  dataMapping: {
    value: [sum(fieldId)],
  },
  format: {
    title: { enabled: true, text: titleText },
  },
});

const overviewPage = {
  id: "overview",
  widgets: {
    "kpi-naive": kpi("1. First Store Checkout Ask", "deals.naiveCheckoutTotal"),
    "kpi-traps": kpi("2. Dark-Pattern Fees Stripped", "deals.strippedDarkPatternUsd"),
    "kpi-locked": kpi("3. Channel3 Verified Floor", "deals.channel3VerifiedPrice"),
    "kpi-saved": kpi("4. Total Saved on PayPal", "deals.totalSavedUsd"),
    "custom-sankey": {
      type: WIDGET_SANKEY,
      dataMapping: {
        category: [{ id: "deals.category" }],
        value: [sum("deals.totalSavedUsd")],
      },
      format: {
        title: {
          enabled: true,
          text: "PriceLock Money Flow: Store Checkout Ask → Surgeon → PayPal Hold",
        },
        subtitle: {
          enabled: true,
          text: "Custom AG Studio Widget #1 • Click any category chip to cross-filter the report",
        },
      },
    },
    "custom-holds": {
      type: WIDGET_HOLDS,
      dataMapping: {
        sku: [{ id: "deals.sku" }],
      },
      format: {
        title: {
          enabled: true,
          text: "Active PayPal Orders v2 Authorization Holds",
        },
        subtitle: {
          enabled: true,
          text: "Custom AG Studio Widget #2 • 1-Click Capture at Target or Void Hold ($0.00)",
        },
      },
    },
    "retailer-spread-chart": {
      type: "bar-chart-grouped",
      dataMapping: {
        categoryKey: [{ id: "deals.sku" }],
        valueKey: [
          sum("deals.naiveCheckoutTotal"),
          sum("deals.channel3VerifiedPrice"),
          sum("deals.totalSavedUsd"),
        ],
      },
      format: {
        title: {
          enabled: true,
          text: "First Store Checkout vs. Channel3 Verified Price & Savings by SKU",
        },
      },
    },
    "custom-traps": {
      type: WIDGET_TRAPS,
      dataMapping: {
        quote: [{ id: "deals.darkPatternQuote" }],
        amount: [sum("deals.strippedDarkPatternUsd")],
      },
      format: {
        title: {
          enabled: true,
          text: "Intercepted Storefront Dark Patterns & Prompt Injections",
        },
        subtitle: {
          enabled: true,
          text: "Custom AG Studio Widget #3 • Click any trap card to cross-filter",
        },
      },
    },
    "deals-grid": {
      type: "grid",
      dataMapping: {
        values: [
          { id: "deals.title" },
          { id: "deals.category" },
          { id: "deals.naiveCheckoutTotal" },
          { id: "deals.strippedDarkPatternUsd" },
          { id: "deals.bestRetailer" },
          { id: "deals.channel3VerifiedPrice" },
          { id: "deals.totalSavedUsd" },
          { id: "deals.status" },
          { id: "deals.paypalOrderId" },
          { id: "deals.receiptHash" },
        ],
      },
      format: {
        title: {
          enabled: true,
          text: "PayPal Sandbox Orders v2 & Ed25519 Receipt Ledger (CSV Export Ready)",
        },
      },
    },
  },
  widgetLayout: {
    "kpi-naive": at(0, 0, 6, 5),
    "kpi-traps": at(6, 0, 6, 5),
    "kpi-locked": at(12, 0, 6, 5),
    "kpi-saved": at(18, 0, 6, 5),
    "custom-sankey": at(0, 5, 14, 13),
    "custom-holds": at(14, 5, 10, 13),
    "retailer-spread-chart": at(0, 18, 12, 14),
    "custom-traps": at(12, 18, 12, 14),
    "deals-grid": at(0, 32, 24, 14),
  },
};

export const initialPriceLockStudioReport = {
  selectedPageId: "overview",
  pages: [overviewPage],
} as unknown as AgReportState;
