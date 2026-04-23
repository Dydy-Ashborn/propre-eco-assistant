# 📱 MODULE TERRAIN & PWA

## Feuilles.js & signaler.js & Specifique.js
- `domContentLoadedHandler()` : Init forms.
- `compressImageSmart()` : Compression Canvas (fit/draw).
- `formSubmitHandler()` : Envoi Firestore + Modales succès/erreur.
- `selectProperty()` : Liaison avec `loadProperties` (CSV/Firestore).
- `photoInput.change` : Compression + affichage stats dans `#compressionInfo` (Ko original → compressé, ratio %).

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