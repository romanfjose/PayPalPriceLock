"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AgStudioAiModule,
  type AgReportState,
  type AgStudioApi,
  type AgStudioMode,
} from "ag-studio";
import { AgStudio, AgStudioProvider } from "ag-studio-react";
import type { PriceLockDeal } from "@/lib/types";
import { buildPriceLockStudioData } from "./data";
import { buildPriceLockStudioTheme } from "./theme";
import { initialPriceLockStudioReport } from "./initial-report";
import { priceLockCustomWidgets, syncCustomWidgetContext } from "./widgets";

const studioModules = [AgStudioAiModule];

const AI_STARTERS = [
  "Where did PriceLock save the most against MSRP?",
  "Which dark-pattern warranty traps were stripped?",
  "Show active PayPal AUTHORIZE holds waiting for capture",
  "Compare Channel3 verified prices vs. first ad-store checkouts",
];

export default function PriceLockStudio({
  deals,
  isDark,
  onDecision,
}: {
  deals: PriceLockDeal[];
  isDark: boolean;
  onDecision: (dealId: string, decision: "CAPTURE" | "VOID" | "REFUND_DROP") => void;
}) {
  const apiRef = useRef<AgStudioApi | null>(null);
  const [mode, setMode] = useState<AgStudioMode>("view");
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiReply, setAiReply] = useState<string>(
    "Studio Agent Ready — Query your PayPal holds, Channel3 retailer price spreads, or stripped checkout dark patterns, or toggle Studio Edit Mode to customize widgets."
  );
  const [aiBusy, setAiBusy] = useState(false);

  useEffect(() => {
    syncCustomWidgetContext(deals, onDecision);
  }, [deals, onDecision]);

  const studioData = useMemo(() => buildPriceLockStudioData(deals), [deals]);
  const theme = useMemo(() => buildPriceLockStudioTheme(isDark), [isDark]);

  const runStudioAgentPrompt = async (promptText: string) => {
    setAiBusy(true);
    setAiPrompt(promptText);
    try {
      const res = await fetch("/api/studio-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: promptText }),
      });
      const data = (await res.json()) as { ok: boolean; reply?: string };
      if (data.reply) setAiReply(data.reply);
    } catch {
      setAiReply("Studio Agent processed the report state locally.");
    } finally {
      setAiBusy(false);
    }
  };

  const resetReportLayout = () => {
    const api = apiRef.current;
    if (api) {
      api.setState(initialPriceLockStudioReport as AgReportState);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Studio Agent Framework & Mode Toolbar */}
      <div className="pl-card-elevated rounded-2xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--pl-paypal-soft)] px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[var(--pl-paypal)]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#0070E0]" />
                AG Studio 3.0 + Studio Agent Framework
              </span>
              <span className="font-mono text-[11px] text-[var(--pl-muted)]">
                ag-studio@3.0.0 • createWidgets()
              </span>
            </div>
            <p className="mt-1.5 text-xs text-[var(--pl-muted)]">
              3 custom domain widgets (Savings Flow Sankey, Dark-Pattern Quote Wall, Interactive PayPal Hold Cheques) cross-filtering live AG Grid &amp; AG Charts.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              id="btn-studio-mode"
              type="button"
              onClick={() => setMode((m) => (m === "view" ? "edit" : "view"))}
              className="cursor-pointer rounded-xl bg-[#0070E0] px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-[#005EA6]"
            >
              {mode === "view" ? "Open Studio Layout Editor" : "Lock Report (View Mode)"}
            </button>
            <button
              type="button"
              onClick={resetReportLayout}
              className="cursor-pointer rounded-xl border border-[var(--pl-border)] bg-[var(--pl-surface-muted)] px-3.5 py-2 text-xs font-semibold transition hover:border-[var(--pl-border-strong)]"
            >
              Restore Default
            </button>
          </div>
        </div>

        {/* Studio Agent Conversational Bar */}
        <div className="mt-4 flex flex-col gap-2.5 border-t border-[var(--pl-border)] pt-3.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--pl-muted)]">
              Agent Queries:
            </span>
            {AI_STARTERS.map((starter, idx) => (
              <button
                key={starter}
                id={`studio-prompt-${idx}`}
                type="button"
                onClick={() => runStudioAgentPrompt(starter)}
                className="cursor-pointer rounded-lg border border-[var(--pl-border)] bg-[var(--pl-surface-muted)] px-2.5 py-1 text-xs font-semibold text-[var(--pl-ink-secondary)] transition hover:border-[#0070E0]/50"
              >
                {starter}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && aiPrompt.trim()) runStudioAgentPrompt(aiPrompt);
              }}
              placeholder="Ask AG Studio Agent about PayPal holds, stripped dark patterns, or Channel3 retailer spreads..."
              className="flex-1 rounded-xl border border-[var(--pl-border)] bg-[var(--pl-surface-muted)] px-3.5 py-2 text-xs font-medium outline-none transition focus:border-[#0070E0] focus:bg-[var(--pl-surface)]"
            />
            <button
              type="button"
              disabled={aiBusy}
              onClick={() => runStudioAgentPrompt(aiPrompt || AI_STARTERS[0])}
              className="cursor-pointer rounded-xl bg-[#0F172A] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#1E293B] disabled:opacity-50 dark:bg-[#10B981] dark:text-[#06130E]"
            >
              {aiBusy ? "Analyzing..." : "Run Agent"}
            </button>
          </div>
          <div className="flex items-start gap-2 rounded-xl border border-emerald-500/20 bg-[var(--pl-accent-soft)] px-3.5 py-2.5 text-xs leading-relaxed">
            <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
            <div>
              <strong className="font-bold text-emerald-800 dark:text-emerald-300">Studio Agent Insights: </strong>
              <span className="text-[var(--pl-ink-secondary)]">{aiReply}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Embedded AG Studio 3.0 Canvas */}
      <div
        className="w-full overflow-hidden rounded-2xl border border-[var(--pl-border)] shadow-sm"
        style={{ height: mode === "edit" ? 960 : 900 }}
      >
        <AgStudioProvider modules={studioModules}>
          <AgStudio
            onStudioReady={(e) => {
              apiRef.current = e.api;
            }}
            data={studioData}
            initialState={initialPriceLockStudioReport}
            mode={mode}
            theme={theme}
            widgets={priceLockCustomWidgets}
            style={{ height: "100%", width: "100%" }}
          />
        </AgStudioProvider>
      </div>
    </div>
  );
}
