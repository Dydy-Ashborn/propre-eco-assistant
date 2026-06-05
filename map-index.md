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
  - `_verifierFiches(slugs[])` : vérifie en batch via `getDoc` si chaque fiche existe dans `fiches/{slug}` → révèle les `.btn-fiche-pwa[data-slug]` correspondants. Cache local `_fichesCache{}` évite les requêtes répétées.
  - `_slugFiche(nom)` / `_isFicheEligible(nom)` / `_extraireSlugs(chantiers[])` : helpers slug / filtre copro / extraction slugs uniques.
  - `ouvrirFichePWA(slug, nomChantier)` : bottom-sheet PWA — charge `fiches/{slug}`, affiche adresse (Google Maps + Plans), texte libre, tâches cochables avec compteur, carrousel photos scroll horizontal. Boutons `.btn-fiche-pwa` masqués par défaut, révélés async après vérification Firestore.
  - `window.toggleTacheFiche(slug, index, checked, employeId)` : coche/décoche tâche → patch Firestore + update compteur DOM.
  - `window._ouvrirPhotoFiche(url)` : viewer plein écran backdrop noir.
- **Onglet Planning dashboard** (`dashbord.html`) : Tab `planning` dans la barre d'onglets. Section avec panneau import (paste Excel + bouton "Vérifier et annoter") + liste paginée des plannings avec recherche et filtre par mois.

## 🎨 CSS NOTES
- `base.css` → `body` : `overflow-x: hidden` (fix scroll horizontal mobile).
- `base.css` → Safe area iOS : `.header` `padding-top: env(safe-area-inset-top)` · `.bottom-nav` `padding-bottom + height` avec `env(safe-area-inset-bottom)` · `.speed-dial` `bottom: calc(80px + env(safe-area-inset-bottom))`. Nécessite `viewport-fit=cover` (déjà présent dans tous les HTML).
- `devis.css` → `.form-row` : `minmax(min(250px, 100%), 1fr)` (fix débordement grille).
- `responsive.css` → Copro mobile : grille 2 col `minmax(0, 1fr)` + counter-btn réduits pour `#viewCoproUnique`, `#viewCoproMultiple`, `#viewCoproSimilaire`.
- `heures.html` → `#saisieInterditeModal` : modale générique rouge pour saisie interdite (futur) ou modification impossible (trop ancien). Contenu injecté dynamiquement par `loadWeekDataAuto()`.