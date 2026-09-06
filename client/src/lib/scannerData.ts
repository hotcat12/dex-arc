export type ScannerMarket = {
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
};

export const fallbackMarkets: ScannerMarket[] = [
  { rank: 1, pair: "ARC / USDC", ticker: "$ARC", price: "$1.0482", change: 12.84, volume: "$4.82M", liquidity: "$12.41M", fdv: "$1.05B", txns: "18.4K", color: "from-cyan-300 to-blue-600", address: "0x8a4e…c91b" },
  { rank: 2, pair: "ARCMOON / USDC", ticker: "$ARCMOON", price: "$0.0846", change: 8.92, volume: "$884.2K", liquidity: "$2.34M", fdv: "$84.6M", txns: "7.2K", color: "from-lime-300 to-emerald-500", address: "0x4f02…aa61" },
  { rank: 3, pair: "PUMP / USDC", ticker: "$PUMP", price: "$0.0100", change: 6.43, volume: "$712.5K", liquidity: "$1.88M", fdv: "$10.0M", txns: "5.8K", color: "from-blue-400 to-violet-500", address: "0x32f1…a8e2" },
  { rank: 4, pair: "WARP / USDC", ticker: "$WARP", price: "$0.1762", change: -2.14, volume: "$492.8K", liquidity: "$1.10M", fdv: "$17.6M", txns: "4.1K", color: "from-indigo-400 to-cyan-400", address: "0x22dc…e044" },
  { rank: 5, pair: "ARCH / USDC", ticker: "$ARCH", price: "$0.0034", change: 18.77, volume: "$388.4K", liquidity: "$642.7K", fdv: "$3.4M", txns: "3.7K", color: "from-fuchsia-400 to-rose-500", address: "0x5042…6650" },
  { rank: 6, pair: "ACT / USDC", ticker: "$ACT", price: "$0.0218", change: 3.62, volume: "$264.6K", liquidity: "$808.5K", fdv: "$21.8M", txns: "2.9K", color: "from-yellow-300 to-orange-500", address: "0x1b2f…c88d" },
  { rank: 7, pair: "PMAV / USDC", ticker: "$PMAV", price: "$0.0009", change: -1.08, volume: "$122.7K", liquidity: "$338.9K", fdv: "$900K", txns: "1.6K", color: "from-sky-300 to-indigo-500", address: "0x12c4…e882" },
];

export async function loadScannerMarkets(signal?: AbortSignal): Promise<ScannerMarket[]> {
  const endpoint = import.meta.env.VITE_ARC_SCANNER_API_URL as string | undefined;
  if (!endpoint) return fallbackMarkets;

  try {
    const response = await fetch(endpoint, { signal, headers: { accept: "application/json" } });
    if (!response.ok) throw new Error(`Scanner provider responded with ${response.status}`);
    const payload = await response.json();
    const rows = Array.isArray(payload) ? payload : payload.markets;
    if (!Array.isArray(rows) || rows.length === 0) throw new Error("Scanner provider returned no markets");
    return rows.map((row, index) => ({
      rank: Number(row.rank ?? index + 1),
      pair: String(row.pair ?? row.symbol ?? "Unknown / USDC"),
      ticker: String(row.ticker ?? row.baseSymbol ?? "UNKNOWN"),
      price: String(row.price ?? "$0.00"),
      change: Number(row.change ?? row.change24h ?? 0),
      volume: String(row.volume ?? row.volume24h ?? "$0"),
      liquidity: String(row.liquidity ?? "$0"),
      fdv: String(row.fdv ?? "$0"),
      txns: String(row.txns ?? row.transactions ?? "0"),
      color: String(row.color ?? "from-cyan-300 to-blue-600"),
      address: String(row.address ?? row.pairAddress ?? "0x—"),
    }));
  } catch (error) {
    console.warn("[Dex ARC] Scanner provider unavailable; using local fallback.", error);
    return fallbackMarkets;
  }
}
