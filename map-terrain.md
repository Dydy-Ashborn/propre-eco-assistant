# 📱 MODULE TERRAIN & PWA

## Feuilles.js & signaler.js & Specifique.js
- `domContentLoadedHandler()` : Init forms.
- `compressImageSmart()` : Compression Canvas (fit/draw).
- `formSubmitHandler()` : Envoi Firestore + Modales succès/erreur.
- `selectProperty()` : Liaison avec `loadProperties` (CSV/Firestore).
- `photoInput.change` : Compression + affichage stats dans `#compressionInfo` (Ko original → compressé, ratio %).
- Champ `#rappel-date` (optionnel) : date ISO persistée dans Firestore (`rappelDate`, `rappelFait:false`). Présent sur signalements et consommables.
- Card `#taches-du-jour` dans `index.html` : chargée au démarrage, affiche les rappels dont `rappelDate === today && !rappelFait`, via query parallèle sur `signalements` + `consommables`.

## pointeuse.js (PWA)
- `validateCode()` : Validation PIN + Enregistrement pointage.
- `loadEmployees()` : Liste depuis Firestore avec initiales.
- `registerServiceWorker()` : Setup mode offline/PWA.

## navbar.css & navbar.js (Bottom Nav)
- Remplace entièrement le sidebar hamburger — supprimé via `display:none !important`.
- `.bottom-nav` : fixed bottom, 64px, 3 zones (Accueil | FAB TERRAIN | Tableau de bord).
- `.fab-wrapper` : `flex-direction:column` — FAB centré dans la barre, pas de débordement.
- `.fab-btn` : 52px rond vert, `z-index:1010`. Classe `.open` → `rotate(45deg)`.
- `.speed-dial` : `position:fixed; flex-direction:row; justify-content:space-around` — ligne horizontale au-dessus de la nav (`bottom:80px`). 5 items : FEUILLES, SIGNALER, SPÉCIFIQUE, DEVIS, POINTEUSE.
- `.sd-icon` : 52px, `border-radius:16px`, blanc, `box-shadow` prononcé, icône verte.
- `.sd-label` : pill blanc `rgba(255,255,255,.85)` pour lisibilité sans fond sombre.
- `.speed-dial-overlay` : `display:none` — pas de fond sombre, items flottent directement.
- Animation : `transition-delay` échelonné 0→.16s gauche→droite.
- `toggleFab()` : déclaré en script inline `<script>` classique (non-module) dans chaque HTML pour éviter le timing issue avec `type="module"`.
- `setActiveNavItem(pageName)` : marque `.active` sur le tab correspondant à la page courante.
- Chemins `index.html` : `pages/xxx.html`. Chemins `pages/*.html` : `../pages/xxx.html`, accueil → `../index.html`.

## Collection `plannings/`
- Document ID : `YYYY-MM-DD` (ex: `2026-05-20`)
- Champs : `date`, `importedAt`, `source` (`'dashboard-paste'` ou `'gmail-auto'`), `employes`
- Structure `employes` : `{ [prenomNormalisé]: { total, absence, display, chantiers[] } }`
- Structure `chantiers[]` : `{ nom, heures, binome, binomeDisplay, annotations[], controle, absence }`
- Import auto : Google Apps Script (`planning-gmail-appscript.js`) — trigger Gmail toutes les heures sur mails de `propre.eco74@outlook.fr`
- Import manuel : Dashboard onglet Planning — paste Excel → review → publication
- Règles Firestore : `allow read, write: if true`

## index.js (PWA accueil)
- Section "Toutes mes copropriétés" supprimée du HTML — `propertiesList` et `showMoreBtn` mis à `null`, `displayProperties()` et `showLoadingState()` vidées. La recherche reste fonctionnelle via `searchResults` + `propertyDetails`.
- `showMessage` remplacé par `showNotification` dans le catch de `loadProperties`.
- `buildChantiersHTML(emp, allEmployes, employeId)` : Rendu chantiers d'un employé. 3 groupes : (1) chantiers purement solo, (2) chantiers sans binôme déclaré mais où d'autres employés ont le même chantier → détectés automatiquement via `getCollègues()`, label "Avec A, B…" (trinôme+), (3) chantiers avec binôme déclaré explicitement. `allEmployes` = `data.employes` du doc Firestore passé en param.
- `ouvrirProchainsJours()` : Refactorisé — helpers `fmtH`, `capFirst`, `fmtDate`, `renderLigne`, `renderGroupe`, `getCollègues`, `buildBody` déclarés en scope local. `buildBody` applique la même logique trinôme que `buildChantiersHTML`. Modale créée une seule fois, réutilisée si déjà présente.
- `PLANNING_ADMINS_VIEW` : liste de prénoms normalisés autorisés à voir le planning des autres employés (phase de test, whitelist manuelle).
- `ouvrirPlanningAutres()` : modale "Planning de l'équipe" — pills de jours (aujourd'hui + jours futurs ayant un planning en base) + liste accordéon par employé (nom + total replié, détail chantiers via `buildChantiersHTML` au clic). Bouton "Voir les autres" affiché en bas-gauche de la card planning (symétrique à "Voir les prochains jours"), visible uniquement si `employeId` ∈ `PLANNING_ADMINS_VIEW`.
- `_selectJourPlanningAutres(index)` : render du contenu accordéon pour le jour sélectionné, appelée au clic sur une pill.

- **Card Événement Jumping** (`index.html`) — DÉSACTIVÉE (événement terminé, réactivation prévue l'an prochain) :
  - `JUMPING_EVENT_ACTIVE = false` en haut d'`index.js` : flag unique contrôlant l'affichage. `initCardJumping()` fait un early return + `display:none` sur `#card-jumping` si `false`.
  - Toutes les données et fonctions conservées intactes pour réactivation : `JUMPING_PLANNING[]`, `JUMPING_LIEUX_DATA{}`, `initCardJumping()`, `afficherJourJumping()`, `ouvrirLieuJumping()`.
  - Réactivation l'an prochain : mettre `JUMPING_EVENT_ACTIVE = true`, mettre à jour les dates dans `JUMPING_PLANNING` et les données/photos dans `JUMPING_LIEUX_DATA`.
  
## Safe area iOS (base.css)
- `.header` : `padding-top: env(safe-area-inset-top)` — évite l'encoche iPhone.
- `.bottom-nav` : `padding-bottom: env(safe-area-inset-bottom)` + `height: calc(64px + env(safe-area-inset-bottom))`.
- `.speed-dial` : `bottom: calc(80px + env(safe-area-inset-bottom))` — FAB speed dial au-dessus de la nav safe area.
- Nécessite `viewport-fit=cover` dans le meta viewport (déjà présent dans tous les HTML).