export type HoldStatus =
  | "AUTHORIZED_HOLD"
  | "CAPTURED_AT_TARGET"
  | "REFUNDED_PRICE_DROP"
  | "VOIDED_EXPIRED"
  | "BLOCKED_DARK_PATTERN";

export interface RetailerOffer {
  retailer: string;
  url: string;
  listedPrice: number;
  shippingFee: number;
  hiddenCheckoutTrap: number;
  trapDescription: string | null;
  verifiedLandedPrice: number;
  inStock: boolean;
  channel3ProductId: string;
  lastCheckedAt: string;
}

export interface SplitParticipant {
  name: string;
  handle: string;
  shareAmount: number;
  paypalAuthId: string;
  status: "LOCKED" | "CAPTURED" | "VOIDED" | "PENDING";
  lockedAt: string;
}

export interface PricePoint {
  timestamp: string;
  dayLabel: string;
  msrp: number;
  firstStoreCheckout: number;
  channel3Lowest: number;
  targetCeiling: number;
}

export interface CryptographicReceipt {
  receiptId: string;
  sequence: number;
  timestamp: string;
  action: "HOLD_AUTHORIZED" | "DARK_PATTERN_STRIPPED" | "PRICE_DROP_CAPTURED" | "PARTIAL_REFUND_CLAIMED" | "HOLD_VOIDED";
  skuTitle: string;
  paypalOrderId: string;
  paypalAuthOrCaptureId: string;
  amountUsd: number;
  savedUsd: number;
  prevHash: string;
  payloadHash: string;
  signatureEd25519: string;
  publicKeyHex: string;
}

export interface PriceLockDeal {
  id: string;
  sku: string;
  title: string;
  category: "Audio & Studio" | "Computing & Desk" | "Home Espresso" | "Outdoor & Group Gear" | "Camera & Optics";
  imageUrl: string;
  userQuery: string;
  msrpPrice: number;
  naiveStoreName: string;
  naiveCheckoutTotal: number;
  strippedDarkPatternUsd: number;
  darkPatternQuote: string;
  darkPatternCategory: "Hidden Warranty Auto-Add" | "Prompt-Injected VIP Bundle" | "Drip Handling Markup" | "Fake Countdown MSRP Inflation";
  bestRetailer: string;
  channel3VerifiedPrice: number;
  targetHoldPrice: number;
  totalSavedUsd: number;
  status: HoldStatus;
  paypal: {
    mode: "LIVE_SANDBOX" | "DETERMINISTIC_SANDBOX";
    orderId: string;
    authorizationId: string;
    captureId: string | null;
    refundId: string | null;
    customIdFingerprint: string;
    vaultTokenId: string | null;
    createdAt: string;
    expiresAt: string;
    returnWindowEndsAt: string;
  };
  offers: RetailerOffer[];
  priceHistory: PricePoint[];
  splitCrew?: SplitParticipant[];
  receipt: CryptographicReceipt;
}

export interface RaceComparisonResult {
  raceId: string;
  timestamp: string;
  skuTitle: string;
  targetCeilingUsd: number;
  naiveAgent: {
    retailerChosen: string;
    basePriceUsd: number;
    trickedAddonsUsd: number;
    dripFeesUsd: number;
    totalChargedUsd: number;
    promptInjectionFollowed: string;
    canaryTokenExfiltrated: string;
    sinkholeInterceptedUrl: string;
    sdkPayloadStatus: "422_DEPRECATED_V1_SCHEMA";
    latencyMs: number;
  };
  priceLockAgent: {
    retailerChosen: string;
    channel3SearchCount: number;
    basePriceUsd: number;
    strippedAddonsUsd: number;
    totalLockedUsd: number;
    netSavingsUsd: number;
    canaryStatus: "ISOLATED_ZERO_LEAK";
    paypalOrderId: string;
    paypalAuthorizationId: string;
    paypalIntent: "AUTHORIZE";
    apimaticSdkValidated: true;
    receiptHash: string;
    signatureEd25519: string;
    latencyMs: number;
  };
}
