import { afterEach, describe, expect, it, vi } from "vitest";
import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { QueryClient, VueQueryPlugin } from "@tanstack/vue-query";
import PrimeVue from "primevue/config";
import DataTable from "primevue/datatable";

const { mockFetchFromAPI, mockConfirmRequire, mockToastAdd } = vi.hoisted(() => ({
  mockFetchFromAPI: vi.fn(),
  mockConfirmRequire: vi.fn(),
  mockToastAdd: vi.fn(),
}));

vi.mock("@/api", () => ({
  fetchFromAPI: (...args: unknown[]) => mockFetchFromAPI(...args),
}));

vi.mock("primevue/useconfirm", () => ({
  useConfirm: () => ({ require: mockConfirmRequire }),
}));

vi.mock("primevue/usetoast", () => ({
  useToast: () => ({ add: mockToastAdd }),
}));

import InventoryTable from "./InventoryTable.vue";

// jsdom has no matchMedia; PrimeVue's paginator dropdown needs it on mount.
if (!window.matchMedia) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

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
    currentPrice: "10.00",
    cost: "2.00",
    url: "https://example.com/product/1",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

const bolt = () => item({ id: "1", name: "Lightning Bolt", currentPrice: "10.00", cost: "2.00" });
const lotus = () =>
  item({ id: "2", name: "Black Lotus", currentPrice: "20000.00", cost: "5000.00" });

let wrappers: VueWrapper[] = [];

function mountTable() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
  const wrapper = mount(InventoryTable, {
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

describe("InventoryTable", () => {
  it("renders loading state while fetching", () => {
    mockFetchFromAPI.mockReturnValue(new Promise(() => {}));

    const wrapper = mountTable();

    expect(wrapper.text()).toContain("Loading...");
  });

  it("renders the error message when fetching fails", async () => {
    mockFetchFromAPI.mockRejectedValue(new Error("db down"));

    const wrapper = mountTable();
    await vi.waitFor(() => expect(wrapper.text()).toContain("Error: db down"));
  });

  it("renders rows from data", async () => {
    mockFetchFromAPI.mockResolvedValue({ inventory: [bolt(), lotus()] });

    const wrapper = mountTable();
    await vi.waitFor(() => expect(wrapper.text()).toContain("Lightning Bolt"));
    expect(wrapper.text()).toContain("Black Lotus");
  });

  it("filters by name case-insensitively", async () => {
    mockFetchFromAPI.mockResolvedValue({ inventory: [bolt(), lotus()] });

    const wrapper = mountTable();
    await vi.waitFor(() => expect(wrapper.text()).toContain("Lightning Bolt"));

    await wrapper.find('input[aria-label="Search items"]').setValue("LOTUS");
    await flushPromises();

    expect(wrapper.text()).toContain("Black Lotus");
    expect(wrapper.text()).not.toContain("Lightning Bolt");
  });

  it("asks for confirmation before deleting", async () => {
    mockFetchFromAPI.mockResolvedValue({ inventory: [bolt(), lotus()] });

    const wrapper = mountTable();
    await vi.waitFor(() => expect(wrapper.text()).toContain("Black Lotus"));

    await wrapper.find('button[aria-label="Delete Black Lotus"]').trigger("click");

    expect(mockConfirmRequire).toHaveBeenCalledTimes(1);
    expect(mockConfirmRequire).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining("Black Lotus") }),
    );
    expect(mockFetchFromAPI).not.toHaveBeenCalledWith(
      "/api/inventory/2",
      expect.objectContaining({ method: "DELETE" }),
    );
  });

  it("deletes after confirmation", async () => {
    mockFetchFromAPI.mockResolvedValue({ inventory: [bolt()] });

    const wrapper = mountTable();
    await vi.waitFor(() => expect(wrapper.text()).toContain("Lightning Bolt"));

    await wrapper.find('button[aria-label="Delete Lightning Bolt"]').trigger("click");
    const accept = mockConfirmRequire.mock.calls[0][0].accept as () => void;
    accept();

    await vi.waitFor(() =>
      expect(mockFetchFromAPI).toHaveBeenCalledWith(
        "/api/inventory/1",
        expect.objectContaining({ method: "DELETE" }),
      ),
    );
  });

  it("shapes the row-edit save payload with numeric cost and no identity fields", async () => {
    mockFetchFromAPI.mockResolvedValue({ inventory: [bolt()] });

    const wrapper = mountTable();
    await vi.waitFor(() => expect(wrapper.text()).toContain("Lightning Bolt"));

    const table = wrapper.findComponent(DataTable);
    expect(table.exists()).toBe(true);
    table.vm.$emit("row-edit-save", { newData: { ...bolt(), quantity: 3, cost: "7.50" } });

    await vi.waitFor(() =>
      expect(mockFetchFromAPI).toHaveBeenCalledWith(
        "/api/inventory/1",
        expect.objectContaining({ method: "PATCH" }),
      ),
    );
    const patchCall = mockFetchFromAPI.mock.calls.find(
      ([url, options]) =>
        url === "/api/inventory/1" &&
        (options as { method: string }).method === "PATCH" &&
        !(url as string).includes("fetch-price"),
    );
    expect(patchCall).toBeDefined();
    const payload = JSON.parse((patchCall![1] as { body: string }).body as string);
    expect(payload).toEqual({ name: "Lightning Bolt", quantity: 3, cost: 7.5 });
  });
});
