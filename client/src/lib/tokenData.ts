export type TokenMetadata = {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply?: string;
  source: "arc-rpc" | "manual";
};

const ADDRESS_PATTERN = /^0x[a-fA-F0-9]{40}$/;
const DEFAULT_ARC_RPC_URL = "https://arc-rpc.transferto.xyz/";
const SELECTORS = {
  name: "0x06fdde03",
  symbol: "0x95d89b41",
  decimals: "0x313ce567",
  totalSupply: "0x18160ddd",
} as const;

export function isEvmAddress(value: string) {
  return ADDRESS_PATTERN.test(value.trim());
}

function decodeHexText(hex: string) {
  const raw = hex.replace(/^0x/, "");
  if (!raw) return "";
  const offset = Number.parseInt(raw.slice(0, 64), 16);
  const lengthAt = offset * 2;
  const length = Number.parseInt(raw.slice(lengthAt, lengthAt + 64), 16);
  const textHex = raw.slice(lengthAt + 64, lengthAt + 64 + length * 2);
  try {
    return decodeURIComponent(textHex.replace(/../g, "%$&")).replace(/\u0000/g, "").trim();
  } catch {
    return "";
  }
}

function decodeBytes32(hex: string) {
  try {
    return decodeURIComponent(hex.replace(/^0x/, "").replace(/../g, "%$&")).replace(/\u0000/g, "").trim();
  } catch {
    return "";
  }
}

async function callRpc(rpcUrl: string, address: string, data: string) {
  const response = await fetch(rpcUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: Date.now(), method: "eth_call", params: [{ to: address, data }, "latest"] }),
  });
  if (!response.ok) throw new Error(`RPC request failed with ${response.status}`);
  const payload = await response.json();
  if (payload.error) throw new Error(payload.error.message || "RPC returned an error");
  return String(payload.result ?? "0x");
}

export async function fetchTokenMetadata(address: string): Promise<TokenMetadata> {
  const normalized = address.trim();
  if (!isEvmAddress(normalized)) throw new Error("Enter a valid 42-character EVM contract address.");
  const rpcUrl = (import.meta.env.VITE_ARC_RPC_URL as string | undefined) || DEFAULT_ARC_RPC_URL;

  const [nameResult, symbolResult, decimalsResult, supplyResult] = await Promise.all([
    callRpc(rpcUrl, normalized, SELECTORS.name),
    callRpc(rpcUrl, normalized, SELECTORS.symbol),
    callRpc(rpcUrl, normalized, SELECTORS.decimals),
    callRpc(rpcUrl, normalized, SELECTORS.totalSupply).catch(() => "0x"),
  ]);
  const name = decodeHexText(nameResult) || decodeBytes32(nameResult) || "Imported ARC token";
  const symbol = decodeHexText(symbolResult) || decodeBytes32(symbolResult) || "TOKEN";
  const decimals = Number.parseInt(decimalsResult.replace(/^0x/, "") || "12", 16);
  const totalSupply = supplyResult !== "0x" ? BigInt(supplyResult).toString() : undefined;
  return { address: normalized, name, symbol, decimals, totalSupply, source: "arc-rpc" };
}
