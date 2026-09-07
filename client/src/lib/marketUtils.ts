export type MarketSortKey = "rank" | "change" | "volume" | "liquidity";

export type MarketRecord = {
  rank: number;
  pair: string;
  ticker: string;
  price: string;
  change: number;
  volume: string;
  liquidity: string;
  fdv: string;
  txns: string;
  color: string;
  address: string;
  imageUrl?: string;
};

export function parseCompactNumber(value: string) {
  const normalized = value.replace(/[$,]/g, "").trim().toUpperCase();
  const multiplier = normalized.endsWith("B") ? 1_000_000_000 : normalized.endsWith("M") ? 1_000_000 : normalized.endsWith("K") ? 1_000 : 1;
  return Number.parseFloat(normalized.replace(/[BMK]$/, "")) * multiplier || 0;
}

export function filterAndSortMarkets(markets: MarketRecord[], query: string, sortKey: MarketSortKey) {
  const normalizedQuery = query.trim().toLowerCase();
  return markets
    .filter((market) => !normalizedQuery || `${market.pair} ${market.ticker} ${market.address}`.toLowerCase().includes(normalizedQuery))
    .sort((a, b) => {
      if (sortKey === "change") return b.change - a.change;
      if (sortKey === "volume") return parseCompactNumber(b.volume) - parseCompactNumber(a.volume);
      if (sortKey === "liquidity") return parseCompactNumber(b.liquidity) - parseCompactNumber(a.liquidity);
      return a.rank - b.rank;
    });
}

export function canSubmitBlockchainAction({ walletConnected, userConfirmed }: { walletConnected: boolean; userConfirmed: boolean }) {
  return walletConnected && userConfirmed;
}
