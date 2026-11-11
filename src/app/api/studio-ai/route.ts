import { NextResponse } from "next/server";
import { getStore } from "@/lib/state";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { prompt?: string };
    const prompt = (body.prompt || "").toLowerCase();
    const store = getStore();
    const totalSaved = store.deals.reduce((s, d) => s + d.totalSavedUsd, 0);
    const totalTraps = store.deals.reduce((s, d) => s + d.strippedDarkPatternUsd, 0);

    let reply = `Across ${store.deals.length} tracked PayPal shopping missions, PriceLock saved **$${totalSaved.toFixed(2)}** total (**$${totalTraps.toFixed(2)}** from stripped checkout dark-pattern add-ons and **$${(totalSaved - totalTraps).toFixed(2)}** from Channel3 cross-retailer price arbitrage).`;

    if (prompt.includes("hold") || prompt.includes("wait") || prompt.includes("sign") || prompt.includes("capture")) {
      const holds = store.deals.filter((d) => d.status === "AUTHORIZED_HOLD");
      reply = `You have **${holds.length} active PayPal AUTHORIZE holds** ready for action: ${holds.map((h) => `${h.title} ($${h.channel3VerifiedPrice.toFixed(2)} via ${h.bestRetailer})`).join("; ")}. Click **Capture Hold at Target** on any cheque card to settle immediately or **Void Hold ($0)** to release.`;
    } else if (prompt.includes("trap") || prompt.includes("dark") || prompt.includes("trick") || prompt.includes("warranty")) {
      reply = `PriceLock's DOM & Vision Surgeon intercepted **${store.deals.length} storefront checkout traps** totaling **$${totalTraps.toFixed(2)}**, including CSS-hidden 2-year warranty checkboxes ($29 on Sony XM5), forced scalper VIP bundles ($115 on Fujifilm X100VI), and auto-checked calibration insurance ($89 on LG 32" OLED).`;
    } else if (prompt.includes("channel3") || prompt.includes("store") || prompt.includes("retailer")) {
      reply = `Channel3's 25,000-retailer price graph beat the first ad-sponsored store on **5 out of 5 SKUs**, led by **LG 32" 4K OLED** ($949 at Adorama vs. $1,217 at MegaTech, saving $268.00) and **Fujifilm X100VI** ($1,549 at Moment vs. $1,839 at CamVault, saving $290.00).`;
    }

    return NextResponse.json({
      ok: true,
      reply,
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: (err as Error).message },
      { status: 500 }
    );
  }
}
