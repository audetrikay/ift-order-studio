<template>
  <div class="auth-page">
    <div class="auth-intro">
      <div class="brand-mark">ift<span>.</span></div>
      <span class="mono eyebrow">THE MAKER'S WORKSPACE</span>
      <h1>make ideas<br />happen<span class="accent">.</span></h1>
      <p>Un espace pour demander, suivre et gérer le matériel des projets IFT.</p>
      <div class="auth-index mono">01 / REQUEST&nbsp;&nbsp; 02 / REVIEW&nbsp;&nbsp; 03 / MAKE</div>
    </div>

    <div class="auth-panel">
      <div class="auth-card">
        <span class="mono eyebrow muted">MEMBER ACCESS / 01</span>

        <!-- TITRES DYNAMIQUES SELON LE MODE -->
        <h2>
          {{ view === 'signup' ? 'créer un compte' : view === 'forgot' ? 'mot de passe oublié.' : 'bienvenue.' }}
        </h2>

        <p class="muted">
          {{
            view === 'signup'
              ? 'Rejoignez votre espace de commandes avec votre e-mail De Vinci.'
              : view === 'forgot'
              ? 'Entrez votre adresse De Vinci pour réinitialiser votre mot de passe.'
              : 'Connectez-vous à votre espace IFT.'
          }}
        </p>

        <div v-if="view === 'signup'" class="school-notice">
          Inscription réservée au domaine <strong>@edu.devinci.fr</strong> ou <strong>@devinci.fr</strong>
        </div>

        <div v-if="!configured" class="alert">
          Firebase n'est pas configuré. Complétez votre fichier .env.
        </div>

        <div v-if="successMsg" class="success-banner">
          {{ successMsg }}
        </div>

        <!-- FORMULAIRE RÉINITIALISATION MOT DE PASSE -->
        <form v-if="view === 'forgot'" @submit.prevent="handleForgot" class="form-stack">
          <label>
            Adresse e-mail De Vinci
            <input
              v-model="email"
              required
              type="email"
              placeholder="prenom.nom@edu.devinci.fr"
            />
          </label>

          <div v-if="error" class="alert" role="alert">
            {{ error }}
          </div>

          <button class="btn btn-dark" :disabled="!configured || busy">
            {{ busy ? 'envoi en cours...' : 'envoyer le lien de réinitialisation →' }}
          </button>

          <button type="button" class="text-btn" @click="switchView('login')">
            ← Retour à la connexion
          </button>
        </form>

        <!-- FORMULAIRE CONNEXION OU INSCRIPTION -->
        <form v-else @submit.prevent="handleSubmit" class="form-stack">
          <label v-if="view === 'signup'">
            Nom complet
            <input v-model="name" required placeholder="Prénom Nom" />
          </label>

          <label>
            Adresse e-mail étudiante / enseignant
            <input
              v-model="email"
              required
              type="email"
              placeholder="prenom.nom@edu.devinci.fr"
            />
          </label>

          <label>
            <div class="label-with-link">
              <span>Mot de passe</span>
              <button
                v-if="view === 'login'"
                type="button"
                class="inline-link"
                @click="switchView('forgot')"
              >
                Mot de passe oublié ?
              </button>
            </div>
            <input v-model="password" required minlength="6" type="password" placeholder="••••••••" />
          </label>

          <div v-if="error" class="alert" role="alert">
            {{ error }}
          </div>

          <button class="btn btn-dark" :disabled="!configured || busy">
            {{ busy ? 'chargement...' : view === 'signup' ? 'créer mon compte →' : 'se connecter →' }}
          </button>

          <button
            type="button"
            class="text-btn"
            @click="switchView(view === 'signup' ? 'login' : 'signup')"
          >
            {{ view === 'signup' ? 'Déjà un compte ? Se connecter' : 'Pas de compte ? S’inscrire' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth, isDevinciEmail } from '../composables/useAuth';

const router = useRouter();
const { login, register, resetPassword, configured } = useAuth();

const view = ref('login'); // 'login' | 'signup' | 'forgot'
const name = ref('');
const email = ref('');
const password = ref('');
const error = ref('');
const successMsg = ref('');
const busy = ref(false);

function switchView(newView) {
  error.value = '';
  successMsg.value = '';
  view.value = newView;
}

async function handleForgot() {
  error.value = '';
  successMsg.value = '';

  if (!isDevinciEmail(email.value)) {
    error.value = "Seules les adresses officielles du Pôle Léonard de Vinci (@edu.devinci.fr ou @devinci.fr) sont autorisées.";
    return;
  }

  busy.value = true;
  try {
    await resetPassword(email.value);
    successMsg.value = `Un e-mail contenant le lien de réinitialisation vient d'être envoyé à ${email.value}. Vérifiez votre messagerie Outlook De Vinci.`;
  } catch (err) {
    if (err.code === 'auth/user-not-found') {
      error.value = "Aucun compte n'est associé à cette adresse e-mail.";
    } else {
      error.value = err.message || err.code;
    }
  } finally {
    busy.value = false;
  }
}

async function handleSubmit() {
  error.value = '';
  successMsg.value = '';

  if (view.value === 'signup' && !isDevinciEmail(email.value)) {
    error.value = "Seules les adresses officielles du Pôle Léonard de Vinci (@edu.devinci.fr ou @devinci.fr) sont autorisées.";
    return;
  }

  busy.value = true;
  try {
    if (view.value === 'signup') {
      await register(email.value, password.value, name.value);
    } else {
      await login(email.value, password.value);
    }
    router.push('/');
  } catch (err) {
    if (err.code === 'auth/email-already-in-use') {
      error.value = "Cette adresse e-mail possède déjà un compte.";
    } else if (
      err.code === 'auth/wrong-password' ||
      err.code === 'auth/user-not-found' ||
      err.code === 'auth/invalid-credential'
    ) {
      error.value = "Identifiants incorrects.";
    } else {
      error.value = err.message || err.code;
    }
  } finally {
    busy.value = false;
  }
}
</script>
