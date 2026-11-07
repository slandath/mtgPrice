import { afterEach, describe, expect, it, vi } from "vitest";
import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { QueryClient, VueQueryPlugin } from "@tanstack/vue-query";
import PrimeVue from "primevue/config";

const { mockFetchFromAPI } = vi.hoisted(() => ({
  mockFetchFromAPI: vi.fn(),
}));

vi.mock("@/api", () => ({
  fetchFromAPI: (...args: unknown[]) => mockFetchFromAPI(...args),
}));

import DashboardWidgets from "./DashboardWidgets.vue";

interface Item {
  id: string;
  userId: string;
  name: string;
  quantity: number;
  currentPrice: string;
  cost: string;
  url: string;
  createdAt: string;
  updatedAt: string;
}

function item(overrides: Partial<Item> & { id: string; name: string }): Item {
  return {
    userId: "user-1",
    quantity: 1,
    currentPrice: "0",
    cost: "0",
    url: "https://example.com/product/1",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

let wrappers: VueWrapper[] = [];

function mountWidgets() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
  const wrapper = mount(DashboardWidgets, {
    global: { plugins: [PrimeVue, [VueQueryPlugin, { queryClient }]] },
  });
  wrappers.push(wrapper);
  return wrapper;
}

afterEach(() => {
  for (const wrapper of wrappers) {
    wrapper.unmount();
  }
  wrappers = [];
  vi.clearAllMocks();
});

describe("DashboardWidgets", () => {
  it("renders loading state while fetching", () => {
    mockFetchFromAPI.mockReturnValue(new Promise(() => {}));

    const wrapper = mountWidgets();

    expect(wrapper.text()).toContain("Loading...");
  });

  it("renders the error message when fetching fails", async () => {
    mockFetchFromAPI.mockRejectedValue(new Error("db down"));

    const wrapper = mountWidgets();
    await vi.waitFor(() => expect(wrapper.text()).toContain("Error: db down"));
  });

  it("sums market value and cost basis", async () => {
    mockFetchFromAPI.mockResolvedValue({
      inventory: [
        item({ id: "1", name: "Bolt", currentPrice: "10", cost: "4" }),
        item({ id: "2", name: "Lotus", currentPrice: "20", cost: "6" }),
      ],
    });

    const wrapper = mountWidgets();
    await vi.waitFor(() => expect(wrapper.text()).toContain("Market Value"));
    await flushPromises();

    expect(wrapper.text()).toContain("$30.00");
    expect(wrapper.text()).toContain("$10.00");
  });

  it("shows 0 gain/loss when cost basis is 0", async () => {
    mockFetchFromAPI.mockResolvedValue({
      inventory: [item({ id: "1", name: "Gift", currentPrice: "25", cost: "0" })],
    });

    const wrapper = mountWidgets();
    await vi.waitFor(() => expect(wrapper.text()).toContain("Gain/Loss"));
    await flushPromises();

    expect(wrapper.text()).toContain("0.00%");
  });

  it("lists the 5 most valuable items", async () => {
    mockFetchFromAPI.mockResolvedValue({
      inventory: [1, 2, 3, 4, 5, 6, 7].map((n) =>
        item({ id: String(n), name: `Card ${n}`, currentPrice: String(n * 10), cost: "1" }),
      ),
    });

    const wrapper = mountWidgets();
    await vi.waitFor(() => expect(wrapper.text()).toContain("Most Valuable Items"));
    await flushPromises();

    const text = wrapper.text();
    for (const name of ["Card 7", "Card 6", "Card 5", "Card 4", "Card 3"]) {
      expect(text).toContain(name);
    }
    expect(text).not.toContain("Card 2");
    expect(text).not.toContain("Card 1");
    expect(text.indexOf("Card 7")).toBeLessThan(text.indexOf("Card 6"));
  });
});
