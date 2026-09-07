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
  imageUrl?: string;
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
  baseToken: { address: string; name: string; symbol: string; decimals: number; imageUrl?: string };
  quoteToken: { address: string; name: string; symbol: string; decimals: number; imageUrl?: string };
  protocol?: string;
  lastSwapAt?: string;
};

export type PoolChartPoint = { timestamp: number; value: number; volume?: number };

const AX_API = "/api/arc";
const configuredEndpoint = () => (import.meta.env.VITE_ARC_SCANNER_API_URL as string | undefined)?.trim() || `${AX_API}/pools`;

function money(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return "—";
  if (Math.abs(value) >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (Math.abs(value) >= 1_000) return `$${(value / 1_000).toFixed(2)}K`;
  return `$${value.toFixed(value < 1 ? 6 : 2)}`;
}

export function tokenImageUrl(token: any) {
  return token?.imageUrl ?? token?.logoURI ?? token?.logo ?? token?.icon ?? undefined;
}

function normalizePool(row: any): LivePool {
  return {
    address: String(row.address ?? row.pairAddress ?? row.poolAddress ?? ""),
    pairName: String(row.pairName ?? row.name ?? `${row.baseToken?.symbol ?? "TOKEN"} / ${row.quoteToken?.symbol ?? "USDC"}`),
    priceUsd: row.priceUsd == null ? null : Number(row.priceUsd),
    change24h: Number(row.change24h ?? row.change ?? row.priceChange?.h24 ?? 0),
    volume24hUsd: Number(row.volume24hUsd ?? row.volume?.h24 ?? row.volume24h ?? 0),
    liquidityUsd: row.liquidityUsd == null && row.liquidity?.usd == null ? null : Number(row.liquidityUsd ?? row.liquidity?.usd),
    fdvUsd: row.fdvUsd == null && row.fdv == null ? null : Number(row.fdvUsd ?? row.fdv),
    swaps24h: Number(row.swaps24h ?? row.txns?.h24 ?? row.transactions ?? 0),
    baseToken: { address: String(row.baseToken?.address ?? row.baseTokenAddress ?? ""), name: String(row.baseToken?.name ?? "Unknown"), symbol: String(row.baseToken?.symbol ?? "TOKEN"), decimals: Number(row.baseToken?.decimals ?? 18), imageUrl: tokenImageUrl(row.baseToken) },
    quoteToken: { address: String(row.quoteToken?.address ?? row.quoteTokenAddress ?? ""), name: String(row.quoteToken?.name ?? "Unknown"), symbol: String(row.quoteToken?.symbol ?? "USDC"), decimals: Number(row.quoteToken?.decimals ?? 6), imageUrl: tokenImageUrl(row.quoteToken) },
    protocol: row.protocol ?? row.dex ?? row.exchange,
    lastSwapAt: row.lastSwapAt ?? row.updatedAt,
  };
}

function poolToMarket(pool: LivePool, index: number): ScannerMarket {
  return { rank: index + 1, pair: pool.pairName.replace("/", " / "), ticker: `$${pool.baseToken.symbol}`, price: money(pool.priceUsd), change: pool.change24h, volume: money(pool.volume24hUsd), liquidity: money(pool.liquidityUsd), fdv: money(pool.fdvUsd), txns: pool.swaps24h.toLocaleString(), color: index % 2 ? "from-lime-300 to-emerald-500" : "from-cyan-300 to-blue-600", address: pool.address, imageUrl: pool.baseToken.imageUrl };
}

async function getJson(url: string, signal?: AbortSignal) {
  const response = await fetch(url, { signal, headers: { accept: "application/json" } });
  if (!response.ok) throw new Error(`Scanner provider responded with ${response.status}`);
  return response.json();
}

function extractRows(payload: any) {
  const rows = Array.isArray(payload) ? payload : payload.items ?? payload.pools ?? payload.markets ?? payload.data;
  if (!Array.isArray(rows)) throw new Error("Scanner provider returned an invalid pool response");
  return rows;
}

export async function loadLivePools(query = "", signal?: AbortSignal): Promise<LivePool[]> {
  const endpoint = configuredEndpoint();
  const url = endpoint.includes("?") ? `${endpoint}&limit=100&offset=0&q=${encodeURIComponent(query)}` : `${endpoint}?limit=100&offset=0&sort=trending&order=desc&minLiquidity=0&q=${encodeURIComponent(query)}`;
  return extractRows(await getJson(url, signal)).map(normalizePool).filter((pool: LivePool) => pool.address);
}

export async function loadScannerMarkets(signal?: AbortSignal): Promise<ScannerMarket[]> {
  const pools = await loadLivePools("", signal);
  return pools.map(poolToMarket);
}

export async function loadPoolsForToken(address: string, signal?: AbortSignal) {
  const pools = await loadLivePools(address, signal);
  return pools.filter((pool) => pool.baseToken.address.toLowerCase() === address.toLowerCase() || pool.quoteToken.address.toLowerCase() === address.toLowerCase() || pool.address.toLowerCase() === address.toLowerCase()).sort((a, b) => (b.liquidityUsd ?? 0) - (a.liquidityUsd ?? 0));
}

export async function loadPoolChart(poolAddress: string, signal?: AbortSignal): Promise<PoolChartPoint[]> {
  const payload = await getJson(`${AX_API}/pools/${encodeURIComponent(poolAddress)}?days=all&interval=15m`, signal);
  const rows = Array.isArray(payload) ? payload : payload.candles ?? payload.points ?? payload.data ?? payload.chart ?? payload.history ?? [];
  if (!Array.isArray(rows)) return [];
  return rows.map((row: any) => ({ timestamp: typeof (row.timestamp ?? row.time ?? row.t) === "string" ? Date.parse(row.timestamp ?? row.time ?? row.t) : Number(row.timestamp ?? row.time ?? row.t ?? 0), value: Number(row.close ?? row.priceUsd ?? row.price ?? row.value ?? 0), volume: row.volumeUsd == null && row.volume == null ? undefined : Number(row.volumeUsd ?? row.volume) })).filter((point: PoolChartPoint) => Number.isFinite(point.timestamp) && Number.isFinite(point.value) && point.value > 0);
}

export function hasUsableChart(points: PoolChartPoint[]) {
  return points.length > 1 && points.every((point) => Number.isFinite(point.value) && point.value > 0);
}

export { money, normalizePool, poolToMarket };
