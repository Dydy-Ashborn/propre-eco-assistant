# 🗺️ INDEX DU PROJET
> Global Map pour orientation rapide.

## 📂 STRUCTURE DES MODULES
- **Core & Admin** : `dashboard.js`, `dashbord-copro.js`, `firebase-copro.js`, `badge.js`, `navbar.js`, `update-modal.js`.
- **Saisie Terrain** : `Feuilles.js`, `signaler.js`, `Specifique.js`, `pointeuse.js`.
- **Métier & Heures** : `heures.js`, `devis.js`, `voir.js`.
- **Système** : `utils.js`, `announcements.js`, `service-worker.js`, `sw-update.js`.

## 📄 PAGES HTML & CSS
- Saisie : `index.html`, `Feuilles.html`, `signaler.html`, `Specifique.html`, `pointeuse.html`.
- Admin : `dashbord.html`, `devis.html`, `voir.html`, `heures.html`.
- PWA : `sw-update.js` — À inclure avant `</body>` dans tous les HTML.
- **Planning PWA** (`index.html`) : Card planning du jour chargée au démarrage via `chargerPlanningDuJour()`. Lit `localStorage.favoriteEmployee` → normalise → cherche `plannings/{today}` dans Firestore. Affiche chantiers solo + sections binômes. Annotations en rouge, badge contrôle jaune. Bouton "Voir les prochains jours" → modale `ouvrirProchainsJours()` qui charge tous les plannings futurs filtrés par employé. `renderChantierLigne()` et `buildChantiersHTML()` sont des fonctions utilitaires partagées entre les deux vues. `extraireAnnotationPWA()` supprimée — annotations lues directement depuis `c.annotations[]`.
- **Onglet Planning dashboard** (`dashbord.html`) : Tab `planning` dans la barre d'onglets. Section avec panneau import (paste Excel + bouton "Vérifier et annoter") + liste paginée des plannings avec recherche et filtre par mois.

## 🎨 CSS NOTES
- `base.css` → `body` : `overflow-x: hidden` (fix scroll horizontal mobile).
- `devis.css` → `.form-row` : `minmax(min(250px, 100%), 1fr)` (fix débordement grille).
- `responsive.css` → Copro mobile : grille 2 col `minmax(0, 1fr)` + counter-btn réduits pour `#viewCoproUnique`, `#viewCoproMultiple`, `#viewCoproSimilaire`.
- `heures.html` → `#saisieInterditeModal` : modale générique rouge pour saisie interdite (futur) ou modification impossible (trop ancien). Contenu injecté dynamiquement par `loadWeekDataAuto()`.