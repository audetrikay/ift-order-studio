<template>
  <div>
    <RouterLink class="text-link" to="/orders">
      ← retour aux commandes
    </RouterLink>

    <div v-if="error" class="alert">{{ error }}</div>

    <div v-if="order">
      <div class="page-heading detail-heading">
        <div>
          <span class="mono eyebrow muted">REQUEST / {{ id.slice(0, 8).toUpperCase() }}</span>
          <h1>{{ order.title }}<span class="accent">.</span></h1>
          <p>{{ order.project }} · {{ dateText(order.createdAt) }}</p>
        </div>
        <span :class="`status status-${order.status}`">
          {{ STATUS_LABELS[order.status] }}
        </span>
      </div>

      <div class="detail-grid">
        <div class="detail-box">
          <span class="mono eyebrow muted">ARTICLES</span>
          <div v-for="(item, i) in order.items" :key="i" class="detail-item">
            <div>
              <strong>{{ item.name }}</strong>
              <a :href="item.url" target="_blank" rel="noopener noreferrer">
                Voir le produit ↗
              </a>
            </div>
            <span>{{ item.quantity }} × {{ money(item.unitPrice) }}</span>
          </div>

          <div class="total-row">
            <span>TOTAL</span>
            <strong>{{ money(order.total) }}</strong>
          </div>
        </div>

        <div class="detail-box">
          <span class="mono eyebrow muted">INFORMATIONS</span>
          <p>
            <strong>Demandeur</strong><br />
            {{ order.userEmail }}
          </p>
          <p>
            <strong>Priorité</strong><br />
            {{ order.priority }}
          </p>
          <p>
            <strong>Fournisseur</strong><br />
            {{ order.supplierId }}
          </p>
          <p>
            <strong>Notes</strong><br />
            {{ order.notes || '—' }}
          </p>

          <div v-if="isAdmin" class="admin-controls">
            <label>
              Modifier le statut
              <select
                :value="order.status"
                :disabled="busy"
                @change="updateStatus($event.target.value)"
              >
                <option v-for="s in STATUSES" :key="s" :value="s">
                  {{ STATUS_LABELS[s] }}
                </option>
              </select>
            </label>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../composables/useAuth';
import { changeStatus } from '../lib/orders';
import { STATUS_LABELS, STATUSES, money, dateText } from '../lib/constants';

const route = useRoute();
const id = route.params.id;
const { isAdmin } = useAuth();

const order = ref(null);
const error = ref('');
const busy = ref(false);

let unsubscribe = null;

onMounted(() => {
  unsubscribe = onSnapshot(
    doc(db, 'orders', id),
    (snap) => {
      if (snap.exists()) {
        order.value = { id: snap.id, ...snap.data() };
      } else {
        error.value = 'Commande introuvable.';
      }
    },
    (e) => {
      error.value = e.message;
    }
  );
});

onUnmounted(() => {
  if (unsubscribe) unsubscribe();
});

async function updateStatus(newStatus) {
  busy.value = true;
  try {
    await changeStatus(id, newStatus);
  } catch (e) {
    error.value = e.message;
  } finally {
    busy.value = false;
  }
}
</script>

