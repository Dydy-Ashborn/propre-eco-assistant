# ⏱️ MODULE MÉTIER & HEURES

## heures.js (Saisie Temps)
- `loadWeekData()` : Charge les heures de la semaine via `getWeekString`.
- `saveWeeklyData()` : **LOGIQUE CRITIQUE** : Vérifie `data-date` sur chaque `<tr>` — bloque si jour futur (modale `#futurInterdictionModal`) ou si `rowDate < today - 1` (trop ancien). Utilise `merge:true`.
- `addProjectRow()` : Ajout dynamique de ligne projet.
- `checkSamediRappel()` : Modale rappel repos (sessionStorage).
- `loadWeekDataAuto()` : Calcule les dates de la semaine depuis `YYYY-Www` en **heure locale** (pas UTC) et pose `data-date` sur chaque `<tr>`. Charge Firestore. Verrouille (`disabled` + `opacity:0.4`) les inputs hors fenêtre (aujourd'hui + hier uniquement). Pose un `div` overlay par-dessus chaque input verrouillé pour intercepter les clics et afficher la modale `#saisieInterditeModal` (rouge — message différent selon futur ou trop ancien).

## heures.html — UI redesign 2026
- **Pas de `heures.js` séparé** : tout le JS est inline dans `heures.html` (compat SDK compat Firebase).
- **Header** : supprimé. Remplacé par une barre verte 4px sticky. Infos employé dans la `user-info-card`.
- **`user-info-card`** : avatar vert initiales, nom, widget compteur `#compteurWidget` (cliquable → `ouvrirHistoriqueCompteurHeures()`), bouton déconnexion `#logoutBtn`.
- **`week-card`** : sélecteur semaine `#weekInput` + total pill `#totalWeeklyHours`.
- **`#weeklyTable tbody tr`** : rendu en flex row via CSS — col1 jour+date (`day-date-sub` injectée dynamiquement), col2 input heures 62×46px, col3 textarea flex:1, col4 boutons Repos/Férié 34×32px. Classe `row-today` ajoutée par JS sur le tr du jour courant (barre verte top + bordure verte).
- **`loadWeekDataAuto()`** : pose `data-date` + `.day-date-sub` (JJ/MM) sur chaque `<tr>`. Ajoute `.row-today` si `rowDate === today`. Verrouille inputs hors fenêtre via `pointerEvents:none` + overlay `.lock-overlay` → modale `#saisieInterditeModal`.
- **`saveWeeklyData()`** : **LOGIQUE CRITIQUE** — vérifie `data-date` sur chaque `<tr>`, bloque futur (`#futurInterdictionModal`) et trop ancien. Préserve les jours verrouillés depuis Firestore. Admin `dylan` bypass toutes les restrictions. `merge:true`.
- **`checkSamediRappel()`** : modale rappel repos (sessionStorage, 1×/jour).
- **`chargerCompteurEmploye()`** : charge `compteurHeures` depuis Firestore, colorise le widget (vert/rouge/gris).
- **`ouvrirHistoriqueCompteurHeures()`** : modale dynamique avec solde + historique `compteurHistorique` (20 derniers mouvements).
- **Modale chantier spécifique** `#modaleChantier` : bottom-sheet (border-radius top, handle, backdrop). Ouverte par `ouvrirModaleChantier(index?)`. Création + édition dans la même modale. Sauvegarde via `sauvegarderModaleChantier()` → Firestore `merge:true`.
- **`editProject(index)`** : délègue à `ouvrirModaleChantier(index)` — pré-remplit les champs depuis Firestore.
- **`deleteProject(index)`** : splice + `setDoc merge:true`.
- **`displaySavedProjects()`** : chaque chantier = flex row inline — nom+date à gauche, total pill, btn Modifier, btn corbeille.
- **CSS clés** : `#weeklyTable tbody tr` → `display:flex`, 4 cols fixes. `.row-today::before` → barre verte 3px. `.day-date-sub` → date JJ/MM sous le nom du jour. Tous les styles hardcodés (pas de CSS variables mode sombre).

## devis.js & voir.js
- `setupPhotoPreview()` : Gestion UI photos devis.
- `uploadPhotos()` : Bulk upload ImgBB.
- `renderEtages(prefix)` : Génère dynamiquement N inputs "Étage X (min)" sous le champ `nbEtages`. Préfixes : `copro`, `sim`, `multi`. Exposée via `window.renderEtages`.
- `lireEtagesTempsMn(prefix)` : Lit le tableau des temps par étage depuis les inputs dynamiques. Retourne `number[]`. Utilisé dans les 3 submit handlers copro.
- `load()` : Affichage photos chantiers.
- `deleteSelected()` : Nettoyage ImgBB + Firestore.
- `calculerRecapCopro()` : Recalcul dynamique — communs (min→h×taux), garages (m²×prixM2 modifiable), moquettes (m²×prixM2 + min×taux), consommables (qty×prixUnit modifiable par ligne). Met à jour sous-totaux inline + récap HT/TTC.
- `renderBatiments()` : Génère dynamiquement la liste d'inputs noms de bâtiments selon `sim-nbBatiments`. Conserve les valeurs existantes.
- `modifierNbBatiments(delta)` : Incrémente/décrémente le compteur (min 1) + appelle `renderBatiments`. Exposé sur `window`.
- Submit `#devisCoproSimilaireForm` : Calcul par bâtiment × `nbBatiments` = `totalHT`. Persiste `batiments: {nb, noms[]}` + `detailsCopro` + `totalHTparBatiment` dans Firestore. `typeDevis: 'copro-similaire'`.
- Submit `#devisCoproForm` : Persiste `prixM2` garage/moquette + `prixUnit` par consommable dans Firestore (`detailsCopro`).
## devis.js
- `devisNavigate(view)` : Affiche la vue cible, masque toutes les autres. Exposé sur `window`.
- Login `#devisLoginForm` : Vérifie `DEVIS_PASSWORD = '1992'`, affiche `#devisContent` + navigue vers `hub`.
- `DOMContentLoaded` : Init counter-btn (+/-) avec dispatch `change`. Branche `calculerRecapCopro` sur tous les `input[type=number]` de `#viewCoproUnique` (events `change` + `input`).
- `calculerRecapCopro()` : Recalcul silencieux des totaux copro (communs, garages m², moquettes m²+temps, trajet, consommables qty×prixUnit). Exposé sur `window`. Pas d'affichage DOM — chiffrage différé au dashboard.
- Submit `#devisCoproForm` : Persiste `detailsCopro` complet dans Firestore (`communs`, `garages`, `moquettes`, `trajet`, `consommables` avec `prixUnit` par ligne). Taux défaut **37.30 €/h**. `showNotification` → redirect `index.html`.
- Submit `#devisForm` : Fin de chantier — upload ImgBB photos + persist Firestore. `showNotification` → redirect `index.html`.
- `setupPhotoPreview(inputId, previewId)` : Accumule fichiers dans `filesArray`, reconstruit `FileList` via `DataTransfer`, affiche previews avec bouton suppression.
- `uploadPhotos(files)` : Bulk upload ImgBB, retourne `[{url, delete_url, name}]`.
- `showNotification(message, type)` : `success` → masque loading + affiche `#successOverlay`. `error` → alert.
## devis.js
- `devisNavigate(view)` : Affiche la vue cible, masque toutes les autres. Reset `devisMultipleData` si on quitte `copro-multiple`. Exposé sur `window`.
- Login `#devisLoginForm` : Vérifie `DEVIS_PASSWORD = '1992'`, affiche `#devisContent` + navigue vers `hub`.
- `DOMContentLoaded` : Init counter-btn (+/-) avec dispatch `change`. Branche `calculerRecapCopro` sur inputs `#viewCoproUnique`. Branche `#btn-ajouter-batiment` → `multiAjouterBatiment`. Branche `#btn-multi-retour` → `multiConfirmRetour`. Init `renderBatiments()`.
- `calculerRecapCopro()` : Recalcul silencieux copro unique. Exposé `window`. Pas d'affichage DOM — chiffrage différé au dashboard.
- Submit `#devisCoproForm` : Copro unique → persist Firestore `typeDevis:'copro'` + `detailsCopro` complet. Taux défaut 37.30 €/h.
- `multiLireBatiment()` : Lit tous les inputs `multi-*`, calcule totaux, retourne objet bâtiment avec `totalHT/TTC`.
- `multiResetForm()` : Remet à zéro les inputs `multi-*` (prix unitaires remis aux valeurs par défaut).
- `multiMettreAJourSummary()` : Affiche/masque `#multi-batiments-summary`, liste bâtiments avec total cumulé HT.
- `multiAjouterBatiment()` : Valide nom, push dans `devisMultipleData`, reset form, scroll haut. Exposé `window`.
- `multiSupprimerBatiment(index)` : Splice `devisMultipleData` + refresh summary. Exposé `window` (appelé via innerHTML dynamique).
- `multiConfirmRetour()` : Confirm si données en cours, reset + navigate `copro-hub`. Exposé `window`.
- Submit `#devisCoproMultipleForm` : Fusionne bâtiment en cours + `devisMultipleData` → `sections[]`. Persist Firestore `typeDevis:'copro-multiple'` avec `totalHT` cumulé.
- `renderBatiments()` : Génère liste d'inputs noms bâtiments selon `sim-nbBatiments`. Conserve valeurs existantes.
- `modifierNbBatiments(delta)` : Incrémente/décrémente compteur (min 1) + appelle `renderBatiments`. Exposé `window`.
- Submit `#devisCoproSimilaireForm` : Calcul par bâtiment × `nbBatiments` = `totalHT`. Persist `batiments:{nb, noms[]}` + `detailsCopro` + `totalHTparBatiment`. `typeDevis:'copro-similaire'`.
- Submit `#devisForm` : Fin de chantier — upload ImgBB photos + persist Firestore. Redirect `index.html`.
- `setupPhotoPreview(inputId, previewId)` : Accumule fichiers dans `filesArray`, reconstruit `FileList` via `DataTransfer`, affiche previews avec bouton suppression.
- `uploadPhotos(files)` : Bulk upload ImgBB, retourne `[{url, delete_url, name}]`.
- `showNotification(message, type)` : `success` → masque loading + affiche `#successOverlay`. `error` → alert.
- Submit `#devisBureauForm` : Calcul `(mn/60) × qty × freq` par tâche → `totalHeuresMois × taux = totalHT`. Persist `detailsBureau` avec `taches`, `heuresMensuelles` par section. `typeDevis: 'bureau'`.

## voir.js
- `setupPhotoPreview()` : Gestion UI photos devis.
- `load()` : Affichage photos chantiers.
- `deleteSelected()` : Nettoyage ImgBB + Firestore.