# 🌿 Propre Eco Assistant

> Application web progressive (PWA) de gestion du personnel et des chantiers pour Propre Eco

[![Made with Love](https://img.shields.io/badge/Made%20with-❤️-red.svg)](https://github.com)
[![PWA Ready](https://img.shields.io/badge/PWA-Ready-success.svg)](https://web.dev/progressive-web-apps/)
[![Mobile First](https://img.shields.io/badge/Mobile-First-blue.svg)](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)

---

## 📋 Table des matières

- [Vue d'ensemble](#-vue-densemble)
- [Fonctionnalités](#-fonctionnalités)
- [Pages et modules](#-pages-et-modules)
- [Technologies](#-technologies)
- [Installation](#-installation)
- [Utilisation](#-utilisation)
- [Architecture](#-architecture)
- [Sécurité](#-sécurité)
- [Contribution](#-contribution)

---

## 🎯 Vue d'ensemble

**Propre Eco Assistant** est une application web complète développée pour gérer les opérations quotidiennes d'une entreprise de nettoyage professionnel. L'application offre une interface moderne et intuitive pour :

- ✅ Gestion des heures de travail
- ✅ Suivi des chantiers spécifiques
- ✅ Génération de feuilles de présence
- ✅ Signalement de problèmes
- ✅ Galerie photos des chantiers
- ✅ Tableau de bord administratif
- ✅ Système de pointeuse avec badges employés

### 🎨 Design
- Interface moderne avec **glassmorphism**
- Dégradés verts (thème Propre Eco)
- **100% responsive** - optimisé mobile et desktop
- Animations fluides et transitions élégantes
- UX soignée avec feedback utilisateur constant

---

## ⚡ Fonctionnalités

### 🔐 Authentification et Sécurité
- **Système de badges employés** avec codes PIN à 4 chiffres
- **Connexion automatique** pour profils favoris (30 jours)
- Stockage sécurisé des sessions dans localStorage
- Déconnexion manuelle disponible

### ⏰ Gestion des Heures
- **Saisie hebdomadaire** avec incréments de 0.25h (1h, 1h25, 1h50, 1h75)
- Calcul automatique des totaux
- Suivi du kilométrage
- Commentaires par jour
- Sauvegarde dans Firebase Firestore

### 🏗️ Chantiers Spécifiques
- Tableau avec : Date, Chantier, Nb employés, Equipe, Total
- Saisie manuelle du total d'heures
- Ajout/suppression de lignes dynamique
- Calcul du total global automatique

### 📸 Galerie Photos
- Upload de photos par chantier
- **Modal carrousel moderne** :
  - Plein écran avec fond noir
  - Navigation clavier (← → Échap)
  - Compteur de photos
  - Informations en overlay
  - Bouton fermeture rouge bien visible
- **Filtres avancés** :
  - Par chantier
  - Par description ✨ **NOUVEAU**
  - Par agent
  - Par date
- Téléchargement en ZIP
- Suppression groupée

### 📊 Tableau de Bord Admin
- Accès protégé par code
- Vue d'ensemble des signalements
- Gestion des photos de chantiers
- Statistiques en temps réel
- Export des données

### 📄 Génération de Feuilles
- **Feuilles de présence** automatiques
- **Feuilles hebdomadaires** personnalisées
- Export et impression optimisés
- Templates professionnels

### 🚨 Signalements
- Formulaire de signalement de problèmes
- Upload de photos d'illustration
- Suivi des incidents
- Notifications

---

## 📱 Pages et Modules

### 1. `index.html` - Page d'accueil
- Portail principal de l'application
- Navigation vers tous les modules
- Design accueillant et moderne

### 2. `pointeuse.html` - Système de badges
- Cartes employés avec avatars colorés
- **Système de favoris** avec étoiles
- **Connexion automatique** si favori + code correct
- Modal de saisie du code PIN
- Redirection vers heures ou feuilles Google Sheets

### 3. `heures.html` - Gestion des heures
- **Tableau hebdomadaire** (Lun-Dim)
- **Tableau chantiers spécifiques** responsive
  - Mode carte sur mobile avec labels auto
  - Bouton supprimer agrandi pour mobile
- Sélecteur de semaine
- **Messages d'alerte** : "Pensez à cliquer sur Enregistrer !"
- Sauvegarde Firebase en temps réel
- **Bouton déconnexion** (si session auto active)

### 4. `dashbord.html` - Tableau de bord
- Accès sécurisé par code
- Section signalements
- Section photos chantiers avec **filtre description**
- **Modal carrousel refonte** :
  - Navigation fluide
  - Support clavier complet
  - Design moderne plein écran
- Actions groupées (téléchargement, suppression)
- Pagination intelligente

### 5. `Feuilles.html` - Gestion des feuilles
- Génération automatique de feuilles
- Templates personnalisables
- Export multi-formats

### 6. `Generateur_feuilles.html` - Générateur
- Outil de création de feuilles
- Interface intuitive
- Paramètres personnalisables

### 7. `Specifique.html` - Chantiers spécifiques
- Gestion détaillée des chantiers
- Upload photos par chantier
- Descriptions et détails

### 8. `signaler.html` - Signalements
- Formulaire de déclaration
- Upload de photos
- Catégorisation des problèmes

### 9. `voir.html` - Visualisation
- Consultation des données
- Filtres et recherche
- Export des informations

---

## 🛠️ Technologies

### Frontend
- **HTML5** - Structure sémantique
- **CSS3** - Styles modernes
  - Variables CSS
  - Flexbox & Grid
  - Animations & Transitions
  - Media Queries (responsive)
  - Glassmorphism
- **JavaScript ES6+** - Logique applicative
  - Fetch API
  - LocalStorage
  - Promises & Async/Await
  - Event Listeners

### Backend & Database
- **Firebase** - Backend as a Service
  - **Firestore** - Base de données NoSQL
  - **Storage** - Hébergement photos
  - **Authentication** (prévu)
  - **Hosting** - Déploiement

### Services Externes
- **ImgBB** - CDN pour images
- **Font Awesome 6.4** - Icônes
- **Google Fonts** (Inter) - Typographie

### PWA
- **Service Worker** - Fonctionnement offline
- **Web App Manifest** - Installation sur mobile
- **Cache API** - Performance optimale

---

## 📦 Installation

### Prérequis
- Navigateur web moderne (Chrome, Firefox, Safari, Edge)
- Connexion internet (première visite)
- Firebase configuré (voir configuration)

### Configuration Firebase

1. Créer un projet sur [Firebase Console](https://console.firebase.google.com/)

2. Ajouter les clés dans les fichiers :

```javascript
const firebaseConfig = {
    apiKey: "VOTRE_API_KEY",
    authDomain: "VOTRE_AUTH_DOMAIN",
    projectId: "VOTRE_PROJECT_ID",
    storageBucket: "VOTRE_STORAGE_BUCKET",
    messagingSenderId: "VOTRE_MESSAGING_ID",
    appId: "VOTRE_APP_ID",
    measurementId: "VOTRE_MEASUREMENT_ID"
};
```

3. Activer Firestore et Storage dans la console Firebase

4. Configurer les règles de sécurité :

```javascript
// Firestore Rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true; // À personnaliser selon vos besoins
    }
  }
}
```

### Déploiement

#### Option 1 : Hébergement Firebase
```bash
npm install -g firebase-tools
firebase login
firebase init
firebase deploy
```

#### Option 2 : Serveur Web classique
1. Copier tous les fichiers sur votre serveur
2. S'assurer que le service worker fonctionne (HTTPS requis)
3. Configurer le fichier `.htaccess` si nécessaire

---

## 🚀 Utilisation

### Premier lancement

1. **Accéder à l'application**
   - Ouvrir `index.html` dans un navigateur
   - Ou accéder via l'URL de déploiement

2. **Installation PWA (mobile)**
   - Sur iOS : Safari > Partager > "Sur l'écran d'accueil"
   - Sur Android : Chrome > Menu > "Installer l'application"

### Flux utilisateur classique

#### Employé
1. Ouvrir l'app via l'icône
2. Navigation automatique si favori configuré
3. Ou cliquer sur badge → entrer code PIN
4. Remplir les heures de la semaine
5. Ajouter chantiers spécifiques si besoin
6. Cliquer sur "Enregistrer"

#### Administrateur
1. Accéder au tableau de bord
2. Entrer le code admin
3. Consulter signalements et photos
4. Filtrer par critères (chantier, description, agent, date)
5. Télécharger ou supprimer selon besoin

---

## 🏗️ Architecture

### Structure des fichiers
```
propre-eco-assistant/
│
├── index.html                 # Page d'accueil
├── pointeuse.html             # Système de badges
├── heures.html                # Gestion heures
├── dashbord.html              # Tableau de bord admin
├── Feuilles.html              # Gestion feuilles
├── Generateur_feuilles.html   # Générateur
├── Specifique.html            # Chantiers spécifiques
├── signaler.html              # Signalements
├── voir.html                  # Visualisation
│
├── styles.css                 # Styles globaux
├── app.js                     # Logique principale
├── badge.js                   # Système badges
│
├── manifest.json              # PWA manifest
├── service-worker.js          # Service worker
│
├── img/                       # Images et logos
│   └── logo.png
│
└── README.md                  # Ce fichier
```

### Structure Firebase

```
Firestore Collections:
│
├── employees/                 # Collection employés
│   ├── {employeeId}/
│   │   ├── weeks/            # Sous-collection semaines
│   │   │   └── {weekId}/     # Document par semaine
│   │   │       ├── days[]    # Tableau jours
│   │   │       └── kilometrage
│   │   └── projects/         # Sous-collection projets
│   │       └── data/         # Document projets
│   │           └── data[]    # Tableau chantiers
│
├── photos_chantiers/         # Collection photos
│   └── {photoId}/
│       ├── chantier
│       ├── description
│       ├── agent
│       ├── photos[]
│       └── createdAt
│
└── signalements/             # Collection signalements
    └── {signalementId}/
        ├── type
        ├── description
        ├── photos[]
        └── createdAt
```

### LocalStorage

```javascript
// Clés utilisées
{
  "favoriteEmployee": "Dylan",           // Employé favori
  "savedEmployeeSession": {              // Session auto-login
    "employeeId": "dylan",
    "employeeName": "Dylan",
    "timestamp": 1732562400000
  }
}
```

---

## 🔒 Sécurité

### Authentification
- Codes PIN à 4 chiffres par employé
- Code admin pour tableau de bord
- Sessions avec expiration (30 jours)
- Aucun mot de passe stocké en clair

### Données
- Firebase Security Rules configurables
- Validation côté client et serveur
- Chiffrement des communications (HTTPS)
- LocalStorage pour sessions uniquement

### Bonnes pratiques
- ✅ Ne pas activer connexion auto sur appareils partagés
- ✅ Déconnexion manuelle disponible
- ✅ Expiration automatique des sessions
- ✅ Codes PIN personnels et confidentiels

---

## 📱 Responsive Design

### Breakpoints
- **Mobile** : < 768px
  - Navigation hamburger
  - Tableaux en mode carte
  - Boutons et inputs agrandis (min 44-48px)
  - Layout vertical optimisé
  
- **Tablette** : 768px - 1024px
  - Grille 2 colonnes
  - Navigation horizontale
  - Espacement équilibré

- **Desktop** : > 1024px
  - Grille 3-4 colonnes
  - Sidebar navigation
  - Espace maximisé

### Mode Mobile Optimisé
- **Tableaux responsive** avec affichage en cartes
- **Labels automatiques** pour chaque champ
- **Boutons tactiles** (min 44px pour Apple HIG)
- **Inputs agrandis** (min 44px de hauteur)
- **Zones de clic généreuses**
- **Scroll fluide** avec momentum

---

## 🎨 Personnalisation

### Couleurs (CSS Variables)
```css
:root {
    --primary: #10b981;        /* Vert Propre Eco */
    --primary-dark: #059669;   /* Vert foncé */
    --primary-light: #d1fae5;  /* Vert clair */
    --secondary: #f59e0b;      /* Orange */
    --accent: #8b5cf6;         /* Violet */
    --text: #1f2937;           /* Gris foncé */
    --border: #e5e7eb;         /* Gris clair */
}
```

### Employés
Modifier dans `pointeuse.html` :
```javascript
const employees = [
    { 
        name: "Prénom",
        sheet: "URL_GOOGLE_SHEETS",
        code: "1234",
        id: "prenom"
    },
    // Ajouter d'autres employés...
];
```

### Codes d'accès
- **Employés** : Variable `code` dans tableau employees
- **Admin** : Fonction `validateCode()` dans dashbord.html

---

## 🐛 Dépannage

### Problèmes courants

#### La connexion auto ne fonctionne pas
- ✅ Vérifier que le profil est bien en favori (étoile pleine)
- ✅ S'assurer que le code a été validé avec succès
- ✅ Vérifier dans DevTools > Application > LocalStorage
- ✅ Session expire après 30 jours

#### Les données ne se sauvegardent pas
- ✅ Vérifier la connexion internet
- ✅ Console navigateur pour voir erreurs Firebase
- ✅ Règles Firebase configurées correctement
- ✅ Cliquer sur "Enregistrer" avant de quitter

#### Le service worker ne fonctionne pas
- ✅ L'app doit être servie en HTTPS (sauf localhost)
- ✅ Vider le cache et recharger
- ✅ Vérifier les erreurs dans DevTools > Application

#### Les photos ne s'affichent pas
- ✅ Vérifier les URLs ImgBB
- ✅ Connexion internet active
- ✅ CORS configuré correctement

---

## 📈 Évolutions futures

### En cours de développement
- [ ] Authentification Firebase Auth
- [ ] Notifications push
- [ ] Export Excel des données
- [ ] Graphiques et statistiques avancées
- [ ] Mode hors ligne complet
- [ ] Synchronisation automatique

### Améliorations UX
- [ ] Dark mode
- [ ] Choix de durée de session (7/15/30 jours)
- [ ] Biométrie (empreinte/Face ID)
- [ ] Multi-langue (FR/EN)
- [ ] Tutoriel interactif

### Fonctionnalités métier
- [ ] Planning hebdomadaire
- [ ] Gestion des congés
- [ ] Calcul automatique paie
- [ ] Géolocalisation chantiers
- [ ] Scanner QR codes

---

## 👥 Contribution

### Comment contribuer
1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

### Guidelines
- Code propre et commenté
- Respect du style existant
- Tests sur mobile et desktop
- Documentation des nouvelles fonctionnalités

---

## 📄 Changelog

### Version 2.0.0 (Novembre 2024)

#### 🚀 Nouvelles fonctionnalités
- ✨ Connexion automatique pour profils favoris
- ✨ Filtre par description sur photos chantiers
- ✨ Modal carrousel complètement refondue
- ✨ Bouton déconnexion sur page heures
- ✨ Messages d'alerte "Pensez à enregistrer"

#### 🎨 Améliorations UX
- 📱 Mode mobile drastiquement amélioré
- 📱 Tableaux responsive avec mode carte
- 📱 Boutons et inputs agrandis (44-48px)
- 🎨 Modal galerie moderne et fluide
- 🎨 Support navigation clavier complète

#### 🐛 Corrections
- ✏️ Tous les accents corrigés (é, è, à...)
- 🔧 Incrémentation heures passée à 0.25
- 🔧 Tableau chantiers avec saisie manuelle
- 🔧 Calcul automatique des totaux

---

## 📞 Support

Pour toute question ou problème :
- 📧 Email : support@propreeco.fr
- 🐛 Issues : GitHub Issues
- 💬 Chat : [Lien vers support]

---

## 📜 Licence

Ce projet est sous licence privée - © 2024 Propre Eco

Tous droits réservés. Utilisation commerciale interdite sans autorisation.

---

## 👏 Remerciements

- **Équipe Propre Eco** - Pour les retours et tests
- **Firebase** - Pour l'infrastructure backend
- **Font Awesome** - Pour les icônes
- **ImgBB** - Pour l'hébergement d'images
- **Communauté PWA** - Pour les bonnes pratiques

---

## 🎯 Roadmap

### Q4 2024
- [x] Connexion automatique
- [x] Amélioration UX mobile
- [x] Refonte modal galerie
- [ ] Mode hors ligne

### Q1 2025
- [ ] Notifications push
- [ ] Dark mode
- [ ] Planning intégré
- [ ] Export Excel

### Q2 2025
- [ ] Application native iOS/Android
- [ ] Géolocalisation
- [ ] Scanner QR codes
- [ ] API REST publique

---

<div align="center">

**Développé avec ❤️ par Ashborn**

[🌿 Propre Eco](https://propreeco.fr) | [📧 Contact](mailto:contact@propreeco.fr)

⭐ N'oubliez pas de mettre une étoile si vous aimez ce projet !

</div>