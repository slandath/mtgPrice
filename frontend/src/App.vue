<script setup lang="ts">
import Navbar from "./components/Navbar.vue";
import ConfirmDialog from "primevue/confirmdialog";
import Toast from "primevue/toast";
</script>

<template>
  <div id="app-container" class="app-container">
    <ConfirmDialog />
    <Toast position="bottom-left" />
    <Navbar />
    <router-view />
  </div>
</template>
