import { beforeEach, describe, expect, it, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import PrimeVue from "primevue/config";
import Button from "primevue/button";
import { nextTick, ref } from "vue";

const { mockSocial, mockToastAdd } = vi.hoisted(() => ({
  mockSocial: vi.fn(),
  mockToastAdd: vi.fn(),
}));

vi.mock("@/auth-client", () => ({
  authClient: {
    useSession: () => ref({ isPending: false, data: null }),
    signIn: { social: (...args: unknown[]) => mockSocial(...args) },
  },
}));

vi.mock("vue-router", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useRoute: () => ({ query: {} }),
  isNavigationFailure: () => false,
}));

vi.mock("primevue/usetoast", () => ({
  useToast: () => ({ add: mockToastAdd }),
}));

import LoginForm from "./LoginForm.vue";

beforeEach(() => {
  vi.clearAllMocks();
  mockSocial.mockResolvedValue({});
});

function mountForm() {
  return mount(LoginForm, { global: { plugins: [PrimeVue] } });
}

describe("LoginForm", () => {
  it("signs in with the github provider on click", async () => {
    const wrapper = mountForm();

    await wrapper.find("button").trigger("click");
    await flushPromises();

    expect(mockSocial).toHaveBeenCalledTimes(1);
    expect(mockSocial).toHaveBeenCalledWith(expect.objectContaining({ provider: "github" }));
  });

  it("shows an error toast when sign-in returns an error", async () => {
    mockSocial.mockResolvedValue({ error: { message: "denied" } });
    const wrapper = mountForm();

    await wrapper.find("button").trigger("click");
    await flushPromises();

    expect(mockToastAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: "error",
        detail: expect.stringContaining("Authentication failed: denied"),
      }),
    );
  });

  it("shows a fallback toast when sign-in throws", async () => {
    mockSocial.mockRejectedValue(new Error("network down"));
    const wrapper = mountForm();

    await wrapper.find("button").trigger("click");
    await flushPromises();

    expect(mockToastAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: "error",
        detail: expect.stringContaining("Authentication failed"),
      }),
    );
  });

  it("tracks pending state on the button while signing in", async () => {
    let resolveSignIn!: (value: unknown) => void;
    mockSocial.mockReturnValue(
      new Promise((resolve) => {
        resolveSignIn = resolve;
      }),
    );
    const wrapper = mountForm();
    const button = wrapper.findComponent(Button);

    expect(button.props("loading")).toBe(false);
    await wrapper.find("button").trigger("click");
    expect(button.props("loading")).toBe(true);

    resolveSignIn({});
    await flushPromises();
    await nextTick();
    expect(button.props("loading")).toBe(false);
  });
});
