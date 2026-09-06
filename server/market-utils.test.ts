import { describe, expect, it } from "vitest";
import { canSubmitBlockchainAction, filterAndSortMarkets, parseCompactNumber } from "../client/src/lib/marketUtils";
import type { MarketRecord } from "../client/src/lib/marketUtils";

const markets: MarketRecord[] = [
  { rank: 1, pair: "ARC / USDC", ticker: "$ARC", price: "$1", change: 4, volume: "$4M", liquidity: "$8M", fdv: "$1B", txns: "1K", color: "cyan", address: "0xarc" },
  { rank: 2, pair: "WARP / USDC", ticker: "$WARP", price: "$0.1", change: 12, volume: "$2M", liquidity: "$3M", fdv: "$10M", txns: "500", color: "blue", address: "0xwarp" },
];

describe("Dex ARC market helpers", () => {
  it("parses compact numeric strings for sorting", () => {
    expect(parseCompactNumber("$4.82M")).toBe(4_820_000);
    expect(parseCompactNumber("$900K")).toBe(900_000);
  });

  it("filters and sorts markets", () => {
    expect(filterAndSortMarkets(markets, "warp", "rank")).toHaveLength(1);
    expect(filterAndSortMarkets(markets, "", "change")[0]?.pair).toBe("WARP / USDC");
    expect(filterAndSortMarkets(markets, "", "volume")[0]?.pair).toBe("ARC / USDC");
  });

  it("requires both a connected wallet and explicit confirmation", () => {
    expect(canSubmitBlockchainAction({ walletConnected: false, userConfirmed: true })).toBe(false);
    expect(canSubmitBlockchainAction({ walletConnected: true, userConfirmed: false })).toBe(false);
    expect(canSubmitBlockchainAction({ walletConnected: true, userConfirmed: true })).toBe(true);
  });
});
