import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { db } from './config.js';

// ── Constantes ───────────────────────────────────────
const DEVIS_PASSWORD = '1992';

const DEVIS_VIEWS = {
    'hub': 'viewHub',
    'fin-chantier': 'viewFinChantier',
    'copro-hub': 'viewCoproHub',
    'copro-unique': 'viewCoproUnique',
    'copro-multiple': 'viewCoproMultiple',
    'copro-similaire': 'viewCoproSimilaire',
    'bureau': 'viewBureau'

};

// ── Navigation ───────────────────────────────────────
function devisNavigate(view) {
    if (view !== 'copro-multiple') devisMultipleData = [];
    Object.values(DEVIS_VIEWS).forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });
    const target = document.getElementById(DEVIS_VIEWS[view]);
    if (target) {
        target.style.display = 'block';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}
window.devisNavigate = devisNavigate;

// ── Login ────────────────────────────────────────────
document.getElementById('devisLoginForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const password = document.getElementById('devisPasswordInput').value;
    const errorDiv = document.getElementById('devisLoginError');
    if (password === DEVIS_PASSWORD) {
        document.getElementById('devisLoginModal').style.display = 'none';
        document.getElementById('devisContent').style.display = 'block';
        errorDiv.style.display = 'none';
        devisNavigate('hub');
    } else {
        errorDiv.style.display = 'block';
        document.getElementById('devisPasswordInput').value = '';
        document.getElementById('devisPasswordInput').focus();
    }
});

// ── DOMContentLoaded ─────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.counter-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const inputId = this.dataset.input;
            const action = this.dataset.action;
            const input = document.getElementById(inputId);
            if (!input) return;
            const step = parseFloat(input.step) || 1;
            const min = parseFloat(input.min) ?? 0;
            let val = parseFloat(input.value) || 0;
            if (action === 'increase') {
                input.value = parseFloat((val + step).toFixed(10));
            } else if (action === 'decrease' && val > min) {
                input.value = parseFloat((val - step).toFixed(10));
            }
            input.dispatchEvent(new Event('change'));
        });
    });

    document.querySelectorAll('#viewCoproUnique input[type="number"]').forEach(input => {
        input.addEventListener('change', calculerRecapCopro);
        input.addEventListener('input', calculerRecapCopro);
    });

    renderBatiments();
});

// ── Recalcul Copro Unique ────────────────────────────
function calculerRecapCopro() {
    const taux = parseFloat(document.getElementById('copro-tauxHoraire')?.value) || 37.30;
    const hallMn = parseFloat(document.getElementById('copro-hall')?.value) || 0;
    const escaliersMn = parseFloat(document.getElementById('copro-escaliers')?.value) || 0;
    const nbEtages = parseFloat(document.getElementById('copro-nbEtages')?.value) || 0;
    const ascenseurMn = parseFloat(document.getElementById('copro-ascenseur')?.value) || 0;
    const poubelleMn = parseFloat(document.getElementById('copro-localPoubelle')?.value) || 0;
    const garageSurface = parseFloat(document.getElementById('copro-garageSurface')?.value) || 0;
    const garagePrixM2 = parseFloat(document.getElementById('copro-garagePrixM2')?.value) || 0.41;
    const moquetteSurface = parseFloat(document.getElementById('copro-moquetteSurface')?.value) || 0;
    const moquettePrixM2 = parseFloat(document.getElementById('copro-moquettePrixM2')?.value) || 3.62;
    const vapeurMn = parseFloat(document.getElementById('copro-moquetteVapeur')?.value) || 0;
    const shampoingMn = parseFloat(document.getElementById('copro-moquetteShampoing')?.value) || 0;
    const trajetMn = parseFloat(document.getElementById('copro-trajet')?.value) || 0;
    const qPoubelles = parseFloat(document.getElementById('copro-poubelles')?.value) || 0;
    const puPoubelles = parseFloat(document.getElementById('copro-poubelles-pu')?.value) || 8.95;
    const qSavon = parseFloat(document.getElementById('copro-savon')?.value) || 0;
    const puSavon = parseFloat(document.getElementById('copro-savon-pu')?.value) || 40.00;
    const qEssuie = parseFloat(document.getElementById('copro-essuieMain')?.value) || 0;
    const puEssuie = parseFloat(document.getElementById('copro-essuieMain-pu')?.value) || 11.00;
    const qJumbo = parseFloat(document.getElementById('copro-jumbo')?.value) || 0;
    const puJumbo = parseFloat(document.getElementById('copro-jumbo-pu')?.value) || 4.00;
}
window.calculerRecapCopro = calculerRecapCopro;

