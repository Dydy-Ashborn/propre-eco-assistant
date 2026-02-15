// Scripts extraits de Specifique.html

// Section 1
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

        // Variables pour les images
        let selectedFiles = [];
        let compressedFiles = [];

        // Fonction de compression d'image
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
                    // Continue avec la méthode Image fallback ci-dessous
                }
            }

            // Fallback avec Image classique (plus compatible)
            return new Promise((resolve, reject) => {
                const img = new Image();

                // Gérer les erreurs de chargement
                img.onerror = (error) => {
                    console.error('Erreur chargement image:', error);
                    reject(new Error(`Impossible de charger l'image: ${file.name}. Format peut-être non supporté.`));
                };

                // Gérer l'abort si l'image prend trop de temps
                const timeout = setTimeout(() => {
                    img.src = '';
                    reject(new Error(`Timeout lors du chargement de l'image: ${file.name}`));
                }, 30000); // 30 secondes max

                img.onload = async () => {
                    clearTimeout(timeout);

                    try {
                        // Vérifier si l'image est valide
                        if (img.width === 0 || img.height === 0) {
                            throw new Error('Image corrompue ou dimensions invalides');
                        }

                        const { blob } = await drawToCanvas(img.width, img.height, (canvas, ctx) => {
                            const { w, h } = fit(img.width, img.height, maxW, maxH);
                            canvas.width = w;
                            canvas.height = h;

                            // Améliorer la qualité de rendu
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

                // Créer l'URL pour l'image
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
        // Gestion des photos - VERSION AVEC SUPPORT HEIC
        photosInput.addEventListener('change', async function (e) {
            const files = Array.from(e.target.files);

            if (files.length === 0) return;

            // Séparer les fichiers HEIC des autres
            const heicFiles = files.filter(file => file.name.toLowerCase().includes('.heic'));
            const validFiles = files.filter(file => {
                // Exclure les fichiers HEIC
                if (file.name.toLowerCase().includes('.heic')) {
                    return false;
                }

                if (!file.type.startsWith('image/')) {
                    showStatus(`${file.name} n'est pas une image valide`, 'error');
                    return false;
                }
                if (file.size > 50 * 1024 * 1024) { // 50MB max
                    showStatus(`${file.name} est trop volumineux (max 50MB)`, 'error');
                    return false;
                }
                return true;
            });

            // Informer l'utilisateur des fichiers HEIC non supportés
            if (heicFiles.length > 0) {
                showStatus(`${heicFiles.length} fichiers HEIC détectés. Veuillez les convertir en JPEG depuis votre iPhone : Réglages > Appareil photo > Formats > Plus compatible`, 'error');
            }

            if (validFiles.length === 0) {
                if (heicFiles.length > 0) {
                    showStatus('Aucune image supportée. Les fichiers HEIC doivent être convertis en JPEG.', 'error');
                } else {
                    showStatus('Aucune image valide sélectionnée', 'error');
                }
                return;
            }

            selectedFiles = validFiles;
            compressedFiles = [];

            showStatus(`Compression de ${validFiles.length} photos en cours...`, 'loading');

            let successCount = 0;
            let errorCount = 0;

            try {
                for (let i = 0; i < validFiles.length; i++) {
                    try {
                        showStatus(`Compression des photos... (${i + 1}/${validFiles.length})`, 'loading');
                        const compressed = await compressImageSmart(validFiles[i]);
                        compressedFiles.push(compressed.blob);
                        successCount++;
                    } catch (error) {
                        console.error(`Erreur compression ${validFiles[i].name}:`, error);
                        errorCount++;
                    }
                }

                if (successCount > 0) {
                    await displayImagePreview(validFiles.slice(0, successCount), compressedFiles);

                    let message = `${successCount} photos compressées avec succès`;
                    if (errorCount > 0) {
                        message += `, ${errorCount} erreurs`;
                    }
                    if (heicFiles.length > 0) {
                        message += `. ${heicFiles.length} fichiers HEIC ignorés`;
                    }

                    showStatus(message, successCount > 0 ? 'success' : 'error');
                } else {
                    showStatus('Erreur lors de la compression de toutes les photos', 'error');
                }

            } catch (error) {
                console.error('Erreur générale:', error);
                showStatus('Erreur lors de la compression des photos', 'error');
            }
        });
        // Affichage des previews
        // Remplacer votre fonction displayImagePreview par celle-ci
        async function displayImagePreview(originalFiles, compressedBlobs) {
            const imagePreview = document.getElementById('image-preview');

            if (originalFiles.length === 0) {
                imagePreview.innerHTML = '';
                toggleFloatingButton(false);
                return;
            }

            // Créer le header sticky
            const header = document.createElement('div');
            header.className = 'preview-header';
            header.innerHTML = `
        <div class="preview-counter">
            <i class="fas fa-images"></i>
            <span>${originalFiles.length} photo${originalFiles.length > 1 ? 's' : ''}</span>
        </div>
        <div class="preview-actions">
            <button type="button" class="btn-small btn-compact" onclick="toggleCompactMode()">
                <i class="fas fa-compress-alt"></i>
                ${compactMode ? 'Normal' : 'Compact'}
            </button>
            <button type="button" class="btn-small btn-clear" onclick="clearAllImages()">
                <i class="fas fa-trash"></i>
                Tout supprimer
            </button>
        </div>
    `;

            // Créer la grille
            const grid = document.createElement('div');
            grid.className = `preview-grid ${compactMode ? 'compact' : ''}`;

            imagePreview.innerHTML = '';
            imagePreview.appendChild(header);
            imagePreview.appendChild(grid);

            // Ajouter les images
            for (let i = 0; i < originalFiles.length; i++) {
                const originalFile = originalFiles[i];
                const compressedBlob = compressedBlobs[i];

                const reader = new FileReader();
                reader.onload = function (e) {
                    const compressedKB = (compressedBlob.size / 1024).toFixed(1);

                    const previewItem = document.createElement('div');
                    previewItem.className = 'preview-item';
                    previewItem.innerHTML = `
                <img src="${e.target.result}" alt="Preview ${i + 1}" class="preview-image" onclick="previewImage('${e.target.result}', ${i})">
                <button type="button" class="preview-remove" onclick="removeImage(${i})">
                    <i class="fas fa-times"></i>
                </button>
                <div class="preview-size">${compressedKB} KB</div>
            `;
                    grid.appendChild(previewItem);

                    // Ajouter les infos de compression après la dernière image
                    if (i === originalFiles.length - 1) {
                        const totalOriginal = originalFiles.reduce((sum, file) => sum + file.size, 0);
                        const totalCompressed = compressedBlobs.reduce((sum, blob) => sum + blob.size, 0);
                        const totalRatio = ((1 - totalCompressed / totalOriginal) * 100).toFixed(1);

                        const compressionInfo = document.createElement('div');
                        compressionInfo.className = 'compression-info';
                        compressionInfo.innerHTML = `
                    <i class="fas fa-chart-line"></i>
                    <span>
                        <strong>Compression totale :</strong> 
                        ${(totalOriginal / 1024).toFixed(1)} KB â†’ ${(totalCompressed / 1024).toFixed(1)} KB 
                        (-${totalRatio}%)
                    </span>
                `;
                        imagePreview.appendChild(compressionInfo);
                    }
                };
                reader.readAsDataURL(compressedBlob);
            }

            // Activer le bouton flottant si beaucoup d'images
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

            showStatus("Envoi des photos en cours...", "loading");

            try {
                let photos = [];


                for (let i = 0; i < compressedFiles.length; i++) {
                    try {
                        showStatus(`Upload des photos... (${i + 1}/${compressedFiles.length})`, "loading");
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
                let message = `ðŸ“¸ Nouvelles photos de chantier de ${agent}\nðŸ—ï¸ Chantier: ${chantier}`;

                if (description) {
                    message += `\nðŸ“ ${description}`;
                }

                message += `\nðŸ“Š ${photos.length} photo${photos.length > 1 ? 's' : ''} ajoutée${photos.length > 1 ? 's' : ''}`;

                // Ajouter l'URL de la première photo si disponible
                if (photos.length > 0 && photos[0].url) {
                    message += `\nðŸ“¸ ${photos[0].url}`;
                }

                try {
                    await fetch("https://ntfy.sh/signalement-propre-eco", {
                        method: "POST",
                        body: message
                    });
                } catch (ntfyError) {
                    console.error("Erreur notification ntfy:", ntfyError);
                }

                showStatus("âœ… Photos envoyées avec succès !", "success");

                // Réinitialiser le formulaire
                form.reset();
                selectedFiles = [];
                compressedFiles = [];
                imagePreview.innerHTML = '';

                // Remettre l'agent sauvegardé après reset
                if (savedAgent) {
                    agentInput.value = savedAgent;
                }

            } catch (err) {
                console.error("Erreur:", err);
                showStatus(`âŒ Erreur lors de l'envoi : ${err.message}`, "error");
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

// Section 2
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js')
      .then(reg => console.log('âœ… Service Worker enregistré', reg))
      .catch(err => console.error('âŒ Erreur Service Worker', err));
  }

