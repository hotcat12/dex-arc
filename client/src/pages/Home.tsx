import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowDownRight,
  ArrowRightLeft,
  ArrowUpRight,
  BarChart3,
  Check,
  ChevronDown,
  CircleDollarSign,
  Clock3,
  Copy,
  Droplets,
  ExternalLink,
  Globe2,
  Layers3,
  Menu,
  Network,
  PanelTop,
  RefreshCw,
  Search,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  TrendingUp,
  Wallet,
  X,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation, useRoute } from "wouter";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { canSubmitBlockchainAction, filterAndSortMarkets } from "@/lib/marketUtils";
import { hasUsableChart, loadPoolChart, loadPoolsForToken, loadScannerMarkets, poolToMarket, type LivePool, type PoolChartPoint, type ScannerMarket } from "@/lib/scannerData";
import { ARC_MAINNET_ENABLED, connectInjectedWallet, getInjectedProvider, switchInjectedChain } from "@/lib/web3";
import { ARC_CHAIN_ID, BSC_CHAIN_ID, getArcV3Quote, getLifiQuote, type LifiQuote } from "@/lib/lifi";
import { type BridgeStatus } from "@/lib/lifiState";
import { allowanceCallData, allowanceNeedsApproval, approveCallData, isNativeToken } from "@/lib/approval";
import { fetchTokenMetadata, type TokenMetadata } from "@/lib/tokenData";


/* const markets = [
  { rank: 1, pair: "ARC / USDC", ticker: "$ARC", price: "$1.0482", change: 12.84, volume: "$4.82M", liquidity: "$12.41M", fdv: "$1.05B", txns: "18.4K", color: "from-cyan-300 to-blue-600", address: "0x8a4e…c91b" },
  { rank: 2, pair: "ARCMOON / USDC", ticker: "$ARCMOON", price: "$0.0846", change: 8.92, volume: "$884.2K", liquidity: "$2.34M", fdv: "$84.6M", txns: "7.2K", color: "from-lime-300 to-emerald-500", address: "0x4f02…aa61" },
  { rank: 3, pair: "PUMP / USDC", ticker: "$PUMP", price: "$0.0100", change: 6.43, volume: "$712.5K", liquidity: "$1.88M", fdv: "$10.0M", txns: "5.8K", color: "from-blue-400 to-violet-500", address: "0x32f1…a8e2" },
  { rank: 4, pair: "WARP / USDC", ticker: "$WARP", price: "$0.1762", change: -2.14, volume: "$492.8K", liquidity: "$1.10M", fdv: "$17.6M", txns: "4.1K", color: "from-indigo-400 to-cyan-400", address: "0x22dc…e044" },
  { rank: 5, pair: "ARCH / USDC", ticker: "$ARCH", price: "$0.0034", change: 18.77, volume: "$388.4K", liquidity: "$642.7K", fdv: "$3.4M", txns: "3.7K", color: "from-fuchsia-400 to-rose-500", address: "0x5042…6650" },
  { rank: 6, pair: "ACT / USDC", ticker: "$ACT", price: "$0.0218", change: 3.62, volume: "$264.6K", liquidity: "$808.5K", fdv: "$21.8M", txns: "2.9K", color: "from-yellow-300 to-orange-500", address: "0x1b2f…c88d" },
  { rank: 7, pair: "PMAV / USDC", ticker: "$PMAV", price: "$0.0009", change: -1.08, volume: "$122.7K", liquidity: "$338.9K", fdv: "$900K", txns: "1.6K", color: "from-sky-300 to-indigo-500", address: "0x12c4…e882" },
];

*/
const emptyMarket: ScannerMarket = { rank: 0, pair: "No live pair selected", ticker: "", price: "—", change: 0, volume: "—", liquidity: "—", fdv: "—", txns: "—", color: "from-slate-700 to-slate-800", address: "", imageUrl: undefined };

