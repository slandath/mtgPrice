<script setup lang="ts">
import { computed } from "vue";
import { useQuery, useQueryClient } from "@tanstack/vue-query";
import { fetchFromAPI } from "@/api";
import { formatCurrency, formatPercent } from "../utils/numberFormat"
import Card from "primevue/card";

const { isPending, isFetching, isError, data, error } = useQuery({
  queryKey: ["items"],
  queryFn: () => fetchFromAPI("/api/inventory"),
  staleTime: 30 * 60 * 1000,
});

const hasItems = computed(()=> data.value?.inventory?.length > 0)

const marketValue = computed(
  () => data.value?.inventory.reduce((sum, item) => sum + Number(item.currentPrice), 0) ?? 0,
);
const costBasis = computed(
  () => data.value?.inventory.reduce((sum, item) => sum + Number(item.cost), 0) ?? 0,
);
const gainLoss = computed(() =>
  costBasis === 0 ? 0 : ((marketValue.value - costBasis.value) / costBasis.value) * 100,
);
</script>

<template>
  <div class="grid-container">
    <Message v-if="isPending" severity="secondary" size="large">Loading...</Message>
    <Message v-else-if="isError" severity="error" size="large">Error</Message>
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
  </template>
  </div>
</template>
