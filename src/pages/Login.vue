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
        <h2>{{ signup ? 'créer un compte' : 'bienvenue.' }}</h2>
        <p class="muted">
          {{ signup ? 'Rejoignez votre espace de commandes.' : 'Connectez-vous à votre espace IFT.' }}
        </p>

        <div v-if="!configured" class="alert">
          Firebase n'est pas configuré. Complétez votre fichier .env.
        </div>

        <form @submit.prevent="submit" class="form-stack">
          <label v-if="signup">
            Nom complet
            <input v-model="name" required placeholder="Prénom Nom" />
          </label>

          <label>
            Adresse e-mail
            <input v-model="email" required type="email" placeholder="prenom@edu.devinci.fr" />
          </label>

          <label>
            Mot de passe
            <input v-model="password" required minlength="6" type="password" placeholder="••••••••" />
          </label>

          <div v-if="error" class="alert" role="alert">
            {{ error }}
          </div>

          <button class="btn btn-dark" :disabled="!configured || busy">
            {{ busy ? 'chargement...' : signup ? 'créer mon compte →' : 'se connecter →' }}
          </button>
        </form>

        <button class="text-btn" @click="signup = !signup">
          {{ signup ? 'Déjà un compte ? Se connecter' : 'Pas de compte ? S’inscrire' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '../composables/useAuth';

const router = useRouter();
const { login, register, configured } = useAuth();

const signup = ref(false);
const name = ref('');
const email = ref('');
const password = ref('');
const error = ref('');
const busy = ref(false);

async function submit() {
  error.value = '';
  busy.value = true;
  try {
    if (signup.value) {
      await register(email.value, password.value, name.value);
    } else {
      await login(email.value, password.value);
    }
    router.push('/');
  } catch (err) {
    error.value = err.code || err.message;
  } finally {
    busy.value = false;
  }
}
</script>

