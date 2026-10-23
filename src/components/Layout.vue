<template>
  <div class="app-shell">
    <aside class="sidebar">
      <div class="brand">
        <span class="brand-mark">ift<span>.</span></span>
        <span class="mono small muted">order studio / 26</span>
      </div>

      <nav aria-label="Navigation principale">
        <RouterLink to="/" exact-active-class="active">
          <LayoutDashboard :size="17" /> vue d'ensemble
        </RouterLink>
        <RouterLink to="/new" exact-active-class="active">
          <Plus :size="17" /> nouvelle demande
        </RouterLink>
        <RouterLink to="/orders" active-class="active">
          <ClipboardList :size="17" /> mes commandes
        </RouterLink>
        <RouterLink v-if="isAdmin" to="/admin" active-class="active">
          <PackageOpen :size="17" /> administration
        </RouterLink>
      </nav>

      <div class="sidebar-bottom">
        <button class="plain-btn" @click="toggleTheme">
          <Sun v-if="dark" :size="17" />
          <Moon v-else :size="17" />
          {{ dark ? 'mode clair' : 'mode sombre' }}
        </button>

        <div class="profile">
          <span class="avatar">
            {{ ((profile?.displayName || user?.email || 'M')[0]).toUpperCase() }}
          </span>
          <div>
            <strong>{{ profile?.displayName || 'Membre IFT' }}</strong>
            <small>{{ user?.email }}</small>
          </div>
        </div>

        <button class="plain-btn" @click="handleLogout">
          <LogOut :size="16" /> déconnexion
        </button>
      </div>
    </aside>

    <div class="main-wrap">
      <header class="topbar">
        <span class="mono muted small">INNOVATION & FABRICATION / IFT</span>
        <span class="top-right">WORKSPACE <span class="online-dot" /> ONLINE</span>
      </header>

      <main class="content">
        <RouterView />
      </main>

      <footer class="footer">
        IFT ORDER STUDIO <span>DESIGNED FOR MAKING THINGS.</span>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  LayoutDashboard,
  Plus,
  ClipboardList,
  LogOut,
  Sun,
  Moon,
  PackageOpen,
} from 'lucide-vue-next';
import { useAuth } from '../composables/useAuth';

const router = useRouter();
const { user, profile, isAdmin, logout } = useAuth();

const dark = ref(localStorage.getItem('ift-theme') === 'dark');

function applyTheme(isDark) {
  document.documentElement.dataset.theme = isDark ? 'dark' : 'light';
  localStorage.setItem('ift-theme', isDark ? 'dark' : 'light');
}

function toggleTheme() {
  dark.value = !dark.value;
  applyTheme(dark.value);
}

onMounted(() => {
  applyTheme(dark.value);
});

async function handleLogout() {
  await logout();
  router.push('/login');
}
</script>

