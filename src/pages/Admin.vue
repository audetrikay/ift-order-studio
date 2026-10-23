<template>
  <div>
    <div v-if="!isAdmin" class="alert">
      Accès réservé aux administrateurs.
    </div>

    <div v-else>
      <div class="page-heading">
        <div>
          <span class="mono eyebrow muted">MANAGEMENT / ADMIN</span>
          <h1>administration<span class="accent">.</span></h1>
          <p>Vue d'ensemble des commandes de l'IFT.</p>
        </div>
      </div>

      <section class="stats">
        <div class="stat">
          <span class="mono small muted">TOTAL</span>
          <strong>{{ orders.length }}</strong>
          <span>Demandes</span>
        </div>
        <div class="stat">
          <span class="mono small muted">EN ATTENTE</span>
          <strong>{{ pendingOrders.length }}</strong>
          <span>À valider</span>
        </div>
        <div class="stat">
          <span class="mono small muted">BUDGET DEMANDÉ</span>
          <strong class="money-stat">{{ money(totalBudget) }}</strong>
          <span>Toutes les demandes</span>
        </div>
      </section>

      <div class="section-title">
        <h2>toutes les demandes</h2>
      </div>

      <div v-if="error" class="alert">{{ error }}</div>

      <div v-if="orders.length">
        <OrderCard v-for="o in orders" :key="o.id" :order="o" />
      </div>

      <div v-else class="empty">
        Aucune demande pour l'instant.
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onUnmounted } from 'vue';
import { useAuth } from '../composables/useAuth';
import { watchOrders } from '../lib/orders';
import { money } from '../lib/constants';
import OrderCard from '../components/OrderCard.vue';

const { user, isAdmin } = useAuth();
const orders = ref([]);
const error = ref('');

let unsubscribe = null;

function setupWatch() {
  if (unsubscribe) unsubscribe();
  if (!isAdmin.value || !user.value) return;

  unsubscribe = watchOrders(
    user.value.uid,
    true,
    (data) => {
      orders.value = data;
    },
    (err) => {
      error.value = err.message;
    }
  );
}

watch([user, isAdmin], () => {
  setupWatch();
}, { immediate: true });

onUnmounted(() => {
  if (unsubscribe) unsubscribe();
});

const pendingOrders = computed(() => orders.value.filter((o) => o.status === 'pending'));
const totalBudget = computed(() =>
  orders.value.reduce((sum, o) => sum + (Number(o.total) || 0), 0)
);
</script>

