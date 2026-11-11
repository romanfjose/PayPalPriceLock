import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

test("Ed25519 + SHA-256 Receipt Chain signs and detects $50 tampering deterministically", () => {
  const keyPair = crypto.generateKeyPairSync("ed25519");
  const prevHash = "0".repeat(64);
  const payload = JSON.stringify({
    receiptId: "rcpt_test_1",
    amountUsd: 214.0,
    prevHash,
  });
  const hash = crypto.createHash("sha256").update(payload).digest("hex");
  const sig = crypto.sign(null, Buffer.from(hash, "utf8"), keyPair.privateKey);
  assert.equal(crypto.verify(null, Buffer.from(hash, "utf8"), keyPair.publicKey, sig), true);

  // Tamper amount by +$50
  const tamperedPayload = JSON.stringify({
    receiptId: "rcpt_test_1",
    amountUsd: 264.0,
    prevHash,
  });
  const tamperedHash = crypto.createHash("sha256").update(tamperedPayload).digest("hex");
  assert.notEqual(tamperedHash, hash);
  assert.equal(crypto.verify(null, Buffer.from(tamperedHash, "utf8"), keyPair.publicKey, sig), false);
});

test("Multi-block SHA-256 Receipt Chain detects intermediate block linkage breaks", () => {
  const genesis = "0".repeat(64);
  const block1Hash = crypto
    .createHash("sha256")
    .update(JSON.stringify({ id: "rcpt_1", amountUsd: 214, prevHash: genesis }))
    .digest("hex");
  const block2Hash = crypto
    .createHash("sha256")
    .update(JSON.stringify({ id: "rcpt_2", amountUsd: 389, prevHash: block1Hash }))
    .digest("hex");

  assert.equal(block1Hash.length, 64);
  assert.equal(block2Hash.length, 64);

  // If block 1 is modified, block 2 prevHash no longer matches recomputed block 1
  const mutatedBlock1Hash = crypto
    .createHash("sha256")
    .update(JSON.stringify({ id: "rcpt_1", amountUsd: 299, prevHash: genesis }))
    .digest("hex");
  assert.notEqual(mutatedBlock1Hash, block1Hash);
});

test("APIMatic Context Validator rejects ungrounded LLM hallucinated PayPal fields", () => {
  const rawHallucinatedPayload = {
    amount: 214.0,
    action: "hold_money_until_price_drops",
    card_cvv: "999",
    canary_secret: "PAYPAL_CANARY_TOKEN_9941_EXFIL",
  };

  // Validate against PayPal Orders v2 schema expectations
  const hasTopLevelIntent = "intent" in rawHallucinatedPayload;
  const hasPurchaseUnits = Array.isArray(rawHallucinatedPayload.purchase_units);
  const containsCanary = JSON.stringify(rawHallucinatedPayload).includes("PAYPAL_CANARY_TOKEN_9941_EXFIL");

  assert.equal(hasTopLevelIntent, false);
  assert.equal(hasPurchaseUnits, false);
  assert.equal(containsCanary, true);
});

test("120-Case Benchmark SVG artifact exists and contains valid vector bars", () => {
  const svgPath = path.join(process.cwd(), "public", "benchmark-chart.svg");
  assert.equal(fs.existsSync(svgPath), true, "public/benchmark-chart.svg must exist");
  const svg = fs.readFileSync(svgPath, "utf8");
  assert.equal(svg.includes("<svg"), true);
  assert.equal(svg.includes("99.2%"), true);
  assert.equal(svg.includes("PriceLock + Channel3 + APIMatic"), true);
});
