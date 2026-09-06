import { describe, expect, it } from "vitest";
import { bridgeStatusFromQuoteResult } from "../client/src/lib/lifiState";

describe("LI.FI bridge status guards", () => {
  it("surfaces unavailable when no route exists", () => {
    expect(bridgeStatusFromQuoteResult({ quoteAvailable: false, walletConnected: true, walletOnSourceChain: true })).toBe("unavailable");
  });

  it("requires the wallet to be connected and on the source chain", () => {
    expect(bridgeStatusFromQuoteResult({ quoteAvailable: true, walletConnected: false, walletOnSourceChain: false })).toBe("awaiting-wallet");
    expect(bridgeStatusFromQuoteResult({ quoteAvailable: true, walletConnected: true, walletOnSourceChain: false })).toBe("wrong-network");
    expect(bridgeStatusFromQuoteResult({ quoteAvailable: true, walletConnected: true, walletOnSourceChain: true })).toBe("ready");
  });
});
