<script setup lang="ts">
import { useMutation, useQueryClient } from "@tanstack/vue-query";
import Button from "primevue/button";
import { useToast } from "primevue/usetoast";
import { useRouter } from "vue-router";
import { fetchFromAPI } from "@/api";
import { authClient } from "@/auth-client";

const router = useRouter();
const toast = useToast();
const queryClient = useQueryClient();

const refreshPricesMutation = useMutation({
  mutationFn: () => fetchFromAPI("/api/inventory/refresh-all", { method: "POST" }),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["items"] });
    toast.add({
      severity: "success",
      summary: "Prices Updated",
      detail: "All prices have been refreshed.",
    });
  },
  onError: (error) => {
    toast.add({
      severity: "error",
      summary: "Refresh Failed",
      detail: error.message,
    });
  },
});

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
            icon="pi pi-refresh"
            :loading="refreshPricesMutation.isPending.value"
            aria-label="Refresh All Prices"
            v-tooltip.bottom="{ value: 'Refresh All Prices', showDelay: 1000 }"
            @click="refreshPricesMutation.mutate()"
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