// ── Submit Copro Unique ──────────────────────────────
document.getElementById('devisCoproForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const loading = document.getElementById('loading');
    loading.style.display = 'flex';
    setTimeout(() => loading.classList.add('active'), 100);
    try {
        const taux = parseFloat(document.getElementById('copro-tauxHoraire').value) || 37.30;
        const hallMn = parseFloat(document.getElementById('copro-hall').value) || 0;
        const escaliersMn = parseFloat(document.getElementById('copro-escaliers').value) || 0;
        const nbEtages = parseFloat(document.getElementById('copro-nbEtages').value) || 0;
        const ascenseurMn = parseFloat(document.getElementById('copro-ascenseur').value) || 0;
        const localPoubelleMn = parseFloat(document.getElementById('copro-localPoubelle').value) || 0;
        const garageSurface = parseFloat(document.getElementById('copro-garageSurface').value) || 0;
        const garagePrixM2 = parseFloat(document.getElementById('copro-garagePrixM2').value) || 0.41;
        const moquetteSurface = parseFloat(document.getElementById('copro-moquetteSurface').value) || 0;
        const moquettePrixM2 = parseFloat(document.getElementById('copro-moquettePrixM2').value) || 3.62;
        const vapeurMn = parseFloat(document.getElementById('copro-moquetteVapeur').value) || 0;
        const shampoingMn = parseFloat(document.getElementById('copro-moquetteShampoing').value) || 0;
        const trajetMn = parseFloat(document.getElementById('copro-trajet').value) || 0;
        const qPoubelles = parseFloat(document.getElementById('copro-poubelles').value) || 0;
        const puPoubelles = parseFloat(document.getElementById('copro-poubelles-pu').value) || 8.95;
        const qSavon = parseFloat(document.getElementById('copro-savon').value) || 0;
        const puSavon = parseFloat(document.getElementById('copro-savon-pu').value) || 40.00;
        const qEssuie = parseFloat(document.getElementById('copro-essuieMain').value) || 0;
        const puEssuie = parseFloat(document.getElementById('copro-essuieMain-pu').value) || 11.00;
        const qJumbo = parseFloat(document.getElementById('copro-jumbo').value) || 0;
        const puJumbo = parseFloat(document.getElementById('copro-jumbo-pu').value) || 4.00;
        const totalCommunsMn = hallMn + (escaliersMn * nbEtages) + ascenseurMn + localPoubelleMn;
        const totalCommunsPrix = (totalCommunsMn / 60) * taux;
        const totalGarages = garageSurface * garagePrixM2;
        const totalMoquettesMn = vapeurMn + shampoingMn;
        const totalMoquettesPrix = ((totalMoquettesMn / 60) * taux) + (moquetteSurface * moquettePrixM2);
        const trajetPrix = (trajetMn / 60) * taux;
        const stPoubelles = qPoubelles * puPoubelles;
        const stSavon = qSavon * puSavon;
        const stEssuie = qEssuie * puEssuie;
        const stJumbo = qJumbo * puJumbo;
        const totalConso = stPoubelles + stSavon + stEssuie + stJumbo;
        const totalHT = totalCommunsPrix + totalGarages + totalMoquettesPrix + trajetPrix + totalConso;
        const totalTTC = totalHT * 1.20;
        const nomChantier = document.getElementById('copro-nomChantier').value;
        const remarques = document.getElementById('copro-remarques').value;
        await addDoc(collection(db, "devis"), {
            nomChantier, typeDevis: 'copro', remarques,
            detailsCopro: {
                tauxHoraire: taux,
                communs: { hallMn, escaliersMnParEtage: escaliersMn, nbEtages, ascenseurMn, localPoubelleMn, totalMn: totalCommunsMn, totalPrix: totalCommunsPrix },
                garages: { surface: garageSurface, prixM2: garagePrixM2, totalPrix: totalGarages },
                moquettes: { surface: moquetteSurface, prixM2: moquettePrixM2, vapeurMn, shampoingMn, totalMn: totalMoquettesMn, totalPrix: totalMoquettesPrix },
                trajet: { minutes: trajetMn, totalPrix: trajetPrix },
                consommables: { poubelles: { quantite: qPoubelles, prixUnit: puPoubelles, total: stPoubelles }, savon: { quantite: qSavon, prixUnit: puSavon, total: stSavon }, essuieMain: { quantite: qEssuie, prixUnit: puEssuie, total: stEssuie }, jumbo: { quantite: qJumbo, prixUnit: puJumbo, total: stJumbo }, totalConso }
            },
            totalHT, totalTTC, status: 'en_attente', dateCreation: serverTimestamp()
        });
        showNotification('Devis copro envoyé avec succès !', 'success');
        try { await fetch("https://ntfy.sh/signalement-propre-eco", { method: "POST", body: `📋 Nouveau devis COPRO !\n\n🏢 ${nomChantier}` }); } catch { }
        setTimeout(() => { window.location.href = '../index.html'; }, 3000);
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur : ' + error.message, 'error');
    }
});

// ── Copro Multiple — données ─────────────────────────
let devisMultipleData = [];

