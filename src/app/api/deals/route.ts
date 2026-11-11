import { NextResponse } from "next/server";
import { createPriceLockHoldFromQuery, decideHoldAction, getStore, resetStore } from "@/lib/state";
import { compileWithApimaticContext } from "@/lib/apimatic-context";

export async function GET() {
  const store = getStore();
  const totalSavedUsd = store.deals.reduce((acc, d) => acc + d.totalSavedUsd, 0);
  const totalStrippedTrapsUsd = store.deals.reduce((acc, d) => acc + d.strippedDarkPatternUsd, 0);
  const activeHoldCount = store.deals.filter((d) => d.status === "AUTHORIZED_HOLD").length;

  return NextResponse.json({
    ok: true,
    summary: {
      totalDeals: store.deals.length,
      activeHoldCount,
      totalSavedUsd: Number(totalSavedUsd.toFixed(2)),
      totalStrippedTrapsUsd: Number(totalStrippedTrapsUsd.toFixed(2)),
    },
    deals: store.deals,
  });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      action?: "CREATE_HOLD" | "DECIDE_HOLD" | "RESET";
      query?: string;
      targetHoldPrice?: number;
      dealId?: string;
      decision?: "CAPTURE" | "VOID" | "REFUND_DROP";
    };

    if (body.action === "RESET") {
      const store = resetStore();
      return NextResponse.json({ ok: true, deals: store.deals });
    }

    if (body.action === "DECIDE_HOLD" && body.dealId && body.decision) {
      const { deal, receipt } = await decideHoldAction({
        dealId: body.dealId,
        decision: body.decision,
      });
      const apimaticReport = compileWithApimaticContext({
        operation:
          body.decision === "CAPTURE"
            ? "CAPTURE_HOLD"
            : body.decision === "REFUND_DROP"
            ? "PARTIAL_REFUND"
            : "AUTHORIZE_HOLD",
        skuTitle: deal.title,
        amountUsd: deal.channel3VerifiedPrice,
        customIdFingerprint: deal.paypal.customIdFingerprint,
      });
      return NextResponse.json({ ok: true, deal, receipt, apimaticReport });
    }

    const query = body.query?.trim() || "Sony WH-1000XM5 Wireless Headphones";
    const { deal, aiAnalysis } = await createPriceLockHoldFromQuery({
      query,
      targetHoldPrice: body.targetHoldPrice,
    });
    const apimaticReport = compileWithApimaticContext({
      operation: "AUTHORIZE_HOLD",
      skuTitle: deal.title,
      amountUsd: deal.channel3VerifiedPrice,
      customIdFingerprint: deal.paypal.customIdFingerprint,
    });

    return NextResponse.json({
      ok: true,
      deal,
      aiAnalysis,
      apimaticReport,
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: (err as Error).message || "Internal error" },
      { status: 500 }
    );
  }
}
