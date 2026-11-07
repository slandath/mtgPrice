import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const { mockAuthHandler, mockGetSession } = vi.hoisted(() => ({
  mockAuthHandler: vi.fn(),
  mockGetSession: vi.fn(),
}));

vi.mock("./utils/auth.js", () => ({
  auth: { handler: mockAuthHandler, api: { getSession: mockGetSession } },
}));

// frontend/dist is gitignored, so a clean checkout has no index.html for
// @fastify/static to serve. Stub the static registration and pin the routing
// contract (non-API GET -> sendFile("index.html")) instead of the file itself.
vi.mock("@fastify/static", () => {
  // fastify-plugin's skip-override so the sendFile decorator is visible
  // outside this plugin's encapsulated context (like the real plugin).
  const plugin = async (instance: {
    decorateReply: (name: string, fn: (file: string) => unknown) => void;
  }) => {
    instance.decorateReply(
      "sendFile",
      function (this: { type: (t: string) => { send: (body: string) => unknown } }, file: string) {
        return this.type("text/html").send(`<html>static-stub:${file}</html>`);
      },
    );
  };
  (plugin as unknown as Record<symbol, boolean>)[Symbol.for("skip-override")] = true;
  return { default: plugin };
});

import type { FastifyInstance } from "fastify";
import { buildApp } from "./app.js";

let app: FastifyInstance;

beforeAll(async () => {
  app = await buildApp();
});

afterAll(async () => {
  await app.close();
});

beforeEach(() => {
  vi.clearAllMocks();
  mockGetSession.mockResolvedValue(null);
});

describe("auth boundary", () => {
  it("returns 500 { error: 'Authentication failed' } when the auth handler throws", async () => {
    mockAuthHandler.mockRejectedValueOnce(new Error("boom"));

    const res = await app.inject({ method: "GET", url: "/api/auth/session" });

    expect(res.statusCode).toBe(500);
    expect(res.json()).toEqual({ error: "Authentication failed" });
  });

  it("passes auth handler responses through", async () => {
    mockAuthHandler.mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    const res = await app.inject({ method: "GET", url: "/api/auth/session" });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ ok: true });
  });
});

describe("not-found handling", () => {
  it("returns 404 JSON for unknown /api/* routes", async () => {
    const res = await app.inject({ method: "GET", url: "/api/nope" });

    expect(res.statusCode).toBe(404);
    expect(res.json()).toEqual({ error: "Not found" });
  });

  it("falls back to index.html for non-API GET routes", async () => {
    const res = await app.inject({ method: "GET", url: "/some-client-route" });

    expect(res.statusCode).toBe(200);
    expect(res.body).toContain("static-stub:index.html");
  });
});
