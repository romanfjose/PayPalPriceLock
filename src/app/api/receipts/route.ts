import { NextResponse } from "next/server";
import { getReceiptVerificationSummary } from "@/lib/state";
import { verifyReceiptChain } from "@/lib/receipts";
import type { CryptographicReceipt } from "@/lib/types";

export async function GET() {
  const summary = getReceiptVerificationSummary();
  return NextResponse.json({
    ok: true,
    ...summary,
  });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { receipts?: CryptographicReceipt[] };
    if (Array.isArray(body.receipts)) {
      const verification = verifyReceiptChain(body.receipts);
      return NextResponse.json({
        ok: true,
        ...verification,
      });
    }
    return NextResponse.json({
      ok: true,
      ...getReceiptVerificationSummary(),
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: (err as Error).message },
      { status: 400 }
    );
  }
}
