<script setup lang="ts">
import Button from "primevue/button";
import IconField from "primevue/iconfield";
import InputIcon from "primevue/inputicon";
import InputText from "primevue/inputtext";

const model = defineModel<string>({ required: true });
</script>

<template>
  <div class="search-bar">
    <IconField>
      <InputIcon class="pi pi-search" />
      <InputText v-model="model" aria-label="Search items" placeholder="Search items…" />
    </IconField>
    <Button
      v-if="model"
      icon="pi pi-times"
      text
      rounded
      severity="secondary"
      size="small"
      aria-label="Clear search"
      @click="model = ''"
    />
  </div>
</template>

<style scoped>
.search-bar {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
}
</style>
