# 🏗️ MODULE CORE & ADMIN

## dashboard.js (Gestion Centrale)
- `init()` : Auth + Setup UI.
- `loadCurrentTab()` : Dispatcher vers onglets (Overview, Feuilles, Photos, Signalements, Heures, Devis).
- `createAndShowGalleryModal()` : Système de galerie photo global.
- `saveAnnonce()` : Upload ImgBB + Firestore.
- `openChiffrageModal(devisId)` : Charge le devis Firestore, détecte `typeDevis` et dispatch vers `generateChiffrageRowsCopro` ou `generateChiffrageRowsBureau` ou lignes fin de chantier. Injecte les données existantes si `status === 'chiffre'`.
- `generateChiffrageRows(devis)` : Dispatcher — détecte `typeDevis` et appelle `generateChiffrageRowsCopro` ou `generateChiffrageRowsBureau`, sinon génère les lignes fin de chantier standard.
- `generateChiffrageRowsCopro(devis)` : Génère lignes copro unique/similaire/multiple. Similaire : inject ligne multiplicateur `.calc-nb-batiments`. Multiple : une ligne header par bâtiment via `devis.sections[]`.
- `generateCoproLignes(details, batIndex, taux)` : Génère les lignes d'un bâtiment copro (communs, garages prix fixe, moquettes, trajet, consommables). Lignes prix fixe utilisent `.calc-prix-fixe` au lieu de `.calc-temps`.
- `generateChiffrageRowsBureau(devis)` : Génère lignes bureau par section (accueil, showroom, sanitaires, vitres) + trajet. Chaque ligne a `.calc-freq` pour la fréquence mensuelle.
- `calculerTotalDevis()` : Gère `.calc-prix-fixe` (copro prix fixe), `.calc-freq` (bureau fréquence), `.calc-nb-batiments` (multiplicateur similaire) en plus des lignes standard.
- `downloadDevisPDF()` : Génération PDF via `generateDevisInfos`.
- `renderSignalements()` : Bouton "Afficher plus" sur `.chantier-meta` — détection DOM `scrollWidth > clientWidth` + toggle classe `expanded`.
- `renderPhotosChantiers()` : Même logique bouton "Afficher plus" — remplace `toggleMetaDesc` + détection DOM.

## TEMPS_DEFAUT
- Vitres Standard : 3 min, Baies Vitrées : 4 min, Vélux : 5 min, Portes vitrées : 3 min, Vitres Hautes : 5 min.
- Grattage : temps × 2 appliqué dynamiquement dans `generateChiffrageRows`.

## dashboard.css
- `.btn-show-more` : Style chip/badge arrondi vert, `display:none` par défaut, affiché via JS inline.
- `.chantier-meta.expanded` : `white-space: normal; overflow: visible; text-overflow: unset`.
- `.chantier-name` : `white-space: normal; font-weight: 700` — wrap naturel sur mobile.

## dashboard-copro.js (Gestion Copropriétés)
- `loadCopros()` : Charge via `getAllCoproprietes`.
- `handleSubmit()` : Create/Update copro.
- `confirmDeleteCopro()` : Suppression via `deleteCopropriete`.

## badge.js & announcements.js
- `NotificationService` : Écoute Firestore temps réel pour badge.
- `showPopupIfNeeded()` : Carousel d'annonces (localStorage sync).