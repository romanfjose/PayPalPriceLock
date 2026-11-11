import { NextResponse } from "next/server";
import { searchChannel3Catalog } from "@/lib/channel3";
import {
  createPriceLockHoldFromQuery,
  decideHoldAction,
  getReceiptVerificationSummary,
  runLiveSideBySideRace,
} from "@/lib/state";
import { compileWithApimaticContext } from "@/lib/apimatic-context";

/**
 * Live Model Context Protocol (MCP) JSON-RPC 2.0 HTTP Server (`/api/mcp`).
 * Enables Claude Code, Cursor, or any MCP-compatible agent to discover products via Channel3,
 * strip checkout dark patterns, create PayPal Orders v2 AUTHORIZE holds, and verify Ed25519 receipts.
 *
 * Usage: `claude mcp add --transport http pricelock http://localhost:4690/api/mcp`
 */
const MCP_TOOLS = [
  {
    name: "pricelock_search_channel3",
    description:
      "Search Channel3's 100M+ product graph across 25,000+ retailers to find the lowest verified landed price and detect hidden checkout warranty/drip-fee traps.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Product name, SKU, or shopping description." },
      },
      required: ["query"],
    },
  },
  {
    name: "pricelock_create_paypal_hold",
    description:
      "Strip checkout dark patterns and place a scoped PayPal Orders v2 AUTHORIZE price-drop hold sealed with an Ed25519 + SHA-256 cryptographic receipt.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Product to lock on PayPal Sandbox." },
        targetHoldPrice: { type: "number", description: "Optional target ceiling price in USD." },
      },
      required: ["query"],
    },
  },
  {
    name: "pricelock_capture_or_void",
    description:
      "Capture an active PayPal authorization hold once the Channel3 price target is hit, or void the hold so $0.00 is charged.",
    inputSchema: {
      type: "object",
      properties: {
        dealId: { type: "string", description: "Deal ID (e.g. deal_sony_xm5)." },
        decision: { type: "string", enum: ["CAPTURE", "VOID", "REFUND_DROP"] },
      },
      required: ["dealId", "decision"],
    },
  },
  {
    name: "pricelock_run_dark_pattern_race",
    description:
      "Run a side-by-side comparison between an unprotected shopping agent and PriceLock's protected engine with Canary Honeypot detection.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Product query to test." },
      },
      required: ["query"],
    },
  },
  {
    name: "pricelock_verify_receipt_chain",
    description:
      "Verify the SHA-256 hash chain and Ed25519 cryptographic signatures across all PriceLock PayPal receipts.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "pricelock_apimatic_sdk_compile",
    description:
      "Compile a zero-hallucination PayPal Server SDK v2 snippet using the APIMatic Context Plugin and list caught v1 schema hallucinations.",
    inputSchema: {
      type: "object",
      properties: {
        operation: { type: "string", enum: ["AUTHORIZE_HOLD", "CAPTURE_HOLD", "PARTIAL_REFUND"] },
        skuTitle: { type: "string" },
        amountUsd: { type: "number" },
      },
      required: ["operation", "skuTitle", "amountUsd"],
    },
  },
];

export async function GET() {
  return NextResponse.json({
    protocol: "mcp/2025-06-18",
    serverInfo: {
      name: "pricelock-paypal-mcp",
      version: "1.0.0",
      vendor: "ZeroBleed Systems",
    },
    connectCommand: "claude mcp add --transport http pricelock http://localhost:4690/api/mcp",
    tools: MCP_TOOLS,
  });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      jsonrpc?: string;
      id?: string | number | null;
      method?: string;
      params?: Record<string, unknown>;
    };

    const rpcId = body.id ?? 1;

    if (body.method === "initialize") {
      return NextResponse.json({
        jsonrpc: "2.0",
        id: rpcId,
        result: {
          protocolVersion: "2024-11-05",
          capabilities: { tools: {} },
          serverInfo: { name: "pricelock-paypal-mcp", version: "1.0.0" },
        },
      });
    }

    if (body.method === "tools/list") {
      return NextResponse.json({
        jsonrpc: "2.0",
        id: rpcId,
        result: { tools: MCP_TOOLS },
      });
    }

    if (body.method === "tools/call") {
      const toolName = String(body.params?.name || "");
      const args = (body.params?.arguments || {}) as Record<string, unknown>;

      let toolOutput: unknown;
      if (toolName === "pricelock_search_channel3") {
        toolOutput = await searchChannel3Catalog(String(args.query || "Sony WH-1000XM5"));
      } else if (toolName === "pricelock_create_paypal_hold") {
        toolOutput = await createPriceLockHoldFromQuery({
          query: String(args.query || "Sony WH-1000XM5"),
          targetHoldPrice: args.targetHoldPrice ? Number(args.targetHoldPrice) : undefined,
        });
      } else if (toolName === "pricelock_capture_or_void") {
        toolOutput = await decideHoldAction({
          dealId: String(args.dealId || "deal_sony_xm5"),
          decision: (args.decision as "CAPTURE" | "VOID" | "REFUND_DROP") || "CAPTURE",
        });
      } else if (toolName === "pricelock_run_dark_pattern_race") {
        toolOutput = await runLiveSideBySideRace(String(args.query || "Sony WH-1000XM5"));
      } else if (toolName === "pricelock_verify_receipt_chain") {
        toolOutput = getReceiptVerificationSummary();
      } else if (toolName === "pricelock_apimatic_sdk_compile") {
        toolOutput = compileWithApimaticContext({
          operation: (args.operation as "AUTHORIZE_HOLD" | "CAPTURE_HOLD" | "PARTIAL_REFUND") || "AUTHORIZE_HOLD",
          skuTitle: String(args.skuTitle || "Sony WH-1000XM5"),
          amountUsd: Number(args.amountUsd || 214),
          customIdFingerprint: "PL-MCP-CONTEXT-991",
        });
      } else {
        return NextResponse.json({
          jsonrpc: "2.0",
          id: rpcId,
          error: { code: -32601, message: `Unknown MCP tool: ${toolName}` },
        });
      }

      return NextResponse.json({
        jsonrpc: "2.0",
        id: rpcId,
        result: {
          content: [{ type: "text", text: JSON.stringify(toolOutput, null, 2) }],
          isError: false,
        },
      });
    }

    return NextResponse.json({
      jsonrpc: "2.0",
      id: rpcId,
      result: { status: "ready", toolsCount: MCP_TOOLS.length },
    });
  } catch (err) {
    return NextResponse.json(
      {
        jsonrpc: "2.0",
        id: null,
        error: { code: -32603, message: (err as Error).message },
      },
      { status: 500 }
    );
  }
}