function multiLireBatiment() {
    const taux = parseFloat(document.getElementById('multi-tauxHoraire').value) || 37.30;
    const hallMn = parseFloat(document.getElementById('multi-hall').value) || 0;
    const escaliersMn = parseFloat(document.getElementById('multi-escaliers').value) || 0;
    const nbEtages = parseFloat(document.getElementById('multi-nbEtages').value) || 0;
    const ascenseurMn = parseFloat(document.getElementById('multi-ascenseur').value) || 0;
    const localPoubelleMn = parseFloat(document.getElementById('multi-localPoubelle').value) || 0;
    const garageSurface = parseFloat(document.getElementById('multi-garageSurface').value) || 0;
    const garagePrixM2 = parseFloat(document.getElementById('multi-garagePrixM2').value) || 0.41;
    const moquetteSurface = parseFloat(document.getElementById('multi-moquetteSurface').value) || 0;
    const moquettePrixM2 = parseFloat(document.getElementById('multi-moquettePrixM2').value) || 3.62;
    const vapeurMn = parseFloat(document.getElementById('multi-moquetteVapeur').value) || 0;
    const shampoingMn = parseFloat(document.getElementById('multi-moquetteShampoing').value) || 0;
    const trajetMn = parseFloat(document.getElementById('multi-trajet').value) || 0;
    const qPoubelles = parseFloat(document.getElementById('multi-poubelles').value) || 0;
    const puPoubelles = parseFloat(document.getElementById('multi-poubelles-pu').value) || 8.95;
    const qSavon = parseFloat(document.getElementById('multi-savon').value) || 0;
    const puSavon = parseFloat(document.getElementById('multi-savon-pu').value) || 40.00;
    const qEssuie = parseFloat(document.getElementById('multi-essuieMain').value) || 0;
    const puEssuie = parseFloat(document.getElementById('multi-essuieMain-pu').value) || 11.00;
    const qJumbo = parseFloat(document.getElementById('multi-jumbo').value) || 0;
    const puJumbo = parseFloat(document.getElementById('multi-jumbo-pu').value) || 4.00;
    const totalCommunsMn = hallMn + (escaliersMn * nbEtages) + ascenseurMn + localPoubelleMn;
    const totalCommunsPrix = (totalCommunsMn / 60) * taux;
    const totalGarages = garageSurface * garagePrixM2;
    const totalMoquettesMn = vapeurMn + shampoingMn;
    const totalMoquettesPrix = ((totalMoquettesMn / 60) * taux) + (moquetteSurface * moquettePrixM2);
    const trajetPrix = (trajetMn / 60) * taux;
    const stPoubelles = qPoubelles * puPoubelles;
    const stSavon = qSavon * puSavon;
    const stEssuie = qEssuie * puEssuie;
    const stJumbo = qJumbo * puJumbo;
    const totalConso = stPoubelles + stSavon + stEssuie + stJumbo;
    const totalHT = totalCommunsPrix + totalGarages + totalMoquettesPrix + trajetPrix + totalConso;
    return {
        nom: document.getElementById('multi-nomBatiment').value.trim() || `Bâtiment ${devisMultipleData.length + 1}`,
        remarques: document.getElementById('multi-remarques').value,
        tauxHoraire: taux,
        communs: { hallMn, escaliersMnParEtage: escaliersMn, nbEtages, ascenseurMn, localPoubelleMn, totalMn: totalCommunsMn, totalPrix: totalCommunsPrix },
        garages: { surface: garageSurface, prixM2: garagePrixM2, totalPrix: totalGarages },
        moquettes: { surface: moquetteSurface, prixM2: moquettePrixM2, vapeurMn, shampoingMn, totalMn: totalMoquettesMn, totalPrix: totalMoquettesPrix },
        trajet: { minutes: trajetMn, totalPrix: trajetPrix },
        consommables: { poubelles: { quantite: qPoubelles, prixUnit: puPoubelles, total: stPoubelles }, savon: { quantite: qSavon, prixUnit: puSavon, total: stSavon }, essuieMain: { quantite: qEssuie, prixUnit: puEssuie, total: stEssuie }, jumbo: { quantite: qJumbo, prixUnit: puJumbo, total: stJumbo }, totalConso },
        totalHT, totalTTC: totalHT * 1.20
    };
}

function multiResetForm() {
    ['multi-nomBatiment', 'multi-remarques', 'multi-hall', 'multi-escaliers', 'multi-nbEtages',
        'multi-ascenseur', 'multi-localPoubelle', 'multi-garageSurface', 'multi-moquetteSurface',
        'multi-moquetteVapeur', 'multi-moquetteShampoing', 'multi-poubelles', 'multi-savon',
        'multi-essuieMain', 'multi-jumbo', 'multi-trajet'
    ].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = el.type === 'number' ? '0' : '';
    });
    document.getElementById('multi-tauxHoraire').value = '37.30';
    document.getElementById('multi-garagePrixM2').value = '0.41';
    document.getElementById('multi-moquettePrixM2').value = '3.62';
    document.getElementById('multi-poubelles-pu').value = '8.95';
    document.getElementById('multi-savon-pu').value = '40.00';
    document.getElementById('multi-essuieMain-pu').value = '11.00';
    document.getElementById('multi-jumbo-pu').value = '4.00';
}

