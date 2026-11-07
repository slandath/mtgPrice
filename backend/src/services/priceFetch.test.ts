import { afterEach, describe, expect, it, vi } from "vitest";
import { priceFetch } from "./priceFetch.js";

function mockFetchJson(jsonValue: unknown) {
  const json = vi.fn().mockResolvedValue(jsonValue);
  const fetchMock = vi.fn().mockResolvedValue({ json });
  vi.stubGlobal("fetch", fetchMock);
  return { fetchMock, json };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("priceFetch", () => {
  it("returns null without calling fetch when the URL has no /product/<id>", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(priceFetch("https://example.com/not-a-product-page")).resolves.toBeNull();

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("calls the pricepoints endpoint for that id and returns the Normal marketPrice as a string", async () => {
    const { fetchMock } = mockFetchJson([
      { printingType: "Foil", marketPrice: 99.99 },
      { printingType: "Normal", marketPrice: 12.34 },
    ]);

    await expect(priceFetch("https://www.tcgplayer.com/product/12345/magic-foo")).resolves.toBe(
      "12.34",
    );

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0][0]).toBe(
      "https://mpapi.tcgplayer.com/v2/product/12345/pricepoints",
    );
  });

  it("returns null when there is no Normal printing", async () => {
    mockFetchJson([
      { printingType: "Foil", marketPrice: 5 },
      { printingType: "Limited", marketPrice: 7 },
    ]);

    await expect(priceFetch("https://www.tcgplayer.com/product/1/x")).resolves.toBeNull();
  });

  it("returns null when the Normal marketPrice is null", async () => {
    mockFetchJson([{ printingType: "Normal", marketPrice: null }]);

    await expect(priceFetch("https://www.tcgplayer.com/product/1/x")).resolves.toBeNull();
  });

  it("rejects on non-array payloads (pins current behavior)", async () => {
    mockFetchJson({ printingType: "Normal", marketPrice: 1 });

    await expect(priceFetch("https://www.tcgplayer.com/product/1/x")).rejects.toThrow();
  });

  it("propagates a rejected fetch (pins current behavior)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

    await expect(priceFetch("https://www.tcgplayer.com/product/1/x")).rejects.toThrow(
      "network down",
    );
  });
});
