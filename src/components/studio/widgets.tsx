"use client";

import type {
  AgFormatShapeParams,
  AgShapeBuilder,
  AgWidgetFormParams,
  AgWidgetParams,
  AgWidgetsConfig,
} from "ag-studio";
import { createWidgets } from "ag-studio-react";
import { useEffect, useState } from "react";
import type { PriceLockDeal } from "@/lib/types";

export const WIDGET_SANKEY = "pricelock-savings-sankey";
export const WIDGET_TRAPS = "pricelock-dark-patterns";
export const WIDGET_HOLDS = "pricelock-paypal-holds";

const formatShapeBase = ({ api }: AgFormatShapeParams) => {
  const cmd = api.defineAiCommand((s: AgShapeBuilder) => ({
    input: s
      .object({
        title: s
          .object({
            enabled: s.boolean().optional(),
            text: s.string().optional(),
          })
          .optional(),
        subtitle: s
          .object({
            enabled: s.boolean().optional(),
            text: s.string().optional(),
          })
          .optional(),
      })
      .optional(),
    execute: () => ({ success: true as const, value: undefined }),
  }));
  return cmd.shape;
};

let currentDealsRef: PriceLockDeal[] = [];
let onDealDecisionRef: ((dealId: string, decision: "CAPTURE" | "VOID" | "REFUND_DROP") => void) | null = null;

export function syncCustomWidgetContext(
  deals: PriceLockDeal[],
  onDecision: (dealId: string, decision: "CAPTURE" | "VOID" | "REFUND_DROP") => void
) {
  currentDealsRef = deals;
  onDealDecisionRef = onDecision;
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("pricelock:deals-updated"));
  }
}

function useLiveDeals(): PriceLockDeal[] {
  const [deals, setDeals] = useState<PriceLockDeal[]>(() => currentDealsRef);
  useEffect(() => {
    setDeals(currentDealsRef);
    const handler = () => setDeals([...currentDealsRef]);
    window.addEventListener("pricelock:deals-updated", handler);
    return () => window.removeEventListener("pricelock:deals-updated", handler);
  }, []);
  return deals;
}