function formatWallet(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function Sparkline({ positive = true }: { positive?: boolean }) {
  return (
    <svg viewBox="0 0 180 58" className={`h-12 w-full ${positive ? "text-cyan-300" : "text-rose-300"}`} preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={positive ? "sparkUp" : "sparkDown"} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity=".28" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={positive ? "M0 47 L12 42 L24 44 L37 33 L50 37 L62 28 L75 31 L87 19 L100 23 L114 12 L128 20 L141 14 L154 19 L168 5 L180 8 V58 H0 Z" : "M0 12 L12 18 L24 14 L37 28 L50 21 L62 32 L75 27 L87 40 L100 33 L114 44 L128 37 L141 49 L154 43 L168 53 L180 48 V58 H0 Z"} fill={`url(#${positive ? "sparkUp" : "sparkDown"})`} />
      <path d={positive ? "M0 47 L12 42 L24 44 L37 33 L50 37 L62 28 L75 31 L87 19 L100 23 L114 12 L128 20 L141 14 L154 19 L168 5 L180 8" : "M0 12 L12 18 L24 14 L37 28 L50 21 L62 32 L75 27 L87 40 L100 33 L114 44 L128 37 L141 49 L154 43 L168 53 L180 48"} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TokenAvatar({ imageUrl, ticker, className = "h-full w-full" }: { imageUrl?: string; ticker?: string; className?: string }) {
  const [imageFailed, setImageFailed] = useState(false);
  const label = (ticker || "TOKEN").replace(/[^a-z0-9]/gi, "").slice(0, 2).toUpperCase() || "TK";
  return (
    <div className={`relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-cyan-300/80 via-blue-500/80 to-lime-300/80 text-[10px] font-black text-slate-950 ${className}`} aria-label={`${ticker || "Token"} token image`}>
      {imageUrl && !imageFailed ? <img src={imageUrl} alt={`${ticker || "Token"} token logo`} className="h-full w-full object-cover" onError={() => setImageFailed(true)} /> : <><span className="absolute inset-0 opacity-30 [background-image:linear-gradient(135deg,rgba(255,255,255,.7)_12%,transparent_12%,transparent_50%,rgba(255,255,255,.7)_50%,rgba(255,255,255,.7)_62%,transparent_62%)] [background-size:10px_10px]" /><span className="relative">{label}</span></>}
    </div>
  );
}

function LogoMark() {
  return (
    <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-cyan-200/30 bg-slate-950 shadow-[0_0_30px_rgba(45,212,191,.14)]" aria-label="Dex ARC logo">
      <svg viewBox="0 0 40 40" className="h-full w-full" role="img" aria-label="Dex ARC logo">
        <defs>
          <linearGradient id="dexArcLogo" x1="4" y1="4" x2="36" y2="36" gradientUnits="userSpaceOnUse">
            <stop stopColor="#67e8f9" />
            <stop offset=".55" stopColor="#22d3ee" />
            <stop offset="1" stopColor="#a3e635" />
          </linearGradient>
        </defs>
        <path d="M9 6h10.5C28.6 6 34 11.2 34 20s-5.4 14-14.5 14H9V6Z" fill="url(#dexArcLogo)" />
        <path d="M15 12v16h4.2c5.7 0 8.8-2.7 8.8-8s-3.1-8-8.8-8H15Z" fill="#071014" />
        <path d="M5 10v20" stroke="#a3e635" strokeWidth="3" strokeLinecap="round" />
      </svg>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-cyan-300/20 via-transparent to-lime-300/20 mix-blend-screen" />
    </div>
  );
}

function MetricCard({ label, value, delta, icon: Icon, accent = "cyan" }: { label: string; value: string; delta: string; icon: typeof Activity; accent?: "cyan" | "lime" | "blue" }) {
  const colors = { cyan: "text-cyan-300 bg-cyan-300/10 border-cyan-300/20", lime: "text-lime-300 bg-lime-300/10 border-lime-300/20", blue: "text-blue-300 bg-blue-300/10 border-blue-300/20" };
  return <div className="glass-card group relative overflow-hidden rounded-2xl p-4 transition duration-200 hover:-translate-y-0.5 hover:border-white/20"><div className={`mb-4 flex h-9 w-9 items-center justify-center rounded-xl border ${colors[accent]}`}><Icon size={17} /></div><p className="text-[11px] font-medium uppercase tracking-[.18em] text-slate-500">{label}</p><div className="mt-1 flex items-end justify-between gap-3"><p className="text-xl font-semibold tracking-tight text-white">{value}</p><span className="text-xs font-semibold text-lime-300">{delta}</span></div><div className="pointer-events-none absolute -right-7 -top-7 h-20 w-20 rounded-full bg-cyan-400/5 blur-2xl transition group-hover:bg-cyan-400/10" /></div>;
}

export default function Home() {
  const [activeView, setActiveView] = useState("Overview");
  const [, navigate] = useLocation();
  const [, pairParams] = useRoute("/pair/:address");
  const [activeTool, setActiveTool] = useState<"swap" | "bridge">("swap");
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<"rank" | "change" | "volume" | "liquidity">("rank");
  const [selectedPair, setSelectedPair] = useState<ScannerMarket>(emptyMarket);
  const [wallet, setWallet] = useState<string | null>(null);
  const [walletIsArc, setWalletIsArc] = useState(false);
  const [walletChainId, setWalletChainId] = useState("");
  const [walletDialog, setWalletDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [mobileNav, setMobileNav] = useState(false);
  const [fromToken, setFromToken] = useState("USDC");
  const [toToken, setToToken] = useState("ARC");
  const [fromChain, setFromChain] = useState("Ethereum");
  const [toChain, setToChain] = useState("ARC Mainnet");
  const [slippage, setSlippage] = useState("0.50");
  const [bridgeAmount, setBridgeAmount] = useState("1000");
  const [bridgeStatus, setBridgeStatus] = useState<BridgeStatus>("idle");
  const [lifiQuote, setLifiQuote] = useState<LifiQuote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [swapAmount, setSwapAmount] = useState("1");
  const [swapQuote, setSwapQuote] = useState<LifiQuote | null>(null);
  const [swapQuoteLoading, setSwapQuoteLoading] = useState(false);
  const [swapStatus, setSwapStatus] = useState<"idle" | "loading" | "ready" | "unavailable">("idle");
  const [liveMarkets, setLiveMarkets] = useState<ScannerMarket[]>([]);
  const [dataSource, setDataSource] = useState(import.meta.env.VITE_ARC_SCANNER_API_URL ? "Configured ARC scanner" : "A/X Explorer live DEX index");
  const [tokenQuery, setTokenQuery] = useState("");
  const [tokenLoading, setTokenLoading] = useState(false);
  const [importedToken, setImportedToken] = useState<TokenMetadata | null>(null);
  const [importedPools, setImportedPools] = useState<LivePool[]>([]);
  const [chartPoints, setChartPoints] = useState<PoolChartPoint[]>([]);
  const [chartLoading, setChartLoading] = useState(false);
  const [chartError, setChartError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    loadScannerMarkets(controller.signal).then((rows) => {
      setLiveMarkets(rows);
      setDataSource(import.meta.env.VITE_ARC_SCANNER_API_URL ? "Configured ARC scanner" : "A/X Explorer live DEX index");
    });
    return () => controller.abort();
  }, []);

  const filteredMarkets = useMemo(() => filterAndSortMarkets(liveMarkets, query, sortKey), [liveMarkets, query, sortKey]);

  useEffect(() => {
    const routeAddress = pairParams?.address ? decodeURIComponent(pairParams.address) : undefined;
    const match = routeAddress ? liveMarkets.find((market) => market.address === routeAddress) : undefined;
    if (match) setSelectedPair(match);
  }, [liveMarkets, pairParams?.address]);

  useEffect(() => {
    if (!selectedPair.address) {
      setChartPoints([]);
      setChartError(null);
      return;
    }
    const controller = new AbortController();
    setChartLoading(true);
    setChartError(null);
    loadPoolChart(selectedPair.address, controller.signal).then((points) => {
      setChartPoints(points);
      if (points.length < 2) setChartError("A/X returned fewer than two candle points for this pair.");
    }).catch((error) => {
      if (!controller.signal.aborted) {
        setChartPoints([]);
        setChartError(error instanceof Error ? error.message : "Candle history request failed.");
      }
    }).finally(() => { if (!controller.signal.aborted) setChartLoading(false); });
    return () => controller.abort();
  }, [selectedPair.address]);

  const handleTokenLookup = async () => {
    if (!tokenQuery.trim()) {
      toast.info("Paste an ARC token contract address", { description: "Use the 0x address from the ARC Mainnet explorer." });
      return;
    }
    setTokenLoading(true);
    try {
      const token = await fetchTokenMetadata(tokenQuery);
      const pools = await loadPoolsForToken(token.address);
      setImportedToken(token);
      setImportedPools(pools);
      if (pools.length) setSelectedPair(poolToMarket(pools[0], 0));
      if (!pools.length) {
        toast.success("Token found, but no live pair", { description: `${token.symbol} metadata is valid; A/X Explorer has no indexed DEX pool for this address yet.` });
      } else {
        toast.success("Live token price found", { description: `${token.symbol} · ${pools.length} ARC pair${pools.length === 1 ? "" : "s"} indexed by A/X Explorer.` });
      }
    } catch (error) {
      setImportedPools([]);
      toast.error("Token lookup failed", { description: error instanceof Error ? error.message : "The address could not be resolved." });
    } finally {
      setTokenLoading(false);
    }
  };

  const chainIdForName = (name: string) => ({ BSC: BSC_CHAIN_ID, Ethereum: 1, Base: 8453, Arbitrum: 42161 }[name] || 1);
  const sourceUsdcForChain = (name: string) => name === "BSC" ? "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d" : "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
  const arcUsdc = "0x3600000000000000000000000000000000000000";
  const selectedTokenAddress = importedToken?.address || selectedPair.tokenAddress || "";
  const selectedTokenDecimals = importedToken?.decimals || selectedPair.tokenDecimals || 18;
  const selectedTokenSymbol = importedToken?.symbol || selectedPair.ticker.replace(/^\$/, "") || "TOKEN";

  const fetchBridgeQuote = async () => {
    const provider = getInjectedProvider();
    const accounts = provider ? await provider.request({ method: "eth_accounts" }) as string[] : [];
    if (!accounts[0]) {
      setBridgeStatus("awaiting-wallet");
      toast.info("Connect your wallet first", { description: "LI.FI uses the connected address for quote and transaction routing." });
      return;
    }
    setQuoteLoading(true);
    setBridgeStatus("loading");
    try {
      const decimals = 6;
      const amount = BigInt(Math.max(0, Number(bridgeAmount || 0)) * 10 ** decimals).toString();
      const quote = await getLifiQuote({ fromChain: chainIdForName(fromChain), toChain: ARC_CHAIN_ID, fromToken: sourceUsdcForChain(fromChain), toToken: arcUsdc, fromAddress: accounts[0], fromAmount: amount, slippage: Number(slippage) / 100 });
      setLifiQuote(quote);
      setBridgeStatus("ready");
      toast.success("LI.FI quote ready", { description: `${fromChain} → Arc route found${quote.tool?.name ? ` via ${quote.tool.name}` : ""}.` });
    } catch (error) {
      setLifiQuote(null);
      setBridgeStatus("unavailable");
      toast.error("No LI.FI route available", { description: error instanceof Error ? error.message : "Try another source chain or amount." });
    } finally {
      setQuoteLoading(false);
    }
  };

  const fetchSwapQuote = async () => {
    const provider = getInjectedProvider();
    const accounts = provider ? await provider.request({ method: "eth_accounts" }) as string[] : [];
    if (!provider || !accounts[0]) {
      toast.info("Connect your wallet first", { description: "The Arc router and LI.FI both use your connected wallet address to simulate the swap route." });
      return;
    }
    if (fromToken === toToken) {
      toast.info("Choose two different tokens", { description: "Select a different input or output asset before requesting a quote." });
      return;
    }
    setSwapQuoteLoading(true);
    setSwapStatus("loading");
    try {
      const inputIsUsdc = fromToken === "USDC";
      const outputIsUsdc = toToken === "USDC";
      const fromTokenAddress = inputIsUsdc ? arcUsdc : selectedTokenAddress;
      const toTokenAddress = outputIsUsdc ? arcUsdc : selectedTokenAddress;
      if (!fromTokenAddress || fromTokenAddress.toLowerCase() === toTokenAddress.toLowerCase()) throw new Error("Select a live ARC token pair before requesting a quote.");
      const decimals = inputIsUsdc ? 6 : selectedTokenDecimals;
      const amount = BigInt(Math.max(0, Number(swapAmount || 0)) * 10 ** decimals).toString();
      let quote: LifiQuote;
      try {
        quote = await getArcV3Quote({ provider, fromToken: fromTokenAddress, toToken: toTokenAddress, fromAddress: accounts[0], fromAmount: amount, feeTier: selectedPair.feeTier || 10000, slippage: Number(slippage) / 100 });
      } catch (arcError) {
        try {
          quote = await getLifiQuote({ fromChain: ARC_CHAIN_ID, toChain: ARC_CHAIN_ID, fromToken: fromTokenAddress, toToken: toTokenAddress, fromAddress: accounts[0], fromAmount: amount, slippage: Number(slippage) / 100 });
        } catch (lifiError) {
          const directMessage = arcError instanceof Error ? arcError.message : "Arc router returned no route.";
          const lifiMessage = lifiError instanceof Error ? lifiError.message : "LI.FI returned no route.";
          throw new Error(`${directMessage} LI.FI fallback: ${lifiMessage}`);
        }
      }
      setSwapQuote(quote);
      setSwapStatus("ready");
      toast.success("LI.FI swap quote ready", { description: `${fromToken === "USDC" ? "USDC" : selectedTokenSymbol} → ${toToken === "USDC" ? "USDC" : selectedTokenSymbol}${quote.tool?.name ? ` via ${quote.tool.name}` : ""}.` });
    } catch (error) {
      setSwapQuote(null);
      setSwapStatus("unavailable");
      toast.error("No LI.FI swap route available", { description: error instanceof Error ? error.message : "Try a supported token pair." });
    } finally {
      setSwapQuoteLoading(false);
    }
  };

  const requestAction = (action: string) => {
    setPendingAction(action);
    if (action.toLowerCase().includes("bridge")) setBridgeStatus(wallet ? "ready" : "awaiting-wallet");
    setWalletDialog(true);
  };

  const connectWallet = async () => {
    try {
      const result = await connectInjectedWallet();
      if (!result.account) throw new Error("The wallet returned no account.");
      setWallet(result.account);
      setWalletIsArc(result.isArcMainnet);
      setWalletChainId(result.chainId);
      setWalletDialog(false);
      toast.success(result.isArcMainnet ? "Wallet connected" : "Wallet connected on another network", { description: result.isArcMainnet ? "ARC Mainnet detected. Blockchain actions still require confirmation." : "Switch to ARC Mainnet before swapping or bridging." });
    } catch (error) {
      toast.error("Wallet connection unavailable", { description: error instanceof Error ? error.message : "Please install or unlock a compatible wallet." });
    }
  };

  const confirmPendingAction = async () => {
    if (!ARC_MAINNET_ENABLED) {
      toast.error("ARC Mainnet provider is not configured", { description: "Official mainnet RPC and audited swap/bridge deployment details are required before any transaction can be signed." });
      return;
    }
    if (!wallet) {
      if (pendingAction?.toLowerCase().includes("bridge")) setBridgeStatus("awaiting-wallet");
      await connectWallet();
      return;
    }
    const isBridge = pendingAction?.toLowerCase().includes("bridge");
    const expectedChainId = isBridge ? chainIdForName(fromChain) : ARC_CHAIN_ID;
    const currentChainId = Number.parseInt(walletChainId, 16);
    if (currentChainId !== expectedChainId) {
      try {
        await switchInjectedChain(expectedChainId);
        setWalletChainId(`0x${expectedChainId.toString(16)}`);
      } catch (error) {
        if (isBridge) setBridgeStatus("wrong-network");
        toast.error("Switch network to continue", { description: `Your wallet must be on ${isBridge ? fromChain : "ARC Mainnet"} before signing.` });
        return;
      }
    }
    const tx = (isBridge ? lifiQuote : swapQuote)?.transactionRequest;
    const provider = getInjectedProvider();
    if ((isBridge || Boolean(swapQuote)) && tx?.to && tx.data && provider) {
      try {
        const quote = isBridge ? lifiQuote : swapQuote;
        const approvalAddress = quote?.estimate?.approvalAddress;
        const inputToken = isBridge ? sourceUsdcForChain(fromChain) : fromToken === "USDC" ? arcUsdc : selectedTokenAddress;
        const inputDecimals = isBridge || fromToken === "USDC" ? 6 : selectedTokenDecimals;
        const inputAmount = BigInt(Math.max(0, Number(isBridge ? bridgeAmount : swapAmount) || 0) * 10 ** inputDecimals).toString();
        if (approvalAddress && !isNativeToken(inputToken)) {
          const allowance = await provider.request({ method: "eth_call", params: [{ to: inputToken, data: allowanceCallData(wallet, approvalAddress) }, "latest"] }) as string;
          if (allowanceNeedsApproval(BigInt(allowance || "0x0"), inputAmount)) {
            const approvalHash = await provider.request({ method: "eth_sendTransaction", params: [{ from: wallet, to: inputToken, data: approveCallData(approvalAddress, BigInt(inputAmount).toString(16)) }] });
            toast.success("Approval requested", { description: `Confirm approval in your wallet, then review the ${isBridge ? "bridge" : "swap"} again. ${String(approvalHash).slice(0, 12)}…` });
            return;
          }
        }
        const txHash = await provider.request({ method: "eth_sendTransaction", params: [{ from: wallet, to: tx.to, data: tx.data, value: tx.value || "0x0", ...(tx.gasLimit ? { gas: tx.gasLimit } : {}), ...(tx.gasPrice ? { gasPrice: tx.gasPrice } : {}) }] });
        setBridgeStatus("provider-opened");
        setWalletDialog(false);
        toast.success("LI.FI transaction submitted", { description: `Review the transaction on Arc Explorer: ${String(txHash).slice(0, 12)}…` });
        return;
      } catch (error) {
        toast.error("Wallet rejected the LI.FI transaction", { description: error instanceof Error ? error.message : "No transaction was submitted." });
        return;
      }
    }
    const providerUrl = isBridge ? (import.meta.env.VITE_BRIDGE_PROVIDER_URL || "https://li.fi/bridge") : (import.meta.env.VITE_SWAP_PROVIDER_URL || "https://li.fi/swap");
    window.open(providerUrl, "_blank", "noopener,noreferrer");
    if (isBridge) setBridgeStatus("provider-opened");
    setWalletDialog(false);
    toast.success(`${isBridge ? "Bridge" : "Swap"} provider opened`, { description: "Review the provider quote and confirm the transaction in your wallet." });
  };

  return <div className="min-h-screen bg-[#071014] text-slate-200 selection:bg-cyan-300 selection:text-slate-950">
    <div className="ambient-grid pointer-events-none fixed inset-0 opacity-50" />
    <div className="pointer-events-none fixed -left-40 top-0 h-[28rem] w-[28rem] rounded-full bg-cyan-400/10 blur-[110px]" />
    <div className="pointer-events-none fixed bottom-0 right-0 h-[24rem] w-[24rem] rounded-full bg-lime-300/5 blur-[120px]" />

    <header className="sticky top-0 z-30 border-b border-white/[.07] bg-[#071014]/85 backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] max-w-[1540px] items-center gap-5 px-4 sm:px-6 xl:px-8">
        <div className="flex shrink-0 items-center gap-3"><LogoMark /><div><div className="flex items-center gap-2"><span className="text-[15px] font-bold tracking-[.16em] text-white">DEX <span className="text-cyan-300">ARC</span></span><span className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-cyan-200">Mainnet</span></div><p className="mt-0.5 hidden text-[10px] uppercase tracking-[.2em] text-slate-600 sm:block">Market intelligence terminal</p></div></div>
        <div className="hidden items-center gap-1 rounded-xl border border-white/[.06] bg-white/[.025] p-1 lg:flex">{["Overview", "Markets", "Trending", "New Pairs"].map((item) => <button key={item} onClick={() => setActiveView(item)} className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${activeView === item ? "bg-white/10 text-white shadow-inner" : "text-slate-500 hover:text-slate-200"}`}>{item}{item === "New Pairs" && <span className="ml-1.5 rounded-full bg-lime-300 px-1.5 py-0.5 text-[9px] text-slate-950">18</span>}</button>)}</div>
        <div className="ml-auto flex items-center gap-2"><div className="hidden items-center gap-2 rounded-xl border border-white/[.07] bg-white/[.025] px-3 py-2 text-xs text-slate-400 md:flex"><span className={`h-2 w-2 rounded-full ${wallet && !walletIsArc ? "bg-rose-300" : "bg-lime-300 shadow-[0_0_10px_rgba(190,242,100,.7)]"}`} />{wallet && !walletIsArc ? "Wrong network" : "ARC Mainnet"} <ChevronDown size={14} className="text-slate-600" /></div><button className="hidden h-9 w-9 items-center justify-center rounded-xl border border-white/[.07] text-slate-400 transition hover:border-white/20 hover:text-white sm:flex"><Settings2 size={16} /></button><Button onClick={() => wallet ? toast.info("Wallet session", { description: `Connected as ${wallet}` }) : setWalletDialog(true)} className="h-9 rounded-xl border border-cyan-300/30 bg-cyan-300/10 px-3 text-xs font-bold text-cyan-200 hover:bg-cyan-300/20"> <Wallet size={15} className="mr-2" />{wallet ? formatWallet(wallet) : "Connect wallet"}</Button><button onClick={() => setMobileNav(!mobileNav)} className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[.07] text-slate-400 lg:hidden">{mobileNav ? <X size={17} /> : <Menu size={17} />}</button></div>
      </div>
      {mobileNav && <div className="border-t border-white/[.06] px-4 py-3 lg:hidden">{["Overview", "Markets", "Trending", "New Pairs"].map((item) => <button key={item} onClick={() => { setActiveView(item); setMobileNav(false); }} className={`mr-2 rounded-lg px-3 py-2 text-xs font-semibold ${activeView === item ? "bg-white/10 text-white" : "text-slate-500"}`}>{item}</button>)}</div>}
    </header>

    <main className="relative mx-auto max-w-[1540px] px-4 pb-10 pt-7 sm:px-6 xl:px-8">
      <section className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.2em] text-cyan-300/80"><span className="h-1.5 w-1.5 rounded-full bg-cyan-300" /> ARC Mainnet terminal <span className="text-slate-700">/</span> {activeView}</div><h1 className="text-3xl font-semibold tracking-[-.04em] text-white sm:text-4xl">See the market <span className="gradient-text">before it moves.</span></h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">A fast, focused view of ARC liquidity, token momentum, and new pair activity—built for people who trade with context.</p></div><div className="flex items-center gap-2"><div className="hidden items-center gap-2 rounded-xl border border-white/[.07] bg-white/[.025] px-3 py-2 text-xs text-slate-500 sm:flex"><Clock3 size={14} className="text-slate-600" /> Updated 12 sec ago</div><Button variant="outline" onClick={() => toast.success("Market data refreshed", { description: "ARC Mainnet index is up to date." })} className="h-10 rounded-xl border-white/10 bg-white/[.025] text-slate-300 hover:bg-white/[.07] hover:text-white"><RefreshCw size={15} className="mr-2" /> Refresh</Button></div></section>

      <section className="mb-7 glass-card overflow-hidden rounded-2xl border-cyan-300/10 p-4 sm:p-5"><div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div className="flex items-start gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-200"><Search size={18} /></div><div><p className="text-sm font-semibold text-white">Inspect an ARC Mainnet token</p><p className="mt-1 text-xs leading-5 text-slate-500">Paste an ERC-20 contract address to import metadata, inspect metrics, and prepare a confirmed swap.</p></div></div><div className="flex w-full gap-2 lg:max-w-xl"><Input value={tokenQuery} onChange={(event) => setTokenQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void handleTokenLookup(); }} placeholder="0x token contract address" className="h-11 flex-1 rounded-xl border-white/[.08] bg-white/[.025] font-mono text-xs text-slate-200 placeholder:text-slate-600" /><Button onClick={() => void handleTokenLookup()} disabled={tokenLoading} className="h-11 rounded-xl bg-cyan-300 px-4 font-bold text-slate-950 hover:bg-cyan-200">{tokenLoading ? "Reading…" : "Search token"}</Button></div></div>{importedToken && <div className="mt-4 rounded-xl border border-lime-300/15 bg-lime-300/[.04] p-3"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-lime-300" /><p className="text-xs font-semibold text-white">{importedToken.name} <span className="text-cyan-200">({importedToken.symbol})</span></p><Badge className="border border-lime-300/20 bg-lime-300/10 text-[9px] text-lime-300">{importedToken.source === "arc-rpc" ? "RPC verified" : "Address imported"}</Badge></div><p className="mt-1 font-mono text-[10px] text-slate-500">{importedToken.address} · {importedToken.decimals} decimals · {importedPools.length ? `${importedPools.length} live ARC pair${importedPools.length === 1 ? "" : "s"}` : "No indexed pair"}</p></div><Button onClick={() => requestAction(`Swap ${importedToken.symbol}`)} className="h-9 rounded-lg bg-lime-300 px-3 text-xs font-bold text-slate-950 hover:bg-lime-200"><ArrowRightLeft size={14} className="mr-1.5" /> Prepare swap</Button></div>{importedPools.length > 0 && <div className="mt-3 grid gap-2 md:grid-cols-2">{importedPools.slice(0, 4).map((pool) => <button key={pool.address} onClick={() => window.open(`https://www.arcexplorer.org/dex/pair/${pool.address}`, "_blank", "noopener,noreferrer")} className="rounded-lg border border-white/[.08] bg-black/10 p-3 text-left transition hover:border-cyan-300/30"><div className="flex items-center justify-between"><span className="text-xs font-semibold text-white">{pool.pairName}</span><span className="font-mono text-xs text-cyan-200">{pool.priceUsd == null ? "—" : `$${pool.priceUsd < 0.01 ? pool.priceUsd.toFixed(8) : pool.priceUsd.toFixed(6)}`}</span></div><div className="mt-2 flex items-center justify-between text-[10px] text-slate-500"><span>24h {pool.change24h >= 0 ? "+" : ""}{pool.change24h.toFixed(2)}%</span><span>Vol {pool.volume24hUsd ? `$${(pool.volume24hUsd / 1000).toFixed(1)}K` : "—"}</span><span>LP {pool.liquidityUsd ? `$${(pool.liquidityUsd / 1000).toFixed(1)}K` : "—"}</span></div></button>)}</div>}</div>}</section>

      <div className="mb-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><MetricCard label="24h volume" value="Live per pair" delta="A/X data" icon={BarChart3} accent="cyan" /><MetricCard label="Liquidity" value="Live per pair" delta="A/X data" icon={Droplets} accent="lime" /><MetricCard label="Active pairs" value={String(liveMarkets.length)} delta="Live index" icon={Layers3} accent="blue" /><MetricCard label="New tokens · 24h" value="Not indexed" delta="No estimate" icon={Sparkles} accent="cyan" /></div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_370px]">
        <section className="min-w-0 space-y-6">
          <div className="glass-card overflow-hidden rounded-2xl"><div className="flex flex-col justify-between gap-4 border-b border-white/[.07] p-4 sm:flex-row sm:items-center"><div><div className="flex items-center gap-2"><h2 className="text-sm font-semibold text-white">Market pulse</h2><span className="flex items-center gap-1 rounded-full bg-lime-300/10 px-2 py-1 text-[10px] font-bold text-lime-300"><span className="h-1.5 w-1.5 rounded-full bg-lime-300" /> LIVE</span></div><p className="mt-1 text-xs text-slate-600">{dataSource} · Top ARC pairs by real-time activity</p></div><div className="flex items-center gap-2"><div className="relative"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search pair or address" className="h-9 w-full rounded-xl border-white/[.08] bg-white/[.025] pl-9 text-xs text-slate-300 placeholder:text-slate-600 sm:w-52" /></div><button className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[.08] bg-white/[.025] text-slate-500 hover:text-white"><SlidersHorizontal size={15} /></button></div></div><div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left"><thead><tr className="border-b border-white/[.05] text-[10px] uppercase tracking-[.16em] text-slate-600"><th className="px-4 py-3 font-medium">Pair</th>{[["price", "Price"], ["change", "24h"], ["volume", "Volume"], ["liquidity", "Liquidity"], ["rank", "FDV"]].map(([key, label]) => <th key={key} className="px-4 py-3 font-medium"><button onClick={() => setSortKey(key as typeof sortKey)} className={`flex items-center gap-1 hover:text-slate-300 ${sortKey === key ? "text-cyan-300" : ""}`}>{label}<ChevronDown size={12} /></button></th>)}<th className="px-4 py-3 font-medium">Chart</th></tr></thead><tbody>{filteredMarkets.map((market) => <tr key={`${market.address || "market"}-${market.rank}`} onClick={() => { setSelectedPair(market); navigate(`/pair/${encodeURIComponent(market.address)}`); }} className={`cursor-pointer border-b border-white/[.045] transition hover:bg-white/[.035] ${selectedPair.pair === market.pair ? "bg-cyan-300/[.025]" : ""}`}><td className="px-4 py-4"><div className="flex items-center gap-3"><div className={`flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br ${market.color} text-[10px] font-black text-slate-950 shadow-lg`}><TokenAvatar imageUrl={market.imageUrl} ticker={market.ticker} /></div><div><p className="text-xs font-semibold text-white">{market.pair}</p><p className="mt-0.5 font-mono text-[10px] text-slate-600">{market.address}</p></div></div></td><td className="px-4 py-4"><span className="text-xs font-semibold text-slate-200">{market.price}</span></td><td className="px-4 py-4"><span className={`flex items-center gap-1 text-xs font-semibold ${market.change >= 0 ? "text-lime-300" : "text-rose-300"}`}>{market.change >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}{Math.abs(market.change).toFixed(2)}%</span></td><td className="px-4 py-4 text-xs text-slate-400">{market.volume}</td><td className="px-4 py-4 text-xs text-slate-400">{market.liquidity}</td><td className="px-4 py-4 text-xs text-slate-400">{market.fdv}</td><td className="w-28 px-4 py-4"><span className="text-[10px] text-slate-600">Live pair →</span></td></tr>)}</tbody></table></div><div className="flex items-center justify-between border-t border-white/[.06] px-4 py-3"><p className="text-[11px] text-slate-600">Showing {filteredMarkets.length} live indexed pairs</p><button className="text-xs font-semibold text-cyan-300 hover:text-cyan-200">View all markets <span className="ml-1">→</span></button></div></div>

          <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]"><div className="glass-card rounded-2xl p-5"><div className="mb-5 flex items-start justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-slate-600">Trending pair</p><div className="mt-2 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-white/[.08] bg-white/[.03] text-[8px] font-bold text-slate-500"><TokenAvatar imageUrl={selectedPair.imageUrl} ticker={selectedPair.ticker} /></div><div><p className="text-sm font-semibold text-white">{selectedPair.pair}</p><p className="text-xs text-slate-500">{selectedPair.address}</p></div></div></div><Badge className="border border-lime-300/20 bg-lime-300/10 text-lime-300">{selectedPair.change >= 0 ? "+" : ""}{selectedPair.change.toFixed(2)}%</Badge></div><div className="mb-2 flex items-end justify-between"><div><p className="text-3xl font-semibold tracking-tight text-white">{selectedPair.price}</p><p className="mt-1 text-xs text-slate-500">{selectedPair.ticker} · 24h change</p></div><div className="text-right"><p className="text-xs text-slate-500">Volume</p><p className="text-sm font-semibold text-slate-200">{selectedPair.volume}</p></div></div><div className="h-32 pt-2">{chartLoading ? <div className="flex h-full items-center justify-center rounded-xl border border-white/[.08] text-xs text-slate-600">Loading live candle history…</div> : hasUsableChart(chartPoints) ? <svg data-testid="live-pair-chart" data-chart-points={chartPoints.length} viewBox="0 0 600 150" className="h-full w-full" preserveAspectRatio="none" aria-label={`Live ${chartPoints.length}-point ARC pair chart`}><defs><linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#7dd3fc" stopOpacity=".22" /><stop offset="100%" stopColor="#7dd3fc" stopOpacity="0" /></linearGradient></defs><path d={`M0 126 ${chartPoints.map((point, index) => `L${(index / Math.max(chartPoints.length - 1, 1)) * 600} ${150 - ((point.value / Math.max(...chartPoints.map((item) => item.value))) * 110)}`).join(" ")} L600 150 L0 150 Z`} fill="url(#areaFill)" /><path d={`M0 126 ${chartPoints.map((point, index) => `L${(index / Math.max(chartPoints.length - 1, 1)) * 600} ${150 - ((point.value / Math.max(...chartPoints.map((item) => item.value))) * 110)}`).join(" ")}`} fill="none" stroke="#67e8f9" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg> : <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-white/[.08] text-xs text-slate-600">{chartError || "Live candle history unavailable for this pair"}</div>}</div><div className="mt-3 flex justify-between text-[10px] text-slate-600"><span>24h ago</span><span>12h</span><span>Now</span></div></div><div className="glass-card rounded-2xl p-5"><div className="mb-5 flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-slate-600">New activity</p><p className="mt-1 text-sm font-semibold text-white">Fresh on ARC</p></div><button className="text-xs text-cyan-300">See all</button></div><div className="space-y-4">{liveMarkets.slice(0, 4).map((market) => <div key={`activity-${market.address || "market"}-${market.rank}`} className="flex items-center gap-3"><div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/[.08] bg-white/[.03] text-[7px] font-bold text-slate-500"><TokenAvatar imageUrl={market.imageUrl} ticker={market.ticker} /></div><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold text-slate-200">{market.ticker}</p><p className="text-[10px] text-slate-600">{market.pair} · {market.change >= 0 ? "Momentum up" : "Pullback"}</p></div><span className={`text-[10px] font-semibold ${market.change >= 0 ? "text-lime-300" : "text-rose-300"}`}>{market.change >= 0 ? "+" : ""}{market.change.toFixed(2)}%</span></div>)}</div></div></div>
        </section>

        <aside className="space-y-6"><div className="glass-card rounded-2xl p-5"><div className="mb-5 flex items-start justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-cyan-300/70">Selected market</p><h2 className="mt-1 text-lg font-semibold text-white">{selectedPair.pair}</h2><p className="mt-1 font-mono text-[10px] text-slate-600">{selectedPair.address}</p></div><button onClick={() => navigator.clipboard?.writeText(selectedPair.address).then(() => toast.success("Address copied"))} className="rounded-lg p-2 text-slate-600 hover:bg-white/5 hover:text-white"><Copy size={14} /></button></div><div className="mb-5 flex items-end justify-between"><div><p className="text-2xl font-semibold text-white">{selectedPair.price}</p><p className={`mt-1 text-xs font-semibold ${selectedPair.change >= 0 ? "text-lime-300" : "text-rose-300"}`}>{selectedPair.change >= 0 ? "+" : ""}{selectedPair.change}% today</p></div><span className="flex items-center gap-1 rounded-lg bg-cyan-300/10 px-2 py-1 text-[10px] font-bold text-cyan-200"><ShieldCheck size={12} /> A/X indexed</span></div><div className="grid grid-cols-2 gap-2">{[["Liquidity", selectedPair.liquidity], ["Volume 24h", selectedPair.volume], ["FDV", selectedPair.fdv], ["Transactions", selectedPair.txns]].map(([label, value]) => <div key={label} className="rounded-xl border border-white/[.06] bg-white/[.02] p-3"><p className="text-[10px] text-slate-600">{label}</p><p className="mt-1 text-xs font-semibold text-slate-200">{value}</p></div>)}</div><Button onClick={() => requestAction("Swap") } className="mt-4 h-10 w-full rounded-xl bg-cyan-300 font-bold text-slate-950 hover:bg-cyan-200"><ArrowRightLeft size={15} className="mr-2" /> Trade this pair <ExternalLink size={13} className="ml-auto" /></Button></div>

          <div className="glass-card rounded-2xl p-5"><div className="mb-4 flex items-center justify-between"><div className="flex rounded-xl border border-white/[.07] bg-white/[.02] p-1"><button onClick={() => setActiveTool("swap")} className={`rounded-lg px-4 py-2 text-xs font-bold ${activeTool === "swap" ? "bg-white/10 text-white" : "text-slate-600"}`}>Swap</button><button onClick={() => setActiveTool("bridge")} className={`rounded-lg px-4 py-2 text-xs font-bold ${activeTool === "bridge" ? "bg-white/10 text-white" : "text-slate-600"}`}>Bridge</button></div><button className="rounded-lg p-2 text-slate-600 hover:text-white"><Settings2 size={15} /></button></div>{activeTool === "swap" ? <div className="space-y-3"><div className="flex items-center justify-between"><div><p className="text-sm font-semibold text-white">Swap on ARC</p><p className="mt-1 text-[11px] text-slate-600">Uniswap-compatible routing</p></div><span className="rounded-full bg-cyan-300/10 px-2 py-1 text-[10px] font-bold text-cyan-200">0.30% fee</span></div><div className="rounded-2xl border border-white/[.08] bg-white/[.025] p-4"><div className="mb-2 flex items-center justify-between text-[10px] text-slate-600"><span>You pay</span><span>Balance —</span></div><div className="flex items-center gap-2"><Input value={swapAmount} onChange={(event) => { setSwapAmount(event.target.value.replace(/[^0-9.]/g, "")); setSwapQuote(null); setSwapStatus("idle"); }} placeholder="0.00" className="h-9 border-0 bg-transparent p-0 text-xl font-semibold text-white shadow-none focus-visible:ring-0" /><button onClick={() => { setFromToken(fromToken === "USDC" ? "ARC" : "USDC"); setSwapQuote(null); }} className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-xs font-bold text-white hover:bg-white/15">{fromToken === "USDC" ? "USDC" : selectedTokenSymbol}<ChevronDown size={13} /></button></div></div><div className="relative z-10 -my-1 flex justify-center"><button onClick={() => { setFromToken(toToken); setToToken(fromToken); }} className="rounded-xl border border-[#071014] bg-cyan-300 p-2 text-slate-950 shadow-[0_0_18px_rgba(103,232,249,.25)]"><ArrowDownRight size={15} /></button></div><div className="rounded-2xl border border-white/[.08] bg-white/[.025] p-4"><div className="mb-2 flex items-center justify-between text-[10px] text-slate-600"><span>You receive</span><span>Estimated</span></div><div className="flex items-center gap-2"><Input placeholder="0.00" className="h-9 border-0 bg-transparent p-0 text-xl font-semibold text-white shadow-none focus-visible:ring-0" /><button onClick={() => setToToken(toToken === "ARC" ? "USDC" : "ARC")} className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-xs font-bold text-white hover:bg-white/15">{toToken === "USDC" ? "USDC" : selectedTokenSymbol}<ChevronDown size={13} /></button></div></div><div className="flex items-center justify-between px-1 text-[11px] text-slate-600"><span>Route</span><span className="flex items-center gap-1 text-slate-400"><span className="h-1.5 w-1.5 rounded-full bg-cyan-300" /> {swapQuote?.tool?.name ? `${fromToken} → ${swapQuote.tool.name} → ${toToken}` : `${fromToken} → ${toToken}`}</span></div><div className="flex items-center justify-between rounded-xl border border-white/[.06] bg-white/[.02] px-3 py-2 text-[11px]"><span className="text-slate-600">Max slippage</span><div className="flex gap-1">{["0.10", "0.50", "1.00"].map((value) => <button key={value} onClick={() => setSlippage(value)} className={`rounded-lg px-2 py-1 font-semibold ${slippage === value ? "bg-cyan-300/15 text-cyan-200" : "text-slate-500 hover:text-slate-200"}`}>{value}%</button>)}</div></div><Button onClick={() => { if (swapQuote) requestAction("Swap transaction"); else void fetchSwapQuote(); }} disabled={swapQuoteLoading} className="h-11 w-full rounded-xl bg-gradient-to-r from-cyan-300 to-blue-400 font-bold text-slate-950 hover:from-cyan-200 hover:to-blue-300">{swapQuoteLoading ? "Finding LI.FI route…" : swapQuote ? "Review & confirm swap" : swapStatus === "unavailable" ? "Try another pair" : wallet ? "Get LI.FI quote" : "Connect wallet to swap"}</Button><p className="text-center text-[10px] leading-4 text-slate-600">You will review the quote and confirm in your wallet before signing.</p></div> : <div className="space-y-3"><div><p className="text-sm font-semibold text-white">Bridge assets to ARC</p><p className="mt-1 text-[11px] text-slate-600">Compare official bridge routes before you move funds.</p></div><label className="block text-[10px] font-bold uppercase tracking-widest text-slate-600">Amount</label><div className="mb-3 flex items-center gap-2 rounded-xl border border-white/[.08] bg-white/[.025] px-3"><Input value={bridgeAmount} onChange={(event) => setBridgeAmount(event.target.value.replace(/[^0-9.]/g, ""))} inputMode="decimal" className="h-10 border-0 bg-transparent px-0 text-lg font-semibold text-white shadow-none focus-visible:ring-0" /><span className="text-xs font-semibold text-slate-500">USDC</span></div><label className="block text-[10px] font-bold uppercase tracking-widest text-slate-600">From</label><div className="flex gap-2"><select value={fromChain} onChange={(event) => setFromChain(event.target.value)} className="h-11 flex-1 rounded-xl border border-white/[.08] bg-white/[.025] px-3 text-xs text-slate-200 outline-none"><option>BSC</option><option>Ethereum</option><option>Base</option><option>Arbitrum</option></select><div className="flex h-11 items-center gap-2 rounded-xl border border-white/[.08] bg-white/[.025] px-3 text-xs font-semibold text-slate-200"><CircleDollarSign size={15} className="text-cyan-300" /> USDC</div></div><div className="relative flex justify-center py-1"><div className="h-7 w-px bg-gradient-to-b from-white/10 via-cyan-300/60 to-white/10" /><div className="absolute top-1/2 -translate-y-1/2 rounded-lg border border-cyan-300/20 bg-[#0b181d] p-1 text-cyan-300"><ArrowDownRight size={13} /></div></div><label className="block text-[10px] font-bold uppercase tracking-widest text-slate-600">To</label><div className="flex h-11 items-center justify-between rounded-xl border border-cyan-300/20 bg-cyan-300/5 px-3 text-xs font-semibold text-white"><span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-lime-300" />{toChain}</span><span className="text-[10px] text-lime-300">Native gas · USDC</span></div><div className="rounded-xl border border-white/[.06] bg-white/[.02] p-3"><div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-widest"><span className="text-slate-600">Bridge status</span><span className={`font-semibold ${bridgeStatus === "provider-opened" ? "text-lime-300" : bridgeStatus === "wrong-network" ? "text-rose-300" : "text-cyan-200"}`}>{bridgeStatus === "provider-opened" ? "Submitted" : bridgeStatus === "wrong-network" ? "Wrong network" : bridgeStatus === "awaiting-wallet" ? "Awaiting wallet" : bridgeStatus === "loading" ? "Finding route…" : bridgeStatus === "unavailable" ? "No route available" : lifiQuote ? "LI.FI quote ready" : "Get a quote"}</span></div><div className="flex items-center justify-between text-[11px]"><span className="text-slate-600">Estimated receive</span><span className="font-semibold text-lime-200">{lifiQuote?.estimate?.toAmount ? (Number(lifiQuote.estimate.toAmount) / 1e6).toFixed(2) : (Number(bridgeAmount || 0) * 0.997).toFixed(2)} USDC</span></div><div className="mt-2 flex items-center justify-between text-[11px]"><span className="text-slate-600">Estimated route</span><span className="font-semibold text-slate-300">{fromChain} → ARC {lifiQuote?.tool?.name ? `· ${lifiQuote.tool.name}` : ""}</span></div><div className="mt-2 flex items-center justify-between text-[11px]"><span className="text-slate-600">Provider</span><span className="flex items-center gap-1 text-cyan-200"><Network size={12} /> {lifiQuote ? "LI.FI Router" : "LI.FI route API"}</span></div></div><Button onClick={() => { if (lifiQuote) requestAction("Bridge transaction") ; else void fetchBridgeQuote(); }} disabled={quoteLoading} className="h-11 w-full rounded-xl border border-lime-300/30 bg-lime-300/10 font-bold text-lime-200 hover:bg-lime-300/20">{quoteLoading ? "Finding LI.FI route…" : bridgeStatus === "unavailable" ? "Try another route" : lifiQuote ? "Review & confirm bridge" : wallet ? "Get LI.FI quote" : "Connect wallet to quote"}</Button><p className="text-center text-[10px] leading-4 text-slate-600">Powered by LI.FI routing; your wallet must confirm every approval and transaction.</p></div>}</div></aside>
      </div>

      <footer className="mt-8 flex flex-col justify-between gap-3 border-t border-white/[.06] pt-5 text-[10px] text-slate-600 sm:flex-row sm:items-center"><div className="flex items-center gap-2"><LogoMark /><span>Dex ARC · Built for the ARC Mainnet community</span></div><div className="flex items-center gap-4"><span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-lime-300" /> Indexer operational</span><span>Chain ID 5042</span><a href="https://www.arc.io" target="_blank" rel="noreferrer" className="hover:text-cyan-300">ARC docs ↗</a></div></footer>
    </main>

    {walletDialog && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-md"><div className="glass-card w-full max-w-md rounded-2xl p-6 shadow-2xl"><div className="mb-5 flex items-start justify-between"><div><div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-300"><Wallet size={20} /></div><h2 className="text-xl font-semibold text-white">{wallet ? "Confirm action" : "Connect to Dex ARC"}</h2><p className="mt-1 text-sm text-slate-500">{wallet ? "Review the provider handoff before any blockchain action." : "Connect your injected wallet to continue."}</p></div><button onClick={() => setWalletDialog(false)} className="text-slate-600 hover:text-white"><X size={18} /></button></div><div className="space-y-3 rounded-2xl border border-white/[.07] bg-white/[.025] p-4 text-xs"><div className="flex items-center justify-between"><span className="text-slate-500">Network</span><span className={`flex items-center gap-2 font-semibold ${wallet && !walletIsArc ? "text-rose-300" : "text-lime-300"}`}><span className={`h-1.5 w-1.5 rounded-full ${wallet && !walletIsArc ? "bg-rose-300" : "bg-lime-300"}`} /> {wallet && !walletIsArc ? "Wrong network" : "ARC Mainnet"}</span></div><div className="flex items-center justify-between"><span className="text-slate-500">Requested action</span><span className="font-semibold text-slate-200">{pendingAction ?? "Connect wallet"}</span></div><div className="mt-2 border-t border-white/[.07] pt-3 leading-5 text-slate-500">Dex ARC never signs or submits a transaction silently. You must review the provider handoff and confirm inside your wallet.</div></div><div className="mt-5 flex gap-2"><Button variant="outline" onClick={() => setWalletDialog(false)} className="h-11 flex-1 rounded-xl border-white/10 bg-transparent text-slate-300 hover:bg-white/5">Cancel</Button><Button onClick={confirmPendingAction} className="h-11 flex-1 rounded-xl bg-cyan-300 font-bold text-slate-950 hover:bg-cyan-200"><Check size={15} className="mr-2" />{wallet ? "Confirm & open provider" : "Connect wallet"}</Button></div></div></div>}
  </div>;
}
