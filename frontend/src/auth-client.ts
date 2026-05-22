import { inferAdditionalFields } from 'better-auth/client/plugins'
import { createAuthClient } from 'better-auth/vue'

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export const authClient = createAuthClient({
  baseURL: `${baseURL}/api/auth`,
  fetchOptions: {
    credentials: "include",
  },
  customFetch: (input: RequestInfo | URL, init = {}) => fetch(input, {...init, credentials: 'include'}), 
  plugins: [
    inferAdditionalFields({
      user: {
        role: {
          type: 'string',
        },
      },
    }),
  ],
})