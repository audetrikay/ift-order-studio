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

      <!-- Encart Anti-gaspillage : Disponible en stock au FabLab -->
      <div v-if="order.status === 'in_stock'" class="stock-banner">
        <PackageCheck :size="28" class="stock-banner-icon" />
        <div>
          <span class="mono small">MATÉRIEL DÉJÀ DISPONIBLE AU FABLAB</span>
          <h3>Pas besoin d'attendre une commande !</h3>
          <p>
            Ces composants sont déjà en stock dans les réserves de l'école :
            <strong>{{ order.stockLocation || 'Disponible auprès du responsable' }}</strong>.
          </p>
          <span class="small muted">
            Vous pouvez passer les récupérer directement au FabLab IFT pour continuer votre projet.
          </span>
        </div>
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

          <p v-if="order.stockLocation && order.status !== 'in_stock'">
            <strong>Emplacement réserve</strong><br />
            {{ order.stockLocation }}
          </p>

          <div v-if="isAdmin" class="admin-controls">
            <label>
              Modifier le statut
              <select
                :value="order.status"
                :disabled="busy"
                @change="onStatusSelect($event.target.value)"
              >
                <option v-for="s in STATUSES" :key="s" :value="s">
                  {{ STATUS_LABELS[s] }}
                </option>
              </select>
            </label>

            <div v-if="order.status === 'in_stock'" class="admin-stock-edit">
              <label>
                Emplacement dans le FabLab
                <select :value="order.stockLocation" @change="updateLocation($event.target.value)">
                  <option v-for="loc in STOCK_LOCATIONS" :key="loc" :value="loc">
                    {{ loc }}
                  </option>
                </select>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import { PackageCheck } from 'lucide-vue-next';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../composables/useAuth';
import { changeStatus } from '../lib/orders';
import { STATUS_LABELS, STATUSES, STOCK_LOCATIONS, money, dateText } from '../lib/constants';

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

async function onStatusSelect(newStatus) {
  busy.value = true;
  try {
    const extra = {};
    if (newStatus === 'in_stock' && !order.value.stockLocation) {
      extra.stockLocation = STOCK_LOCATIONS[0];
    }
    await changeStatus(id, newStatus, extra);
  } catch (e) {
    error.value = e.message;
  } finally {
    busy.value = false;
  }
}

async function updateLocation(newLocation) {
  busy.value = true;
  try {
    await changeStatus(id, 'in_stock', { stockLocation: newLocation });
  } catch (e) {
    error.value = e.message;
  } finally {
    busy.value = false;
  }
}
</script>
