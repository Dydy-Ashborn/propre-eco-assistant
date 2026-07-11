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
- **Card Événement Jumping** (`index.html`) : Card autonome sur l'accueil, indépendante du planning quotidien. Données 100% en dur dans le code (pas de collection Firestore dédiée) :
  - `JUMPING_PLANNING[]` : tableau des jours (`jour`, `date` ISO, `horaireGeneral`, `lieux[]` avec `id` + `horaire` optionnel par lieu, ex. VIP a des horaires spécifiques certains jours).
  - `JUMPING_LIEUX_DATA{}` : dictionnaire `id → {label, texteLibre, photos[]}` — un lieu (JURY, VIP, SECRETARIAT...) a un texte et des photos fixes, réutilisés sur tous les jours où il apparaît. Photos en chemin relatif `img/jumping/xxx.JPG` (attention à la casse exacte sur GitHub Pages, sensible contrairement au local).
  - `initCardJumping()` : Render de la card — thème vert anglais/or (identité concours équestre). Barre de progression (jours écoulés/total), détection auto du jour courant (`date === todayISO`) avec highlight doré + badge "AUJOURD'HUI" + point pulsé animé (`@keyframes jumpingPulse`). Jours passés grisés (`opacity:0.55`). Horaire général affiché directement sous chaque jour dans la liste.
  - `afficherJourJumping(idx)` : Bottom-sheet listant les lieux du jour sélectionné, cliquables.
  - `ouvrirLieuJumping(lieuId)` : Modale centrée (pas bottom-sheet) affichant texte + grille photos (1 colonne si 1 seule photo, 2 colonnes sinon) d'un lieu depuis `JUMPING_LIEUX_DATA`. Clic photo → `_ouvrirPhotoFiche`.
- `window._ouvrirPhotoFiche(urls, startIndex)` : Viewer plein écran mutualisé (fiches classiques + jumping). Accepte un tableau d'URLs + index de départ. Si plusieurs photos : flèches gauche/droite + compteur `X / N`, navigation via `window._photoViewerNav(dir)`. Bouton fermeture positionné avec `env(safe-area-inset-top)` pour respecter l'encoche mobile.

## Safe area iOS (base.css)
- `.header` : `padding-top: env(safe-area-inset-top)` — évite l'encoche iPhone.
- `.bottom-nav` : `padding-bottom: env(safe-area-inset-bottom)` + `height: calc(64px + env(safe-area-inset-bottom))`.
- `.speed-dial` : `bottom: calc(80px + env(safe-area-inset-bottom))` — FAB speed dial au-dessus de la nav safe area.
- Nécessite `viewport-fit=cover` dans le meta viewport (déjà présent dans tous les HTML).