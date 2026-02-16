// Scripts extraits de Feuilles.html

// Section 1
// Configuration Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBzXEN0e-4dgh9NVVF7JGzpKtJrPnuzo0Y",
    authDomain: "copro-256d7.firebaseapp.com",
    projectId: "copro-256d7",
    storageBucket: "copro-256d7.appspot.com",
    messagingSenderId: "665588381388",
    appId: "1:665588381388:web:a0567533ff1a62407db469",
    measurementId: "G-Y7YNZDDCTD"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Variables globales
let selectedProperty = null;
let compressedImageBlob = null;
let properties = [];

// Éléments DOM
const propertyName = document.getElementById('propertyName');
const propertyAddress = document.getElementById('propertyAddress');
const propertyCode = document.getElementById('propertyCode');
const workConfirmation = document.getElementById('workConfirmation');
const photoInput = document.getElementById('photoInput');
const photoBtn = document.getElementById('photoBtn');
const previewContainer = document.getElementById('previewContainer');
const previewImage = document.getElementById('previewImage');
const compressionInfo = document.getElementById('compressionInfo');
const uploadBtn = document.getElementById('uploadBtn');
const messages = document.getElementById('messages');
const propertySearch = document.getElementById('propertySearch');
const searchResults = document.getElementById('searchResults');
const IMGBB_API_KEY = "5667189ac916d67ca3e097312dd0443a";

// Navigation mobile
document.addEventListener('DOMContentLoaded', function () {
    const toggleButton = document.querySelector('.nav-toggle');
    const menu = document.querySelector('.nav-menu');

    if (toggleButton && menu) {
        toggleButton.addEventListener('click', () => {
            menu.classList.toggle('open');
        });

        // Fermer le menu en cliquant sur un lien
        document.querySelectorAll('.nav-menu a').forEach(link => {
            link.addEventListener('click', () => {
                menu.classList.remove('open');
            });
        });
    }
});
function filterProperties(query) {
    if (!query.trim()) {
        filteredProperties = [];
        searchResults.classList.remove('show');
        return;
    }

    const lowerQuery = query.toLowerCase();
    filteredProperties = properties.filter(p =>
        (p.nom && p.nom.toLowerCase().includes(lowerQuery)) ||
        (p.code && p.code.toLowerCase().includes(lowerQuery)) ||
        (p.adresse && p.adresse.toLowerCase().includes(lowerQuery))
    );

    displaySearchResults();
}

function displaySearchResults() {
    if (filteredProperties.length === 0) {
        searchResults.innerHTML = '<div class="no-results"><i class="fas fa-search"></i> Aucune copropriété trouvée</div>';
    } else {
        searchResults.innerHTML = filteredProperties.map((property, index) => `
            <div class="search-result-item" data-index="${index}">
                <div class="search-result-name">${property.nom || 'Nom non défini'}</div>
                <div class="search-result-code">${property.code || 'N/A'}</div>
            </div>
        `).join('');
    }
    searchResults.classList.add('show');
}

function selectProperty(property) {
    selectedProperty = property;
    propertySearch.value = property.nom || 'Nom non défini';
    propertyName.textContent = property.nom || 'Nom non défini';
    propertyAddress.textContent = property.adresse || 'Adresse non définie';
    propertyCode.textContent = property.code || 'N/A';
    searchResults.classList.remove('show');
    updateButtonStates();
}
propertySearch.addEventListener('input', (e) => {
    const query = e.target.value;
    if (!query.trim()) {
        selectedProperty = null;
        propertyName.textContent = 'Sélectionnez une copropriété';
        propertyAddress.textContent = 'Adresse non définie';
        propertyCode.textContent = 'N/A';
        updateButtonStates();
    }
    filterProperties(query);
});

propertySearch.addEventListener('focus', () => {
    if (propertySearch.value.trim()) {
        filterProperties(propertySearch.value);
    }
});

// Gestion des clics sur les résultats
searchResults.addEventListener('click', (e) => {
    const item = e.target.closest('.search-result-item');
    if (item) {
        const index = parseInt(item.dataset.index);
        selectProperty(filteredProperties[index]);
    }
});

// Fermer les résultats en cliquant ailleurs
document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-container')) {
        searchResults.classList.remove('show');
    }
});

