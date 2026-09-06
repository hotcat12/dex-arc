export type BridgeStatus = "idle" | "loading" | "ready" | "awaiting-wallet" | "wrong-network" | "unavailable" | "provider-opened";

export function bridgeStatusFromQuoteResult(input: { quoteAvailable: boolean; walletConnected: boolean; walletOnSourceChain: boolean }): BridgeStatus {
  if (!input.quoteAvailable) return "unavailable";
  if (!input.walletConnected) return "awaiting-wallet";
  if (!input.walletOnSourceChain) return "wrong-network";
  return "ready";
}
