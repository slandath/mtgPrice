<script setup lang="ts">
import { computed } from "vue";
import { useQuery, useQueryClient } from "@tanstack/vue-query";
import { fetchFromAPI } from "@/api";
import Card from "primevue/card";

const { isPending, isFetching, isError, data, error } = useQuery({
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
  costBasis === 0 ? 0 : ((marketValue.value - costBasis.value) / costBasis.value) * 100,
);
</script>

<template>
  <div class="grid-container">
    <Card class="card">
      <template #title>Market Value</template>
      <template #content>
        <p>$ {{ marketValue }}</p>
      </template>
    </Card>
    <Card class="card">
      <template #title>Cost Basis</template>
      <template #content>
        <p>$ {{ costBasis }}</p>
      </template>
    </Card>
    <Card class="card">
      <template #title>Gain/Loss</template>
      <template #content>
        <p>{{ gainLoss }} %</p>
      </template>
    </Card>
  </div>
</template>
