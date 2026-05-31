<script setup lang="ts">
import { authClient } from '@/auth-client'
import { useAuthRedirect } from '@/composables/useAuthRedirect'
import Button from 'primevue/button'

const toast = useToast();
const { session } = useAuthRedirect()
const appUrl = import.meta.env.VITE_APP_URL ? `${import.meta.env.VITE_APP_URL}/login` : `${window.location.origin}/login`

async function handleSignIn() {
  try {
    await authClient.signIn.social({
      provider: 'github',
      callbackURL: appUrl,
    })
  }
  catch (err) {
    toast.add({
      severity: 'danger',
      summary: 'Login Error',
      detail: `Authentication failed: ${err}`
    })
    console.warn(`Authentication failed: ${err}`, 'error')
  }
}
</script>

<template>
  <div class="login-container">
  <h1>Login</h1>
  <Button :loading="session.isPending" @click="handleSignIn" label="Login with GitHub"/>
</div>
</template>
