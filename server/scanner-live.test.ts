import { describe, expect, it, vi } from "vitest";
import { money, poolToMarket, type LivePool } from "../client/src/lib/scannerData";

describe("A/X live scanner normalization", () => {
  it("maps live pool metrics into a scanner row", () => {
    const pool: LivePool = {
      address: "0x1111111111111111111111111111111111111111",
      pairName: "TOLLY/USDC",
      priceUsd: 0.00267959,
      change24h: 40.73,
      volume24hUsd: 190060,
      liquidityUsd: 221400,
      fdvUsd: 2679594,
      swaps24h: 778,
      baseToken: { address: "0x2", name: "Tolly", symbol: "TOLLY", decimals: 18 },
      quoteToken: { address: "0x3", name: "USDC", symbol: "USDC", decimals: 6 },
    };
    const row = poolToMarket(pool, 0);
    expect(row.pair).toBe("TOLLY / USDC");
    expect(row.price).toContain("0.002680");
    expect(row.volume).toBe("$190.06K");
    expect(row.liquidity).toBe("$221.40K");
    expect(row.txns).toBe("778");
  });

  it("formats missing market values without inventing a price", () => {
    expect(money(null)).toBe("—");
    expect(money(1250000)).toBe("$1.25M");
  });

  it("queries the live provider by contract address and handles empty/error responses", async () => {
    const token = "0x1111111111111111111111111111111111111111";
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ items: [] }), { status: 200 }))
      .mockRejectedValueOnce(new Error("provider offline"));
    vi.stubGlobal("fetch", fetchMock);
    const { loadPoolsForToken } = await import("../client/src/lib/scannerData");
    await expect(loadPoolsForToken(token)).resolves.toEqual([]);
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain(`q=${token}`);
    await expect(loadPoolsForToken(token)).rejects.toThrow("provider offline");
    vi.unstubAllGlobals();
  });
});
