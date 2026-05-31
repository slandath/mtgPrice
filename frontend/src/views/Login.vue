<script setup lang="ts">
import { ref } from 'vue';
import { authClient } from '@/auth-client'
import { useAuthRedirect } from '@/composables/useAuthRedirect'
import Button from 'primevue/button'
import { useToast } from 'primevue/usetoast'

const toast = useToast();
const { session } = useAuthRedirect()
const isSigningIn = ref(false)
const appUrl = import.meta.env.VITE_APP_URL ? `${import.meta.env.VITE_APP_URL}/login` : `${window.location.origin}/login`

async function handleSignIn() {
  try {
    isSigningIn.value = true
    await authClient.signIn.social({
      provider: 'github',
      callbackURL: appUrl,
    })
  }
  catch (err) {
    toast.add({
      severity: 'error',
      summary: 'Login Error',
      detail: `Authentication failed: ${err}`
    })
    console.warn(`Authentication failed: ${err}`, 'error')
  }
  finally {
    isSigningIn.value = false
  }
}
</script>

<template>
  <div class="login-container">
  <h1>Login</h1>
  <Button :loading="session.isPending || isSigningIn" @click="handleSignIn" label="Login with GitHub"/>
</div>
</template>
