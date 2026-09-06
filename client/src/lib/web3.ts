export type Eip1193Provider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
};

export const ARC_MAINNET_CHAIN_ID = (import.meta.env.VITE_ARC_MAINNET_CHAIN_ID || "0x13b2").toLowerCase();
export const ARC_MAINNET_RPC_URL = import.meta.env.VITE_ARC_RPC_URL || "https://arc-rpc.transferto.xyz/";
export const ARC_MAINNET_ENABLED = import.meta.env.VITE_ARC_MAINNET_ENABLED !== "false";

export function getInjectedProvider() {
  if (typeof window === "undefined") return undefined;
  return (window as Window & { ethereum?: Eip1193Provider }).ethereum;
}

export async function connectInjectedWallet() {
  const provider = getInjectedProvider();
  if (!provider) throw new Error("No injected wallet was found. Install a compatible browser wallet to continue.");
  const accounts = await provider.request({ method: "eth_requestAccounts" }) as string[];
  const chainId = await provider.request({ method: "eth_chainId" }) as string;
  return { account: accounts[0] ?? "", chainId, isArcMainnet: ARC_MAINNET_ENABLED && chainId.toLowerCase() === ARC_MAINNET_CHAIN_ID, mainnetEnabled: ARC_MAINNET_ENABLED };
}

export async function readWalletNetwork() {
  const provider = getInjectedProvider();
  if (!provider) return { account: "", chainId: "", isArcMainnet: false, mainnetEnabled: ARC_MAINNET_ENABLED };
  const accounts = await provider.request({ method: "eth_accounts" }) as string[];
  const chainId = await provider.request({ method: "eth_chainId" }) as string;
  return { account: accounts[0] ?? "", chainId, isArcMainnet: ARC_MAINNET_ENABLED && chainId.toLowerCase() === ARC_MAINNET_CHAIN_ID, mainnetEnabled: ARC_MAINNET_ENABLED };
}

export async function switchInjectedChain(chainId: number) {
  const provider = getInjectedProvider();
  if (!provider) throw new Error("No injected wallet was found.");
  const hexChainId = `0x${chainId.toString(16)}`;
  await provider.request({ method: "wallet_switchEthereumChain", params: [{ chainId: hexChainId }] });
}
