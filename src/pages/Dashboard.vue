<template>
  <div>
    <div class="page-heading">
      <div>
        <span class="mono eyebrow muted">WORKSPACE / OVERVIEW</span>
        <h1>bonjour, {{ profile?.displayName?.split(' ')[0] || 'maker' }}<span class="accent">.</span></h1>
        <p>Vos demandes de matériel, au même endroit.</p>
      </div>
      <RouterLink class="btn btn-dark" to="/new">
        <Plus :size="17" /> nouvelle demande
      </RouterLink>
    </div>

    <section class="stats">
      <div class="stat">
        <span class="mono small muted">01 / TOTAL</span>
        <strong>{{ orders.length.toString().padStart(2, '0') }}</strong>
        <span>Commandes</span>
      </div>
      <div class="stat">
        <span class="mono small muted">02 / EN ATTENTE</span>
        <strong>{{ pending.toString().padStart(2, '0') }}</strong>
        <span>À traiter</span>
      </div>
      <div class="stat">
        <span class="mono small muted">03 / VALIDÉES</span>
        <strong>{{ approved.toString().padStart(2, '0') }}</strong>
        <span>Approuvées ou reçues</span>
      </div>
      <div class="stat">
        <span class="mono small muted">04 / BUDGET</span>
        <strong class="money-stat">{{ money(totalBudget) }}</strong>
        <span>Total des demandes</span>
      </div>
    </section>

    <div class="section-title">
      <div>
        <span class="mono eyebrow muted">ACTIVITY / 01</span>
        <h2>dernières demandes</h2>
      </div>
      <RouterLink to="/orders" class="text-link">
        tout voir <ArrowUpRight :size="16" />
      </RouterLink>
    </div>

    <div v-if="error" class="alert">{{ error }}</div>

    <div v-if="orders.length">
      <OrderCard v-for="o in orders.slice(0, 5)" :key="o.id" :order="o" />
    </div>

    <div v-else class="empty">
      <span class="empty-number">00</span>
      <h3>rien pour l'instant.</h3>
      <p>Créez votre première demande pour commencer.</p>
      <RouterLink to="/new" class="text-link">
        créer une commande <ArrowRight :size="16" />
      </RouterLink>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onUnmounted } from 'vue';
import { Plus, ArrowUpRight, ArrowRight } from 'lucide-vue-next';
import { useAuth } from '../composables/useAuth';
import { watchOrders } from '../lib/orders';
import { money } from '../lib/constants';
import OrderCard from '../components/OrderCard.vue';

const { user, isAdmin, profile } = useAuth();
const orders = ref([]);
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

const pending = computed(() => orders.value.filter((o) => o.status === 'pending').length);
const approved = computed(() =>
  orders.value.filter((o) => ['approved', 'ordered', 'received'].includes(o.status)).length
);
const totalBudget = computed(() =>
  orders.value.reduce((sum, o) => sum + (Number(o.total) || 0), 0)
);
</script>