// Navigation au clavier
propertySearch.addEventListener('keydown', (e) => {
    const items = searchResults.querySelectorAll('.search-result-item');
    let selectedIndex = Array.from(items).findIndex(item => item.classList.contains('selected'));

    switch (e.key) {
        case 'ArrowDown':
            e.preventDefault();
            if (selectedIndex < items.length - 1) {
                if (selectedIndex >= 0) items[selectedIndex].classList.remove('selected');
                items[selectedIndex + 1].classList.add('selected');
            }
            break;

        case 'ArrowUp':
            e.preventDefault();
            if (selectedIndex > 0) {
                items[selectedIndex].classList.remove('selected');
                items[selectedIndex - 1].classList.add('selected');
            }
            break;

        case 'Enter':
            e.preventDefault();
            if (selectedIndex >= 0) {
                selectProperty(filteredProperties[selectedIndex]);
            }
            break;

        case 'Escape':
            searchResults.classList.remove('show');
            propertySearch.blur();
            break;
    }
});
// Chargement des copropriétés
async function loadProperties() {
    try {
        const gistId = "67645db75ea2d7228078345dc31667b1";
        const resp = await fetch(`https://api.github.com/gists/${gistId}`);
        if (!resp.ok) throw new Error("Erreur lors du chargement des copropriétés");

        const data = await resp.json();
        const csvUrl = Object.values(data.files)[0].raw_url;
        const csvResp = await fetch(csvUrl, { cache: "no-store" });
        const csvText = await csvResp.text();
        properties = parseCsv(csvText);

    } catch (e) {
        console.error(e);
        showMessage("Erreur lors du chargement des copropriétés", "error");
    }
}

function parseCsv(text) {
    if (!text) return [];
    const lines = text.trim().split(/\r?\n/).filter(Boolean);
    const headers = lines.shift().split(',').map(h => h.trim().replace(/"/g, '').toLowerCase());
    return lines.map(l => {
        const cols = l.split(',').map(c => c.trim().replace(/"/g, ''));
        const o = {};
        headers.forEach((h, i) => o[h] = cols[i] || "");
        return o;
    });
}


// Event listeners

workConfirmation.addEventListener('change', updateButtonStates);
photoBtn.addEventListener('click', () => photoInput.click());

photoInput.addEventListener('change', async e => {
    const file = e.target.files[0];
    if (!file) return;

    try {
        photoBtn.disabled = true;
        // photoBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Compression...';

        const compressed = await compressImageSmart(file);
        compressedImageBlob = compressed.blob;

        const reader = new FileReader();
        reader.onload = ev => {
            previewImage.src = ev.target.result;
            previewContainer.style.display = 'block';
            const originalKB = (file.size / 1024).toFixed(1);
            const compressedKB = (compressed.blob.size / 1024).toFixed(1);
            const ratio = ((1 - compressed.blob.size / file.size) * 100).toFixed(1);
            ;
        };
        reader.readAsDataURL(compressed.blob);
        updateButtonStates();
    } catch (err) {
        console.error(err);
        showMessage("Erreur lors de la compression de l'image", "error");
    } finally {
        photoBtn.disabled = false;
        photoBtn.innerHTML = '<i class="fas fa-camera"></i> Changer la photo';
    }
});

// Compression intelligente d'image
async function compressImageSmart(file, maxW = 1080, maxH = 1080, quality = 0.7) {
    if ('createImageBitmap' in window) {
        try {
            const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
            const { blob } = await drawToCanvas(bitmap.width, bitmap.height, (c, ctx) => {
                const { w, h } = fit(bitmap.width, bitmap.height, maxW, maxH);
                c.width = w;
                c.height = h;
                ctx.drawImage(bitmap, 0, 0, w, h);
            }, quality);

            if (blob.size > 700 * 1024) {
                const { blob: blob2 } = await drawToCanvas(bitmap.width, bitmap.height, (c, ctx) => {
                    const { w, h } = fit(bitmap.width, bitmap.height, maxW, maxH);
                    c.width = w;
                    c.height = h;
                    ctx.drawImage(bitmap, 0, 0, w, h);
                }, 0.6);
                return { blob: blob2 };
            }
            return { blob };
        } catch (_) { }
    }

    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = async () => {
            const { blob } = await drawToCanvas(img.width, img.height, (c, ctx) => {
                const { w, h } = fit(img.width, img.height, maxW, maxH);
                c.width = w;
                c.height = h;
                ctx.drawImage(img, 0, 0, w, h);
            }, quality);

            if (blob.size > 700 * 1024) {
                const { blob: blob2 } = await drawToCanvas(img.width, img.height, (c, ctx) => {
                    const { w, h } = fit(img.width, img.height, maxW, maxH);
                    c.width = w;
                    c.height = h;
                    ctx.drawImage(img, 0, 0, w, h);
                }, 0.6);
                resolve({ blob: blob2 });
            } else {
                resolve({ blob });
            }
        };
        img.onerror = () => reject(new Error('Chargement image impossible'));
        img.src = URL.createObjectURL(file);
    });
}

function fit(w, h, maxW, maxH) {
    let rw = w, rh = h;
    if (rw > rh && rw > maxW) {
        rh = Math.round(rh * (maxW / rw));
        rw = maxW;
    } else if (rh >= rw && rh > maxH) {
        rw = Math.round(rw * (maxH / rh));
        rh = maxH;
    }
    return { w: rw, h: rh };
}

function drawToCanvas(srcW, srcH, drawCb, quality = 0.7) {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        try {
            drawCb(canvas, ctx);
            canvas.toBlob(blob => {
                if (!blob) return reject(new Error('Échec toBlob'));
                resolve({ blob });
            }, 'image/jpeg', quality);
        } catch (e) {
            reject(e);
        }
    });
}

