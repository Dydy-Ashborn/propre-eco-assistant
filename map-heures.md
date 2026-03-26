# ⏱️ MODULE MÉTIER & HEURES

## heures.js (Saisie Temps)
- `loadWeekData()` : Charge les heures de la semaine via `getWeekString`.
- `saveWeeklyData()` : **LOGIQUE CRITIQUE** : Sauvegarde + Blocage si saisie sur jour futur (via `getWeekStartDate`).
- `addProjectRow()` : Ajout dynamique de ligne projet.
- `checkSamediRappel()` : Modale rappel repos (sessionStorage).

## devis.js & voir.js
- `setupPhotoPreview()` : Gestion UI photos devis.
- `uploadPhotos()` : Bulk upload ImgBB.
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