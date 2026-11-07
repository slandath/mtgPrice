import { afterEach, describe, expect, it, vi } from "vitest";
import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { QueryClient, VueQueryPlugin } from "@tanstack/vue-query";
import PrimeVue from "primevue/config";

const { mockFetchFromAPI, mockToastAdd } = vi.hoisted(() => ({
  mockFetchFromAPI: vi.fn(),
  mockToastAdd: vi.fn(),
}));

vi.mock("@/api", () => ({
  fetchFromAPI: (...args: unknown[]) => mockFetchFromAPI(...args),
}));

vi.mock("primevue/usetoast", () => ({
  useToast: () => ({ add: mockToastAdd }),
}));

import ItemForm from "./ItemForm.vue";

let wrappers: VueWrapper[] = [];

function mountForm() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
  const wrapper = mount(ItemForm, {
    global: { plugins: [PrimeVue, [VueQueryPlugin, { queryClient }]] },
  });
  wrappers.push(wrapper);
  return wrapper;
}

async function submit(wrapper: VueWrapper) {
  const form = wrapper.find("form");
  expect(form.exists()).toBe(true);
  await form.trigger("submit");
  await flushPromises();
}

async function fill(wrapper: VueWrapper, selector: string, value: string) {
  const input = wrapper.find(selector);
  await input.setValue(value);
  // PrimeVue InputNumber commits currency values on blur.
  await input.trigger("blur");
}

afterEach(() => {
  for (const wrapper of wrappers) {
    wrapper.unmount();
  }
  wrappers = [];
  vi.clearAllMocks();
});

describe("ItemForm", () => {
  it("blocks invalid submit with field errors and fires no request", async () => {
    const wrapper = mountForm();

    await fill(wrapper, "input#quantity", "0");
    await wrapper.find("input#url").setValue("not-a-url");
    await submit(wrapper);

    expect(mockFetchFromAPI).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain("Name is required");
    expect(wrapper.text()).toContain("Quantity must be at least 1");
    expect(wrapper.text()).toContain("Must be a valid URL");
  });

  it("posts the payload once and shows a success toast on valid submit", async () => {
    mockFetchFromAPI.mockResolvedValue({ id: "1" });
    const wrapper = mountForm();

    await fill(wrapper, "input#name", "Lightning Bolt");
    await fill(wrapper, "input#cost", "10");
    await fill(wrapper, "input#url", "https://tcgplayer.com/product/123");
    await submit(wrapper);

    await vi.waitFor(() => expect(mockFetchFromAPI).toHaveBeenCalledTimes(1));
    expect(mockFetchFromAPI).toHaveBeenCalledWith(
      "/api/inventory",
      expect.objectContaining({ method: "POST" }),
    );
    const body = JSON.parse(mockFetchFromAPI.mock.calls[0][1].body as string);
    expect(body).toEqual({
      name: "Lightning Bolt",
      quantity: 1,
      cost: 10,
      url: "https://tcgplayer.com/product/123",
    });
    await vi.waitFor(() =>
      expect(mockToastAdd).toHaveBeenCalledWith(expect.objectContaining({ severity: "success" })),
    );
  });

  it("shows an error toast when the request fails", async () => {
    mockFetchFromAPI.mockRejectedValue(new Error("nope"));
    const wrapper = mountForm();

    await fill(wrapper, "input#name", "Lightning Bolt");
    await fill(wrapper, "input#cost", "10");
    await fill(wrapper, "input#url", "https://tcgplayer.com/product/123");
    await submit(wrapper);

    await vi.waitFor(() =>
      expect(mockToastAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: "error",
          detail: expect.stringContaining("Failed to add item: nope"),
        }),
      ),
    );
  });
});
