// Scripts pour signaler.html
let notif = false; // (inversé)

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, onSnapshot } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBzXEN0e-4dgh9NVVF7JGzpKtJrPnuzo0Y",
    authDomain: "copro-256d7.firebaseapp.com",
    projectId: "copro-256d7",
    storageBucket: "copro-256d7.firebasestorage.app",
    messagingSenderId: "665588381388",
    appId: "1:665588381388:web:a0567533ff1a62407db469",
    measurementId: "G-Y7YNZDDCTD"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Elements DOM
const form = document.getElementById('report-form');
const status = document.getElementById('status');
const imagesInput = document.getElementById('images-input');
const imagePreview = document.getElementById('image-preview');
const API_KEY = "7f0e4433bcc19c0f1408f57919fbcf14";

// Gestion de la signature sauvegardée
const signatureInput = document.getElementById('signature-input');
const savedSignature = localStorage.getItem('agent-signature');

// Charger la signature sauvegardée au chargement de la page
if (savedSignature) {
    signatureInput.value = savedSignature;
    signatureInput.readOnly = true;
    signatureInput.style.backgroundColor = '#f0f8ff';

    // Ajouter un bouton pour changer la signature
    const signatureGroup = signatureInput.parentElement;
    const changeButton = document.createElement('div');
    changeButton.className = 'signature-controls';
    changeButton.innerHTML = `
        <div class="signature-saved">
            <i class="fas fa-check-circle"></i>
            Signature sauvegardée
        </div>
        <button type="button" class="change-signature" onclick="changeSignature()">
            <i class="fas fa-edit"></i> Modifier
        </button>
    `;
    signatureGroup.appendChild(changeButton);
}

// Fonction pour permettre de changer la signature
window.changeSignature = function () {
    signatureInput.readOnly = false;
    signatureInput.style.backgroundColor = '';
    signatureInput.focus();
    signatureInput.select();

    // Supprimer les contrôles
    const controls = document.querySelector('.signature-controls');
    if (controls) {
        controls.remove();
    }
};

// Sauvegarder la signature quand l'utilisateur tape
signatureInput.addEventListener('blur', function () {
    if (this.value.trim()) {
        localStorage.setItem('agent-signature', this.value.trim());
    }
});

// Gestion des modales de chargement et succès
function showLoading() {
    console.log('showLoading appelée');
    const loadingOverlay = document.getElementById('loading');
    console.log('loadingOverlay:', loadingOverlay);
    if (loadingOverlay) {
        loadingOverlay.style.display = 'flex';
        setTimeout(() => loadingOverlay.classList.add('active'), 10);
    }
}

function hideLoading() {
    console.log('hideLoading appelée');
    const loadingOverlay = document.getElementById('loading');
    if (loadingOverlay) {
        loadingOverlay.classList.remove('active');
        setTimeout(() => {
            loadingOverlay.style.display = 'none';
        }, 300);
    }
}

function showSuccess() {
    console.log('showSuccess appelée');
    const successOverlay = document.getElementById('successOverlay');
    console.log('successOverlay:', successOverlay);
    if (successOverlay) {
        successOverlay.style.display = 'flex';
        console.log('display flex appliqué');
        setTimeout(() => {
            successOverlay.classList.add('active');
            console.log('classe active ajoutée');
            const successBar = successOverlay.querySelector('.success-bar-fill');
            if (successBar) {
                successBar.style.animation = 'fillBar 3s ease-out forwards';
                console.log('animation appliquée');
            }
        }, 10);
    } else {
        console.error('Element successOverlay non trouvé !');
    }
}

function hideSuccess() {
    console.log('hideSuccess appelée');
    const successOverlay = document.getElementById('successOverlay');
    if (successOverlay) {
        successOverlay.classList.remove('active');
        setTimeout(() => {
            successOverlay.style.display = 'none';
        }, 300);
    }
}

// Variables globales pour les images
let selectedFiles = [];
let compressedFiles = [];