// Upload vers ImgBB et Firestore
// Upload vers ImgBB et Firestore
uploadBtn.addEventListener('click', async () => {
    if (!selectedProperty || !workConfirmation.checked || !compressedImageBlob) {
        showMessage('<i class="fas fa-exclamation-triangle"></i> Veuillez remplir tous les champs requis', 'error');
        return;
    }

    let uploadedUrl;

    try {
        // Afficher la modale de chargement
        showLoading();

        // Upload vers ImgBB
        const formData = new FormData();
        formData.append('image', compressedImageBlob);
        const resp = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
            method: 'POST',
            body: formData
        });
        const result = await resp.json();

        if (result.success) {
            uploadedUrl = result.data.url;

            // Stocker dans Firestore
            await db.collection("feuilles_passage").add({
                copro: selectedProperty.nom,
                code: selectedProperty.code,
                agent: agentName.value.trim(),
                url: uploadedUrl,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Masquer le chargement et afficher le succès
            hideLoading();
            showSuccess();

            // Réinitialiser après 3 secondes
            setTimeout(() => {
                hideSuccess();
                resetForm();
            }, 3000);
        } else {
            hideLoading();
            showMessage('<i class="fas fa-times-circle"></i> Erreur lors de l\'upload ImgBB', 'error');
        }
    } catch (e) {
        console.error(e);
        hideLoading();
        showMessage(`<i class="fas fa-times-circle"></i> Erreur : ${e.message}`, 'error');
    }
});

// Mise Ã  jour des états des boutons
function updateButtonStates() {
    const okProperty = !!selectedProperty;
    const okConfirm = workConfirmation.checked;
    const okPhoto = !!compressedImageBlob;
    const okName = agentName.value.trim().length > 0;

    photoBtn.disabled = !(okProperty && okConfirm && okName);
    uploadBtn.disabled = !(okProperty && okConfirm && okPhoto && okName);
}

// Affichage des messages
function showMessage(msg, type) {
    messages.innerHTML = `<div class="${type}-message">${msg}</div>`;
    if (type === 'success') {
        setTimeout(() => messages.innerHTML = '', 8000);
    }
}

// Réinitialiser le formulaire
function resetForm() {
    propertySearch.value = '';
    selectedProperty = null;
    propertyName.textContent = 'Sélectionnez une copropriété';
    propertyAddress.textContent = 'Adresse non définie';
    propertyCode.textContent = 'N/A';
    searchResults.classList.remove('show');
    workConfirmation.checked = false;
    // Ne pas réinitialiser agentName pour le garder
    photoInput.value = '';
    compressedImageBlob = null;
    previewContainer.style.display = 'none';
    photoBtn.innerHTML = '<i class="fas fa-camera"></i> Prendre la photo';
    updateButtonStates();
}
// Gestion des modales de chargement et succès
function showLoading() {
    const loadingOverlay = document.getElementById('loading');
    if (loadingOverlay) {
        loadingOverlay.style.display = 'flex';
    }
}

function hideLoading() {
    const loadingOverlay = document.getElementById('loading');
    if (loadingOverlay) {
        loadingOverlay.style.display = 'none';
    }
}

function showSuccess() {
    const successOverlay = document.getElementById('successOverlay');
    if (successOverlay) {
        successOverlay.style.display = 'flex';
        // Animer la barre de progression
        const successBar = successOverlay.querySelector('.success-bar-fill');
        if (successBar) {
            successBar.style.animation = 'fillBar 3s ease-out forwards';
        }
    }
}

function hideSuccess() {
    const successOverlay = document.getElementById('successOverlay');
    if (successOverlay) {
        successOverlay.style.display = 'none';
    }
}

// Initialisation
window.addEventListener('load', () => {
    loadProperties();
    loadAgentName();
    updateButtonStates();
});
const agentName = document.getElementById('agentName');
const AGENT_NAME_STORAGE_KEY = 'propre_eco_agent_name_v1';

function loadAgentName() {
    const savedName = localStorage.getItem(AGENT_NAME_STORAGE_KEY);
    if (savedName) {
        agentName.value = savedName;
    }
}

function saveAgentName() {
    const name = agentName.value.trim();
    if (name) {
        localStorage.setItem(AGENT_NAME_STORAGE_KEY, name);
    }
}
agentName.addEventListener('input', updateButtonStates);
agentName.addEventListener('blur', saveAgentName);

// Section 2
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js')
        .then(reg => console.log('✅ Service Worker enregistré', reg))
        .catch(err => console.error('❌ Erreur Service Worker', err));
}

