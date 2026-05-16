# 🏗️ MODULE CORE & ADMIN

## dashboard.js (Gestion Centrale)
- `init()` : Auth + Setup UI.
- `loadCurrentTab()` : Dispatcher vers onglets (Overview, Feuilles, Photos, Signalements, Heures, Devis).
- `createAndShowGalleryModal()` : Système de galerie photo global.
- `saveAnnonce()` : Upload ImgBB + Firestore.
- `openChiffrageModal(devisId)` : Charge le devis Firestore, détecte `typeDevis` et dispatch vers `generateChiffrageRowsCopro` ou `generateChiffrageRowsBureau` ou lignes fin de chantier. Injecte les données existantes si `status === 'chiffre'`. Pour les devis copro/multiple/similaire, injecte un bloc fréquence (`#copro-frequence`) au-dessus du tableau.
- `generateChiffrageRows(devis)` : Dispatcher — détecte `typeDevis` et appelle `generateChiffrageRowsCopro` ou `generateChiffrageRowsBureau`, sinon génère les lignes fin de chantier standard.
- `generateChiffrageRowsCopro(devis)` : Génère lignes copro unique/similaire/multiple. Similaire : inject ligne multiplicateur `.calc-nb-batiments`. Multiple : une ligne header par bâtiment via `devis.sections[]`.
- `generateCoproLignes(details, batIndex, taux)` : Génère les lignes d'un bâtiment copro. Escaliers : lit `etagesTempsMn[]` (nouveau format, 1 ligne par étage) avec fallback `escaliersMnParEtage × nbEtages` pour rétrocompat. Lignes communs : hall, escaliers par étage, ascenseur, local poubelle, local vélos, accès -1, caves. Garages/moquettes/conso en prix fixe.
- `generateChiffrageRowsBureau(devis)` : Génère lignes bureau par section (accueil, showroom, sanitaires, vitres) + trajet. Chaque ligne a `.calc-freq` pour la fréquence mensuelle.
- `calculerTotalDevis()` : Calcule le total HT/TTC/temps. Gère `.calc-prix-fixe` (copro prix fixe), `.calc-freq` (bureau fréquence par ligne), `.calc-nb-batiments` (multiplicateur similaire), `#copro-frequence` (fréquence globale copro appliquée en dernier).
- `downloadDevisPDF()` : Génération PDF via `generateDevisInfos`.
- `renderSignalements()` : Bouton "Afficher plus" sur `.chantier-meta` — détection DOM `scrollWidth > clientWidth` + toggle classe `expanded`.
- `renderPhotosChantiers()` : Même logique bouton "Afficher plus" — remplace `toggleMetaDesc` + détection DOM.
- `renderSignalements()` : Badge rappel coloré (orange=aujourd'hui, rouge=passé, vert=fait). Bordure gauche orange si rappel J. Bouton cloche → `ouvrirRappelModal`, bouton ✓ → `marquerRappelFait`.
- `ouvrirRappelModal(id, collection, currentDate)` : Modale date picker pour poser/modifier/supprimer un rappel sur signalement ou consommable.
- `sauvegarderRappel(id, col)` : `updateDoc` avec `rappelDate` + reset `rappelFait:false`.
- `marquerRappelFait(id, col)` : `updateDoc rappelFait:true` + reload.
- `showFacturationView()` / `hideFacturationView()` : Affiche/masque la vue facturation dans l'onglet Heures. `hide` vide aussi le innerHTML du container pour forcer un re-render propre au prochain appel. `switchTab('heures')` fait la même chose pour reset la vue si on navigue via les onglets.
- `loadFacturationData()` : Interroge `employees/{id}/weeks/{week}` pour tous les employés en parallèle (SDK modular `getDoc`/`doc`). Render le shell si absent du DOM, sinon spinner sur `#fact-cards` uniquement (préserve le focus des filtres). Debounce 400ms sur le champ recherche via `factSearchTimeout`.
- `groupChantiers(passages[])` : Deux règles de regroupement — (1) même date + 2+ mots significatifs en commun → `uncertain:false` ; (2) distance Levenshtein ≤ 0.3 → `uncertain:true`. Résultat trié par `totalH` desc.
- `STOPWORDS` : Set de mots ignorés pour le calcul des mots significatifs (articles, prépositions, termes génériques : ext, parking, int, bat, hall, cave…).
- `formatHeuresFactu(h)` : Affiche les heures sans zéro inutile — entier → `"9h"`, 1 décimale → `"8.5h"`, 2 décimales → `"1.75h"`.
- `renderFacturationShell()` : Injecte header + filtres (semaine, employé, recherche) + stats + container cards. Réutilise les classes `heures-filters`, `heures-stats-grid`, `heures-stat-card` du module heures.
- `renderFacturationCards()` : Tableau `heures-emp-table` — colonnes Chantier, Date(s), Passages, Total heures, Détail par employé. Badge cliquable "Regroupé (N noms)" / "⚠ Incertain" qui toggle un div avec les variantes de noms. Détail employé toujours visible inline.

## TEMPS_DEFAUT
- Vitres Standard : 3 min, Baies Vitrées : 4 min, Vélux : 5 min, Portes vitrées : 3 min, Vitres Hautes : 5 min.
- Grattage : temps × 2 appliqué dynamiquement dans `generateChiffrageRows`.

## dashboard.css
- `.btn-show-more` : Style chip/badge arrondi vert, `display:none` par défaut, affiché via JS inline.
- `.chantier-meta.expanded` : `white-space: normal; overflow: visible; text-overflow: unset`.
- `.chantier-name` : `white-space: normal; font-weight: 700` — wrap naturel sur mobile.

## dashboard-copro.js (Gestion Copropriétés)
- `loadCopros()` : Charge via `getAllCoproprietes`.
- `handleSubmit()` : Create/Update copro — `nom` et `adresse` obligatoires, `code` optionnel (clé ou code selon le cas).
- `confirmDeleteCopro()` : Exposée via `window.confirmDeleteCopro` uniquement — pas de déclaration locale en doublon.
- `renderCopros()` : Affichage grille avec badges complétude.

## badge.js & announcements.js
- `NotificationService` : Écoute Firestore temps réel pour badge.
- `showPopupIfNeeded()` : Carousel d'annonces (localStorage sync).
- `displayPopup(annonce)` : Crée la modale, injecte carousel photos. Timer 5s bloquant avant fermeture — flag `_timerDone` posé sur l'objet à l'expiration. Tant que `_timerDone === false`, tout appel à `closePopup` est bloqué (bouton ✕, Escape, bouton footer).
- `closePopup(announcementId)` : Guard `if (!this._timerDone) return` — bloque la fermeture pendant le countdown. Retire la popup + `dismissAnnouncement` + chaîne vers l'annonce suivante.
- `_timerDone` : Flag booléen remis à `false` à chaque `displayPopup`, passé à `true` après les 5s du `setInterval`.

## firebase-copro.js (Accès Firestore Copros)
- `addCopropriete()` : Utilise `addDoc` (ID auto Firestore) — jamais `setDoc` pour éviter écrasement silencieux.
- `getAllCoproprietes()` : Query ordonnée par `nom`.
- `getCoproByCode()` : Recherche linéaire sur collection complète — usage rare uniquement.
- `updateCopropriete()` / `deleteCopropriete()` : Opérations standard par ID Firestore.