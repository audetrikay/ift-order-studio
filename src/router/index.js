import { createRouter, createWebHistory } from 'vue-router';
import { useAuth } from '../composables/useAuth';
import Layout from '../components/Layout.vue';
import Login from '../pages/Login.vue';
import Dashboard from '../pages/Dashboard.vue';
import NewOrder from '../pages/NewOrder.vue';
import Orders from '../pages/Orders.vue';
import OrderDetail from '../pages/OrderDetail.vue';
import Admin from '../pages/Admin.vue';

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: Login,
  },
  {
    path: '/',
    component: Layout,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: Dashboard,
      },
      {
        path: 'new',
        name: 'NewOrder',
        component: NewOrder,
      },
      {
        path: 'orders',
        name: 'Orders',
        component: Orders,
      },
      {
        path: 'orders/:id',
        name: 'OrderDetail',
        component: OrderDetail,
      },
      {
        path: 'admin',
        name: 'Admin',
        component: Admin,
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to, from, next) => {
  const { user, loading } = useAuth();

  // Attendre que l'auth soit initialisée
  if (loading.value) {
    await new Promise((resolve) => {
      const unwatch = () => {
        if (!loading.value) {
          resolve();
        } else {
          setTimeout(unwatch, 50);
        }
      };
      unwatch();
    });
  }

  if (to.meta.requiresAuth && !user.value) {
    next('/login');
  } else if (to.path === '/login' && user.value) {
    next('/');
  } else {
    next();
  }
});

export default router;

