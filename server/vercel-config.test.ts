import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("Vercel deployment configuration", () => {
  it("serves the Vite output and routes API requests to the handler", () => {
    const config = JSON.parse(readFileSync(resolve(process.cwd(), "vercel.json"), "utf8"));

    expect(config.buildCommand).toBe("pnpm run build");
    expect(config.outputDirectory).toBe("dist/public");
    expect(config.framework).toBe("vite");
    expect(config.functions).toBeUndefined();
    expect(config.rewrites).toEqual([{ source: "/(.*)", destination: "/index.html" }]);

    expect(readFileSync(resolve(process.cwd(), "api/arc/pools.ts"), "utf8")).toContain(
      "https://www.arcexplorer.org/api/v1"
    );
    const home = readFileSync(resolve(process.cwd(), "client/src/pages/Home.tsx"), "utf8");
    expect(home).toContain('aria-label="Dex ARC logo"');
    expect(home).toContain('id="dexArcLogo"');
    expect(home).not.toContain("LOGO_URL");
  });
});
