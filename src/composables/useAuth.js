import { ref, computed } from 'vue';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, configured } from '../lib/firebase';

const user = ref(null);
const profile = ref(null);
const loading = ref(configured);
let initialized = false;

function initAuth() {
  if (initialized || !configured || !auth) return;
  initialized = true;

  onAuthStateChanged(auth, async (current) => {
    user.value = current;
    profile.value = null;

    if (current) {
      try {
        const snap = await getDoc(doc(db, 'users', current.uid));
        if (snap.exists()) {
          profile.value = snap.data();
        }
      } catch (e) {
        console.error('Erreur lecture profil:', e);
      }
    }
    loading.value = false;
  });
}

export function useAuth() {
  initAuth();

  const isAdmin = computed(() => profile.value?.role === 'admin');

  async function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  async function register(email, password, name) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const data = {
      displayName: name.trim(),
      email: cred.user.email,
      role: 'member',
      createdAt: serverTimestamp(),
    };
    await setDoc(doc(db, 'users', cred.user.uid), data);
    profile.value = data;
    return cred;
  }

  async function logout() {
    return signOut(auth);
  }

  return {
    user,
    profile,
    loading,
    configured,
    isAdmin,
    login,
    register,
    logout,
  };
}

