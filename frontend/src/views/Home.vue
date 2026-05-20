<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query';
import { fetchFromAPI } from '@/api';

const { isPending, isFetching, isError, data, error } = useQuery({
  queryKey: ['items'],
  queryFn: () => fetchFromAPI('/api/inventory'),
})

</script>

<template>
  <h1>Home</h1>
  <span v-if="isPending || isFetching">Loading...</span>
  <span v-else-if="isError">Error: {{  error?.message }}</span>
  <ul v-else-if="data">
    <li v-for="item in data.inventory" :key="item.id">{{ item.name }}</li>
  </ul>
</template>
