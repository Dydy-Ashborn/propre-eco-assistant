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