function SavingsSankeyWidget(props: AgWidgetParams) {
  const deals = useLiveDeals();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    props.widgetApi.setDisplayState("ready" as never);
  }, [props.widgetApi]);

  const filtered = selectedCategory ? deals.filter((d) => d.category === selectedCategory) : deals;
  const totalNaive = filtered.reduce((s, d) => s + d.naiveCheckoutTotal, 0);
  const totalTraps = filtered.reduce((s, d) => s + d.strippedDarkPatternUsd, 0);
  const totalArbitrage = filtered.reduce((s, d) => s + (d.totalSavedUsd - d.strippedDarkPatternUsd), 0);
  const totalLocked = filtered.reduce((s, d) => s + d.channel3VerifiedPrice, 0);
  const totalSaved = filtered.reduce((s, d) => s + d.totalSavedUsd, 0);

  const handleCategoryFilter = (cat: string) => {
    const next = selectedCategory === cat ? null : cat;
    setSelectedCategory(next);
    try {
      props.widgetApi.toggleCrossFilter({ fieldIds: ["deals.category"], values: [cat] } as never);
    } catch {
      // ignore if cross-filter field not mapped
    }
  };

  return (
    <div className="flex h-full flex-col justify-between gap-2 p-2 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--pl-border)] pb-2">
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-[var(--pl-accent-soft)] px-2 py-0.5 font-mono font-bold text-emerald-700 dark:text-emerald-300">
            Save Rate {totalNaive > 0 ? ((totalSaved / totalNaive) * 100).toFixed(1) : "0"}%
          </span>
          <span className="text-[var(--pl-muted)]">Filter by category:</span>
        </div>
        <div className="flex flex-wrap gap-1">
          {Array.from(new Set(deals.map((d) => d.category))).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => handleCategoryFilter(cat)}
              className={`cursor-pointer rounded-md px-2 py-0.5 text-[11px] font-semibold transition ${
                selectedCategory === cat
                  ? "bg-[#0070E0] text-white"
                  : "border border-[var(--pl-border)] bg-[var(--pl-surface-muted)] hover:border-[var(--pl-border-strong)]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 items-center gap-3 py-1">
        <div className="rounded-xl border border-[var(--pl-border)] bg-[var(--pl-surface-muted)] p-3">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--pl-muted)]">
            1. Unprotected Cart
          </div>
          <div className="mt-1 font-mono text-lg font-extrabold">${totalNaive.toFixed(2)}</div>
          <div className="mt-1 text-[11px] text-red-600 dark:text-red-400">
            Includes ${totalTraps.toFixed(2)} in traps
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="rounded-lg border border-red-500/25 bg-[var(--pl-danger-soft)] p-2">
            <div className="flex items-center justify-between font-semibold text-red-700 dark:text-red-300">
              <span>Traps Stripped</span>
              <span className="font-mono">-${totalTraps.toFixed(2)}</span>
            </div>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded bg-black/10">
              <div
                className="h-full bg-red-500"
                style={{ width: `${Math.min(100, (totalTraps / Math.max(1, totalSaved)) * 100)}%` }}
              />
            </div>
          </div>

          <div className="rounded-lg border border-[#0070E0]/25 bg-[var(--pl-paypal-soft)] p-2">
            <div className="flex items-center justify-between font-semibold text-[var(--pl-paypal)]">
              <span>Channel3 Arbitrage</span>
              <span className="font-mono">-${totalArbitrage.toFixed(2)}</span>
            </div>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded bg-black/10">
              <div
                className="h-full bg-[#0070E0]"
                style={{ width: `${Math.min(100, (totalArbitrage / Math.max(1, totalSaved)) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-emerald-500/30 bg-[var(--pl-accent-soft)] p-3">
          <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
            3. PayPal Verified Hold
          </div>
          <div className="mt-1 font-mono text-lg font-extrabold text-emerald-900 dark:text-emerald-200">
            ${totalLocked.toFixed(2)}
          </div>
          <div className="mt-1 font-mono text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
            +${totalSaved.toFixed(2)} kept
          </div>
        </div>
      </div>
    </div>
  );
}

function DarkPatternsWallWidget(props: AgWidgetParams) {
  const deals = useLiveDeals();

  useEffect(() => {
    props.widgetApi.setDisplayState("ready" as never);
  }, [props.widgetApi]);

  return (
    <div className="flex h-full flex-col gap-2 overflow-y-auto p-1.5 text-xs">
      {deals.map((d) => (
        <div
          key={d.id}
          onClick={() => {
            try {
              props.widgetApi.toggleCrossFilter({ fieldIds: ["deals.sku"], values: [d.sku] } as never);
            } catch {
              // ignore
            }
          }}
          className="cursor-pointer rounded-xl border border-[var(--pl-border)] bg-[var(--pl-surface-muted)] p-2.5 transition hover:border-[#0070E0]/50"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="font-bold">{d.title}</span>
            <span className="rounded-md bg-[var(--pl-danger-soft)] px-2 py-0.5 font-mono text-[11px] font-bold text-red-700 dark:text-red-300">
              -${d.strippedDarkPatternUsd.toFixed(2)} ({d.darkPatternCategory})
            </span>
          </div>
          <div className="mt-1.5 truncate rounded-lg bg-[#0F141C] px-2.5 py-1 font-mono text-[11px] text-slate-300">
            {d.darkPatternQuote}
          </div>
          <div className="mt-1.5 flex items-center justify-between text-[11px] text-[var(--pl-muted)]">
            <span>Ad Store: {d.naiveStoreName} (${d.naiveCheckoutTotal.toFixed(2)})</span>
            <span className="font-semibold text-emerald-700 dark:text-emerald-400">
              Rerouted to {d.bestRetailer} (${d.channel3VerifiedPrice.toFixed(2)})
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function PayPalHoldsChequeWidget(props: AgWidgetParams) {
  const deals = useLiveDeals();

  useEffect(() => {
    props.widgetApi.setDisplayState("ready" as never);
  }, [props.widgetApi]);

  const activeHolds = deals.filter((d) => d.status === "AUTHORIZED_HOLD");

  return (
    <div className="flex h-full flex-col gap-2 overflow-y-auto p-1.5 text-xs">
      {activeHolds.length === 0 ? (
        <div className="flex h-full items-center justify-center text-sm text-[var(--pl-muted)]">
          All PayPal holds settled. Create a new PriceLock hold on Checkout Shield.
        </div>
      ) : (
        activeHolds.map((d) => (
          <div
            key={d.id}
            className="rounded-xl border border-[#0070E0]/30 bg-[var(--pl-paypal-soft)] p-3"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--pl-paypal)]">
                PAYPAL ORDERS V2 HOLD • {d.paypal.orderId}
              </span>
              <span className="rounded-md bg-[var(--pl-accent-soft)] px-2 py-0.5 font-mono font-bold text-emerald-800 dark:text-emerald-300">
                Saves ${d.totalSavedUsd.toFixed(2)}
              </span>
            </div>
            <div className="mt-1 text-sm font-bold">{d.title}</div>
            <div className="mt-0.5 text-[11px] text-[var(--pl-muted)]">
              Fulfilled by <strong>{d.bestRetailer}</strong> at{" "}
              <strong className="font-mono">${d.channel3VerifiedPrice.toFixed(2)}</strong> (vs. ${d.naiveCheckoutTotal.toFixed(2)})
            </div>
            <div className="mt-2.5 flex items-center gap-2">
              <button
                type="button"
                onClick={() => onDealDecisionRef?.(d.id, "CAPTURE")}
                className="cursor-pointer rounded-lg bg-[#0070E0] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#005EA6]"
              >
                Capture Hold (${d.channel3VerifiedPrice.toFixed(2)})
              </button>
              <button
                type="button"
                onClick={() => onDealDecisionRef?.(d.id, "VOID")}
                className="cursor-pointer rounded-lg border border-[var(--pl-border)] bg-[var(--pl-surface)] px-3 py-1.5 text-xs font-semibold hover:border-[var(--pl-border-strong)]"
              >
                Void ($0.00)
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export function priceLockCustomWidgets(defaults: AgWidgetsConfig): AgWidgetsConfig {
  return createWidgets({
    additionalTypes: [
      {
        id: WIDGET_SANKEY,
        label: "PriceLock Savings Flow Sankey",
        dataMapping: {
          category: {
            type: "field",
            supportedRoles: ["category"],
            intent: "category",
            aiDescription: "Category field from deals table (deals.category).",
          },
          value: {
            type: "field",
            supportedRoles: ["numeric"],
            intent: "value",
            aiDescription: "Total saved USD (deals.totalSavedUsd).",
          },
        },
        formatShape: formatShapeBase,
        form: (p: AgWidgetFormParams) =>
          p.createDefaults({
            dataMappingItems: [
              { key: "category", label: "Category" },
              { key: "value", label: "Saved Amount" },
            ],
          }),
        defaultState: {
          format: {
            title: { enabled: true, text: "Money Flow: Unprotected Checkout → PriceLock Surgeon → PayPal Hold" },
            subtitle: { enabled: true, text: "Click any category chip to cross-filter the AG Studio report" },
          },
          dataMapping: {
            category: [{ id: "deals.category" }],
            value: [{ id: "deals.totalSavedUsd", aggregation: "sum" }],
          },
        },
        comp: SavingsSankeyWidget,
        defaultSize: { width: 580, height: 260 },
        minSize: { width: 280, height: 180 },
        featureConfig: { crossFilter: { supportsHighlight: false } },
        ai: {
          label: "PriceLock Savings Sankey",
          description: "Shows how money flows from inflated store checkouts into stripped dark-pattern savings and Channel3 arbitrage.",
          usage: "Place at the top of the overview report to show total buyer savings.",
          configuration: "Map category to deals.category and value to deals.totalSavedUsd (sum).",
        },
      },
      {
        id: WIDGET_TRAPS,
        label: "Intercepted Dark-Pattern Quote Wall",
        dataMapping: {
          quote: {
            type: "field",
            supportedRoles: ["category"],
            intent: "category",
            aiDescription: "The dark-pattern quote intercepted on the store page (deals.darkPatternQuote).",
          },
          amount: {
            type: "field",
            supportedRoles: ["numeric"],
            intent: "value",
            aiDescription: "Dollar amount stripped (deals.strippedDarkPatternUsd).",
          },
        },
        formatShape: formatShapeBase,
        form: (p: AgWidgetFormParams) =>
          p.createDefaults({
            dataMappingItems: [
              { key: "quote", label: "Trap Quote" },
              { key: "amount", label: "Stripped USD" },
            ],
          }),
        defaultState: {
          format: {
            title: { enabled: true, text: "Checkout Dark Patterns Stripped Before PayPal Moves a Cent" },
            subtitle: { enabled: true, text: "Exact hidden HTML/CSS warranty traps and scalper bundles caught by PriceLock" },
          },
          dataMapping: {
            quote: [{ id: "deals.darkPatternQuote" }],
            amount: [{ id: "deals.strippedDarkPatternUsd", aggregation: "sum" }],
          },
        },
        comp: DarkPatternsWallWidget,
        defaultSize: { width: 520, height: 320 },
        minSize: { width: 260, height: 200 },
        featureConfig: { crossFilter: { supportsHighlight: false } },
        ai: {
          label: "Dark-Pattern Trap Wall",
          description: "Lists every hidden warranty checkbox, drip fee, and prompt-injection comment stripped from store checkouts.",
          usage: "Use whenever the user asks what tricks stores tried to pull on their shopping agent.",
          configuration: "Map quote to deals.darkPatternQuote and amount to deals.strippedDarkPatternUsd.",
        },
      },
      {
        id: WIDGET_HOLDS,
        label: "PayPal Authorization Hold Cheques",
        dataMapping: {
          sku: {
            type: "field",
            supportedRoles: ["category"],
            intent: "category",
            aiDescription: "Product SKU (deals.sku).",
          },
        },
        formatShape: formatShapeBase,
        form: (p: AgWidgetFormParams) =>
          p.createDefaults({
            dataMappingItems: [{ key: "sku", label: "Product SKU" }],
          }),
        defaultState: {
          format: {
            title: { enabled: true, text: "Active PayPal Orders v2 Authorization Holds (1-Click Capture or Void)" },
            subtitle: { enabled: true, text: "Money stays in your PayPal wallet until you approve Capture or target floor hits" },
          },
          dataMapping: {
            sku: [{ id: "deals.sku" }],
          },
        },
        comp: PayPalHoldsChequeWidget,
        defaultSize: { width: 460, height: 320 },
        minSize: { width: 260, height: 200 },
        ai: {
          label: "PayPal Authorization Hold Cheques",
          description: "Interactive PayPal Orders v2 AUTHORIZE cheques with Capture and Void buttons.",
          usage: "Use to let the shopper sign, capture, or void active PayPal holds directly from the dashboard.",
          configuration: "Map sku to deals.sku.",
        },
      },
    ],
    menu: [
      { label: "PriceLock Custom Widgets", widgetIds: [WIDGET_SANKEY, WIDGET_TRAPS, WIDGET_HOLDS] },
      ...defaults.menu,
    ],
  } as never) as unknown as AgWidgetsConfig;
}
