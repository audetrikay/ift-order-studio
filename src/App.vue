<template>
  <div v-if="loading" class="loading">
    chargement de l'espace ift...
  </div>
  <RouterView v-else />
</template>

<script setup>
import { useAuth } from './composables/useAuth';

const { loading } = useAuth();
</script>

