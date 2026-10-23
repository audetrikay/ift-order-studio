<template>
  <div>
    <div class="page-heading">
      <div>
        <span class="mono eyebrow muted">ARCHIVE / REQUESTS</span>
        <h1>mes commandes<span class="accent">.</span></h1>
        <p>Consultez les demandes et leur avancement.</p>
      </div>
    </div>

    <div class="toolbar">
      <input
        v-model="search"
        aria-label="Rechercher"
        placeholder="Rechercher une commande..."
      />
      <select v-model="filter" aria-label="Filtrer par statut">
        <option value="all">Tous les statuts</option>
        <option v-for="(label, key) in STATUS_LABELS" :key="key" :value="key">
          {{ label }}
        </option>
      </select>
    </div>

    <div v-if="error" class="alert">{{ error }}</div>

    <div v-if="visibleOrders.length">
      <OrderCard v-for="o in visibleOrders" :key="o.id" :order="o" />
    </div>

    <div v-else class="empty">
      Aucune commande trouvée.
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onUnmounted } from 'vue';
import { useAuth } from '../composables/useAuth';
import { watchOrders } from '../lib/orders';
import { STATUS_LABELS } from '../lib/constants';
import OrderCard from '../components/OrderCard.vue';

const { user, isAdmin } = useAuth();
const orders = ref([]);
const filter = ref('all');
const search = ref('');
const error = ref('');

let unsubscribe = null;

function setupWatch() {
  if (unsubscribe) unsubscribe();
  if (!user.value) return;

  unsubscribe = watchOrders(
    user.value.uid,
    isAdmin.value,
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

const visibleOrders = computed(() => {
  return orders.value.filter((o) => {
    const matchFilter = filter.value === 'all' || o.status === filter.value;
    const matchSearch = `${o.title} ${o.project} ${o.id}`
      .toLowerCase()
      .includes(search.value.toLowerCase());
    return matchFilter && matchSearch;
  });
});
</script>

