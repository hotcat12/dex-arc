import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("Vercel deployment configuration", () => {
  it("serves the Vite output and routes API requests to the handler", () => {
    const config = JSON.parse(readFileSync(resolve(process.cwd(), "vercel.json"), "utf8"));

    expect(config.buildCommand).toBe("pnpm run build");
    expect(config.outputDirectory).toBe("dist/public");
    expect(config.framework).toBe("vite");
    expect(config.functions["api/index.ts"].runtime).toBe("nodejs22.x");
    expect(config.rewrites).toEqual([
      { source: "/api/:path*", destination: "/api/index.ts" },
      { source: "/(.*)", destination: "/index.html" },
    ]);
  });
});
