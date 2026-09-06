export type Eip1193Provider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
};

export const ARC_MAINNET_CHAIN_ID = "0x13a2"; // 5042

export function getInjectedProvider() {
  if (typeof window === "undefined") return undefined;
  return (window as Window & { ethereum?: Eip1193Provider }).ethereum;
}

export async function connectInjectedWallet() {
  const provider = getInjectedProvider();
  if (!provider) throw new Error("No injected wallet was found. Install a compatible browser wallet to continue.");
  const accounts = await provider.request({ method: "eth_requestAccounts" }) as string[];
  const chainId = await provider.request({ method: "eth_chainId" }) as string;
  return { account: accounts[0] ?? "", chainId, isArcMainnet: chainId.toLowerCase() === ARC_MAINNET_CHAIN_ID };
}

export async function readWalletNetwork() {
  const provider = getInjectedProvider();
  if (!provider) return { account: "", chainId: "", isArcMainnet: false };
  const accounts = await provider.request({ method: "eth_accounts" }) as string[];
  const chainId = await provider.request({ method: "eth_chainId" }) as string;
  return { account: accounts[0] ?? "", chainId, isArcMainnet: chainId.toLowerCase() === ARC_MAINNET_CHAIN_ID };
}
