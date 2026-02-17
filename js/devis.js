
// Protection par mot de passe - Code requis à chaque accès
const DEVIS_PASSWORD = '1992';

document.getElementById('devisLoginForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const password = document.getElementById('devisPasswordInput').value;
    const errorDiv = document.getElementById('devisLoginError');

    if (password === DEVIS_PASSWORD) {
        document.getElementById('devisLoginModal').style.display = 'none';
        document.getElementById('devisContent').style.display = 'block';
        errorDiv.style.display = 'none';
    } else {
        errorDiv.style.display = 'block';
        document.getElementById('devisPasswordInput').value = '';
        document.getElementById('devisPasswordInput').focus();
    }
});


import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { db } from './config.js';

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.counter-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const inputId = this.dataset.input;
            const action = this.dataset.action;
            const input = document.getElementById(inputId);
            const step = parseFloat(input.step) || 1;
            const min = parseFloat(input.min) || 0;
            let currentValue = parseFloat(input.value) || 0;

            if (action === 'increase') {
                input.value = currentValue + step;
            } else if (action === 'decrease' && currentValue > min) {
                input.value = currentValue - step;
            }

            input.dispatchEvent(new Event('change'));
        });
    });
    const toggleButton = document.querySelector('.nav-toggle');
    const menu = document.querySelector('.nav-menu');

    if (toggleButton && menu) {
        toggleButton.addEventListener('click', () => {
            menu.classList.toggle('open');
        });

        document.querySelectorAll('.nav-menu a').forEach(link => {
            link.addEventListener('click', () => {
                menu.classList.remove('open');
            });
        });
    }
});

// Preview photos
function setupPhotoPreview(inputId, previewId) {
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);

    input.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        const existingFiles = input.dataset.existingFiles ? JSON.parse(input.dataset.existingFiles) : [];
        
        // Ajouter les nouveaux fichiers aux existants
        const dt = new DataTransfer();
        existingFiles.forEach(file => dt.items.add(file));
        files.forEach(file => dt.items.add(file));
        
        // Stocker tous les fichiers
        input.dataset.existingFiles = JSON.stringify(Array.from(dt.files));
        input.files = dt.files;
        
        // Afficher toutes les photos
        preview.innerHTML = '';
        Array.from(dt.files).forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const div = document.createElement('div');
                div.className = 'photo-preview-item';
                div.innerHTML = `
                    <img src="${e.target.result}" alt="Photo ${index + 1}">
                    <button type="button" class="remove-photo" onclick="removePhoto('${inputId}', ${index})">
                        <i class="fas fa-times"></i>
                    </button>
                `;
                preview.appendChild(div);
            };
            reader.readAsDataURL(file);
        });
    });
}

window.removePhoto = function (inputId, index) {
    const input = document.getElementById(inputId);
    const dt = new DataTransfer();
    const existingFiles = input.dataset.existingFiles ? JSON.parse(input.dataset.existingFiles) : [];
    
    existingFiles.forEach((file, i) => {
        if (i !== index) dt.items.add(file);
    });

    input.dataset.existingFiles = JSON.stringify(Array.from(dt.files));
    input.files = dt.files;
    input.dispatchEvent(new Event('change'));
};

// Toggle vitres hautes photos
document.getElementById('vitresHautes').addEventListener('change', (e) => {
    document.getElementById('vitresHautesPhotos').style.display = e.target.checked ? 'block' : 'none';
});

// Setup previews
setupPhotoPreview('photosCuisine', 'previewCuisine');
setupPhotoPreview('photosSejour', 'previewSejour');
setupPhotoPreview('photosVitresHautes', 'previewVitresHautes');
setupPhotoPreview('photosSupplementaires', 'previewSupplementaires');
// Upload photos
async function uploadPhotos(files) {
    const IMGBB_API_KEY = '5667189ac916d67ca3e097312dd0443a';
    const urls = [];

    for (const file of files) {
        const formData = new FormData();
        formData.append('image', file);

        try {
            const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();
            if (data.success) {
                urls.push({
                    url: data.data.url,
                    delete_url: data.data.delete_url,
                    name: file.name
                });
            } else {
                throw new Error('Upload ImgBB échoué');
            }
        } catch (error) {
            console.error(`Erreur upload ${file.name}:`, error);
            throw new Error(`Impossible d'uploader ${file.name}`);
        }
    }
    return urls;
}

