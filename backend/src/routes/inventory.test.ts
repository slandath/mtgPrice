import type { FastifyInstance } from "fastify";
import Fastify from "fastify";
import fastifySensible from "@fastify/sensible";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockGetSession,
  mockPriceFetch,
  mockRefreshAll,
  mockOrderBy,
  mockLimit,
  mockInsertReturning,
  mockUpdateWhere,
  mockUpdateReturning,
  mockDeleteReturning,
} = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
  mockPriceFetch: vi.fn(),
  mockRefreshAll: vi.fn(),
  mockOrderBy: vi.fn(),
  mockLimit: vi.fn(),
  mockInsertReturning: vi.fn(),
  mockUpdateWhere: vi.fn(),
  mockUpdateReturning: vi.fn(),
  mockDeleteReturning: vi.fn(),
}));

vi.mock("../index.js", () => ({
  db: {
    select: () => ({ from: () => ({ where: () => ({ orderBy: mockOrderBy, limit: mockLimit }) }) }),
    insert: () => ({ values: () => ({ returning: mockInsertReturning }) }),
    update: () => ({ set: () => ({ where: mockUpdateWhere }) }),
    delete: () => ({ where: () => ({ returning: mockDeleteReturning }) }),
  },
}));

vi.mock("../utils/auth.js", () => ({
  auth: { api: { getSession: mockGetSession } },
}));

vi.mock("../services/priceFetch.js", () => ({
  priceFetch: mockPriceFetch,
}));

vi.mock("../services/refreshAllPrices.js", () => ({
  refreshAllPrices: mockRefreshAll,
}));

import inventoryRoutes from "./inventory.js";

const USER_ID = "user-1";
const ITEM_ID = "123e4567-e89b-12d3-a456-426614174000";
const OTHER_ITEM_ID = "123e4567-e89b-12d3-a456-426614174001";

function session() {
  return { user: { id: USER_ID }, session: { id: "session-1" } };
}

function item(overrides: Record<string, unknown> = {}) {
  return {
    id: ITEM_ID,
    userId: USER_ID,
    name: "Lightning Bolt",
    quantity: 4,
    cost: "1.50",
    currentPrice: "2.00",
    url: "https://www.tcgplayer.com/product/12345/magic-lightning-bolt",
    ...overrides,
  };
}

const validBody = {
  name: "Lightning Bolt",
  quantity: 4,
  cost: 1.5,
  url: "https://www.tcgplayer.com/product/12345/magic-lightning-bolt",
};

let app: FastifyInstance;

beforeAll(async () => {
  app = Fastify({ logger: false });
  await app.register(fastifySensible);
  await app.register(inventoryRoutes);
  await app.ready();
});

afterAll(async () => {
  await app.close();
});

beforeEach(() => {
  vi.clearAllMocks();
  mockGetSession.mockResolvedValue(session());
  mockUpdateWhere.mockReturnValue({ returning: mockUpdateReturning });
});

describe("GET /", () => {
  it("returns 401 without a session", async () => {
    mockGetSession.mockResolvedValueOnce(null);

    const res = await app.inject({ method: "GET", url: "/" });

    expect(res.statusCode).toBe(401);
  });

  it("returns 200 with the session user's items", async () => {
    mockOrderBy.mockResolvedValue([item(), item({ id: OTHER_ITEM_ID, name: "Counterspell" })]);

    const res = await app.inject({ method: "GET", url: "/" });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.inventory).toHaveLength(2);
    expect(body.inventory[0].userId).toBe(USER_ID);
    expect(body.message).toBeUndefined();
  });

  it("returns the empty-list message when the user has no items", async () => {
    mockOrderBy.mockResolvedValue([]);

    const res = await app.inject({ method: "GET", url: "/" });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ inventory: [], message: "No items found for user" });
  });
});

