<script setup lang="ts">
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import Button from 'primevue/button'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import Message from 'primevue/message'
import { reactive } from 'vue'
import { fetchFromAPI } from '@/api'

const queryClient = useQueryClient()
const loadingItems = reactive<Record<string, boolean>>({})

const { isPending, isFetching, isError, data, error } = useQuery({
  queryKey: ['items'],
  queryFn: () => fetchFromAPI('/api/inventory'),
  staleTime: 30 * 60 * 1000,
})

const fetchPriceMutation = useMutation({
  mutationFn: async (id: string) => {
    loadingItems[id] = true
    try {
      return await fetchFromAPI(`/api/inventory/${id}/fetch-price`, { method: 'PATCH' })
    }
    finally {
      loadingItems[id] = false
    }
  },
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['items'] }),
})
</script>

<template>
  <Message v-if="isPending" severity="secondary" size="large" variant="simple" class="padding">Loading...</Message>
  <span v-else-if="isError">Error: {{ error?.message }}</span>
  <DataTable v-else-if="data" :value="data.inventory" :loading="isFetching" paginator :rows="10" :rowsPerPageOptions="[10, 25, 50]" scrollable scrollHeight="80vh" class="table-container">
    <Column field="quantity" header="Qty" sortable />
    <Column field="name" header="Name" sortable/>
    <Column field="currentPrice" header="Current Price" sortable>
      <template #body="slotProps">
        $ {{ slotProps.data.currentPrice }}
      </template>
    </Column>
    <Column field="cost" header="Paid (Each)" sortable>
      <template #body="slotProps">
        $ {{ slotProps.data.cost }}
      </template>
    </Column>
    <Column header="">
      <template #body="slotProps">
        <Button type="button" icon="pi pi-refresh" :loading="loadingItems[slotProps.data.id]" @click="fetchPriceMutation.mutate(slotProps.data.id)" />
      </template>
    </Column>
  </DataTable>
</template>
