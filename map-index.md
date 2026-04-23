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

## 🎨 CSS NOTES
- `base.css` → `body` : `overflow-x: hidden` (fix scroll horizontal mobile).
- `devis.css` → `.form-row` : `minmax(min(250px, 100%), 1fr)` (fix débordement grille).
- `responsive.css` → Copro mobile : grille 2 col `minmax(0, 1fr)` + counter-btn réduits pour `#viewCoproUnique`, `#viewCoproMultiple`, `#viewCoproSimilaire`.
- `heures.html` → `#saisieInterditeModal` : modale générique rouge pour saisie interdite (futur) ou modification impossible (trop ancien). Contenu injecté dynamiquement par `loadWeekDataAuto()`.