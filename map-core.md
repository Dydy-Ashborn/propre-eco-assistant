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
- `initPlanningTab()` : Init onglet planning — remplit select mois, reset état, charge liste.
- `parserPlanningTexte(texte)` : Parse texte tabulé collé depuis Excel. Détecte date automatiquement depuis ligne "Prénom et son binôme / 24-mai". Distingue employés (via `PLANNING_EMPLOYEES` + pattern binôme) des chantiers. Zéro détection d'annotations (faite manuellement). Retourne `{ date, employes: { [prenom]: { total, chantiers[], absence, display } } }`.
- `afficherReviewDansModal(planning)` : Fonction réellement utilisée par `testerImportPlanning()` pour injecter la review in-place (body+footer de la modale existante). Chaque chantier a un bouton "+ Annotation" (champ rouge inline) et une case contrôle qualité (`fa-clipboard-check`). Détection binôme automatique via comparaison de noms de chantiers si `binomeDisplay`/`binome` absents. Utilise `formatHeuresFactu()` pour l'affichage des heures (format `0,25`/`0,5`/`1,5` — anciennement bug format `h`/`min` via un `formatH` local, corrigé). Fallback vers `afficherInterfaceReview(planning)` si `#import-modal-body`/`#import-modal-footer` absents du DOM.
- `afficherInterfaceReview(planning)` : Modale de vérification standalone — sert de fallback uniquement, plus le chemin principal d'affichage. Chaque chantier a un bouton "+ Annotation" (champ rouge inline) et une case contrôle qualité (`fa-clipboard-check`). Propagation automatique annotations + contrôle aux chantiers binômes via `trouverChantiersBinomes()`. Utilise `formatHeuresFactu()` pour l'affichage des heures. (`fa-clipboard-check`). Propagation automatique annotations + contrôle aux chantiers binômes via `trouverChantiersBinomes()`.
- `trouverChantiersBinomes(prenom, ci)` : Trouve les chantiers miroir d'un binôme (même nom de chantier, binôme = prenom).
- `publierPlanning(planning)` : Sauvegarde dans Firestore `plannings/{YYYY-MM-DD}` via `setDoc` (annule et remplace automatiquement). Envoie backup mail à `Dylan.propre.eco@gmail.com` via `mailto:`.
- `loadPlanning()` : Charge tous les docs `plannings/` triés par date desc. Remplit `allPlanningDocs` + `remplirSelectMois()`.
- `renderPlanningList()` : Affiche les plannings paginés (7/page). Cards employés avec annotations en rouge, badge contrôle jaune, badge binôme bleu. Highlight recherche. Filtre par mois via `window._planningMoisFilter`.
- `remplirSelectMois()` : Peuple le select de filtre avec les mois disponibles en base.
- `filtrerPlanningParMois(mois)` : Filtre la liste + affiche bouton "Supprimer ce mois".
- `supprimerPlanningsMois()` : Modale de confirmation → suppression en parallèle de tous les plannings du mois sélectionné.
- `PRENOM_DISPLAY` : Dictionnaire `id → nom affiché avec accents` pour tous les employés. Fallback quand `emp.display` absent (anciens plannings).
- `PLANNING_EMPLOYEES` : Liste des IDs employés normalisés pour détection parser.
- `formatHeuresFactu(h)` : Format décimal français — entier → `"2"`, décimal → `"1,5"` / `"1,25"`. Pas de suffixe `h`. Utilisé partout dans les tableaux heures, planning, facturation.
- `ouvrirModalImportPlanning()` : Ouvre une grande modale plein écran (max-width:960px, hauteur 100vh) avec textarea Excel. Étape 1 du flux import planning.
- `testerImportPlanning()` : Parse le texte collé via `parserPlanningTexte`, injecte la review directement dans la modale existante (body + footer remplacés in-place). Pas de modale séparée.
- `publierPlanningDepuisReview()` : Synchronise annotations depuis inputs DOM, anime le bouton `#btn-envoyer-planning` (spinner), appelle `publierPlanning`.
- `publierPlanning(planning)` : Sauvegarde Firestore `plannings/{date}`, appelle `envoyerNotifPlanning`, ferme `#modal-import-planning`, affiche `afficherModalPlanningPublie`. Plus d'envoi mail backup.
- `envoyerNotifPlanning(date, nbEmployes, employes, isUpdate)` : Envoie un ping ntfy par employé sur `planning-{prenom}`. Titre fixe `'Propre Eco Assistant'`. Corps : "Ton planning du {dateLabel} est disponible…" ou "…a été modifié…" selon `isUpdate`. Emoji saison en fin de message. Tag `calendar` (nouveau) ou `repeat` (annulé-remplacé). Pas de contenu du planning dans la notif — l'employé consulte PEA.
- `afficherModalPlanningPublie(date, nbEmployes)` : Grande modale animée (slideUp + scale + bounce icône) confirmant l'envoi — bandeau vert, stat employés, info ntfy, bouton "Parfait !".
- `envoyerNotifPlanning(date, nbEmployes, employes)` : Calcule `emojiSaison` en local depuis le mois. `formatH` local format décimal avec `h` suffixe pour le corps du message ntfy. Log console par topic.
- `renderPlanningList()` : Tri alpha des employés par `localeCompare('fr')`. `emojiSaison` calculé dans le `forEach` depuis `data.date`. Plannings triés par date asc.
- `getPlanningFiltered()` : Recherche normalisée sans accents (NFD) sur date (format FR + ISO + JJ/MM), prénom employé, chantier, annotation.
- `rechercherPlanning(term)` : Normalise le terme (NFD, lowercase) avant stockage dans `planningSearchTerm`.
- `initPlanningTab()` : Reset `planningEnCours = null` + appel `loadPlanning()`. Plus de référence à `planning-date-input` ni `planning-import-feedback`.
- `ouvrirModalImportPlanning()` : Après collage (`paste` event), la textarea est masquée et remplacée par un `div#planning-paste-preview` qui affiche le texte formaté — prénoms reconnus (via `PLANNING_EMPLOYEES`) mis en `<strong>` 1rem/700. `window._resetPlanningPaste()` permet de revenir à la textarea. La valeur de la textarea reste inchangée et est lue normalement par `testerImportPlanning()`.
- `publierPlanning(planning)` : Fait un `getDoc` avant le `setDoc` pour détecter si le planning existait déjà → passe `isUpdate` à `envoyerNotifPlanning`.Vous avez dit : refaisons un test de nouveau planning et un annule remplace sur dylan
- Vérification indisponibilités : si le planning est un sam/dim, lit `employees/{prenom}/indisponibilites/weekends` pour chaque employé non absent. Si conflit → `afficherPopupConflitIndispo(conflits, date)` et retour BLOQUANT (pas de publication).
- `afficherPopupConflitIndispo(conflits, planningDate)` : modale rouge listant les employés en conflit. Bouton "Retour au planning" uniquement — aucun moyen de forcer la publication.
- `publierPlanningDepuisReview()` (màj) : avant publication, si le planning est un sam/dim → lit `employees/{prenom}/indisponibilites/weekends` pour chaque employé non absent via `getDoc` modular. Si conflits → `afficherPopupConflitIndispo` + retour BLOQUANT. Sinon animation bouton + `publierPlanning`.
- `afficherPopupConflitIndispo(conflits[], planningDate)` : modale rouge (z-index 10000, backdrop blur) listant les employés en conflit. Bouton "Retour au planning" uniquement — publication impossible tant que non résolu.
- `chargerBandeauIndispos()` : lit `indisponibilites/weekends` pour tous les employés en parallèle. Filtre les 30 prochains jours. Groupe par date. Affiche dans `#bandeau-indispos` (haut de l'onglet planning) — cartes horizontales scrollables, badge SAM/DIM, liste des noms par date. Badge compteur total en rouge. Si aucune indispo → bandeau vert "Aucune indisponibilité".
- `initPlanningTab()` (màj) : appelle `chargerBandeauIndispos()` en plus de `loadPlanning()`.

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

## fiches/ (nouvelle collection Firestore)
- Document ID : slug normalisé du nom de chantier (ex: `fin-de-chantier-mieussy`)
- Champs : `nomChantier`, `slug`, `adresse`, `texteLibre`, `taches[]` (`{label, faite, faitePar, faiteAt}`), `photos[]` (`{url, delete_url}`), `updatedAt`
- Tâches partagées entre employés — liste globale, coches persistées en temps réel
- Dashboard : création/édition via `ouvrirModaleFiche(nomChantier)` depuis `afficherInterfaceReview`
- PWA : lecture + coches via `ouvrirFichePWA(slug, nomChantier)` depuis `renderChantierLigne`
- Détection chantier éligible : `estChantierFiche(nom)` — exclut mots-clés copro
- `ouvrirFichePWA(slug, nomChantier)` : bloc photos mis à jour — passe le tableau complet des URLs + index à `_ouvrirPhotoFiche` (au lieu d'une URL seule) pour bénéficier du carrousel navigable.