import type { Express, Request, Response } from "express";

const AX_API = "https://www.arcexplorer.org/api/v1";

async function proxyJson(url: string, response: Response) {
  try {
    const upstream = await fetch(url, { headers: { accept: "application/json" } });
    const body = await upstream.text();
    response.status(upstream.status).type("application/json").send(body);
  } catch (error) {
    response.status(502).json({ error: error instanceof Error ? error.message : "ARC Explorer upstream unavailable" });
  }
}

export function registerArcProxy(app: Express) {
  app.get("/api/arc/pools", (req: Request, res: Response) => {
    const params = new URLSearchParams();
    for (const key of ["limit", "offset", "sort", "order", "minLiquidity", "q"]) {
      const value = req.query[key];
      if (typeof value === "string" && value) params.set(key, value);
    }
    void proxyJson(`${AX_API}/dex/pools?${params.toString()}`, res);
  });

  app.get("/api/arc/pools/:address", (req: Request, res: Response) => {
    const params = new URLSearchParams();
    for (const key of ["days", "interval"]) {
      const value = req.query[key];
      if (typeof value === "string" && value) params.set(key, value);
    }
    void proxyJson(`${AX_API}/dex/pools/${encodeURIComponent(req.params.address)}?${params.toString()}`, res);
  });
}
