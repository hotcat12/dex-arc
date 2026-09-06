import { describe, expect, it } from "vitest";
import { canSubmitBlockchainAction, filterAndSortMarkets, type MarketRecord } from "./marketUtils";

const markets: MarketRecord[] = [
  { rank: 1, pair: "ARC / USDC", ticker: "$ARC", price: "$1", change: 4, volume: "$4M", liquidity: "$8M", fdv: "$1B", txns: "1K", color: "cyan", address: "0xarc" },
  { rank: 2, pair: "WARP / USDC", ticker: "$WARP", price: "$0.1", change: 12, volume: "$2M", liquidity: "$3M", fdv: "$10M", txns: "500", color: "blue", address: "0xwarp" },
];

describe("marketUtils", () => {
  it("filters markets by pair, ticker, or address", () => {
    expect(filterAndSortMarkets(markets, "warp", "rank")).toHaveLength(1);
    expect(filterAndSortMarkets(markets, "0xarc", "rank")[0]?.pair).toBe("ARC / USDC");
  });

  it("sorts by the selected market metric", () => {
    expect(filterAndSortMarkets(markets, "", "change")[0]?.pair).toBe("WARP / USDC");
    expect(filterAndSortMarkets(markets, "", "rank")[0]?.pair).toBe("ARC / USDC");
  });

  it("does not allow blockchain actions without wallet and explicit confirmation", () => {
    expect(canSubmitBlockchainAction({ walletConnected: false, userConfirmed: true })).toBe(false);
    expect(canSubmitBlockchainAction({ walletConnected: true, userConfirmed: false })).toBe(false);
    expect(canSubmitBlockchainAction({ walletConnected: true, userConfirmed: true })).toBe(true);
  });
});
