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

export type LivePool = {
  address: string;
  pairName: string;
  priceUsd: number | null;
  change24h: number;
  volume24hUsd: number;
  liquidityUsd: number | null;
  fdvUsd: number | null;
  swaps24h: number;
  baseToken: { address: string; name: string; symbol: string; decimals: number };
  quoteToken: { address: string; name: string; symbol: string; decimals: number };
  protocol?: string;
  lastSwapAt?: string;
};

const AX_API = "https://www.arcexplorer.org/api/v1";
const configuredEndpoint = () => (import.meta.env.VITE_ARC_SCANNER_API_URL as string | undefined)?.trim() || `${AX_API}/dex/pools`;

export const fallbackMarkets: ScannerMarket[] = [
  { rank: 1, pair: "ARC / USDC", ticker: "$ARC", price: "$1.0482", change: 12.84, volume: "$4.82M", liquidity: "$12.41M", fdv: "$1.05B", txns: "18.4K", color: "from-cyan-300 to-blue-600", address: "0x8a4e…c91b" },
  { rank: 2, pair: "ARCMOON / USDC", ticker: "$ARCMOON", price: "$0.0846", change: 8.92, volume: "$884.2K", liquidity: "$2.34M", fdv: "$84.6M", txns: "7.2K", color: "from-lime-300 to-emerald-500", address: "0x4f02…aa61" },
  { rank: 3, pair: "PUMP / USDC", ticker: "$PUMP", price: "$0.0100", change: 6.43, volume: "$712.5K", liquidity: "$1.88M", fdv: "$10.0M", txns: "5.8K", color: "from-blue-400 to-violet-500", address: "0x32f1…a8e2" },
  { rank: 4, pair: "WARP / USDC", ticker: "$WARP", price: "$0.1762", change: -2.14, volume: "$492.8K", liquidity: "$1.10M", fdv: "$17.6M", txns: "4.1K", color: "from-indigo-400 to-cyan-400", address: "0x22dc…e044" },
  { rank: 5, pair: "ARCH / USDC", ticker: "$ARCH", price: "$0.0034", change: 18.77, volume: "$388.4K", liquidity: "$642.7K", fdv: "$3.4M", txns: "3.7K", color: "from-fuchsia-400 to-rose-500", address: "0x5042…6650" },
  { rank: 6, pair: "ACT / USDC", ticker: "$ACT", price: "$0.0218", change: 3.62, volume: "$264.6K", liquidity: "$808.5K", fdv: "$21.8M", txns: "2.9K", color: "from-yellow-300 to-orange-500", address: "0x1b2f…c88d" },
  { rank: 7, pair: "PMAV / USDC", ticker: "$PMAV", price: "$0.0009", change: -1.08, volume: "$122.7K", liquidity: "$338.9K", fdv: "$900K", txns: "1.6K", color: "from-sky-300 to-indigo-500", address: "0x12c4…e882" },
];

function money(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return "—";
  if (Math.abs(value) >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (Math.abs(value) >= 1_000) return `$${(value / 1_000).toFixed(2)}K`;
  return `$${value.toFixed(value < 1 ? 6 : 2)}`;
}

function normalizePool(row: any, index: number): LivePool {
  return {
    address: String(row.address ?? row.pairAddress ?? ""),
    pairName: String(row.pairName ?? `${row.baseToken?.symbol ?? "TOKEN"} / ${row.quoteToken?.symbol ?? "USDC"}`),
    priceUsd: row.priceUsd == null ? null : Number(row.priceUsd),
    change24h: Number(row.change24h ?? row.change ?? 0),
    volume24hUsd: Number(row.volume24hUsd ?? row.volume?.h24 ?? row.volume24h ?? 0),
    liquidityUsd: row.liquidityUsd == null ? null : Number(row.liquidityUsd ?? row.liquidity?.usd),
    fdvUsd: row.fdvUsd == null ? null : Number(row.fdvUsd ?? row.fdv),
    swaps24h: Number(row.swaps24h ?? row.txns?.h24 ?? row.transactions ?? 0),
    baseToken: { address: String(row.baseToken?.address ?? ""), name: String(row.baseToken?.name ?? "Unknown"), symbol: String(row.baseToken?.symbol ?? "TOKEN"), decimals: Number(row.baseToken?.decimals ?? 18) },
    quoteToken: { address: String(row.quoteToken?.address ?? ""), name: String(row.quoteToken?.name ?? "Unknown"), symbol: String(row.quoteToken?.symbol ?? "USDC"), decimals: Number(row.quoteToken?.decimals ?? 6) },
    protocol: row.protocol,
    lastSwapAt: row.lastSwapAt,
  };
}

function poolToMarket(pool: LivePool, index: number): ScannerMarket {
  return { rank: index + 1, pair: pool.pairName.replace("/", " / "), ticker: `$${pool.baseToken.symbol}`, price: money(pool.priceUsd), change: pool.change24h, volume: money(pool.volume24hUsd), liquidity: money(pool.liquidityUsd), fdv: money(pool.fdvUsd), txns: pool.swaps24h.toLocaleString(), color: index % 2 ? "from-lime-300 to-emerald-500" : "from-cyan-300 to-blue-600", address: pool.address };
}

async function getJson(url: string, signal?: AbortSignal) {
  const response = await fetch(url, { signal, headers: { accept: "application/json" } });
  if (!response.ok) throw new Error(`Scanner provider responded with ${response.status}`);
  return response.json();
}

export async function loadLivePools(query = "", signal?: AbortSignal): Promise<LivePool[]> {
  const endpoint = configuredEndpoint();
  const url = endpoint.includes("?") ? `${endpoint}&limit=100&offset=0&q=${encodeURIComponent(query)}` : `${endpoint}?limit=100&offset=0&sort=trending&order=desc&minLiquidity=0&q=${encodeURIComponent(query)}`;
  const payload = await getJson(url, signal);
  const rows = Array.isArray(payload) ? payload : payload.items ?? payload.pools ?? payload.markets;
  if (!Array.isArray(rows)) throw new Error("Scanner provider returned an invalid pool response");
  return rows.map(normalizePool).filter((pool: LivePool) => pool.address);
}

export async function loadScannerMarkets(signal?: AbortSignal): Promise<ScannerMarket[]> {
  try {
    const pools = await loadLivePools("", signal);
    if (!pools.length) throw new Error("Scanner provider returned no markets");
    return pools.map(poolToMarket);
  } catch (error) {
    console.warn("[Dex ARC] Scanner provider unavailable; using local fallback.", error);
    return fallbackMarkets;
  }
}

export async function loadPoolsForToken(address: string, signal?: AbortSignal) {
  const pools = await loadLivePools(address, signal);
  return pools.sort((a, b) => (b.liquidityUsd ?? 0) - (a.liquidityUsd ?? 0));
}

export { money, poolToMarket };
