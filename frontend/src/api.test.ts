import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchFromAPI } from "./api";

interface MockResponse {
  ok: boolean;
  status: number;
  statusText: string;
  json: () => Promise<unknown>;
}

function mockFetchOnce(response: MockResponse) {
  const fetchMock = vi.fn().mockResolvedValue(response);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function jsonResponse(status: number, body: unknown, statusText = ""): MockResponse {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText,
    json: () => Promise.resolve(body),
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fetchFromAPI", () => {
  it("adds Content-Type: application/json when a body is present", async () => {
    const fetchMock = mockFetchOnce(jsonResponse(200, { ok: true }));

    await fetchFromAPI("/api/inventory", { method: "POST", body: JSON.stringify({ a: 1 }) });

    expect(fetchMock).toHaveBeenCalledWith("/api/inventory", {
      method: "POST",
      body: JSON.stringify({ a: 1 }),
      headers: { "Content-Type": "application/json" },
    });
  });

  it("preserves caller headers alongside the JSON content type", async () => {
    const fetchMock = mockFetchOnce(jsonResponse(200, { ok: true }));

    await fetchFromAPI("/api/inventory", {
      method: "POST",
      body: "{}",
      headers: { Authorization: "Bearer token" },
    });

    expect(fetchMock).toHaveBeenCalledWith("/api/inventory", {
      method: "POST",
      body: "{}",
      headers: { "Content-Type": "application/json", Authorization: "Bearer token" },
    });
  });

  it("returns parsed JSON on 2xx", async () => {
    mockFetchOnce(jsonResponse(200, { inventory: [] }));

    await expect(fetchFromAPI("/api/inventory")).resolves.toEqual({ inventory: [] });
  });

  it("returns undefined on 204 without reading the body", async () => {
    const json = vi.fn();
    const fetchMock = mockFetchOnce({ ok: true, status: 204, statusText: "No Content", json });

    await expect(fetchFromAPI("/api/inventory/1", { method: "DELETE" })).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalled();
    expect(json).not.toHaveBeenCalled();
  });

  it("throws API error with the body message on non-2xx", async () => {
    mockFetchOnce(jsonResponse(404, { message: "not here" }, "Not Found"));

    await expect(fetchFromAPI("/api/inventory/1")).rejects.toThrow("API error: 404 not here");
  });

  it("falls back to statusText when the error body has no message", async () => {
    mockFetchOnce(jsonResponse(500, {}, "Internal Server Error"));

    await expect(fetchFromAPI("/api/inventory")).rejects.toThrow(
      "API error: 500 Internal Server Error",
    );
  });

  it("survives a non-JSON error body", async () => {
    mockFetchOnce({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      json: () => Promise.reject(new Error("invalid json")),
    });

    await expect(fetchFromAPI("/api/inventory")).rejects.toThrow(
      "API error: 500 Internal Server Error",
    );
  });
});
