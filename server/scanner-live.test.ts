import { describe, expect, it, vi } from "vitest";
import { hasUsableChart, money, poolToMarket, tokenImageUrl, type LivePool } from "../client/src/lib/scannerData";

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

  it("normalizes the reported SHARCFUN live pool fixture", () => {
    const row = poolToMarket({ address: "0x43d92668d942d5eaf24817387593e9cd052df35d", pairName: "SHARCFUN/USDC", priceUsd: 0.00021911277347173416, change24h: -20.401954958911457, volume24hUsd: 33841.534226, liquidityUsd: 19107.972138, fdvUsd: 212476.285131, swaps24h: 342, baseToken: { address: "0x99b37b7fccaa7a1030617b6195eb3045c523bb97", name: "Sharc Fun", symbol: "SHARCFUN", decimals: 18, imageUrl: "https://example.com/sharcfun.png" }, quoteToken: { address: "0x3600000000000000000000000000000000000000", name: "USDC", symbol: "USDC", decimals: 6 }, protocol: "v3" }, 0);
    expect(row.pair).toBe("SHARCFUN / USDC");
    expect(row.price).toContain("0.000219");
    expect(row.imageUrl).toBe("https://example.com/sharcfun.png");
  });

  it("uses provider image URLs and rejects unavailable chart data", () => {
    expect(tokenImageUrl({ imageUrl: "https://example.com/token.png" })).toBe("https://example.com/token.png");
    expect(hasUsableChart([])).toBe(false);
    expect(hasUsableChart([{ timestamp: 1, value: 0 }])).toBe(false);
  });

  it("maps A/X candle close prices from ISO timestamps", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ candles: [{ timestamp: "2026-09-07T12:00:00.000Z", close: 1.25, volumeUsd: 42 }] }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const { loadPoolChart } = await import("../client/src/lib/scannerData");
    await expect(loadPoolChart("0x2222222222222222222222222222222222222222")).resolves.toEqual([{ timestamp: Date.parse("2026-09-07T12:00:00.000Z"), value: 1.25, volume: 42 }]);
    vi.unstubAllGlobals();
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
