import { describe, expect, it } from "vitest";
import { auth } from "./auth.js";

type AuthShape = {
  options: { basePath?: string; plugins?: { id?: string }[] };
};

describe("auth config", () => {
  it("serves the API under /api/auth", () => {
    expect((auth as unknown as AuthShape).options.basePath).toBe("/api/auth");
  });

  it("includes the admin plugin", () => {
    const plugins = (auth as unknown as AuthShape).options.plugins ?? [];
    expect(plugins.map((plugin) => plugin.id)).toContain("admin");
  });
});
