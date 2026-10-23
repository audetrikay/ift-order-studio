<template>
  <div>
    <div v-if="!isAdmin" class="alert">
      Accès réservé aux administrateurs.
    </div>

    <div v-else>
      <!-- En-tête de la page Admin -->
      <div class="page-heading">
        <div>
          <span class="mono eyebrow muted">MANAGEMENT / ADMIN</span>
          <h1>administration<span class="accent">.</span></h1>
          <p>Supervision et validation des commandes de l'IFT.</p>
        </div>

        <button
          v-if="pendingOrders.length"
          type="button"
          class="btn btn-dark fast-review-btn"
          @click="openFastReview"
        >
          Revue Rapide ({{ pendingOrders.length }} en attente)
        </button>
      </div>

      <!-- Statistiques globales -->
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
          <span class="mono small muted">EN STOCK AU LAB</span>
          <strong>{{ inStockOrders.length }}</strong>
          <span>Anti-gaspillage</span>
        </div>
        <div class="stat">
          <span class="mono small muted">BUDGET DEMANDÉ</span>
          <strong class="money-stat">{{ money(totalBudget) }}</strong>
          <span>Toutes les demandes</span>
        </div>
      </section>

      <!-- MODALE / MODE FAST REVIEW (REVUE RAPIDE) -->
      <div v-if="fastReviewOpen" class="fast-review-backdrop" @click.self="closeFastReview">
        <div class="fast-review-card">
          <!-- Barre haute du mode Fast Review -->
          <div class="fast-review-top">
            <div class="fast-review-counter">
              <span class="mono small">FAST REVIEW / ÉTAPE</span>
              <strong>{{ currentFastIndex + 1 }} sur {{ pendingOrders.length }}</strong>
            </div>

            <button type="button" class="icon-btn close-btn" @click="closeFastReview" title="Fermer [Échap]">
              <X :size="18" />
            </button>
          </div>

          <!-- Contenu de la commande en cours d'examen -->
          <div v-if="currentFastOrder" class="fast-review-body">
            <div class="fast-meta-row">
              <span class="mono small muted">PROJET {{ currentFastOrder.project }} · {{ currentFastOrder.supplierId }}</span>
              <span class="small muted">Demandé par : <strong>{{ currentFastOrder.userEmail }}</strong></span>
            </div>

            <h2 class="fast-title">{{ currentFastOrder.title }}</h2>

            <!-- Liste des articles demandés -->
            <div class="fast-items-box">
              <span class="mono small muted">ARTICLES DEMANDÉS ({{ currentFastOrder.items?.length || 0 }})</span>
              <div v-for="(it, idx) in currentFastOrder.items" :key="idx" class="fast-item-row">
                <div>
                  <strong>{{ it.name }}</strong>
                  <a :href="it.url" target="_blank" rel="noopener noreferrer" class="small text-link">
                    Lien fournisseur ↗
                  </a>
                </div>
                <span>{{ it.quantity }} × {{ money(it.unitPrice) }} = <strong>{{ money((it.quantity || 1) * (it.unitPrice || 0)) }}</strong></span>
              </div>

              <div class="fast-total-row">
                <span class="mono">MONTANT TOTAL</span>
                <strong>{{ money(currentFastOrder.total) }}</strong>
              </div>
            </div>

            <p v-if="currentFastOrder.notes" class="fast-notes small">
              <strong>Notes de l'étudiant :</strong> {{ currentFastOrder.notes }}
            </p>

            <!-- SOUS-PANNEAU : Déjà en stock au FabLab (Emplacement dans le lab) -->
            <div v-if="stockSelectorOpen" class="stock-selector-box">
              <h4>Indiquer l'emplacement du composant au FabLab :</h4>
              <div class="stock-chips">
                <button
                  type="button"
                  v-for="loc in STOCK_LOCATIONS"
                  :key="loc"
                  :class="['stock-chip', { selected: chosenLocation === loc }]"
                  @click="chosenLocation = loc"
                >
                  {{ loc }}
                </button>
              </div>

              <div class="stock-confirm-row">
                <input
                  v-model="chosenLocation"
                  placeholder="Ou précisez l'emplacement (ex: Tiroir B-12)"
                />
                <button
                  type="button"
                  class="btn btn-dark small-btn"
                  :disabled="actionBusy"
                  @click="confirmInStock"
                >
                  Valider en stock
                </button>
                <button
                  type="button"
                  class="btn btn-outline small-btn"
                  @click="stockSelectorOpen = false"
                >
                  Annuler
                </button>
              </div>
            </div>

            <!-- BOUTONS D'ACTION RAPIDE -->
            <div v-else class="fast-actions-bar">
              <button
                type="button"
                class="fast-btn btn-approve"
                :disabled="actionBusy"
                @click="fastApprove"
                title="Touche [A]"
              >
                <span class="key-badge">A</span>
                Approuver l'achat
              </button>

              <button
                type="button"
                class="fast-btn btn-stock"
                :disabled="actionBusy"
                @click="stockSelectorOpen = true"
                title="Touche [S]"
              >
                <span class="key-badge">S</span>
                Déjà en stock au Lab
              </button>

              <button
                type="button"
                class="fast-btn btn-reject"
                :disabled="actionBusy"
                @click="fastReject"
                title="Touche [R]"
              >
                <span class="key-badge">R</span>
                Refuser
              </button>

              <button
                type="button"
                class="fast-btn btn-skip"
                @click="fastNext"
                title="Flèche droite [→]"
              >
                <span class="key-badge">→</span>
                Passer
              </button>
            </div>

            <!-- Aide raccourcis clavier -->
            <div class="fast-shortcuts-hint mono small muted">
              Raccourcis clavier : <strong>[A]</strong> Approuver · <strong>[S]</strong> En stock · <strong>[R]</strong> Refuser · <strong>[→]</strong> Suivant · <strong>[Échap]</strong> Fermer
            </div>
          </div>

          <div v-else class="fast-empty">
            <h3>Toutes les commandes ont été traitées !</h3>
            <p>Il n'y a plus aucune commande en attente.</p>
            <button type="button" class="btn btn-dark" @click="closeFastReview">
              Retour au tableau de bord
            </button>
          </div>
        </div>
      </div>

      <!-- Liste standard des commandes avec filtre -->
      <div class="section-title">
        <h2>toutes les demandes</h2>
        <div class="admin-filter">
          <select v-model="filterStatus">
            <option value="all">Tous les statuts ({{ orders.length }})</option>
            <option v-for="(lbl, val) in STATUS_LABELS" :key="val" :value="val">
              {{ lbl }} ({{ orders.filter((o) => o.status === val).length }})
            </option>
          </select>
        </div>
      </div>

      <div v-if="error" class="alert">{{ error }}</div>

      <div v-if="filteredOrders.length">
        <OrderCard v-for="o in filteredOrders" :key="o.id" :order="o" />
      </div>

      <div v-else class="empty">
        Aucune commande correspondant à ce filtre.
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { X } from 'lucide-vue-next';
import { useAuth } from '../composables/useAuth';
import { watchOrders, changeStatus } from '../lib/orders';
import { money, STATUS_LABELS, STOCK_LOCATIONS } from '../lib/constants';
import OrderCard from '../components/OrderCard.vue';

