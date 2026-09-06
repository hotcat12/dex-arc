export const LIFI_API_BASE = "https://li.quest/v1";
export const ARC_CHAIN_ID = 5042;
export const BSC_CHAIN_ID = 56;

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
