import { describe, expect, it, vi } from "vitest";
import { approvalDecision, isWalletRejection } from "../client/src/lib/approval";
import { fetchTokenMetadata, isEvmAddress } from "../client/src/lib/tokenData";
import { readWalletNetwork, switchInjectedChain } from "../client/src/lib/web3";

describe("mainnet guards", () => {
  it("validates ERC-20 contract addresses and rejects malformed input", () => {
    expect(isEvmAddress("0x1111111111111111111111111111111111111111")).toBe(true);
    expect(isEvmAddress("0x1234")).toBe(false);
    expect(isEvmAddress("not-an-address")).toBe(false);
  });

  it("throws before any RPC call for a malformed token address", async () => {
    await expect(fetchTokenMetadata("0x1234")).rejects.toThrow("Enter a valid 42-character EVM contract address.");
  });

  it("reads ARC network and switches the injected wallet chain", async () => {
    const request = vi.fn(async ({ method }: { method: string }) => method === "eth_chainId" ? "0x13b2" : method === "eth_accounts" ? ["0x1111111111111111111111111111111111111111"] : undefined);
    (globalThis as typeof globalThis & { window?: unknown }).window = { ethereum: { request } };
    await expect(readWalletNetwork()).resolves.toMatchObject({ isArcMainnet: true });
    await switchInjectedChain(56);
    expect(request).toHaveBeenCalledWith({ method: "wallet_switchEthereumChain", params: [{ chainId: "0x38" }] });
  });

  it("separates approval-required and wallet-rejected states", () => {
    const token = "0x1111111111111111111111111111111111111111";
    const spender = "0x2222222222222222222222222222222222222222";
    expect(approvalDecision({ token, approvalAddress: spender, allowance: "0", required: "10" })).toBe("required");
    expect(approvalDecision({ token, approvalAddress: spender, allowance: "10", required: "10" })).toBe("sufficient");
    expect(isWalletRejection({ code: 4001 })).toBe(true);
    expect(isWalletRejection(new Error("User rejected the request"))).toBe(true);
  });
});
