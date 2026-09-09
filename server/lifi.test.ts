import { describe, expect, it, vi } from "vitest";
import { ARC_CHAIN_ID, ARC_V3_ROUTER, BSC_CHAIN_ID, getArcV3Quote, getLifiExplorerUrl } from "../client/src/lib/lifi";
import { encodeAbiParameters } from "viem";

describe("LI.FI chain configuration", () => {
  it("uses the documented Arc and BSC mainnet IDs", () => {
    expect(ARC_CHAIN_ID).toBe(5042);
    expect(BSC_CHAIN_ID).toBe(56);
  });

  it("creates safe explorer links for submitted transactions", () => {
    expect(getLifiExplorerUrl("0xabc", ARC_CHAIN_ID)).toBe("https://explorer.arc.io/tx/0xabc");
    expect(getLifiExplorerUrl("0xdef", BSC_CHAIN_ID)).toBe("https://bscscan.com/tx/0xdef");
  });

  it("builds an Arc Uniswap v3 quote and wallet transaction for a liquid pair", async () => {
    const provider = { request: vi.fn().mockResolvedValue(encodeAbiParameters([{ type: "uint256" }, { type: "uint160" }, { type: "uint32" }, { type: "uint256" }], [123456n, 0n, 0, 210000n])) };
    const quote = await getArcV3Quote({ provider, fromToken: "0x1111111111111111111111111111111111111111", toToken: "0x3600000000000000000000000000000000000000", fromAddress: "0x2222222222222222222222222222222222222222", fromAmount: "1000000000000000000", feeTier: 10000, slippage: 0.005 });
    expect(quote.tool?.key).toBe("arc-uniswap-v3");
    expect(quote.estimate?.approvalAddress).toBe(ARC_V3_ROUTER);
    expect(quote.transactionRequest?.to).toBe(ARC_V3_ROUTER);
    expect(quote.transactionRequest?.data).toMatch(/^0x[0-9a-f]+$/);
  });
});
