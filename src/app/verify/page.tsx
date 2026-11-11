import PriceLockCockpit from "@/components/PriceLockCockpit";
import { getStore } from "@/lib/state";
import { PUBLIC_KEY_HEX } from "@/lib/receipts";
import { compileWithApimaticContext } from "@/lib/apimatic-context";

export const dynamic = "force-dynamic";

export default function VerifyPage() {
  const store = getStore();
  const apimatic = compileWithApimaticContext({
    operation: "AUTHORIZE_HOLD",
    skuTitle: store.deals[0].title,
    amountUsd: store.deals[0].channel3VerifiedPrice,
    customIdFingerprint: store.deals[0].paypal.customIdFingerprint,
  });

  return (
    <PriceLockCockpit
      initialDeals={store.deals}
      initialReceipts={store.receipts}
      publicKeyHex={PUBLIC_KEY_HEX}
      initialRace={store.races[0]}
      initialApimatic={apimatic}
      defaultTab="verify"
    />
  );
}
