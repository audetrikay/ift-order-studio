<template>
  <RouterLink :to="`/orders/${order.id}`" class="order-row">
    <div class="order-main">
      <span class="mono small muted">
        {{ order.id.slice(0, 8).toUpperCase() }} / {{ dateText(order.createdAt) }}
      </span>
      <strong>{{ order.title }}</strong>
      <span class="muted small">{{ order.project }} · {{ order.items?.length || 0 }} article(s)</span>
    </div>
    <span :class="`status status-${order.status}`">
      {{ STATUS_LABELS[order.status] || order.status }}
    </span>
    <strong class="price">{{ money(order.total) }}</strong>
    <ArrowUpRight :size="18" />
  </RouterLink>
</template>

<script setup>
import { ArrowUpRight } from 'lucide-vue-next';
import { money, dateText, STATUS_LABELS } from '../lib/constants';

defineProps({
  order: {
    type: Object,
    required: true,
  },
});
</script>

