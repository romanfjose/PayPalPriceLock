import { NextResponse } from "next/server";
import { getStore, runLiveSideBySideRace } from "@/lib/state";
import { compileWithApimaticContext } from "@/lib/apimatic-context";

export async function GET() {
  const store = getStore();
  return NextResponse.json({
    ok: true,
    latestRace: store.races[0],
    races: store.races,
  });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { query?: string };
    const query = body.query?.trim() || "Sony WH-1000XM5 Wireless Headphones";
    const race = await runLiveSideBySideRace(query);
    const apimatic = compileWithApimaticContext({
      operation: "AUTHORIZE_HOLD",
      skuTitle: race.skuTitle,
      amountUsd: race.priceLockAgent.totalLockedUsd,
      customIdFingerprint: `PL-${race.priceLockAgent.receiptHash.slice(0, 28)}`,
    });
    return NextResponse.json({
      ok: true,
      race,
      apimatic,
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: (err as Error).message || "Race execution failed" },
      { status: 500 }
    );
  }
}
