# 🧹 Propre Eco Assistant

**Version 2.0.0** - Application web progressive (PWA) de gestion pour entreprise de nettoyage

Développé avec ❤️ par **Ashborn**

---

## 📋 Table des matières

- [Vue d'ensemble](#-vue-densemble)
- [Fonctionnalités](#-fonctionnalités)
- [Technologies](#-technologies)
- [Structure du projet](#-structure-du-projet)
- [Installation](#-installation)
- [Pages & Modules](#-pages--modules)
- [Changelog v2.0](#-changelog-v20)
- [Performances](#-performances)
- [Responsive Design](#-responsive-design)

---

## 🎯 Vue d'ensemble

Propre Eco Assistant est une application web complète permettant de gérer l'ensemble des activités d'une entreprise de nettoyage :
- Gestion des copropriétés
- Suivi des heures et chantiers
- Création de devis professionnels
- Pointeuse employés
- Signalement de problèmes
- Feuilles de passage signées
- Système d'annonces interne

---

## ✨ Fonctionnalités

### 🆕 Nouveautés v2.0

#### 📋 Page Devis
- Formulaire mobile optimisé pour chiffrage sur chantier
- Calcul automatique du prix et du temps de travail
- Support photos (cuisine, séjour, vitres hautes)
- Export PDF professionnel avec logo
- Détails complets : vitres, chambres, salles de bain, pièces annexes

#### 🏢 Gestion Copropriétés
- Ajout de nouvelles copropriétés depuis le dashboard
- Modification en temps réel des informations
- Suppression sécurisée avec confirmation
- Vue d'ensemble complète

#### 📢 Système d'Annonces
- Création d'annonces visibles par tous les employés
- Support de 5 photos maximum par annonce
- Affichage automatique à la connexion
- Carousel de navigation entre photos
- Gestion centralisée depuis le dashboard

#### 🎨 Refonte Interface
- Tableau de bord entièrement repensé
- Menu de navigation latéral moderne
- Design épuré et professionnel
- Animations fluides

### 📊 Tableau de Bord
- Vue d'ensemble de l'activité
- Gestion des copropriétés
- Consultation et chiffrage des devis
- Création d'annonces
- Statistiques en temps réel
- Onglets : Heures, Copros, Devis, Annonces

### ⏰ Onglet Heures (Performance x10)
- Affichage ultra-rapide (< 1 seconde)
- Vue semaine par semaine détaillée
- Calcul automatique des kilomètres
- Liste des chantiers spécifiques
- Export des données

### 🏢 Gestion Copropriétés
- Recherche intelligente
- Codes d'accès sécurisés
- Historique des passages
- Informations détaillées
- Modification en temps réel

### 👤 Pointeuse
- Saisie de code PIN sécurisée
- Clavier numérique tactile
- Enregistrement des heures
- Interface optimisée mobile

### 📸 Feuilles de Passage
- Photo de la feuille signée
- Compression automatique des images
- Upload vers ImgBB
- Confirmation de passage
- Horodatage automatique

### ⚠️ Signalement
- Signalement de problèmes sur chantier
- Photos des anomalies
- Envoi avec feedback visuel
- Suivi des signalements

### 🔨 Chantiers Spécifiques
- Saisie des chantiers spéciaux
- Photos avant/après
- Calcul des heures
- Historique complet

---

## 🛠 Technologies

### Frontend
- **HTML5** - Structure sémantique
- **CSS3** - Styles modernes (Flexbox, Grid, CSS Variables)
- **JavaScript ES6+** - Logique applicative
- **Font Awesome 6.4.0** - Icônes

### Backend & Database
- **Firebase Authentication** - Gestion des utilisateurs
- **Firestore** - Base de données temps réel
- **Firebase Storage** - Stockage des photos

### APIs Externes
- **ImgBB API** - Hébergement d'images optimisé

### PWA
- **Service Worker** - Mode hors ligne
- **Manifest.json** - Installation sur mobile
- **Cache API** - Performances optimales

---

## 📁 Structure du projet

```
PROPRE-ECO-CLEAN/
│
├── css/                          # Styles CSS
│   ├── base.css                  # Reset & styles de base
│   ├── variables.css             # Variables CSS globales
│   ├── components.css            # Composants réutilisables
│   ├── navbar.css                # Menu de navigation
│   ├── modals.css                # Modales (annonces, etc.)
│   ├── dashbord.css              # Tableau de bord
│   ├── devis.css                 # Page devis
│   ├── heures.css                # Onglet heures
│   ├── pointeuse.css             # Pointeuse
│   ├── Feuilles.css              # Feuilles de passage
│   ├── signaler.css              # Signalements
│   ├── Specifique.css            # Chantiers spécifiques
│   ├── voir.css                  # Visualisation
│   ├── responsive.css            # Media queries
│   └── update-modal-dashboard.css # Modal mise à jour
│
├── js/                           # Scripts JavaScript
│   ├── config.js                 # Configuration Firebase
│   ├── navbar.js                 # Navigation
│   ├── utils.js                  # Utilitaires
│   ├── dashbord.js               # Tableau de bord
│   ├── dashboard-copro.js        # Gestion copros
│   ├── devis.js                  # Devis
│   ├── heures.js                 # Heures
│   ├── pointeuse.js              # Pointeuse
│   ├── Feuilles.js               # Feuilles
│   ├── signaler.js               # Signalements
│   ├── Specifique.js             # Spécifiques
│   ├── voir.js                   # Visualisation
│   ├── announcements.js          # Système d'annonces
│   ├── update-modal.js           # Modal mise à jour
│   └── badge.js                  # Badges & notifications
│
├── img/                          # Images
│   ├── logo.png                  # Logo Propre Eco
│   └── logo-propre-eco.png       # Logo haute résolution
│
├── pages/                        # Pages HTML (legacy)
│
├── index.html                    # Page d'accueil
├── dashbord.html                 # Tableau de bord
├── devis.html                    # Devis
├── heures.html                   # Heures
├── pointeuse.html                # Pointeuse
├── Feuilles.html                 # Feuilles
├── signaler.html                 # Signalements
├── Specifique.html               # Spécifiques
├── voir.html                     # Visualisation
├── Ge_ne_rateur_feuilles.html    # Générateur feuilles
│
├── manifest.json                 # Configuration PWA
├── service-worker.js             # Service Worker PWA
├── elements-chiffrage.json       # Données de chiffrage
└── README.md                     # Ce fichier
```

---

## 🚀 Installation

### Prérequis
- Navigateur web moderne (Chrome, Firefox, Safari, Edge)
- Connexion Internet (première utilisation)
- Compte Firebase configuré

### Configuration Firebase

1. Créer un projet Firebase sur [console.firebase.google.com](https://console.firebase.google.com)

2. Activer les services :
   - Authentication (Email/Password)
   - Firestore Database
   - Storage

3. Configurer `js/config.js` avec vos identifiants Firebase :

```javascript
const firebaseConfig = {
    apiKey: "VOTRE_API_KEY",
    authDomain: "VOTRE_PROJECT.firebaseapp.com",
    projectId: "VOTRE_PROJECT_ID",
    storageBucket: "VOTRE_PROJECT.appspot.com",
    messagingSenderId: "VOTRE_SENDER_ID",
    appId: "VOTRE_APP_ID",
    measurementId: "VOTRE_MEASUREMENT_ID"
};
```

4. Configurer la clé API ImgBB dans les fichiers concernés

### Déploiement

#### Option 1 : Firebase Hosting
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

#### Option 2 : Serveur Web classique
1. Cloner le repository
2. Configurer Firebase
3. Héberger sur votre serveur (Apache, Nginx, etc.)

#### Option 3 : Test local
```bash
# Utiliser un serveur local simple
python -m http.server 8000
# ou
npx http-server
```

---

## 📱 Pages & Modules

### 🏠 Index (Accueil)
- Liste des procédures par copropriété
- Recherche de procédures
- Accès rapide aux fonctionnalités

### 📊 Dashboard (Tableau de bord)
- **Onglet Heures** : Suivi des heures employés
- **Onglet Copros** : Gestion copropriétés
- **Onglet Devis** : Consultation et chiffrage
- **Onglet Annonces** : Création d'annonces
- Authentification requise

### 📋 Devis
- Formulaire de chiffrage complet
- Calcul automatique temps/prix
- Photos du chantier
- Export PDF professionnel

### ⏰ Pointeuse
- Code PIN par employé
- Clavier tactile sécurisé
- Enregistrement instantané

### 📸 Feuilles
- Photo feuille signée
- Compression automatique
- Validation de passage

### ⚠️ Signaler
- Signalement problèmes
- Photos anomalies
- Envoi confirmé

### 🔨 Spécifique
- Chantiers spéciaux
- Calcul heures
- Photos avant/après

---

## 📈 Changelog v2.0

### ✨ Nouvelles fonctionnalités
- ✅ Page Devis complète avec chiffrage automatique
- ✅ Système d'annonces avec photos
- ✅ Gestion copropriétés (CRUD complet)
- ✅ Refonte complète du dashboard
- ✅ Menu de navigation moderne

### ⚡ Améliorations performances
- ✅ Onglet Heures 10x plus rapide (6s → <1s)
- ✅ Système de cache intelligent
- ✅ Optimisation chargement images

### 🎨 Interface utilisateur
- ✅ Design moderne et épuré
- ✅ Animations fluides
- ✅ Menu latéral responsive
- ✅ Boutons agrandis mobile (40px min)

### 🐛 Corrections
- ✅ Affichage accents et caractères spéciaux
- ✅ Dates format français
- ✅ Responsive navbar petits écrans
- ✅ Modal annonces sur toutes les pages

### 🔧 Optimisations techniques
- ✅ Externalisation CSS/JS (−5800 lignes code dupliqué)
- ✅ Suppression doublons imports
- ✅ Code modulaire et maintenable

---

## ⚡ Performances

### Métriques v2.0
- **Onglet Heures** : < 1 seconde (vs 6s avant)
- **Chargement pages** : < 2 secondes
- **Compression images** : Automatique
- **Cache** : Service Worker activé
- **PWA Score** : 90+/100

### Optimisations
- Cache intelligent avec Service Worker
- Lazy loading des images
- Minification CSS/JS (production)
- Compression automatique photos
- Requêtes Firestore optimisées

---

## 📱 Responsive Design

### Breakpoints
- **Desktop** : > 1024px
- **Tablet** : 768px - 1024px
- **Mobile L** : 480px - 768px
- **Mobile M** : 390px - 480px
- **Mobile S** : < 390px

### Optimisations mobiles
- Menu hamburger fluide
- Boutons tactiles (min 40px)
- Clavier numérique optimisé
- Images responsives
- Modales plein écran

---

## 🔐 Sécurité

- Authentification Firebase
- Codes PIN employés
- Règles Firestore strictes
- HTTPS obligatoire
- Validation côté serveur

---

## 📝 License

Propriétaire - Propre Eco  
Tous droits réservés © 2026

---

## 👨‍💻 Développeur

**Ashborn**  
Developed with ❤️

---

## 🆘 Support

Pour toute question ou problème :
1. Vérifier la console navigateur (F12)
2. Vider le cache si nécessaire
3. Contacter le développeur

---

**Version actuelle : 2.0.0**  
**Dernière mise à jour : 15 février 2026**