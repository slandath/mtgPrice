<script setup lang="ts">
import Navbar from './components/Navbar.vue';
</script>

<template>
  <div id="app-container" class="app-container">
    <Navbar />
    <router-view />
  </div>
</template>
