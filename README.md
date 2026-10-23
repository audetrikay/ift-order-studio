# IFT Order Studio

Application moderne **Vue 3 + Vite + Firebase** pour la gestion et le suivi des demandes de matériel des projets de l'Institut des Formations du Tourisme / FabLab IFT (Pôle Léonard de Vinci).

## 🚀 Fonctionnalités

- **Authentification Firebase** : Inscription et connexion sécurisées par e-mail et mot de passe.
- **Gestion des rôles (RBAC)** :
  - **Étudiant (`member`)** : création de demandes, calcul dynamique des prix, suivi en temps réel de ses commandes.
  - **Responsable / Professeur (`admin`)** : vue d'ensemble de toutes les commandes, approbation/rejet/suivi des livraisons, statistiques globales.
- **Formulaire de commande interactif** :
  - Sélection du projet IFT et du fournisseur (123 Roulement, RS Components, ManoMano, Amazon...).
  - Ajout dynamique d'articles, validation des URLs et calcul en direct du total.
- **Synchronisation temps réel** : mise à jour instantanée des commandes et des statuts via Firestore (`onSnapshot`).
- **Design & Ergonomie** :
  - Interface soignée avec typographie éditoriale (**Anton** & **DM Sans**).
  - Mode clair / sombre avec mémorisation des préférences.
  - Responsive (ordinateur, tablette, mobile).
- **Sécurité** : Règles de sécurité Firestore (`firestore.rules`) protégeant les données et empêchant l'usurpation du rôle administrateur.

---

## 🛠️ Installation & Démarrage local

### 1. Prérequis
- [Node.js](https://nodejs.org/) (version 20+ recommandée)
- Un projet [Firebase](https://console.firebase.google.com/)

### 2. Cloner le dépôt et installer les dépendances
```bash
git clone https://github.com/<votre-nom-utilisateur>/<nom-du-repo>.git
cd ift-orders
npm install
```

### 3. Configurer Firebase
1. Créez un fichier `.env` à la racine du dossier `ift-orders` en copiant `.env.example` :
   ```bash
   cp .env.example .env
   ```
2. Remplissez les clés obtenues dans les paramètres de votre projet Firebase Console :
   ```env
   VITE_FIREBASE_API_KEY=AIzaSy...
   VITE_FIREBASE_AUTH_DOMAIN=votre-projet.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=votre-projet
   VITE_FIREBASE_STORAGE_BUCKET=votre-projet.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=...
   VITE_FIREBASE_APP_ID=1:...
   ```
3. Dans la console Firebase :
   - Activez **Authentication** avec le fournisseur **Adresse e-mail / Mot de passe**.
   - Créez la base **Firestore Database** en mode test ou avec les règles fournies.

### 4. Lancer le serveur de développement
```bash
npm run dev
```
Ouvrez l'adresse indiquée (généralement `http://localhost:5173`).

---

## 👑 Activer un compte Administrateur (Prof / Responsable)

1. Créez un compte directement depuis la page d'inscription de l'application.
2. Rendez-vous dans la **Firebase Console** → **Firestore Database** → collection **`users`**.
3. Sélectionnez le document correspondant à l'UID de votre compte.
4. Modifiez la valeur du champ `role` : remplacez `"member"` par **`"admin"`**.
5. Rafraîchissez l'application : l'onglet **Administration** apparaît automatiquement.

---

## 🔒 Déploiement des Règles Firestore

Pour sécuriser la base de données :
```bash
npm install -g firebase-tools
firebase login
firebase use --add
firebase deploy --only firestore:rules
```

---

## 🌐 Déploiement sur Firebase Hosting

```bash
npm run build
firebase init hosting
# Dossier public : dist
# Configure as single-page app : Yes
firebase deploy --only hosting
```

---

## 📁 Structure du projet

```
ift-orders/
├── src/
│   ├── components/
│   │   ├── Layout.vue        # Structure globale (sidebar, navigation, dark mode)
│   │   └── OrderCard.vue     # Carte d'affichage d'une commande
│   ├── composables/
│   │   └── useAuth.js        # Gestion réactive de l'authentification et des rôles
│   ├── lib/
│   │   ├── constants.js      # Fournisseurs, projets, statuts et utilitaires
│   │   ├── firebase.js       # Initialisation du SDK Firebase
│   │   └── orders.js         # Opérations CRUD Firestore
│   ├── pages/
│   │   ├── Admin.vue         # Vue d'ensemble et validation (admin)
│   │   ├── Dashboard.vue     # Tableau de bord principal
│   │   ├── Login.vue         # Connexion et inscription
│   │   ├── NewOrder.vue      # Formulaire de commande multi-articles
│   │   ├── OrderDetail.vue   # Détail d'une commande
│   │   └── Orders.vue        # Liste filtrable et recherche
│   ├── router/
│   │   └── index.js          # Configuration Vue Router avec guards d'authentification
│   ├── App.vue               # Composant racine
│   ├── main.js               # Point d'entrée de l'application
│   └── styles.css            # Styles globaux (Anton & DM Sans)
├── firestore.rules           # Règles de sécurité Firestore
├── firebase.json             # Configuration Firebase CLI
└── vite.config.js            # Configuration Vite + Vue
```

---

## 📄 Licence

Projet réalisé dans le cadre du cours Web Tech - ESILV / Pôle Léonard de Vinci.
