# AG Studio 3.0 & Studio Agent Framework Architecture (`docs/AG-STUDIO.md`)

**PriceLock** embeds **AG Studio 3.0 (`ag-studio@3.0.0` + `ag-studio-react@3.0.0` + `ag-grid-react@36.2.0`)** as an interactive consumer savings and PayPal authorization hold studio at `/dashboard` (and Tab 2 of the main cockpit).

## 1. Three Custom Widget Types Registered via `createWidgets`

Registered in [`src/components/studio/widgets.tsx`](../src/components/studio/widgets.tsx) and listed first under the **`PriceLock Custom Widgets`** menu group in AG Studio's Compose panel:

| Custom Widget ID | Component | What It Renders & How Cross-Filtering Works |
| :--- | :--- | :--- |
| **`pricelock-savings-sankey`** | `SavingsSankeyWidget` | Visualizes every dollar flowing from **1. First Store Checkout Ask** → **2. Dark Patterns Stripped & Channel3 Arbitrage** → **3. PayPal Verified Hold Floor**. Clicking any category pill calls `widgetApi.toggleCrossFilter` on `deals.category`, narrowing every KPI tile, bar chart, and grid in the AG Studio report. |
| **`pricelock-dark-patterns`** | `DarkPatternsWallWidget` | Displays the exact hidden HTML/CSS warranty traps, forced scalper bundles, and prompt-injection comments intercepted on store pages, stamped with the dollar amount stripped. Clicking any trap card cross-filters the entire report to `deals.sku`. |
| **`pricelock-paypal-holds`** | `PayPalHoldsChequeWidget` | Renders active **PayPal Orders v2 `AUTHORIZE` holds** as interactive banking cheques with **1-Click `Capture Hold`** and **`Void Hold ($0.00)`** buttons that execute live PayPal Sandbox state transitions (`POST /api/deals`) and refresh the AG Studio data model in place. |

Each custom widget defines:
- `dataMapping` with typed `supportedRoles` (`"category"`, `"numeric"`) and `aiDescription` strings so Studio's AI agents understand how to map fields automatically.
- `formatShape` validated via `api.defineAiCommand`.
- `form` builder via `p.createDefaults(...)`.
- `ai` metadata (`label`, `description`, `usage`, `configuration`).

## 2. Relational Data Model & Calculated Measure (`src/components/studio/data.ts`)

- **`deals` table:** One row per protected purchase/hold (`sku`, `title`, `category`, `naiveStore`, `bestRetailer`, `msrpPrice`, `naiveCheckoutTotal`, `strippedDarkPatternUsd`, `channel3VerifiedPrice`, `totalSavedUsd`, `status`, `paypalOrderId`, `receiptHash`).
- **`flows` table:** Stage-by-stage money flow linked to `deals` via a `many-to-one` relationship (`flows.dealId` → `deals.id`).
- **Calculated Measure (`savingsRate`):** `divide(sum(deals.totalSavedUsd), sum(deals.naiveCheckoutTotal))` formatted with `percentageFormat`.

## 3. Dual-Theme `studioTheme.withParams` (`src/components/studio/theme.ts`)

Synchronized dynamically with PriceLock's **Warm Sandstone (`data-theme="warm"`)** and **Dracula Obsidian Dark (`data-theme="dark"`)** switcher (`#btn-theme-toggle`), updating canvas surfaces, widget borders, grid headers, and chart palettes without losing editor state.
