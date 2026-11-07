import { beforeEach, describe, expect, it, vi } from "vitest";
import { flushPromises } from "@vue/test-utils";
import { ref } from "vue";

const state = vi.hoisted(() => ({
  push: vi.fn(),
  query: {} as Record<string, unknown>,
  session: null as { value: unknown } | null,
  isNavigationFailure: vi.fn((_value: unknown) => false),
}));

vi.mock("vue-router", () => ({
  useRouter: () => ({ push: state.push }),
  useRoute: () => ({ query: state.query }),
  isNavigationFailure: (value: unknown) => state.isNavigationFailure(value),
}));

vi.mock("../auth-client", () => ({
  authClient: { useSession: () => state.session },
}));

import { useAuthRedirect } from "./useAuthRedirect";

interface SessionData {
  isPending: boolean;
  data: { user: { id: string } } | null;
}

function authedSession(): SessionData {
  return { isPending: false, data: { user: { id: "user-1" } } };
}

function stubStorage(initial: Record<string, string> = {}) {
  const store = new Map(Object.entries(initial));
  const storage = {
    getItem: vi.fn((key: string) => (store.has(key) ? store.get(key)! : null)),
    setItem: vi.fn((key: string, value: string) => {
      store.set(key, value);
    }),
    removeItem: vi.fn((key: string) => {
      store.delete(key);
    }),
    clear: vi.fn(() => {
      store.clear();
    }),
  };
  vi.stubGlobal("sessionStorage", storage);
  return storage;
}

beforeEach(() => {
  vi.unstubAllGlobals();
  state.push.mockReset().mockResolvedValue(undefined);
  state.isNavigationFailure.mockReset().mockReturnValue(false);
  for (const key of Object.keys(state.query)) {
    delete state.query[key];
  }
  state.session = ref({ isPending: true, data: null });
  stubStorage();
});

describe("useAuthRedirect", () => {
  it("does nothing while the session is pending", async () => {
    useAuthRedirect();

    await flushPromises();

    expect(state.push).not.toHaveBeenCalled();
  });

  it("redirects when a pending session resolves to an authenticated user", async () => {
    const session = ref<SessionData>({ isPending: true, data: null });
    state.session = session;
    useAuthRedirect();
    await flushPromises();
    expect(state.push).not.toHaveBeenCalled();

    session.value = authedSession();
    await flushPromises();

    expect(state.push).toHaveBeenCalledWith("/");
  });

  it("prefers the stored post-login target", async () => {
    stubStorage({ post_login_redirect: "/inventory" });
    state.session = ref<SessionData>(authedSession());

    const { handleAuthenticated } = useAuthRedirect();
    await handleAuthenticated();

    expect(state.push).toHaveBeenCalledWith("/inventory");
  });

  it("falls back to the ?redirect= query parameter", async () => {
    state.query.redirect = "/add";
    state.session = ref<SessionData>(authedSession());

    const { handleAuthenticated } = useAuthRedirect();
    await handleAuthenticated();

    expect(state.push).toHaveBeenCalledWith("/add");
  });

  it("falls back to / with no stored or query target", async () => {
    state.session = ref<SessionData>(authedSession());

    const { handleAuthenticated } = useAuthRedirect();
    await handleAuthenticated();

    expect(state.push).toHaveBeenCalledWith("/");
  });

  it("rejects protocol-relative targets", async () => {
    stubStorage({ post_login_redirect: "//evil.example/phish" });
    state.session = ref<SessionData>(authedSession());

    const { handleAuthenticated } = useAuthRedirect();
    await handleAuthenticated();

    expect(state.push).toHaveBeenCalledWith("/");
  });

  it("rejects absolute external URLs", async () => {
    state.query.redirect = "https://evil.example/phish";
    state.session = ref<SessionData>(authedSession());

    const { handleAuthenticated } = useAuthRedirect();
    await handleAuthenticated();

    expect(state.push).toHaveBeenCalledWith("/");
  });

  it("clears the stored target after successful navigation", async () => {
    const storage = stubStorage({ post_login_redirect: "/inventory" });
    state.session = ref<SessionData>(authedSession());

    const { handleAuthenticated } = useAuthRedirect();
    await handleAuthenticated();

    expect(storage.removeItem).toHaveBeenCalledWith("post_login_redirect");
  });

  it("keeps the stored target when navigation fails", async () => {
    const storage = stubStorage({ post_login_redirect: "/inventory" });
    state.push.mockResolvedValue("blocked");
    state.isNavigationFailure.mockReturnValue(true);
    state.session = ref<SessionData>(authedSession());

    const { handleAuthenticated } = useAuthRedirect();
    await handleAuthenticated();

    expect(state.push).toHaveBeenCalledWith("/inventory");
    expect(storage.removeItem).not.toHaveBeenCalled();
  });
});
