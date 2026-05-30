<script setup lang="ts">
import { Button } from 'primevue'
import { useRouter } from 'vue-router'
import { authClient } from '@/auth-client'

const router = useRouter()

async function handleSignOut() {
  try {
    await authClient.signOut()
    router.push('/')
  }
  catch (err) {
    console.warn(`Sign out error: ${err}`)
  }
}
</script>

<template>
  <header>
    <nav class="navbar">
      <ul class="flex">
        <li>
          <h1>
            <RouterLink to="/">
              MTG Price Tracker
            </RouterLink>
          </h1>
        </li>
      </ul>
      <ul class="flex">
        <li><Button icon="pi pi-plus" @click="router.push('/add')" /></li>
        <li><Button icon="pi pi-sign-out" @click="handleSignOut" /></li>
      </ul>
    </nav>
  </header>
</template>
