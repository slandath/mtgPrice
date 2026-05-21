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
  <span v-if="isPending || isFetching" aria-busy="true">Loading</span>
  <span v-else-if="isError">Error: {{  error?.message }}</span>

  <table v-else-if="data">
    <thead>
      <tr>
        <th scope="col">Qty</th>
        <th scope="col">Name</th>
        <th scope="col">Current Price</th>
        <th scope="col">Paid (Each)</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="item in data.inventory" :key="item.id">
        <th scope="row">{{ item.quantity }}</th>
        <td>{{ item.name }}</td>
        <td>${{ item.currentPrice }}</td>
        <td>${{ item.cost }}</td>
      </tr>
    </tbody>
  </table>



  <!-- <ul v-else-if="data"> -->
    <!-- <li v-for="item in data.inventory" :key="item.id">{{ item.name }}</li>
  </ul> -->
</template>
