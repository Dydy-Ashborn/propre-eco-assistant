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