const AX_API = "https://www.arcexplorer.org/api/v1";

export default async function handler(req: any, res: any) {
  const address = req.query?.address;
  const params = new URLSearchParams();
  const detail = typeof address === "string" && address.length > 0;
  const keys = detail ? ["days", "interval"] : ["limit", "offset", "sort", "order", "minLiquidity", "q"];
  for (const key of keys) {
    const value = req.query?.[key];
    if (typeof value === "string" && value) params.set(key, value);
  }

  try {
    const upstreamUrl = detail
      ? `${AX_API}/dex/pools/${encodeURIComponent(address)}?${params.toString()}`
      : `${AX_API}/dex/pools?${params.toString()}`;
    const upstream = await fetch(upstreamUrl, {
      headers: { accept: "application/json" },
    });
    const body = await upstream.text();
    res.status(upstream.status).setHeader("content-type", "application/json").send(body);
  } catch (error) {
    res.status(502).json({ error: error instanceof Error ? error.message : "ARC Explorer upstream unavailable" });
  }
}