// Fonction de compression intelligente d'image AMÉLIORÉE
async function compressImageSmart(file, maxW = 1200, maxH = 900, quality = 0.8) {
    if ('createImageBitmap' in window) {
        try {
            const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
            const { blob } = await drawToCanvas(bitmap.width, bitmap.height, (canvas, ctx) => {
                const { w, h } = fit(bitmap.width, bitmap.height, maxW, maxH);
                canvas.width = w;
                canvas.height = h;
                ctx.drawImage(bitmap, 0, 0, w, h);
            }, quality);

            if (blob.size > 500 * 1024) {
                const { blob: blob2 } = await drawToCanvas(bitmap.width, bitmap.height, (canvas, ctx) => {
                    const { w, h } = fit(bitmap.width, bitmap.height, maxW, maxH);
                    canvas.width = w;
                    canvas.height = h;
                    ctx.drawImage(bitmap, 0, 0, w, h);
                }, 0.65);
                return { blob: blob2 };
            }
            return { blob };
        } catch (error) {
            console.error('Erreur createImageBitmap:', error);
        }
    }

    // Fallback avec Image classique
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = async () => {
            try {
                const { blob } = await drawToCanvas(img.width, img.height, (canvas, ctx) => {
                    const { w, h } = fit(img.width, img.height, maxW, maxH);
                    canvas.width = w;
                    canvas.height = h;

                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';

                    ctx.drawImage(img, 0, 0, w, h);
                }, quality);

                if (blob.size > 500 * 1024) {
                    const { blob: blob2 } = await drawToCanvas(img.width, img.height, (canvas, ctx) => {
                        const { w, h } = fit(img.width, img.height, maxW, maxH);
                        canvas.width = w;
                        canvas.height = h;

                        ctx.imageSmoothingEnabled = true;
                        ctx.imageSmoothingQuality = 'high';

                        ctx.drawImage(img, 0, 0, w, h);
                    }, 0.65);
                    resolve({ blob: blob2 });
                } else {
                    resolve({ blob });
                }
            } catch (error) {
                reject(error);
            }
        };
        img.onerror = () => reject(new Error('Impossible de charger l\'image'));
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

function drawToCanvas(srcW, srcH, drawCallback, quality = 0.6) {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        try {
            drawCallback(canvas, ctx);
            canvas.toBlob(blob => {
                if (!blob) return reject(new Error('Échec de la conversion en blob'));
                resolve({ blob });
            }, 'image/jpeg', quality);
        } catch (e) {
            reject(e);
        }
    });
}

// Upload vers ImgBB
async function uploadToImgBB(blob) {
    const formData = new FormData();
    formData.append("image", blob);

    const res = await fetch(`https://api.imgbb.com/1/upload?key=${API_KEY}`, {
        method: "POST",
        body: formData
    });

    if (!res.ok) throw new Error("Upload ImgBB échoué");

    const data = await res.json();
    return {
        url: data.data.display_url,
        deleteUrl: data.data.delete_url
    };
}

// Click sur zone d'upload
const uploadArea = document.getElementById('upload-area-signaler');
if (uploadArea) {
    uploadArea.addEventListener('click', () => {
        imagesInput.click();
    });

    // Drag & drop
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('drag-over');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('drag-over');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('drag-over');
        const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
        if (files.length > 0) {
            handleImageSelection(files);
        }
    });
}

// Gestion des images
imagesInput.addEventListener('change', async function (e) {
    const files = Array.from(e.target.files);
    handleImageSelection(files);
});

async function handleImageSelection(files) {
    // Limiter à 3 images
    if (files.length > 3) {
        showStatus('Maximum 3 images autorisées', 'error');
        return;
    }

    selectedFiles = files;
    compressedFiles = [];

    // Afficher loading
    if (uploadArea) {
        uploadArea.innerHTML = `
            <div class="upload-loading">
                <div class="upload-spinner"></div>
                <div class="upload-progress">Compression...</div>
            </div>
        `;
    }

    try {
        // Compresser chaque image
        for (let i = 0; i < files.length; i++) {
            const loadingDiv = uploadArea?.querySelector('.upload-progress');
            if (loadingDiv) {
                loadingDiv.textContent = `Compression ${i + 1}/${files.length}...`;
            }

            const compressed = await compressImageSmart(files[i]);
            compressedFiles.push(compressed.blob);
        }

        // Restaurer zone upload
        if (uploadArea) {
            uploadArea.innerHTML = `
                <i class="fas fa-cloud-upload-alt upload-icon"></i>
                <div class="upload-text">Touchez pour sélectionner</div>
                <div class="upload-hint">ou glissez-déposez vos images ici</div>
            `;
        }

        await displayImagePreview(files, compressedFiles);

    } catch (error) {
        console.error('Erreur compression:', error);

        if (uploadArea) {
            uploadArea.innerHTML = `
                <i class="fas fa-cloud-upload-alt upload-icon"></i>
                <div class="upload-text">Touchez pour sélectionner</div>
                <div class="upload-hint">ou glissez-déposez vos images ici</div>
            `;
        }

        showStatus('Erreur lors de la compression', 'error');
    }
}

