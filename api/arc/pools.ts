const AX_API = "https://www.arcexplorer.org/api/v1";

export default async function handler(req: any, res: any) {
  const params = new URLSearchParams();
  for (const key of ["limit", "offset", "sort", "order", "minLiquidity", "q"]) {
    const value = req.query?.[key];
    if (typeof value === "string" && value) params.set(key, value);
  }

  try {
    const upstream = await fetch(`${AX_API}/dex/pools?${params.toString()}`, {
      headers: { accept: "application/json" },
    });
    const body = await upstream.text();
    res.status(upstream.status).setHeader("content-type", "application/json").send(body);
  } catch (error) {
    res.status(502).json({ error: error instanceof Error ? error.message : "ARC Explorer upstream unavailable" });
  }
}
