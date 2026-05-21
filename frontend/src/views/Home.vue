<script setup lang="ts">
import { reactive } from 'vue';
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import { fetchFromAPI } from '@/api';

const queryClient = useQueryClient()
const loadingItems = reactive<Record<string, boolean>>({})

const { isPending, isFetching, isError, data, error } = useQuery({
  queryKey: ['items'],
  queryFn: () => fetchFromAPI('/api/inventory'),
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
  <table v-else-if="data">
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
        <td><button :aria-busy="loadingItems[item.id]" @click="fetchPriceMutation.mutate(item.id)">Update</button></td>
      </tr>
    </tbody>
  </table>
</template>
