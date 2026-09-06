import { describe, expect, it } from "vitest";
import { ARC_CHAIN_ID, BSC_CHAIN_ID, getLifiExplorerUrl } from "../client/src/lib/lifi";

describe("LI.FI chain configuration", () => {
  it("uses the documented Arc and BSC mainnet IDs", () => {
    expect(ARC_CHAIN_ID).toBe(5042);
    expect(BSC_CHAIN_ID).toBe(56);
  });

  it("creates safe explorer links for submitted transactions", () => {
    expect(getLifiExplorerUrl("0xabc", ARC_CHAIN_ID)).toBe("https://explorer.arc.io/tx/0xabc");
    expect(getLifiExplorerUrl("0xdef", BSC_CHAIN_ID)).toBe("https://bscscan.com/tx/0xdef");
  });
});
