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
          <p>Vue d'ensemble et mutualisation des commandes de l'IFT.</p>
        </div>

        <div class="view-toggles">
          <button
            type="button"
            :class="['btn', currentTab === 'orders' ? 'btn-dark' : 'btn-outline']"
            @click="currentTab = 'orders'"
          >
            Toutes les demandes ({{ orders.length }})
          </button>
          <button
            type="button"
            :class="['btn', currentTab === 'mutualisation' ? 'btn-dark' : 'btn-outline']"
            @click="currentTab = 'mutualisation'"
          >
            🌱 Mutualisation & Lots ({{ mutualisationOpportunities.length }})
          </button>
        </div>
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
          <span class="mono small muted">ÉCONOMIE MUTUALISÉE</span>
          <strong class="money-stat">{{ money(totalPotentialSavings) }}</strong>
          <span>Frais de port évités</span>
        </div>
        <div class="stat">
          <span class="mono small muted">BUDGET TOTAL</span>
          <strong class="money-stat">{{ money(totalBudget) }}</strong>
          <span>Montant global</span>
        </div>
      </section>

      <div v-if="error" class="alert">{{ error }}</div>
      <div v-if="successMsg" class="success-banner">{{ successMsg }}</div>

      <!-- ONGLET 1 : MUTUALISATION DES COMMANDES -->
      <div v-if="currentTab === 'mutualisation'">
        <div class="section-title">
          <div>
            <span class="mono eyebrow muted">ECO-DESIGN / GROUP BUYING</span>
            <h2>achats groupés par fournisseur</h2>
          </div>
          <span class="small muted">
            Regroupez les achats pour réduire les frais de livraison et l'empreinte carbone.
          </span>
        </div>

        <div v-if="mutualisationGroups.length" class="groups-grid">
          <div
            v-for="group in mutualisationGroups"
            :key="group.supplier.id"
            :class="['group-card', { 'group-highlight': group.orders.length > 1 }]"
          >
            <div class="group-header">
              <div>
                <div class="group-title-row">
                  <h3>{{ group.supplier.name }}</h3>
                  <span v-if="group.orders.length > 1" class="savings-tag">
                    🌱 {{ money(group.estimatedSavings) }} économisés
                  </span>
                </div>
                <p class="muted small">
                  {{ group.orders.length }} commande(s) · {{ group.projects.join(', ') }}
                </p>
              </div>

              <div class="group-total">
                <span class="mono small muted">TOTAL DU LOT</span>
                <strong>{{ money(group.totalBudget) }}</strong>
              </div>
            </div>

            <!-- Liste consolidée des articles du groupe -->
            <div class="consolidated-items">
              <div
                v-for="(item, idx) in group.allItems"
                :key="idx"
                class="consolidated-item-row"
              >
                <div class="item-info">
                  <strong>{{ item.name }}</strong>
                  <span class="small muted">
                    Projet {{ item.project }} · Demandé par {{ item.userEmail }}
                  </span>
                </div>
                <div class="item-qty-price">
                  <span>{{ item.quantity }} × {{ money(item.unitPrice) }}</span>
                  <a
                    :href="item.url"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-link small"
                  >
                    Lien ↗
                  </a>
                </div>
              </div>
            </div>

            <!-- Actions du groupe -->
            <div class="group-actions">
              <button
                type="button"
                class="btn btn-outline small-btn"
                @click="exportSupplierCSV(group)"
              >
                <Download :size="15" /> Exporter le panier (CSV)
              </button>

              <button
                type="button"
                class="btn btn-dark small-btn"
                :disabled="busy"
                @click="orderGroup(group)"
              >
                <CheckCircle :size="15" /> Valider & Commander le lot ({{ group.orders.length }})
              </button>
            </div>
          </div>
        </div>

        <div v-else class="empty">
          <span class="empty-number">00</span>
          <h3>aucune commande à mutualiser.</h3>
          <p>Toutes les commandes sont déjà traitées ou aucune demande n'est en attente.</p>
        </div>
      </div>

      <!-- ONGLET 2 : TOUTES LES COMMANDES INDIVIDUELLES -->
      <div v-else>
        <div class="section-title">
          <h2>toutes les demandes</h2>
        </div>

        <div v-if="orders.length">
          <OrderCard v-for="o in orders" :key="o.id" :order="o" />
        </div>

        <div v-else class="empty">
          Aucune demande pour l'instant.
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onUnmounted } from 'vue';
import { Download, CheckCircle } from 'lucide-vue-next';
import { useAuth } from '../composables/useAuth';
import { watchOrders, batchChangeStatus } from '../lib/orders';
import { money, SUPPLIERS } from '../lib/constants';
import OrderCard from '../components/OrderCard.vue';