describe("POST /", () => {
  it("returns 401 without a session", async () => {
    mockGetSession.mockResolvedValueOnce(null);

    const res = await app.inject({ method: "POST", url: "/", payload: validBody });

    expect(res.statusCode).toBe(401);
  });

  it("returns 400 on a schema-invalid body", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/",
      payload: { name: "", quantity: 0, cost: -1, url: "not-a-url" },
    });

    expect(res.statusCode).toBe(400);
    expect(mockInsertReturning).not.toHaveBeenCalled();
  });

  it("returns 201 with the created item stamped with the session user's id", async () => {
    mockInsertReturning.mockResolvedValue([item()]);

    const res = await app.inject({ method: "POST", url: "/", payload: validBody });

    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.item.userId).toBe(USER_ID);
    expect(body.item.name).toBe(validBody.name);
  });
});

describe("PATCH /:id", () => {
  it("returns 400 on a non-UUID id", async () => {
    const res = await app.inject({
      method: "PATCH",
      url: "/not-an-id",
      payload: { quantity: 2 },
    });

    expect(res.statusCode).toBe(400);
  });

  it("returns 400 on an invalid body", async () => {
    const res = await app.inject({
      method: "PATCH",
      url: `/${ITEM_ID}`,
      payload: { quantity: 0 },
    });

    expect(res.statusCode).toBe(400);
  });

  it("returns 404 when the item is missing or owned by another user", async () => {
    mockUpdateReturning.mockResolvedValue([]);

    const res = await app.inject({
      method: "PATCH",
      url: `/${OTHER_ITEM_ID}`,
      payload: { quantity: 2 },
    });

    expect(res.statusCode).toBe(404);
  });

  it("returns 200 with the updated item", async () => {
    mockUpdateReturning.mockResolvedValue([item({ quantity: 2 })]);

    const res = await app.inject({
      method: "PATCH",
      url: `/${ITEM_ID}`,
      payload: { quantity: 2 },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ id: ITEM_ID, quantity: 2 });
  });
});

describe("PATCH /:id/fetch-price", () => {
  it("returns 400 on a non-UUID id", async () => {
    const res = await app.inject({ method: "PATCH", url: "/not-an-id/fetch-price" });

    expect(res.statusCode).toBe(400);
  });

  it("returns 404 for a missing or foreign-owned item", async () => {
    mockLimit.mockResolvedValue([]);

    const res = await app.inject({ method: "PATCH", url: `/${OTHER_ITEM_ID}/fetch-price` });

    expect(res.statusCode).toBe(404);
    expect(mockPriceFetch).not.toHaveBeenCalled();
  });

  it("returns 400 when priceFetch returns null", async () => {
    mockLimit.mockResolvedValue([item()]);
    mockPriceFetch.mockResolvedValue(null);

    const res = await app.inject({ method: "PATCH", url: `/${ITEM_ID}/fetch-price` });

    expect(res.statusCode).toBe(400);
  });

  it("returns 200 with the price and persists it", async () => {
    mockLimit.mockResolvedValue([item()]);
    mockPriceFetch.mockResolvedValue("12.34");

    const res = await app.inject({ method: "PATCH", url: `/${ITEM_ID}/fetch-price` });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ price: "12.34" });
  });
});

describe("DELETE /:id", () => {
  it("returns 400 on a non-UUID id", async () => {
    const res = await app.inject({ method: "DELETE", url: "/not-an-id" });

    expect(res.statusCode).toBe(400);
  });

  it("returns 404 for a missing or foreign-owned item", async () => {
    mockDeleteReturning.mockResolvedValue([]);

    const res = await app.inject({ method: "DELETE", url: `/${OTHER_ITEM_ID}` });

    expect(res.statusCode).toBe(404);
  });

  it("returns 204 with an empty body on success", async () => {
    mockDeleteReturning.mockResolvedValue([item()]);

    const res = await app.inject({ method: "DELETE", url: `/${ITEM_ID}` });

    expect(res.statusCode).toBe(204);
    expect(res.body).toBe("");
  });
});

describe("POST /refresh-all", () => {
  it("returns 401 without a session", async () => {
    mockGetSession.mockResolvedValueOnce(null);

    const res = await app.inject({ method: "POST", url: "/refresh-all" });

    expect(res.statusCode).toBe(401);
  });

  it("returns 200 with the refresh summary", async () => {
    mockRefreshAll.mockResolvedValue({ updated: 2, failed: 1, total: 3 });

    const res = await app.inject({ method: "POST", url: "/refresh-all" });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ updated: 2, failed: 1, total: 3 });
  });
});