// Affichage des previews - VERSION LISTE COMPACTE
async function displayImagePreview(originalFiles, compressedBlobs) {
    imagePreview.innerHTML = '';

    for (let i = 0; i < originalFiles.length; i++) {
        const originalFile = originalFiles[i];
        const compressedBlob = compressedBlobs[i];

        const reader = new FileReader();
        reader.onload = function (e) {
            const compressedKB = (compressedBlob.size / 1024).toFixed(0);
            const fileName = originalFile.name.length > 25
                ? originalFile.name.substring(0, 22) + '...'
                : originalFile.name;

            const previewItem = document.createElement('div');
            previewItem.className = 'preview-list-item';
            previewItem.innerHTML = `
                <img src="${e.target.result}" alt="Image ${i + 1}" class="preview-list-image">
                <div class="preview-list-info">
                    <div class="preview-list-name">${fileName}</div>
                    <div class="preview-list-size">${compressedKB} KB</div>
                </div>
                <button type="button" class="preview-list-remove" data-index="${i}">
                    <i class="fas fa-trash-alt"></i>
                </button>
            `;

            // Event listener sur le bouton
            previewItem.querySelector('.preview-list-remove').addEventListener('click', (e) => {
                e.stopPropagation();
                removeImage(parseInt(e.currentTarget.dataset.index));
            });

            imagePreview.appendChild(previewItem);

            // Info compression après dernière image
            if (i === originalFiles.length - 1) {
                const totalOriginal = originalFiles.reduce((sum, file) => sum + file.size, 0);
                const totalCompressed = compressedBlobs.reduce((sum, blob) => sum + blob.size, 0);
                const reduction = ((1 - totalCompressed / totalOriginal) * 100).toFixed(0);

                const compressionInfo = document.createElement('div');
                compressionInfo.className = 'compression-info-compact';
                compressionInfo.innerHTML = `
                    <i class="fas fa-chart-line"></i>
                    <span>
                        <strong>Compression :</strong> 
                        ${(totalOriginal / 1024).toFixed(0)} KB → ${(totalCompressed / 1024).toFixed(0)} KB 
                        (-${reduction}%)
                    </span>
                `;
                imagePreview.appendChild(compressionInfo);
            }
        };
        reader.readAsDataURL(compressedBlob);
    }
}

// Supprimer une image
function removeImage(index) {
    selectedFiles.splice(index, 1);
    compressedFiles.splice(index, 1);

    if (selectedFiles.length > 0) {
        displayImagePreview(selectedFiles, compressedFiles);
    } else {
        imagePreview.innerHTML = '';
        imagesInput.value = '';
    }
}

// Affichage des messages de statut
function showStatus(message, type) {
    status.className = `status ${type}`;
    status.style.display = 'block';

    const icons = {
        success: 'fas fa-check-circle',
        error: 'fas fa-times-circle',
        loading: 'fas fa-spinner fa-spin'
    };

    status.innerHTML = `
        <i class="${icons[type]}"></i>
        ${message}
    `;

    if (type === 'success') {
        setTimeout(() => {
            status.style.display = 'none';
        }, 5000);
    }
}

// Gestion du changement de type de signalement
const typeSignalement = document.getElementById('type-signalement');
const problemeFields = document.getElementById('probleme-fields');
const consommableFields = document.getElementById('consommable-fields');
const descInput = document.getElementById('desc-input');
const consommableType = document.getElementById('consommable-type');
const consommableQuantite = document.getElementById('consommable-quantite');

typeSignalement.addEventListener('change', function () {
    if (this.value === 'consommable') {
        problemeFields.style.display = 'none';
        consommableFields.style.display = 'block';

        descInput.removeAttribute('required');
        consommableType.setAttribute('required', 'required');
        consommableQuantite.setAttribute('required', 'required');
    } else {
        problemeFields.style.display = 'block';
        consommableFields.style.display = 'none';

        descInput.setAttribute('required', 'required');
        consommableType.removeAttribute('required');
        consommableQuantite.removeAttribute('required');
    }
});

