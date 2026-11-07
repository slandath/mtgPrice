import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import PrimeVue from "primevue/config";
import SearchBar from "./SearchBar.vue";

function mountSearchBar(modelValue: string) {
  return mount(SearchBar, {
    props: { modelValue },
    global: { plugins: [PrimeVue] },
  });
}

describe("SearchBar", () => {
  it("typing emits model updates", async () => {
    const wrapper = mountSearchBar("");

    await wrapper.find('input[aria-label="Search items"]').setValue("bolt");

    expect(wrapper.emitted("update:modelValue")).toEqual([["bolt"]]);
  });

  it("hides the clear button when there is no text", () => {
    const wrapper = mountSearchBar("");

    expect(wrapper.find('button[aria-label="Clear search"]').exists()).toBe(false);
  });

  it("clear button appears with text and resets the model", async () => {
    const wrapper = mountSearchBar("bolt");

    const clear = wrapper.find('button[aria-label="Clear search"]');
    expect(clear.exists()).toBe(true);
    await clear.trigger("click");

    expect(wrapper.emitted("update:modelValue")).toEqual([[""]]);
  });
});
