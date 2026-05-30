<script setup lang="ts">
import { reactive } from 'vue';
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import  Button from 'primevue/button';
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import { fetchFromAPI } from '@/api';

const queryClient = useQueryClient()
const loadingItems = reactive<Record<string, boolean>>({})

const { isPending, isFetching, isError, data, error } = useQuery({
  queryKey: ['items'],
  queryFn: () => fetchFromAPI('/api/inventory'),
  staleTime: 30 * 60 * 1000
})

const fetchPriceMutation = useMutation({
  mutationFn: async (id: string) => {
  loadingItems[id] = true
  try {
    return await fetchFromAPI(`/api/inventory/${id}/fetch-price`, { method: 'PATCH' })
  } finally {
    loadingItems[id] = false
  }
},
onSuccess: () => queryClient.invalidateQueries({ queryKey: ['items']})
})

</script>

<template>
  <span v-if="isPending || isFetching" aria-busy="true">Loading</span>
  <span v-else-if="isError">Error: {{  error?.message }}</span>
  <!-- <table v-else-if="data">
    <thead>
      <tr>
        <th scope="col">Qty</th>
        <th scope="col">Name</th>
        <th scope="col">Current Price</th>
        <th scope="col">Paid (Each)</th>
        <th scope="col"></th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="item in data.inventory" :key="item.id">
        <th scope="row">{{ item.quantity }}</th>
        <td>{{ item.name }}</td>
        <td>${{ item.currentPrice }}</td>
        <td>${{ item.cost }}</td>
        <td><Button type="button" icon="pi pi-refresh" :loading="loadingItems[item.id]" @click="fetchPriceMutation.mutate(item.id)" /></td>
        <td></td>
      </tr>
    </tbody>
  </table> -->
  <DataTable v-else-if="data" :value="data.inventory" class="top-spacing">
    <Column field="quantity" header="Qty" />
    <Column field="name" header="Name" />
    <Column field="currentPrice" header="Current Price">
    <template #body="slotProps">
      {{ slotProps.data.currentPrice }}
    </template>
    </Column>
    <Column field="cost" header="Paid (Each)">
    <template #body="slotProps">
      {{ slotProps.data.cost }}
    </template>
    </Column>
    <Column header="">
    <template #body="slotProps">
      <Button type="button" icon="pi pi-refresh" :loading="loadingItems[slotProps.data.id]" @click="fetchPriceMutation.mutate(slotProps.data.id)" />
    </template>
    </Column>
  </DataTable>
</template>