export const LIFI_API_BASE = "https://li.quest/v1";
import { decodeFunctionResult, encodeFunctionData, parseAbi } from "viem";

export const ARC_CHAIN_ID = 5042;
export const BSC_CHAIN_ID = 56;
export const ARC_V3_ROUTER = "0x53bf6b0684ec7ef91e1387da3d1a1769bc5a6f77" as const;
export const ARC_V3_QUOTER = "0x7dfd4f31be6814d2906bde155c3e1b146eac1468" as const;
export const ARC_V4_QUOTER = "0x8dc178efb8111bb0973dd9d722ebeff267c98f94" as const;

const arcQuoterAbi = parseAbi([
  "function quoteExactInputSingle((address tokenIn,address tokenOut,uint256 amountIn,uint24 fee,uint160 sqrtPriceLimitX96) params) returns (uint256 amountOut,uint160 sqrtPriceX96,uint32 initializedTicksCrossed,uint256 gasEstimate)",
]);
const arcRouterAbi = parseAbi([
  "function exactInputSingle((address tokenIn,address tokenOut,uint24 fee,address recipient,uint256 deadline,uint256 amountIn,uint256 amountOutMinimum,uint160 sqrtPriceLimitX96) params) payable returns (uint256 amountOut)",
]);

type Eip1193Reader = { request: (args: { method: string; params?: unknown[] }) => Promise<unknown> };

export async function getArcV3Quote(params: {
  provider: Eip1193Reader;
  fromToken: string;
  toToken: string;
  fromAddress: string;
  fromAmount: string;
  feeTier: number;
  slippage: number;
}) : Promise<LifiQuote> {
  const callData = encodeFunctionData({
    abi: arcQuoterAbi,
    functionName: "quoteExactInputSingle",
    args: [{ tokenIn: params.fromToken as `0x${string}`, tokenOut: params.toToken as `0x${string}`, amountIn: BigInt(params.fromAmount), fee: params.feeTier, sqrtPriceLimitX96: BigInt(0) }],
  });
  const raw = await params.provider.request({ method: "eth_call", params: [{ to: ARC_V3_QUOTER, data: callData }, "latest"] }) as `0x${string}`;
  const decoded = decodeFunctionResult({ abi: arcQuoterAbi, functionName: "quoteExactInputSingle", data: raw }) as readonly [bigint, bigint, number, bigint];
  const amountOut = decoded[0];
  if (amountOut <= BigInt(0)) throw new Error("Arc Uniswap returned no output liquidity for this token pair.");
  const minimum = (amountOut * BigInt(Math.max(0, Math.floor((1 - params.slippage) * 1_000_000)))) / BigInt(1_000_000);
  const txData = encodeFunctionData({
    abi: arcRouterAbi,
    functionName: "exactInputSingle",
    args: [{ tokenIn: params.fromToken as `0x${string}`, tokenOut: params.toToken as `0x${string}`, fee: params.feeTier, recipient: params.fromAddress as `0x${string}`, deadline: BigInt(Math.floor(Date.now() / 1000) + 1200), amountIn: BigInt(params.fromAmount), amountOutMinimum: minimum, sqrtPriceLimitX96: BigInt(0) }],
  });
  return {
    tool: { name: "Arc Uniswap v3", key: "arc-uniswap-v3" },
    estimate: { toAmount: amountOut.toString(), toAmountMin: minimum.toString(), approvalAddress: ARC_V3_ROUTER },
    transactionRequest: { to: ARC_V3_ROUTER, data: txData, value: "0x0", chainId: ARC_CHAIN_ID },
    action: { fromChainId: ARC_CHAIN_ID, toChainId: ARC_CHAIN_ID },
  };
}

export type LifiQuote = {
  id?: string;
  tool?: { name?: string; key?: string };
  estimate?: { toAmount?: string; toAmountMin?: string; executionDuration?: number; approvalAddress?: string; feeCosts?: Array<{ amount?: string; token?: { symbol?: string } }> };
  transactionRequest?: { to?: string; data?: string; value?: string; gasLimit?: string; gasPrice?: string; chainId?: number };
  action?: { fromChainId?: number; toChainId?: number; fromToken?: { symbol?: string }; toToken?: { symbol?: string } };
};

export type LifiChain = { id: number; key: string; name: string; mainnet: boolean; nativeToken?: { address: string; symbol: string; decimals: number } };

function lifiHeaders(): Record<string, string> {
  const apiKey = import.meta.env.VITE_LIFI_API_KEY as string | undefined;
  return apiKey ? { "x-lifi-api-key": apiKey } : {};
}

export async function getLifiChains(): Promise<LifiChain[]> {
  const response = await fetch(`${LIFI_API_BASE}/chains?chainTypes=EVM`, { headers: lifiHeaders() });
  if (!response.ok) throw new Error(`LI.FI chains request failed with ${response.status}`);
  const payload = await response.json();
  return payload.chains ?? [];
}

export async function getLifiQuote(params: {
  fromChain: number;
  toChain: number;
  fromToken: string;
  toToken: string;
  fromAddress: string;
  fromAmount: string;
  slippage: number;
}) {
  const search = new URLSearchParams({
    fromChain: String(params.fromChain),
    toChain: String(params.toChain),
    fromToken: params.fromToken,
    toToken: params.toToken,
    fromAddress: params.fromAddress,
    toAddress: params.fromAddress,
    fromAmount: params.fromAmount,
    slippage: String(params.slippage),
    order: "CHEAPEST",
    integrator: "dex-arc",
    allowDestinationCall: "false",
  });
  const response = await fetch(`${LIFI_API_BASE}/quote?${search.toString()}`, { headers: lifiHeaders() });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(detail || `LI.FI quote request failed with ${response.status}`);
  }
  return (await response.json()) as LifiQuote;
}

export function getLifiExplorerUrl(txHash: string, chainId: number) {
  if (chainId === ARC_CHAIN_ID) return `https://explorer.arc.io/tx/${txHash}`;
  if (chainId === BSC_CHAIN_ID) return `https://bscscan.com/tx/${txHash}`;
  return "";
}
