import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockSelectFrom, mockUpdateWhere, mockPriceFetch } = vi.hoisted(() => ({
  mockSelectFrom: vi.fn(),
  mockUpdateWhere: vi.fn(),
  mockPriceFetch: vi.fn(),
}));

vi.mock("../index.js", () => ({
  db: {
    select: () => ({ from: mockSelectFrom }),
    update: () => ({ set: () => ({ where: mockUpdateWhere }) }),
  },
}));

vi.mock("./priceFetch.js", () => ({
  priceFetch: mockPriceFetch,
}));

import { refreshAllPrices } from "./refreshAllPrices.js";

function item(id: string, url: string) {
  return { id, url };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockUpdateWhere.mockResolvedValue([]);
});

describe("refreshAllPrices", () => {
  it("returns zeros for an empty inventory", async () => {
    mockSelectFrom.mockResolvedValue([]);

    await expect(refreshAllPrices()).resolves.toEqual({ updated: 0, failed: 0, total: 0 });

    expect(mockPriceFetch).not.toHaveBeenCalled();
    expect(mockUpdateWhere).not.toHaveBeenCalled();
  });

  it("updates every item when all prices are found", async () => {
    mockSelectFrom.mockResolvedValue([
      item("a", "https://www.tcgplayer.com/product/1/x"),
      item("b", "https://www.tcgplayer.com/product/2/x"),
    ]);
    mockPriceFetch.mockResolvedValue("10.00");

    await expect(refreshAllPrices()).resolves.toEqual({ updated: 2, failed: 0, total: 2 });

    expect(mockUpdateWhere).toHaveBeenCalledTimes(2);
  });

  it("counts failed and skips the update when priceFetch returns null", async () => {
    mockSelectFrom.mockResolvedValue([
      item("a", "https://www.tcgplayer.com/product/1/x"),
      item("b", "https://www.tcgplayer.com/product/2/x"),
    ]);
    mockPriceFetch.mockResolvedValueOnce("10.00").mockResolvedValueOnce(null);

    await expect(refreshAllPrices()).resolves.toEqual({ updated: 1, failed: 1, total: 2 });

    expect(mockUpdateWhere).toHaveBeenCalledTimes(1);
  });

  it("continues the run when priceFetch throws for one item (error isolation)", async () => {
    mockSelectFrom.mockResolvedValue([
      item("a", "https://www.tcgplayer.com/product/1/x"),
      item("b", "https://www.tcgplayer.com/product/2/x"),
      item("c", "https://www.tcgplayer.com/product/3/x"),
    ]);
    mockPriceFetch
      .mockRejectedValueOnce(new Error("boom"))
      .mockResolvedValueOnce("10.00")
      .mockResolvedValueOnce("20.00");

    await expect(refreshAllPrices()).resolves.toEqual({ updated: 2, failed: 1, total: 3 });

    expect(mockUpdateWhere).toHaveBeenCalledTimes(2);
  });
});