function multiMettreAJourSummary() {
    const summary = document.getElementById('multi-batiments-summary');
    const liste = document.getElementById('multi-batiments-liste');
    const cumul = document.getElementById('multi-total-cumul');
    if (!summary || !liste) return;
    if (devisMultipleData.length === 0) { summary.style.display = 'none'; return; }
    summary.style.display = 'block';
    liste.innerHTML = '';
    let totalCumul = 0;
    devisMultipleData.forEach((bat, i) => {
        totalCumul += bat.totalHT;
        const div = document.createElement('div');
        div.className = 'multi-bat-item';
        div.innerHTML = `
            <span class="multi-bat-nom"><i class="fas fa-building"></i> ${bat.nom}</span>
            <span class="multi-bat-prix">${bat.totalHT.toFixed(2)} € HT</span>
            <button type="button" class="multi-bat-suppr" onclick="multiSupprimerBatiment(${i})"><i class="fas fa-times"></i></button>
        `;
        liste.appendChild(div);
    });
    if (cumul) cumul.textContent = `Total cumulé : ${totalCumul.toFixed(2)} € HT`;
}

function multiAjouterBatiment() {
    const nomInput = document.getElementById('multi-nomBatiment');
    if (!nomInput?.value.trim()) {
        nomInput?.focus();
        if (nomInput) { nomInput.style.borderColor = 'var(--secondary)'; setTimeout(() => nomInput.style.borderColor = '', 1500); }
        return;
    }
    devisMultipleData.push(multiLireBatiment());
    multiMettreAJourSummary();
    multiResetForm();
    const label = document.getElementById('multi-batiment-label');
    if (label) label.textContent = `Bâtiment ${devisMultipleData.length + 1}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function multiSupprimerBatiment(index) {
    devisMultipleData.splice(index, 1);
    multiMettreAJourSummary();
    const label = document.getElementById('multi-batiment-label');
    if (label) label.textContent = `Bâtiment ${devisMultipleData.length + 1}`;
}

function multiConfirmRetour() {
    if (devisMultipleData.length > 0) {
        if (!confirm(`Vous avez ${devisMultipleData.length} bâtiment(s) chiffré(s). Quitter va tout effacer. Continuer ?`)) return;
    }
    devisMultipleData = [];
    devisNavigate('copro-hub');
}

window.multiAjouterBatiment = multiAjouterBatiment;
window.multiSupprimerBatiment = multiSupprimerBatiment;
window.multiConfirmRetour = multiConfirmRetour;

// Listeners boutons multi (évite le problème defer/module ES)
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btn-ajouter-batiment')?.addEventListener('click', multiAjouterBatiment);
    document.getElementById('btn-multi-retour')?.addEventListener('click', multiConfirmRetour);
});
// ── Submit Copro Multiple ────────────────────────────
document.getElementById('devisCoproMultipleForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nomBatiment = document.getElementById('multi-nomBatiment').value.trim();
    if (!nomBatiment) { document.getElementById('multi-nomBatiment').focus(); return; }
    const tousLesBatiments = [...devisMultipleData, multiLireBatiment()];
    const loading = document.getElementById('loading');
    loading.style.display = 'flex';
    setTimeout(() => loading.classList.add('active'), 100);
    try {
        const nomChantier = document.getElementById('multi-nomChantier').value || tousLesBatiments[0].nom;
        const totalHT = tousLesBatiments.reduce((s, b) => s + b.totalHT, 0);
        const totalTTC = totalHT * 1.20;
        await addDoc(collection(db, "devis"), {
            nomChantier, typeDevis: 'copro-multiple',
            sections: tousLesBatiments, totalHT, totalTTC,
            status: 'en_attente', dateCreation: serverTimestamp()
        });
        showNotification('Devis copro envoyé avec succès !', 'success');
        try { await fetch("https://ntfy.sh/signalement-propre-eco", { method: "POST", body: `📋 Nouveau devis COPRO MULTIPLE !\n\n🏢 ${nomChantier}\n🏗️ ${tousLesBatiments.length} bâtiments\n💶 Total HT : ${totalHT.toFixed(2)} €` }); } catch { }
        devisMultipleData = [];
        setTimeout(() => { window.location.href = '../index.html'; }, 3000);
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur : ' + error.message, 'error');
    }
});

// ── Copro Similaire — Bâtiments ──────────────────────
function renderBatiments() {
    const nb = parseInt(document.getElementById('sim-nbBatiments')?.value) || 1;
    const liste = document.getElementById('batiments-liste');
    if (!liste) return;
    const vals = Array.from(liste.querySelectorAll('input')).map(i => i.value);
    liste.innerHTML = '';
    for (let i = 0; i < nb; i++) {
        const div = document.createElement('div');
        div.className = 'batiment-input-row';
        div.innerHTML = `
            <span class="batiment-num"><i class="fas fa-building"></i> Bât. ${i + 1}</span>
            <input type="text" id="sim-batiment-${i}" placeholder="Ex: Bâtiment A" value="${vals[i] || ''}">
        `;
        liste.appendChild(div);
    }
}

function modifierNbBatiments(delta) {
    const input = document.getElementById('sim-nbBatiments');
    if (!input) return;
    input.value = Math.max(1, (parseInt(input.value) || 1) + delta);
    renderBatiments();
}
window.modifierNbBatiments = modifierNbBatiments;

// ── Submit Copro Similaire ───────────────────────────
document.getElementById('devisCoproSimilaireForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const loading = document.getElementById('loading');
    loading.style.display = 'flex';
    setTimeout(() => loading.classList.add('active'), 100);
    try {
        const nbBatiments = parseInt(document.getElementById('sim-nbBatiments').value) || 1;
        const nomsBatiments = Array.from({ length: nbBatiments }, (_, i) => document.getElementById(`sim-batiment-${i}`)?.value.trim() || `Bâtiment ${i + 1}`);
        const taux = parseFloat(document.getElementById('sim-tauxHoraire').value) || 37.30;
        const hallMn = parseFloat(document.getElementById('sim-hall').value) || 0;
        const escaliersMn = parseFloat(document.getElementById('sim-escaliers').value) || 0;
        const nbEtages = parseFloat(document.getElementById('sim-nbEtages').value) || 0;
        const ascenseurMn = parseFloat(document.getElementById('sim-ascenseur').value) || 0;
        const localPoubelleMn = parseFloat(document.getElementById('sim-localPoubelle').value) || 0;
        const garageSurface = parseFloat(document.getElementById('sim-garageSurface').value) || 0;
        const garagePrixM2 = parseFloat(document.getElementById('sim-garagePrixM2').value) || 0.41;
        const moquetteSurface = parseFloat(document.getElementById('sim-moquetteSurface').value) || 0;
        const moquettePrixM2 = parseFloat(document.getElementById('sim-moquettePrixM2').value) || 3.62;
        const vapeurMn = parseFloat(document.getElementById('sim-moquetteVapeur').value) || 0;
        const shampoingMn = parseFloat(document.getElementById('sim-moquetteShampoing').value) || 0;
        const trajetMn = parseFloat(document.getElementById('sim-trajet').value) || 0;
        const qPoubelles = parseFloat(document.getElementById('sim-poubelles').value) || 0;
        const puPoubelles = parseFloat(document.getElementById('sim-poubelles-pu').value) || 8.95;
        const qSavon = parseFloat(document.getElementById('sim-savon').value) || 0;
        const puSavon = parseFloat(document.getElementById('sim-savon-pu').value) || 40.00;
        const qEssuie = parseFloat(document.getElementById('sim-essuieMain').value) || 0;
        const puEssuie = parseFloat(document.getElementById('sim-essuieMain-pu').value) || 11.00;
        const qJumbo = parseFloat(document.getElementById('sim-jumbo').value) || 0;
        const puJumbo = parseFloat(document.getElementById('sim-jumbo-pu').value) || 4.00;
        const totalCommunsMn = hallMn + (escaliersMn * nbEtages) + ascenseurMn + localPoubelleMn;
        const totalCommunsPrix = (totalCommunsMn / 60) * taux;
        const totalGarages = garageSurface * garagePrixM2;
        const totalMoquettesMn = vapeurMn + shampoingMn;
        const totalMoquettesPrix = ((totalMoquettesMn / 60) * taux) + (moquetteSurface * moquettePrixM2);
        const trajetPrix = (trajetMn / 60) * taux;
        const stPoubelles = qPoubelles * puPoubelles;
        const stSavon = qSavon * puSavon;
        const stEssuie = qEssuie * puEssuie;
        const stJumbo = qJumbo * puJumbo;
        const totalConso = stPoubelles + stSavon + stEssuie + stJumbo;
        const totalHTparBatiment = totalCommunsPrix + totalGarages + totalMoquettesPrix + trajetPrix + totalConso;
        const totalHT = totalHTparBatiment * nbBatiments;
        const totalTTC = totalHT * 1.20;
        const nomChantier = document.getElementById('sim-nomChantier').value;
        const remarques = document.getElementById('sim-remarques').value;
        await addDoc(collection(db, "devis"), {
            nomChantier, typeDevis: 'copro-similaire', remarques,
            batiments: { nb: nbBatiments, noms: nomsBatiments },
            detailsCopro: {
                tauxHoraire: taux,
                communs: { hallMn, escaliersMnParEtage: escaliersMn, nbEtages, ascenseurMn, localPoubelleMn, totalMn: totalCommunsMn, totalPrix: totalCommunsPrix },
                garages: { surface: garageSurface, prixM2: garagePrixM2, totalPrix: totalGarages },
                moquettes: { surface: moquetteSurface, prixM2: moquettePrixM2, vapeurMn, shampoingMn, totalMn: totalMoquettesMn, totalPrix: totalMoquettesPrix },
                trajet: { minutes: trajetMn, totalPrix: trajetPrix },
                consommables: { poubelles: { quantite: qPoubelles, prixUnit: puPoubelles, total: stPoubelles }, savon: { quantite: qSavon, prixUnit: puSavon, total: stSavon }, essuieMain: { quantite: qEssuie, prixUnit: puEssuie, total: stEssuie }, jumbo: { quantite: qJumbo, prixUnit: puJumbo, total: stJumbo }, totalConso },
                totalHTparBatiment
            },
            totalHT, totalTTC, status: 'en_attente', dateCreation: serverTimestamp()
        });
        showNotification('Devis copro envoyé avec succès !', 'success');
        try { await fetch("https://ntfy.sh/signalement-propre-eco", { method: "POST", body: `📋 Nouveau devis COPRO SIMILAIRE !\n\n🏢 ${nomChantier}\n🏗️ ${nbBatiments} bâtiments\n💶 Total HT : ${totalHT.toFixed(2)} €` }); } catch { }
        setTimeout(() => { window.location.href = '../index.html'; }, 3000);
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur : ' + error.message, 'error');
    }
});

// ── Submit Bureau ────────────────────────────────────
document.getElementById('devisBureauForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const loading = document.getElementById('loading');
    loading.style.display = 'flex';
    setTimeout(() => loading.classList.add('active'), 100);

    try {
        const taux = parseFloat(document.getElementById('bureau-tauxHoraire').value) || 37.30;
        const trajetMn = parseFloat(document.getElementById('bureau-trajet').value) || 0;

        const g = (id) => parseFloat(document.getElementById(id)?.value) || 0;
        const hm = (mn, qty, freq) => (mn / 60) * qty * freq;

        const taches = {
            accueil: {
                aspi: { mn: g('b-accueil-aspi-mn'), qty: g('b-accueil-aspi-qty'), freq: g('b-accueil-aspi-freq') },
                mobilier: { mn: g('b-accueil-mobilier-mn'), qty: g('b-accueil-mobilier-qty'), freq: g('b-accueil-mobilier-freq') },
                poubelles: { mn: g('b-accueil-poubelles-mn'), qty: g('b-accueil-poubelles-qty'), freq: g('b-accueil-poubelles-freq') },
                vitres: { mn: g('b-accueil-vitres-mn'), qty: g('b-accueil-vitres-qty'), freq: g('b-accueil-vitres-freq') },
            },
            showroom: {
                aspi: { mn: g('b-show-aspi-mn'), qty: g('b-show-aspi-qty'), freq: g('b-show-aspi-freq') },
                toiles: { mn: g('b-show-toiles-mn'), qty: g('b-show-toiles-qty'), freq: g('b-show-toiles-freq') },
                vitres: { mn: g('b-show-vitres-mn'), qty: g('b-show-vitres-qty'), freq: g('b-show-vitres-freq') },
            },
            sanitaires: {
                sols: { mn: g('b-sanit-sols-mn'), qty: g('b-sanit-sols-qty'), freq: g('b-sanit-sols-freq') },
                wc: { mn: g('b-sanit-wc-mn'), qty: g('b-sanit-wc-qty'), freq: g('b-sanit-wc-freq') },
                lavabos: { mn: g('b-sanit-lavabos-mn'), qty: g('b-sanit-lavabos-qty'), freq: g('b-sanit-lavabos-freq') },
            },
            vitres: {
                facades: { mn: g('b-vitres-facades-mn'), qty: g('b-vitres-facades-qty'), freq: g('b-vitres-facades-freq') },
                porte: { mn: g('b-vitres-porte-mn'), qty: g('b-vitres-porte-qty'), freq: g('b-vitres-porte-freq') },
                bureaux: { mn: g('b-vitres-bureaux-mn'), qty: g('b-vitres-bureaux-qty'), freq: g('b-vitres-bureaux-freq') },
            }
        };

        // Calcul heures mensuelles par section
        const hAccueil = Object.values(taches.accueil).reduce((s, t) => s + hm(t.mn, t.qty, t.freq), 0);
        const hShowroom = Object.values(taches.showroom).reduce((s, t) => s + hm(t.mn, t.qty, t.freq), 0);
        const hSanitaires = Object.values(taches.sanitaires).reduce((s, t) => s + hm(t.mn, t.qty, t.freq), 0);
        const hVitres = Object.values(taches.vitres).reduce((s, t) => s + hm(t.mn, t.qty, t.freq), 0);
        const hTrajet = (trajetMn / 60) * (parseFloat(document.getElementById('bureau-frequenceMois').value) || 4);

        const totalHeuresMois = hAccueil + hShowroom + hSanitaires + hVitres + hTrajet;
        const totalHT = totalHeuresMois * taux;
        const totalTTC = totalHT * 1.20;

        const nomChantier = document.getElementById('bureau-nomChantier').value;
        const remarques = document.getElementById('bureau-remarques').value;

        await addDoc(collection(db, "devis"), {
            nomChantier,
            typeDevis: 'bureau',
            remarques,
            detailsBureau: {
                tauxHoraire: taux,
                frequenceMois: parseFloat(document.getElementById('bureau-frequenceMois').value) || 4,
                taches,
                heuresMensuelles: {
                    accueil: hAccueil,
                    showroom: hShowroom,
                    sanitaires: hSanitaires,
                    vitres: hVitres,
                    trajet: hTrajet,
                    total: totalHeuresMois
                },
                trajet: { minutes: trajetMn }
            },
            totalHT,
            totalTTC,
            status: 'en_attente',
            dateCreation: serverTimestamp()
        });

        showNotification('Devis bureau envoyé avec succès !', 'success');
        try {
            await fetch("https://ntfy.sh/signalement-propre-eco", {
                method: "POST",
                body: `📋 Nouveau devis BUREAU !\n\n🏢 ${nomChantier}\n⏱️ ${totalHeuresMois.toFixed(2)}h/mois\n💶 Total HT : ${totalHT.toFixed(2)} €`
            });
        } catch { }
        setTimeout(() => { window.location.href = '../index.html'; }, 3000);

    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur : ' + error.message, 'error');
    }
});

// ── Submit Fin de chantier ───────────────────────────
document.getElementById('devisForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const loading = document.getElementById('loading');
    loading.style.display = 'flex';
    setTimeout(() => loading.classList.add('active'), 100);
    try {
        const nomChantier = document.getElementById('nomChantier').value;
        const typeLogement = document.getElementById('typeLogement').value;
        const surface = document.getElementById('surface').value;
        const vitresStandard = parseInt(document.getElementById('vitresStandard').value) || 0;
        const baiesVitrees = parseInt(document.getElementById('baiesVitrees').value) || 0;
        const velux = parseInt(document.getElementById('velux').value) || 0;
        const portesVitrees = parseInt(document.getElementById('portesVitrees').value) || 0;
        const vitresHautes = parseInt(document.getElementById('vitresHautes').value) || 0;
        const petiteCuisine = parseInt(document.getElementById('petiteCuisine').value) || 0;
        const grandeCuisine = parseInt(document.getElementById('grandeCuisine').value) || 0;
        const chambresAvecPlacard = parseInt(document.getElementById('chambresAvecPlacard').value) || 0;
        const chambresSansPlacard = parseInt(document.getElementById('chambresSansPlacard').value) || 0;
        const dortoir = parseInt(document.getElementById('dortoir').value) || 0;
        const mezzanine = parseInt(document.getElementById('mezzanine').value) || 0;
        const dressing = parseInt(document.getElementById('dressing').value) || 0;
        const placardsSeuls = parseInt(document.getElementById('placardsSeuls').value) || 0;
        const grandeSdbDouche = parseInt(document.getElementById('grandeSdbDouche').value) || 0;
        const grandeSdbBaignoire = parseInt(document.getElementById('grandeSdbBaignoire').value) || 0;
        const petiteSdbDouche = parseInt(document.getElementById('petiteSdbDouche').value) || 0;
        const petiteSdbBaignoire = parseInt(document.getElementById('petiteSdbBaignoire').value) || 0;
        const wcLaveMain = parseInt(document.getElementById('wcLaveMain').value) || 0;
        const wcSeul = parseInt(document.getElementById('wcSeul').value) || 0;
        const sauna = parseInt(document.getElementById('sauna').value) || 0;
        const buanderie = parseInt(document.getElementById('buanderie').value) || 0;
        const localTechnique = parseInt(document.getElementById('localTechnique').value) || 0;
        const cellier = parseInt(document.getElementById('cellier').value) || 0;
        const bureau = parseInt(document.getElementById('bureau').value) || 0;
        const garage = parseInt(document.getElementById('garage').value) || 0;
        const skiroom = parseInt(document.getElementById('skiroom').value) || 0;
        const salleVideo = parseInt(document.getElementById('salleVideo').value) || 0;
        const chaufferie = parseInt(document.getElementById('chaufferie').value) || 0;
        const escalier = parseInt(document.getElementById('escalier').value) || 0;
        const ascenseur = parseInt(document.getElementById('ascenseur').value) || 0;
        const tapisEntree = document.getElementById('tapisEntree').checked;
        const aspiVmc = document.getElementById('aspiVmc').checked;
        const rambarde = document.getElementById('rambarde').checked;
        const aspiPoutraison = document.getElementById('aspiPoutraison').checked;
        const autresAnnexes = [];
        const autresAnnexesText = document.getElementById('autresAnnexes').value;
        if (autresAnnexesText) autresAnnexesText.split(',').forEach(p => { const t = p.trim(); if (t) autresAnnexes.push(t); });
        const balcon = parseInt(document.getElementById('balcon').value) || 0;
        const terrasse = parseInt(document.getElementById('terrasse').value) || 0;
        const piscine = parseInt(document.getElementById('piscine').value) || 0;
        const trajet = parseInt(document.getElementById('trajet').value) || 0;
        const photosCuisine = await uploadPhotos(document.getElementById('photosCuisine').files);
        const photosSejour = await uploadPhotos(document.getElementById('photosSejour').files);
        let photosVitresHautes = [];
        if (vitresHautes > 0 && document.getElementById('photosVitresHautes').files.length > 0)
            photosVitresHautes = await uploadPhotos(document.getElementById('photosVitresHautes').files);
        let photosSupplementaires = [];
        if (document.getElementById('photosSupplementaires').files.length > 0)
            photosSupplementaires = await uploadPhotos(document.getElementById('photosSupplementaires').files);
        const remarques = document.getElementById('remarques').value;
        await addDoc(collection(db, "devis"), {
            nomChantier, typeLogement, surface,
            vitres: { standard: vitresStandard, baies: baiesVitrees, velux, portes: portesVitrees, hautes: vitresHautes },
            grattage: { standard: document.getElementById('grattageStandard')?.checked || false, baies: document.getElementById('grattageBaies')?.checked || false, velux: document.getElementById('grattageVelux')?.checked || false, portes: document.getElementById('grattagePortes')?.checked || false, hautes: document.getElementById('grattageHautes')?.checked || false },
            cuisine: { petite: petiteCuisine, grande: grandeCuisine, total: petiteCuisine + grandeCuisine },
            chambres: { avecPlacard: chambresAvecPlacard, sansPlacard: chambresSansPlacard, dortoir, mezzanine, dressing, placardsSeuls, total: chambresAvecPlacard + chambresSansPlacard + dortoir + mezzanine + dressing + placardsSeuls },
            sallesDeBain: { grandeSdbDouche, grandeSdbBaignoire, petiteSdbDouche, petiteSdbBaignoire, wcLaveMain, wcSeul, total: grandeSdbDouche + grandeSdbBaignoire + petiteSdbDouche + petiteSdbBaignoire + wcLaveMain + wcSeul },
            piecesAnnexes: { sauna, buanderie, localTechnique, cellier, bureau, garage, skiroom, salleVideo, chaufferie, escalier, ascenseur, tapisEntree, aspiVmc, rambarde, aspiPoutraison, autres: autresAnnexes },
            exterieurs: { balcon, terrasse, piscine },
            trajet,
            photos: { cuisine: photosCuisine, sejour: photosSejour, vitresHautes: photosVitresHautes, supplementaires: photosSupplementaires },
            remarques, status: 'en_attente', dateCreation: serverTimestamp()
        });
        showNotification('Devis envoyé avec succès !', 'success');
        try { await fetch("https://ntfy.sh/signalement-propre-eco", { method: "POST", body: `📋 Nouveau devis reçu !\n\n🏠 Chantier : ${nomChantier}\n📍 Type : ${typeLogement}\n📐 Surface : ${surface}m²` }); } catch { }
        setTimeout(() => { window.location.href = '../index.html'; }, 3000);
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur : ' + error.message, 'error');
    }
});

// ── Preview photos ───────────────────────────────────
function setupPhotoPreview(inputId, previewId) {
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);
    if (!input || !preview) return;
    input.filesArray = [];
    input.addEventListener('change', (e) => {
        input.filesArray = [...input.filesArray, ...Array.from(e.target.files)];
        const dt = new DataTransfer();
        input.filesArray.forEach(file => dt.items.add(file));
        input.files = dt.files;
        preview.innerHTML = '';
        input.filesArray.forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const div = document.createElement('div');
                div.className = 'photo-preview-item';
                div.innerHTML = `<img src="${e.target.result}" alt="Photo ${index + 1}"><button type="button" class="remove-photo" onclick="removePhoto('${inputId}', ${index})"><i class="fas fa-times"></i></button>`;
                preview.appendChild(div);
            };
            reader.readAsDataURL(file);
        });
    });
}

window.removePhoto = function (inputId, index) {
    const input = document.getElementById(inputId);
    input.filesArray.splice(index, 1);
    const dt = new DataTransfer();
    input.filesArray.forEach(file => dt.items.add(file));
    input.files = dt.files;
    input.dispatchEvent(new Event('change'));
};

document.getElementById('vitresHautes')?.addEventListener('change', (e) => {
    document.getElementById('vitresHautesPhotos').style.display = e.target.checked ? 'block' : 'none';
});

setupPhotoPreview('photosCuisine', 'previewCuisine');
setupPhotoPreview('photosSejour', 'previewSejour');
setupPhotoPreview('photosVitresHautes', 'previewVitresHautes');
setupPhotoPreview('photosSupplementaires', 'previewSupplementaires');

// ── Upload ImgBB ─────────────────────────────────────
async function uploadPhotos(files) {
    const IMGBB_API_KEY = '5667189ac916d67ca3e097312dd0443a';
    const urls = [];
    for (const file of files) {
        const formData = new FormData();
        formData.append('image', file);
        const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, { method: 'POST', body: formData });
        const data = await response.json();
        if (data.success) urls.push({ url: data.data.url, delete_url: data.data.delete_url, name: file.name });
        else throw new Error('Upload ImgBB échoué');
    }
    return urls;
}

// ── Notification / Overlay succès ────────────────────
function showNotification(message, type) {
    const loading = document.getElementById('loading');
    const successOverlay = document.getElementById('successOverlay');
    if (type === 'success') {
        loading.classList.remove('active');
        setTimeout(() => {
            loading.style.display = 'none';
            successOverlay.style.display = 'flex';
            setTimeout(() => successOverlay.classList.add('show'), 50);
        }, 300);
    } else {
        loading.classList.remove('active');
        loading.style.display = 'none';
        alert('Erreur : ' + message);
    }
}