// Soumission du formulaire
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const copro = document.getElementById('copro-input').value.trim();
    const employee = document.getElementById('signature-input').value.trim();
    const typeSignal = document.getElementById('type-signalement').value;

    // Sauvegarder la signature si ce n'est pas déjà fait
    if (employee) {
        localStorage.setItem('agent-signature', employee);
    }

    // Validation selon le type
    if (typeSignal === 'probleme') {
        const description = document.getElementById('desc-input').value.trim();
        if (!copro || !description || !employee) {
            showStatus('Veuillez remplir tous les champs obligatoires', 'error');
            return;
        }
    } else if (typeSignal === 'consommable') {
        const consomType = document.getElementById('consommable-type').value.trim();
        const consomQuantite = document.getElementById('consommable-quantite').value.trim();
        if (!copro || !consomType || !consomQuantite || !employee) {
            showStatus('Veuillez remplir tous les champs obligatoires', 'error');
            return;
        }
    }

    showLoading();

    try {
        let images = [];

        // Upload des images compressées si présentes
        if (compressedFiles.length > 0) {
            for (let i = 0; i < compressedFiles.length; i++) {
                try {
                    const uploaded = await uploadToImgBB(compressedFiles[i]);
                    images.push(uploaded);
                } catch (err) {
                    console.error("Erreur upload image :", err);
                    showStatus(`Erreur lors de l'envoi de l'image ${i + 1}`, "error");
                }
            }
        }

        // Enregistrer selon le type
        if (typeSignal === 'probleme') {
            const description = document.getElementById('desc-input').value.trim();

            await addDoc(collection(db, "signalements"), {
                copro,
                description,
                employee,
                images,
                createdAt: new Date()
            });

            let message = `🚨 Nouveau signalement de ${employee} sur ${copro}\n${description}`;

            if (notif == false) {
                if (images.length > 0 && images[0].url) {
                    message += `\n📸 ${images[0].url}`;
                }

                try {
                    await fetch("https://ntfy.sh/signalement-propre-eco", {
                        method: "POST",
                        body: message
                    });
                } catch (ntfyError) {
                    console.error("Erreur notification ntfy:", ntfyError);
                }
            }

        } else if (typeSignal === 'consommable') {
            const consomType = document.getElementById('consommable-type').value.trim();
            const consomQuantite = parseInt(document.getElementById('consommable-quantite').value);

            await addDoc(collection(db, "consommables"), {
                copro,
                type: consomType,
                quantite: consomQuantite,
                employee,
                images,
                facture: false,
                createdAt: new Date()
            });

            let message = `📦 Consommable utilisé par ${employee} sur ${copro}\n${consomType} (x${consomQuantite})`;

            if (notif == false) {
                if (images.length > 0 && images[0].url) {
                    message += `\n📸 ${images[0].url}`;
                }

                try {
                    await fetch("https://ntfy.sh/signalement-propre-eco", {
                        method: "POST",
                        body: message
                    });
                } catch (ntfyError) {
                    console.error("Erreur notification ntfy:", ntfyError);
                }
            }
        }

        console.log('Envoi réussi, masquage loading...');
        hideLoading();
        console.log('Affichage succès...');
        showSuccess();

        setTimeout(() => {
            console.log('Masquage succès et reset formulaire...');
            hideSuccess();

            form.reset();
            selectedFiles = [];
            compressedFiles = [];
            imagePreview.innerHTML = '';

            if (savedSignature) {
                signatureInput.value = savedSignature;
            }

            typeSignalement.value = 'probleme';
            problemeFields.style.display = 'block';
            consommableFields.style.display = 'none';
            descInput.setAttribute('required', 'required');
            consommableType.removeAttribute('required');
            consommableQuantite.removeAttribute('required');
        }, 3000);

    } catch (err) {
        console.error("Erreur:", err);
        hideLoading();
        showStatus(`❌ Erreur lors de l'envoi : ${err.message}`, "error");
    }
});

// Navigation mobile
document.addEventListener('DOMContentLoaded', function () {
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

// Service Worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js')
        .then(reg => console.log('✅ Service Worker enregistré', reg))
        .catch(err => console.error('❌ Erreur Service Worker', err));
}