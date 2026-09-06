import { describe, expect, it } from "vitest";
import { allowanceCallData, allowanceNeedsApproval, approveCallData, isNativeToken } from "../client/src/lib/approval";

describe("ERC-20 approval helpers", () => {
  it("detects native tokens and approval requirements", () => {
    expect(isNativeToken("0x0000000000000000000000000000000000000000")).toBe(true);
    expect(isNativeToken("0x1111111111111111111111111111111111111111")).toBe(false);
    expect(allowanceNeedsApproval("10", "11")).toBe(true);
    expect(allowanceNeedsApproval("11", "10")).toBe(false);
  });

  it("encodes allowance and approve calldata", () => {
    expect(allowanceCallData("0x1111111111111111111111111111111111111111", "0x2222222222222222222222222222222222222222")).toHaveLength(138);
    expect(approveCallData("0x2222222222222222222222222222222222222222")).toMatch(/^0x095ea7b3/);
  });
});
