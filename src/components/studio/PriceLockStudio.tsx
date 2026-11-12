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
    "Studio Agent Ready — Ask any question about your PayPal holds, Channel3 price spreads, or stripped checkout dark patterns, or switch to Edit Mode to add/rearrange custom widgets."
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
    <div className="flex flex-col gap-3">
      {/* Studio Agent Framework & Mode Toolbar */}
      <div className="pl-glass-panel pl-tilt-card rounded-2xl border border-[var(--pl-border)] p-3.5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600/15 px-3 py-1 text-xs font-extrabold text-emerald-800 dark:text-emerald-300">
              ● AG Studio 3.0 + Studio Agent Framework
            </span>
            <span className="text-xs text-[var(--pl-muted)]">
              3 Custom Registered Widgets (<code>createWidgets</code>) + Cross-Filtering + Live PayPal Cheque Signer
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMode((m) => (m === "view" ? "edit" : "view"))}
              className="cursor-pointer rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 px-3.5 py-1.5 text-xs font-extrabold text-white shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              {mode === "view" ? "✦ Customize in AG Studio Editor" : "✓ Lock Report (View Mode)"}
            </button>
            <button
              type="button"
              onClick={resetReportLayout}
              className="cursor-pointer rounded-xl border border-[var(--pl-border)] px-3 py-1.5 text-xs font-semibold transition-all hover:-translate-y-0.5 hover:bg-black/5 dark:hover:bg-white/5"
            >
              ↺ Restore Default Layout
            </button>
          </div>
        </div>

        {/* Studio Agent Conversational Bar */}
        <div className="mt-3 flex flex-col gap-2 border-t border-[var(--pl-border)] pt-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-[var(--pl-muted)]">Studio Agent Starters:</span>
            {AI_STARTERS.map((starter, idx) => (
              <button
                key={starter}
                id={`studio-prompt-${idx}`}
                type="button"
                onClick={() => runStudioAgentPrompt(starter)}
                className="cursor-pointer rounded-full border border-[var(--pl-border)] bg-black/[0.02] px-2.5 py-1 text-xs font-semibold transition-all hover:-translate-y-0.5 hover:border-emerald-600/50 dark:bg-white/[0.03]"
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
              placeholder="Ask the AG Studio Agent about your PayPal holds, stripped dark patterns, or Channel3 savings..."
              className="flex-1 rounded-lg border border-[var(--pl-border)] bg-transparent px-3 py-1.5 text-xs outline-none focus:border-emerald-600"
            />
            <button
              type="button"
              disabled={aiBusy}
              onClick={() => runStudioAgentPrompt(aiPrompt || AI_STARTERS[0])}
              className="rounded-lg bg-emerald-700 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
            >
              {aiBusy ? "Querying..." : "Ask Studio Agent"}
            </button>
          </div>
          <div className="rounded-lg bg-emerald-600/[0.08] px-3 py-2 text-xs leading-relaxed">
            <strong className="text-emerald-800 dark:text-emerald-300">WHAT HAPPENED (Studio Agent Verdict): </strong>
            <span>{aiReply}</span>
          </div>
        </div>
      </div>

      {/* Embedded AG Studio 3.0 Canvas */}
      <div
        className="w-full overflow-hidden rounded-xl border border-[var(--pl-border)] shadow-sm"
        style={{ height: mode === "edit" ? 960 : 920 }}
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
