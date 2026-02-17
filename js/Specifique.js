// Scripts pour Specifique.html
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

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
const form = document.getElementById('photos-form');
const status = document.getElementById('status');
const photosInput = document.getElementById('photos-input');
const imagePreview = document.getElementById('image-preview');
const API_KEY = "7f0e4433bcc19c0f1408f57919fbcf14";

// Gestion de l'agent sauvegardé
const agentInput = document.getElementById('agent-input');
const savedAgent = localStorage.getItem('agent-signature');

if (savedAgent) {
    agentInput.value = savedAgent;
    agentInput.readOnly = true;
    agentInput.style.backgroundColor = '#f0f8ff';

    const agentGroup = agentInput.parentElement;
    const changeButton = document.createElement('div');
    changeButton.className = 'signature-controls';
    changeButton.innerHTML = `
        <div class="signature-saved">
            <i class="fas fa-check-circle"></i>
            Agent sauvegardé
        </div>
        <button type="button" class="change-signature" onclick="changeAgent()">
            <i class="fas fa-edit"></i> Modifier
        </button>
    `;
    agentGroup.appendChild(changeButton);
}

window.changeAgent = function () {
    agentInput.readOnly = false;
    agentInput.style.backgroundColor = '';
    agentInput.focus();
    agentInput.select();

    const controls = document.querySelector('.signature-controls');
    if (controls) {
        controls.remove();
    }
};