// Submit form
document.getElementById('devisForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const loading = document.getElementById('loading');
    loading.style.display = 'flex';
    setTimeout(() => loading.classList.add('active'), 100);

    try {
        const nomChantier = document.getElementById('nomChantier').value;
        const typeLogement = document.getElementById('typeLogement').value;
        const surface = document.getElementById('surface').value;

        // Vitres
        const vitresStandard = parseInt(document.getElementById('vitresStandard').value) || 0;
        const baiesVitrees = parseInt(document.getElementById('baiesVitrees').value) || 0;
        const velux = parseInt(document.getElementById('velux').value) || 0;
        const portesVitrees = parseInt(document.getElementById('portesVitrees').value) || 0;
        const vitresHautes = document.getElementById('vitresHautes').checked;

        // Cuisine
        const petiteCuisine = parseInt(document.getElementById('petiteCuisine').value) || 0;
        const grandeCuisine = parseInt(document.getElementById('grandeCuisine').value) || 0;

        // Chambres
        const chambresAvecPlacard = parseInt(document.getElementById('chambresAvecPlacard').value) || 0;
        const chambresSansPlacard = parseInt(document.getElementById('chambresSansPlacard').value) || 0;
        const dortoir = parseInt(document.getElementById('dortoir').value) || 0;
        const mezzanine = parseInt(document.getElementById('mezzanine').value) || 0;
        const dressing = parseInt(document.getElementById('dressing').value) || 0;
        const placardsSeuls = parseInt(document.getElementById('placardsSeuls').value) || 0;

        // Salles de bain
        const grandeSdbDouche = parseInt(document.getElementById('grandeSdbDouche').value) || 0;
        const grandeSdbBaignoire = parseInt(document.getElementById('grandeSdbBaignoire').value) || 0;
        const petiteSdbDouche = parseInt(document.getElementById('petiteSdbDouche').value) || 0;
        const petiteSdbBaignoire = parseInt(document.getElementById('petiteSdbBaignoire').value) || 0;
        const wcLaveMain = parseInt(document.getElementById('wcLaveMain').value) || 0;
        const wcSeul = parseInt(document.getElementById('wcSeul').value) || 0;

        // Pieces annexes
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

        // Checkboxes annexes
        const tapisEntree = document.getElementById('tapisEntree').checked;
        const aspiVmc = document.getElementById('aspiVmc').checked;
        const rambarde = document.getElementById('rambarde').checked;
        const aspiPoutraison = document.getElementById('aspiPoutraison').checked;

        // Autres annexes texte
        const autresAnnexes = [];
        const autresAnnexesText = document.getElementById('autresAnnexes').value;
        if (autresAnnexesText) {
            autresAnnexesText.split(',').forEach(piece => {
                const trimmed = piece.trim();
                if (trimmed) autresAnnexes.push(trimmed);
            });
        }

        // Exterieurs
        const balcon = parseInt(document.getElementById('balcon').value) || 0;
        const terrasse = parseInt(document.getElementById('terrasse').value) || 0;

        const photosCuisine = await uploadPhotos(document.getElementById('photosCuisine').files);
        const photosSejour = await uploadPhotos(document.getElementById('photosSejour').files);

        let photosVitresHautes = [];
        if (vitresHautes && document.getElementById('photosVitresHautes').files.length > 0) {
            photosVitresHautes = await uploadPhotos(document.getElementById('photosVitresHautes').files);
        }

        let photosSupplementaires = [];
        if (document.getElementById('photosSupplementaires').files.length > 0) {
            photosSupplementaires = await uploadPhotos(document.getElementById('photosSupplementaires').files);
        }

        const remarques = document.getElementById('remarques').value;

        await addDoc(collection(db, "devis"), {
            nomChantier,
            typeLogement,
            surface,
            vitres: {
                standard: vitresStandard,
                baies: baiesVitrees,
                velux: velux,
                portes: portesVitrees,
                hautes: vitresHautes
            },
            grattage: {
                standard: document.getElementById('grattageStandard')?.checked || false,
                baies: document.getElementById('grattageBaies')?.checked || false,
                velux: document.getElementById('grattageVelux')?.checked || false,
                portes: document.getElementById('grattagePortes')?.checked || false,
                hautes: document.getElementById('grattageHautes')?.checked || false
            },
            cuisine: {
                petite: petiteCuisine,
                grande: grandeCuisine,
                total: petiteCuisine + grandeCuisine
            },
            chambres: {
                avecPlacard: chambresAvecPlacard,
                sansPlacard: chambresSansPlacard,
                dortoir: dortoir,
                mezzanine: mezzanine,
                dressing: dressing,
                placardsSeuls: placardsSeuls,
                total: chambresAvecPlacard + chambresSansPlacard + dortoir + mezzanine + dressing + placardsSeuls
            },
            sallesDeBain: {
                grandeSdbDouche,
                grandeSdbBaignoire,
                petiteSdbDouche,
                petiteSdbBaignoire,
                wcLaveMain,
                wcSeul,
                total: grandeSdbDouche + grandeSdbBaignoire + petiteSdbDouche + petiteSdbBaignoire + wcLaveMain + wcSeul
            },
            piecesAnnexes: {
                sauna,
                buanderie,
                localTechnique,
                cellier,
                bureau,
                garage,
                skiroom,
                salleVideo,
                chaufferie,
                escalier,
                ascenseur,
                tapisEntree,
                aspiVmc,
                rambarde,
                aspiPoutraison,
                autres: autresAnnexes
            },
            exterieurs: {
                balcon,
                terrasse
            },
            photos: {
                cuisine: photosCuisine,
                sejour: photosSejour,
                vitresHautes: photosVitresHautes,
                supplementaires: photosSupplementaires
            },
            remarques,
            status: 'en_attente',
            dateCreation: serverTimestamp()
        });

        // Afficher le succes
        showNotification('Devis envoye avec succes !', 'success');
        // Envoyer notification ntfy
        try {
            const message = `📋 Nouveau devis reçu !\n\n🏠 Chantier : ${nomChantier}\n📍 Type : ${typeLogement}\n📐 Surface : ${surface}m²`;
            await fetch("https://ntfy.sh/signalement-propre-eco", {
                method: "POST",
                body: message
            });
        } catch (ntfyError) {
            console.error("Erreur notification ntfy:", ntfyError);
        }

        // Rediriger apres 3 secondes
        setTimeout(() => {
            window.location.href = '../index.html';
        }, 3000);

    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur : ' + error.message, 'error');
    }
});


function showNotification(message, type) {
    const loading = document.getElementById('loading');
    const successOverlay = document.getElementById('successOverlay');

    if (type === 'success') {
        // Masquer le loading
        loading.classList.remove('active');
        setTimeout(() => {
            loading.style.display = 'none';

            // Afficher le success overlay
            successOverlay.style.display = 'flex';
            setTimeout(() => {
                successOverlay.classList.add('show');
            }, 50);
        }, 300);

    } else if (type === 'error') {
        // Pour les erreurs, juste masquer le loading et afficher l'erreur
        loading.classList.remove('active');
        loading.style.display = 'none';
        alert('Erreur : ' + message);
    }
}