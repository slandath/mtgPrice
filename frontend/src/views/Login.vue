<script setup lang="ts">
import { authClient } from '@/auth-client'
import { useAuthRedirect } from '@/composables/useAuthRedirect'

const { session } = useAuthRedirect()
const appUrl = import.meta.env.VITE_APP_URL ? `${import.meta.env.VITE_APP_URL}/login`: `${window.location.origin}/login`

async function handleSignIn() {
  try {
    await authClient.signIn.social({
      provider: 'github',
      callbackURL: appUrl,
    })
  }
  catch (err) {
    console.warn(`Authentication failed: ${err}`, 'error')
  }
}

</script>

<template>
  <h1>Login</h1>
  <div v-if="session.isPending">
    <p>Loading...</p>
  </div>
  <button v-else-if="!session.data" @click="handleSignIn">Login with GitHub</button>
</template>