const { user, isAdmin } = useAuth();
const orders = ref([]);
const error = ref('');
const successMsg = ref('');
const busy = ref(false);
const currentTab = ref('mutualisation');

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

// Moteur de mutualisation : regroupe les commandes éligibles (pending ou approved) par fournisseur
const mutualisationGroups = computed(() => {
  const eligible = orders.value.filter((o) => ['pending', 'approved'].includes(o.status));
  const groups = {};

  eligible.forEach((order) => {
    const sId = order.supplierId || 'other';
    if (!groups[sId]) {
      const supplierObj = SUPPLIERS.find((s) => s.id === sId) || {
        id: sId,
        name: sId,
        shippingCost: 8.0,
      };
      groups[sId] = {
        supplier: supplierObj,
        orders: [],
        totalItemsCount: 0,
        totalBudget: 0,
        projects: new Set(),
        allItems: [],
      };
    }
    const g = groups[sId];
    g.orders.push(order);
    g.totalBudget += Number(order.total) || 0;
    g.projects.add(order.project);
    order.items?.forEach((item) => {
      g.totalItemsCount += Number(item.quantity) || 1;
      g.allItems.push({
        ...item,
        orderId: order.id,
        orderTitle: order.title,
        project: order.project,
        userEmail: order.userEmail,
      });
    });
  });

  return Object.values(groups)
    .map((g) => ({
      ...g,
      projects: Array.from(g.projects),
      estimatedSavings:
        g.orders.length > 1 ? (g.orders.length - 1) * (g.supplier.shippingCost || 8) : 0,
    }))
    .sort((a, b) => b.orders.length - a.orders.length);
});

// Groupes ayant au moins 2 commandes mutualisables
const mutualisationOpportunities = computed(() =>
  mutualisationGroups.value.filter((g) => g.orders.length > 1)
);

const totalPotentialSavings = computed(() =>
  mutualisationGroups.value.reduce((sum, g) => sum + g.estimatedSavings, 0)
);

// Exporter le bon d'achat groupé en CSV prêt pour Excel ou le fournisseur
function exportSupplierCSV(group) {
  const headers = [
    'Article',
    'Quantite',
    'Prix_Unitaire_EUR',
    'Total_Ligne_EUR',
    'Projet_IFT',
    'Demandeur',
    'Lien_Fournisseur',
  ];
  const rows = group.allItems.map((i) => [
    `"${(i.name || '').replace(/"/g, '""')}"`,
    i.quantity,
    i.unitPrice,
    (i.quantity * i.unitPrice).toFixed(2),
    `"${i.project}"`,
    `"${i.userEmail}"`,
    `"${i.url}"`,
  ]);

  const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `panier-groupe-${group.supplier.id}-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

// Marquer l'ensemble des commandes du groupe comme commandées
async function orderGroup(group) {
  const count = group.orders.length;
  if (!confirm(`Confirmer le passage en statut "Commandée" pour les ${count} commandes groupées chez ${group.supplier.name} ?`)) {
    return;
  }

  busy.value = true;
  error.value = '';
  try {
    const ids = group.orders.map((o) => o.id);
    await batchChangeStatus(ids, 'ordered');
    successMsg.value = `✅ Le lot ${group.supplier.name} (${count} commandes) a été validé et marqué comme commandé !`;
    setTimeout(() => {
      successMsg.value = '';
    }, 4500);
  } catch (e) {
    error.value = e.message;
  } finally {
    busy.value = false;
  }
}
</script>
