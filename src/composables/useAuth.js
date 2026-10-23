import { ref, computed } from 'vue';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signOut,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, configured } from '../lib/firebase';

const user = ref(null);
const profile = ref(null);
const loading = ref(configured);
let initialized = false;

export function isDevinciEmail(email) {
  if (!email) return false;
  const lower = email.trim().toLowerCase();
  return lower.endsWith('@edu.devinci.fr') || lower.endsWith('@devinci.fr');
}

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
  const isEmailVerified = computed(() => Boolean(user.value?.emailVerified));

  async function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  async function register(email, password, name) {
    if (!isDevinciEmail(email)) {
      throw new Error(
        "Adresse non autorisée : veuillez utiliser une adresse officielle du Pôle Léonard de Vinci (@edu.devinci.fr ou @devinci.fr)."
      );
    }

    const cred = await createUserWithEmailAndPassword(auth, email, password);

    // Envoi immédiat du lien de vérification par e-mail
    try {
      await sendEmailVerification(cred.user);
    } catch (e) {
      console.warn("Impossible d'envoyer l'e-mail de confirmation:", e);
    }

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

  async function resendVerificationEmail() {
    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser);
    } else {
      throw new Error('Aucun utilisateur connecté.');
    }
  }

  async function reloadUser() {
    if (auth.currentUser) {
      await auth.currentUser.reload();
      user.value = { ...auth.currentUser };
    }
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
    isEmailVerified,
    isDevinciEmail,
    login,
    register,
    resendVerificationEmail,
    reloadUser,
    logout,
  };
}
