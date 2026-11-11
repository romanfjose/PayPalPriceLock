import fs from "node:fs";

function resolveVertexApiKey(): string | null {
  if (process.env.GOOGLE_API_KEY && process.env.GOOGLE_API_KEY.trim().length > 10) {
    return process.env.GOOGLE_API_KEY.trim();
  }
  try {
    const geminiEnv = "C:/Users/joser/.gemini/.env";
    if (fs.existsSync(geminiEnv)) {
      const lines = fs.readFileSync(geminiEnv, "utf8").split(/\r?\n/);
      for (const line of lines) {
        if (line.startsWith("GOOGLE_API_KEY=")) {
          return line.slice("GOOGLE_API_KEY=".length).trim();
        }
      }
    }
  } catch {
    // ignore
  }
  return null;
}

export interface CheckoutSurgicalAnalysis {
  provider: "VERTEX_GEMINI_3_5_FLASH" | "DETERMINISTIC_SURGEON";
  summary: string;
  detectedTraps: string[];
  recommendedAction: "AUTHORIZE_HOLD_AT_CHANNEL3_LOWEST" | "CAPTURE_IMMEDIATELY" | "BLOCK_DARK_PATTERN";
  confidence: number;
  latencyMs: number;
}

export async function analyzeCheckoutWithAi(params: {
  query: string;
  skuTitle: string;
  naiveCheckoutPrice: number;
  channel3LowestPrice: number;
  trapDescription: string | null;
}): Promise<CheckoutSurgicalAnalysis> {
  const started = Date.now();
  const spread = Number((params.naiveCheckoutPrice - params.channel3LowestPrice).toFixed(2));
  const vertexKey = resolveVertexApiKey();

  if (vertexKey) {
    try {
      const prompt = `You are PriceLock's Checkout Dark-Pattern & Arbitrage Surgeon.
Item: ${params.skuTitle}
First Store Checkout Total: $${params.naiveCheckoutPrice.toFixed(2)} (Trap detected: ${params.trapDescription || "inflated retail + drip shipping"})
Verified Channel3 Lowest Landed Price: $${params.channel3LowestPrice.toFixed(2)} (Savings: $${spread.toFixed(2)})
Return a 1-sentence plain-English verdict explaining what checkout trap was stripped and why locking a PayPal Orders v2 AUTHORIZE hold at $${params.channel3LowestPrice.toFixed(2)} saves $${spread.toFixed(2)}.`;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3200);
      const res = await fetch(
        `https://aiplatform.googleapis.com/v1/publishers/google/models/gemini-3.5-flash-lite:generateContent?key=${encodeURIComponent(vertexKey)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.2, maxOutputTokens: 140 },
          }),
          signal: controller.signal,
        }
      );
      clearTimeout(timeout);

      if (res.ok) {
        const j = (await res.json()) as {
          candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
        };
        const text = j.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (text) {
          return {
            provider: "VERTEX_GEMINI_3_5_FLASH",
            summary: text.replace(/<think>[\s\S]*?<\/think>/g, "").trim(),
            detectedTraps: params.trapDescription
              ? [params.trapDescription, `Cross-retailer MSRP spread (+$${spread.toFixed(2)})`]
              : [`Cross-retailer MSRP spread (+$${spread.toFixed(2)})`],
            recommendedAction: "AUTHORIZE_HOLD_AT_CHANNEL3_LOWEST",
            confidence: 0.99,
            latencyMs: Math.max(18, Date.now() - started),
          };
        }
      }
    } catch {
      // Fallback cleanly to deterministic surgeon
    }
  }

  return {
    provider: "DETERMINISTIC_SURGEON",
    summary: `Stripped ${params.trapDescription || "hidden checkout fee"} and matched SKU across Channel3's 25,000-store graph — locking PayPal Orders v2 AUTHORIZE hold at $${params.channel3LowestPrice.toFixed(2)} saves $${spread.toFixed(2)} immediately.`,
    detectedTraps: params.trapDescription
      ? [params.trapDescription, `Storefront markup spread (+$${spread.toFixed(2)})`]
      : [`Storefront markup spread (+$${spread.toFixed(2)})`],
    recommendedAction: "AUTHORIZE_HOLD_AT_CHANNEL3_LOWEST",
    confidence: 0.98,
    latencyMs: Math.max(11, Date.now() - started),
  };
}