const { user, isAdmin } = useAuth();
const orders = ref([]);
const error = ref('');
const filterStatus = ref('all');

// Mode Fast Review
const fastReviewOpen = ref(false);
const currentFastIndex = ref(0);
const stockSelectorOpen = ref(false);
const chosenLocation = ref(STOCK_LOCATIONS[0]);
const actionBusy = ref(false);

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
  window.removeEventListener('keydown', handleKeyDown);
});

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown);
});

const pendingOrders = computed(() => orders.value.filter((o) => o.status === 'pending'));
const inStockOrders = computed(() => orders.value.filter((o) => o.status === 'in_stock'));
const totalBudget = computed(() =>
  orders.value.reduce((sum, o) => sum + (Number(o.total) || 0), 0)
);

const filteredOrders = computed(() => {
  if (filterStatus.value === 'all') return orders.value;
  return orders.value.filter((o) => o.status === filterStatus.value);
});

const currentFastOrder = computed(() => {
  if (!pendingOrders.value.length) return null;
  return pendingOrders.value[currentFastIndex.value] || pendingOrders.value[0];
});

function openFastReview() {
  currentFastIndex.value = 0;
  stockSelectorOpen.value = false;
  chosenLocation.value = STOCK_LOCATIONS[0];
  fastReviewOpen.value = true;
}

function closeFastReview() {
  fastReviewOpen.value = false;
  stockSelectorOpen.value = false;
}

function fastNext() {
  stockSelectorOpen.value = false;
  if (currentFastIndex.value + 1 < pendingOrders.value.length) {
    currentFastIndex.value++;
  } else {
    currentFastIndex.value = 0;
  }
}

async function fastApprove() {
  if (!currentFastOrder.value || actionBusy.value) return;
  actionBusy.value = true;
  try {
    await changeStatus(currentFastOrder.value.id, 'approved');
    // Une fois la commande approuvée, pendingOrders diminue automatiquement
  } catch (e) {
    error.value = e.message;
  } finally {
    actionBusy.value = false;
  }
}

async function fastReject() {
  if (!currentFastOrder.value || actionBusy.value) return;
  actionBusy.value = true;
  try {
    await changeStatus(currentFastOrder.value.id, 'rejected');
  } catch (e) {
    error.value = e.message;
  } finally {
    actionBusy.value = false;
  }
}

async function confirmInStock() {
  if (!currentFastOrder.value || actionBusy.value) return;
  actionBusy.value = true;
  try {
    await changeStatus(currentFastOrder.value.id, 'in_stock', {
      stockLocation: chosenLocation.value || 'Disponible en réserve FabLab',
    });
    stockSelectorOpen.value = false;
  } catch (e) {
    error.value = e.message;
  } finally {
    actionBusy.value = false;
  }
}

function handleKeyDown(e) {
  if (!fastReviewOpen.value) return;

  // Si on est en train de taper dans un champ de texte, ignorer les raccourcis
  if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
    if (e.key === 'Escape') {
      stockSelectorOpen.value = false;
    }
    return;
  }

  if (e.key === 'Escape') {
    closeFastReview();
  } else if (e.key === 'a' || e.key === 'A') {
    e.preventDefault();
    fastApprove();
  } else if (e.key === 's' || e.key === 'S') {
    e.preventDefault();
    stockSelectorOpen.value = !stockSelectorOpen.value;
  } else if (e.key === 'r' || e.key === 'R') {
    e.preventDefault();
    fastReject();
  } else if (e.key === 'ArrowRight') {
    e.preventDefault();
    fastNext();
  }
}
</script>