agentInput.addEventListener('blur', function () {
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
function showError(message) {
    console.log('showError appelée');
    const errorOverlay = document.getElementById('errorOverlay');
    console.log('errorOverlay:', errorOverlay);
    if (errorOverlay) {
        const errorMessage = errorOverlay.querySelector('.error-message');
        if (errorMessage) {
            errorMessage.textContent = message || 'Une erreur est survenue';
        }
        errorOverlay.style.display = 'flex';
        console.log('display flex appliqué');
        setTimeout(() => {
            errorOverlay.classList.add('active');
            console.log('classe active ajoutée');
        }, 10);
    } else {
        console.error('Element errorOverlay non trouvé !');
    }
}

function hideError() {
    console.log('hideError appelée');
    const errorOverlay = document.getElementById('errorOverlay');
    if (errorOverlay) {
        errorOverlay.classList.remove('active');
        setTimeout(() => {
            errorOverlay.style.display = 'none';
        }, 300);
    }
}

// Variables pour les images
let selectedFiles = [];
let compressedFiles = [];

// Fonction de compression d'image AMÉLIORÉE
async function compressImageSmart(file, maxW = 1200, maxH = 900, quality = 0.8) {
    // Vérifier d'abord si le fichier est valide
    if (!file || !file.type.startsWith('image/')) {
        throw new Error('Fichier non valide ou non supporté');
    }

    // Essayer createImageBitmap en premier (plus moderne)
    if ('createImageBitmap' in window) {
        try {
            const bitmap = await createImageBitmap(file, {
                imageOrientation: 'from-image',
                premultiplyAlpha: 'none',
                colorSpaceConversion: 'none'
            });

            const { blob } = await drawToCanvas(bitmap.width, bitmap.height, (canvas, ctx) => {
                const { w, h } = fit(bitmap.width, bitmap.height, maxW, maxH);
                canvas.width = w;
                canvas.height = h;
                ctx.drawImage(bitmap, 0, 0, w, h);
            }, quality);

            bitmap.close(); // Libérer la mémoire

            if (blob.size > 500 * 1024) {
                const bitmap2 = await createImageBitmap(file, {
                    imageOrientation: 'from-image',
                    premultiplyAlpha: 'none',
                    colorSpaceConversion: 'none'
                });

                const { blob: blob2 } = await drawToCanvas(bitmap2.width, bitmap2.height, (canvas, ctx) => {
                    const { w, h } = fit(bitmap2.width, bitmap2.height, maxW, maxH);
                    canvas.width = w;
                    canvas.height = h;
                    ctx.drawImage(bitmap2, 0, 0, w, h);
                }, 0.65);

                bitmap2.close();
                return { blob: blob2 };
            }
            return { blob };
        } catch (error) {
            console.warn('createImageBitmap échoué, fallback vers Image:', error.message);
        }
    }

    // Fallback avec Image classique (plus compatible)
    return new Promise((resolve, reject) => {
        const img = new Image();

        img.onerror = (error) => {
            console.error('Erreur chargement image:', error);
            reject(new Error(`Impossible de charger l'image: ${file.name}. Format peut-être non supporté.`));
        };

        const timeout = setTimeout(() => {
            img.src = '';
            reject(new Error(`Timeout lors du chargement de l'image: ${file.name}`));
        }, 30000);

        img.onload = async () => {
            clearTimeout(timeout);

            try {
                if (img.width === 0 || img.height === 0) {
                    throw new Error('Image corrompue ou dimensions invalides');
                }

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
                reject(new Error(`Erreur lors de la compression de ${file.name}: ${error.message}`));
            }
        };

        try {
            img.src = URL.createObjectURL(file);
        } catch (error) {
            clearTimeout(timeout);
            reject(new Error(`Impossible de créer l'URL pour ${file.name}`));
        }
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

// Gestion des photos
photosInput.addEventListener('change', async function (e) {
    const files = Array.from(e.target.files);
    handlePhotoSelection(files);
});

async function handlePhotoSelection(files) {
    const validFiles = files.filter(f => !f.name.toLowerCase().endsWith('.heic'));
    const heicFiles = files.filter(f => f.name.toLowerCase().endsWith('.heic'));

    if (heicFiles.length > 0) {
        showStatus(`${heicFiles.length} fichier(s) HEIC ignoré(s). Utilisez JPEG ou PNG.`, 'error');
    }

    if (validFiles.length === 0) return;

    selectedFiles = validFiles;
    compressedFiles = [];

    // Afficher loading
    const uploadArea = document.getElementById('upload-area');
    if (uploadArea) {
        uploadArea.innerHTML = `
            <div class="upload-loading">
                <div class="upload-spinner"></div>
                <div class="upload-progress">Compression...</div>
            </div>
        `;
    }

    try {
        let successCount = 0;

        for (let i = 0; i < validFiles.length; i++) {
            const loadingDiv = uploadArea?.querySelector('.upload-progress');
            if (loadingDiv) {
                loadingDiv.textContent = `Compression ${i + 1}/${validFiles.length}...`;
            }

            try {
                const compressed = await compressImageSmart(validFiles[i]);
                compressedFiles.push(compressed.blob);
                successCount++;
            } catch (err) {
                console.error(`Erreur compression ${validFiles[i].name}:`, err);
            }
        }

        // Restaurer zone upload
        if (uploadArea) {
            uploadArea.innerHTML = `
                <i class="fas fa-cloud-upload-alt upload-icon"></i>
                <div class="upload-text">Touchez pour sélectionner</div>
                <div class="upload-hint">ou glissez-déposez vos images ici</div>
            `;
        }

        if (successCount > 0) {
            await displayImagePreview(validFiles.slice(0, successCount), compressedFiles);
        } else {
            showStatus('Erreur lors de la compression', 'error');
        }

    } catch (error) {
        console.error('Erreur:', error);

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

// Click sur zone d'upload
const uploadArea = document.getElementById('upload-area');
if (uploadArea) {
    uploadArea.addEventListener('click', () => {
        photosInput.click();
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
            handlePhotoSelection(files);
        }
    });
}

// Affichage des previews - VERSION LISTE COMPACTE
async function displayImagePreview(originalFiles, compressedBlobs) {
    const imagePreview = document.getElementById('image-preview');

    if (originalFiles.length === 0) {
        imagePreview.innerHTML = '';
        toggleFloatingButton(false);
        return;
    }

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
                <img src="${e.target.result}" alt="Image ${i + 1}" class="preview-list-image" onclick="previewImage('${e.target.result}', ${i})">
                <div class="preview-list-info">
                    <div class="preview-list-name">${fileName}</div>
                    <div class="preview-list-size">${compressedKB} KB</div>
                </div>
                <button type="button" class="preview-list-remove" onclick="removeImage(${i})">
                    <i class="fas fa-trash-alt"></i>
                </button>
            `;

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

    toggleFloatingButton(originalFiles.length > 10);
}

// Variables pour l'interface améliorée
let compactMode = false;

// Fonctions utilitaires
window.toggleCompactMode = function () {
    compactMode = !compactMode;
    displayImagePreview(selectedFiles, compressedFiles);
};

window.clearAllImages = function () {
    if (confirm('Supprimer toutes les photos sélectionnées ?')) {
        selectedFiles = [];
        compressedFiles = [];
        document.getElementById('photos-input').value = '';
        displayImagePreview([], []);
    }
};

window.previewImage = function (src, index) {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.9);
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
    `;

    const img = document.createElement('img');
    img.src = src;
    img.style.cssText = `
        max-width: 90%;
        max-height: 90%;
        object-fit: contain;
    `;

    modal.appendChild(img);
    modal.onclick = () => modal.remove();
    document.body.appendChild(modal);
};

function toggleFloatingButton(show) {
    const floatingBtn = document.getElementById('floating-submit');
    const normalBtn = document.getElementById('normal-submit');

    if (show) {
        floatingBtn.classList.add('visible');
        normalBtn.style.display = 'none';
    } else {
        floatingBtn.classList.remove('visible');
        normalBtn.style.display = 'block';
    }
}

// Gérer le clic sur le bouton flottant
document.getElementById('floating-submit').addEventListener('click', function (e) {
    e.preventDefault();
    document.getElementById('photos-form').dispatchEvent(new Event('submit'));
});

// Fonction globale pour supprimer une photo
window.removeImage = function (index) {
    selectedFiles.splice(index, 1);
    compressedFiles.splice(index, 1);

    if (selectedFiles.length > 0) {
        displayImagePreview(selectedFiles, compressedFiles);
    } else {
        imagePreview.innerHTML = '';
    }

    const dt = new DataTransfer();
    selectedFiles.forEach(file => dt.items.add(file));
    photosInput.files = dt.files;
};

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

// Soumission du formulaire
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const chantier = document.getElementById('chantier-input').value.trim();
    const description = document.getElementById('description-input').value.trim();
    const agent = document.getElementById('agent-input').value.trim();

    if (agent) {
        localStorage.setItem('agent-signature', agent);
    }

    if (!chantier || !agent) {
        showStatus('Veuillez remplir tous les champs obligatoires', 'error');
        return;
    }

    showLoading();

    try {
        let photos = [];

        for (let i = 0; i < compressedFiles.length; i++) {
            try {
                const uploaded = await uploadToImgBB(compressedFiles[i]);
                photos.push(uploaded);
            } catch (err) {
                console.error("Erreur upload photo :", err);
                showStatus(`Erreur lors de l'upload de la photo ${i + 1}`, "error");
            }
        }

        // Enregistrer dans Firebase
        await addDoc(collection(db, "photos_chantiers"), {
            chantier,
            description: description || null,
            agent,
            photos,
            createdAt: new Date()
        });

        // Envoi notification ntfy
        let message = `📸 Nouvelles photos de chantier de ${agent}\n🗏️ Chantier: ${chantier}`;

        if (description) {
            message += `\n📝 ${description}`;
        }

        message += `\n📊 ${photos.length} photo${photos.length > 1 ? 's' : ''} ajoutée${photos.length > 1 ? 's' : ''}`;

        if (photos.length > 0 && photos[0].url) {
            message += `\n📸 ${photos[0].url}`;
        }

        try {
            await fetch("https://ntfy.sh/signalement-propre-eco", {
                method: "POST",
                body: message
            });
        } catch (ntfyError) {
            console.error("Erreur notification ntfy:", ntfyError);
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

            if (savedAgent) {
                agentInput.value = savedAgent;
            }
        }, 3000);

  } catch (err) {
        console.error("Erreur:", err);
        hideLoading();
        showError(err.message || 'Erreur lors de l\'envoi');
        
        setTimeout(() => {
            hideError();
        }, 5000);
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