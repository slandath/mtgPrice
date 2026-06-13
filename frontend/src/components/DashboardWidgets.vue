<script setup lang="ts">
import { computed } from "vue";
import { useQuery } from "@tanstack/vue-query";
import { fetchFromAPI } from "@/api";
import { formatCurrency, formatPercent } from "../utils/numberFormat";
import Card from "primevue/card";
import Message from "primevue/message";

interface InventoryItem {
  id: string;
  userId: string;
  name: string;
  quantity: number;
  currentPrice: string; // numeric from Drizzle → string in JS
  cost: string;
  url: string;
  createdAt: string;
  updatedAt: string;
}

interface InventoryResponse {
  inventory: InventoryItem[];
  message?: string;
}

const { isPending, isError, data, error } = useQuery<InventoryResponse>({
  queryKey: ["items"],
  queryFn: () => fetchFromAPI("/api/inventory"),
  staleTime: 30 * 60 * 1000,
});

const marketValue = computed(
  () => data.value?.inventory.reduce((sum, item) => sum + Number(item.currentPrice), 0) ?? 0,
);
const costBasis = computed(
  () => data.value?.inventory.reduce((sum, item) => sum + Number(item.cost), 0) ?? 0,
);
const gainLoss = computed(() =>
  costBasis.value === 0 ? 0 : ((marketValue.value - costBasis.value) / costBasis.value) * 100,
);
const topItems = computed(() =>
  [...(data.value?.inventory ?? [])]
    .sort((a, b) => Number(b.currentPrice) - Number(a.currentPrice))
    .slice(0, 5),
);
</script>

<template>
  <div class="grid-container">
    <Message v-if="isPending" severity="secondary" size="large">Loading...</Message>
    <Message v-else-if="isError" severity="error" size="large">Error: {{ error?.message }}</Message>
    <template v-else>
      <Card class="card">
        <template #title>Market Value</template>
        <template #content>
          <p>{{ formatCurrency(marketValue) }}</p>
        </template>
      </Card>
      <Card class="card">
        <template #title>Cost Basis</template>
        <template #content>
          <p>{{ formatCurrency(costBasis) }}</p>
        </template>
      </Card>
      <Card class="card">
        <template #title>Gain/Loss</template>
        <template #content>
          <p>{{ formatPercent(gainLoss) }}</p>
        </template>
      </Card>
      <Card class="card">
        <template #title>Most Valuable Items</template>
        <template #content>
          <ol>
            <li v-for="item in topItems" :key="item.id">
              {{ item.name }}
              <div class="spacer-0" />
            </li>
          </ol>
        </template>
      </Card>
    </template>
  </div>
</template>
