<script setup lang="ts">
import Button from "primevue/button";
import { useRouter } from "vue-router";
import { authClient } from "@/auth-client";

const router = useRouter();

async function handleSignOut() {
  try {
    await authClient.signOut();
    window.location.href = "/login";
  } catch (err) {
    console.warn(`Sign out error: ${err}`);
  }
}
</script>

<template>
  <header>
    <nav class="navbar">
      <ul class="flex">
        <li>
          <h1>
            <RouterLink to="/"> MTG Price Tracker </RouterLink>
          </h1>
        </li>
      </ul>
      <ul class="flex">
        <li>
          <Button
            icon="pi pi-list"
            aria-label="View Inventory"
            v-tooltip.bottom="{ value: 'View Inventory', showDelay: 1000 }"
            @click="router.push('/inventory')"
          />
        </li>
        <li>
          <Button
            icon="pi pi-plus"
            aria-label="Add Item"
            v-tooltip.bottom="{ value: 'Add Item', showDelay: 1000 }"
            @click="router.push('/add')"
          />
        </li>
        <li>
          <Button
            icon="pi pi-sign-out"
            aria-label="Log Out"
            v-tooltip.bottom="{ value: 'Log Out', showDelay: 1000 }"
            @click="handleSignOut"
          />
        </li>
      </ul>
    </nav>
  </header>
</template>
