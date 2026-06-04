import { watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { authClient } from "../auth-client";

/**
 * Handles redirecting users after successful authentication.
 * Supports both query parameter redirects and sessionStorage redirects.
 * Checks for redirect targets and navigates the user after login.
 */
export function useAuthRedirect() {
  const session = authClient.useSession();
  const router = useRouter();
  const route = useRoute();

  function getRedirectTarget(): string {
    const postLoginRedirect = sessionStorage.getItem("post_login_redirect");
    const queryRedirect = typeof route.query.redirect === "string" ? route.query.redirect : "";
    const target = postLoginRedirect || queryRedirect || "/";
    if (target.startsWith("/") && !target.startsWith("//")) {
      return target;
    }
    return "/";
  }

  async function handleAuthenticated() {
    try {
      const target = getRedirectTarget();
      await router.push(target);
      sessionStorage.removeItem("post_login_redirect");
    } catch (error) {
      console.warn(`Redirect error: ${error}`, "error");
    }
  }

  watch(
    () => session.value.isPending,
    (isPending) => {
      if (!isPending && session.value.data) {
       void handleAuthenticated();
      }
    },
    { immediate: true },
  );

  return {
    session,
    handleAuthenticated,
  };
}
