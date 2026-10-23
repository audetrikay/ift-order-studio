<template>
  <div>
    <div class="page-heading">
      <div>
        <span class="mono eyebrow muted">REQUEST / NEW</span>
        <h1>nouvelle demande<span class="accent">.</span></h1>
        <p>Décrivez précisément le matériel dont vous avez besoin.</p>
      </div>
      <span class="mono small muted">FORM / 001</span>
    </div>

    <form @submit.prevent="submit" class="order-form">
      <!-- Section 1 : Informations générales -->
      <section class="form-section">
        <div class="section-marker">
          <span class="mono">01</span>
          <div>
            <h2>informations générales</h2>
            <p>Pour quel projet et chez quel fournisseur ?</p>
          </div>
        </div>

        <div class="fields">
          <label>
            Titre de la commande
            <input
              v-model="form.title"
              placeholder="Ex. Pièces mécaniques pour prototype"
              required
              maxlength="140"
            />
          </label>

          <div class="field-grid">
            <label>
              Fournisseur
              <select v-model="form.supplierId">
                <option v-for="s in SUPPLIERS" :key="s.id" :value="s.id">
                  {{ s.name }}
                </option>
              </select>
            </label>

            <label>
              Projet
              <select v-model="form.project">
                <option v-for="p in PROJECTS" :key="p" :value="p">
                  {{ p }}
                </option>
              </select>
            </label>
          </div>

          <label>
            Priorité
            <div class="priority-group">
              <button
                type="button"
                v-for="p in ['low', 'medium', 'high']"
                :key="p"
                :class="['priority', { selected: form.priority === p }]"
                @click="form.priority = p"
              >
                {{ p === 'low' ? 'Basse' : p === 'medium' ? 'Moyenne' : 'Haute' }}
              </button>
            </div>
          </label>
        </div>
      </section>

      <!-- Section 2 : Articles -->
      <section class="form-section">
        <div class="section-marker">
          <span class="mono">02</span>
          <div>
            <h2>articles</h2>
            <p>Un lien, une quantité et un prix par produit.</p>
          </div>
        </div>

        <div class="fields">
          <div v-for="(item, i) in form.items" :key="i" class="item-card">
            <div class="item-header">
              <span class="mono small muted">ITEM / {{ String(i + 1).padStart(2, '0') }}</span>
              <button
                v-if="form.items.length > 1"
                type="button"
                class="icon-btn"
                :aria-label="`Supprimer article ${i + 1}`"
                @click="removeItem(i)"
              >
                <Trash2 :size="16" />
              </button>
            </div>

            <label>
              Nom de l'article
              <input v-model="item.name" required placeholder="Ex. Roulement à billes 608ZZ" />
            </label>

            <label>
              Lien produit
              <input v-model="item.url" required type="url" placeholder="https://..." />
            </label>

            <div class="field-grid">
              <label>
                Quantité
                <input v-model.number="item.quantity" required type="number" min="1" step="1" />
              </label>

              <label>
                Prix unitaire (€)
                <input v-model.number="item.unitPrice" required type="number" min="0" step="0.01" />
              </label>
            </div>
          </div>

          <button type="button" class="btn btn-outline" @click="addItem">
            <Plus :size="16" /> Ajouter un article
          </button>
        </div>
      </section>

      <!-- Section 3 : Finalisation -->
      <section class="form-section">
        <div class="section-marker">
          <span class="mono">03</span>
          <div>
            <h2>finalisation</h2>
            <p>Ajoutez vos précisions avant l'envoi.</p>
          </div>
        </div>

        <div class="fields">
          <label>
            Notes complémentaires
            <textarea
              v-model="form.notes"
              rows="4"
              maxlength="1500"
              placeholder="Délais souhaités, dimensions, informations utiles..."
            />
          </label>

          <div class="total-row">
            <span>ESTIMATION TOTALE</span>
            <strong>{{ money(total) }}</strong>
          </div>

          <div v-if="error" role="alert" class="alert">
            {{ error }}
          </div>

          <button class="btn btn-dark submit" :disabled="busy">
            {{ busy ? 'envoi...' : 'soumettre la demande' }} <ArrowRight :size="17" />
          </button>

          <p class="small muted">
            Votre commande sera soumise à validation. Aucun achat n'est effectué automatiquement.
          </p>
        </div>
      </section>
    </form>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { Plus, Trash2, ArrowRight } from 'lucide-vue-next';
import { useAuth } from '../composables/useAuth';
import { createOrder } from '../lib/orders';
import { SUPPLIERS, PROJECTS, money, isValidSupplierUrl } from '../lib/constants';

const router = useRouter();
const { user } = useAuth();

const blankItem = () => ({ name: '', url: '', quantity: 1, unitPrice: '' });

const form = ref({
  title: '',
  supplierId: '123roulement',
  project: 'Other',
  priority: 'medium',
  notes: '',
  items: [blankItem()],
});

const error = ref('');
const busy = ref(false);

const supplier = computed(() => SUPPLIERS.find((s) => s.id === form.value.supplierId));

const total = computed(() =>
  form.value.items.reduce(
    (sum, i) => sum + (Number(i.quantity) || 0) * (Number(i.unitPrice) || 0),
    0
  )
);

function addItem() {
  form.value.items.push(blankItem());
}

function removeItem(index) {
  form.value.items.splice(index, 1);
}

async function submit() {
  error.value = '';

  if (!form.value.title.trim()) {
    error.value = 'Ajoutez un titre.';
    return;
  }

  if (form.value.items.some((i) => !isValidSupplierUrl(i.url, supplier.value))) {
    error.value = 'Vérifiez les liens des produits et leur fournisseur.';
    return;
  }

  if (
    form.value.items.some(
      (i) =>
        !i.name.trim() ||
        !Number.isInteger(Number(i.quantity)) ||
        Number(i.quantity) < 1 ||
        i.unitPrice === '' ||
        Number(i.unitPrice) < 0
    )
  ) {
    error.value = 'Complétez correctement chaque article.';
    return;
  }

  busy.value = true;
  try {
    const refDoc = await createOrder(user.value, form.value);
    router.push(`/orders/${refDoc.id}`);
  } catch (e) {
    error.value = e.message;
  } finally {
    busy.value = false;
  }
}
</script>

