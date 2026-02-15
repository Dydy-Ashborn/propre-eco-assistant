// Scripts extraits de voir.html

// Section 1
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
        import { getFirestore, collection, getDocs, deleteDoc, doc, query, orderBy } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

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
        const rows = document.getElementById('rows');

        let currentSort = "createdAt";

        // Navigation mobile
        document.addEventListener('DOMContentLoaded', function () {
            const toggleButton = document.querySelector('.nav-toggle');
            const menu = document.querySelector('.nav-menu');

            toggleButton.addEventListener('click', () => {
                menu.classList.toggle('open');
            });

            document.querySelectorAll('.nav-menu a').forEach(link => {
                link.addEventListener('click', () => {
                    menu.classList.remove('open');
                });
            });
        });

        async function deleteFromImgBB(deleteUrl) {
            try {
                await fetch(deleteUrl);
            } catch (err) {
                console.error("Erreur suppression ImgBB :", err);
            }
        }

        async function load() {
            rows.innerHTML = `
                <tr>
                    <td colspan="6" class="loading">
                        <i class="fas fa-spinner fa-spin"></i>
                        <div>Chargement des signalements...</div>
                    </td>
                </tr>
            `;

            try {
                const q = query(collection(db, "signalements"), orderBy(currentSort, "asc"));
                const snapshot = await getDocs(q);

                if (snapshot.empty) {
                    rows.innerHTML = `
                        <tr>
                            <td colspan="6" class="empty-state">
                                <i class="fas fa-inbox"></i>
                                <div>Aucun signalement trouvé</div>
                            </td>
                        </tr>
                    `;
                    return;
                }

                rows.innerHTML = '';
                let index = 0;

                snapshot.docs.forEach(docSnap => {
                    const data = docSnap.data();
                    const tr = document.createElement('tr');
                    tr.style.animationDelay = `${index * 0.1}s`;
                    tr.className = 'table-row-animated';

                    let imgHTML = "";
                    if (data.images && data.images.length > 0) {
                        imgHTML = data.images.map(img =>
                            `<a href="${img.url}" target="_blank" style="margin-right: 0.5rem;">
                                <img src="${img.url}" class="thumb" alt="Signalement" />
                            </a>`
                        ).join("");
                    }

                    tr.innerHTML = `
                        <td>
                            <div class="custom-checkbox">
                                <input type="checkbox" class="rowCheckbox" data-id="${docSnap.id}" 
                                       data-urls='${JSON.stringify((data.images || []).map(img => img.deleteUrl))}'>
                            </div>
                        </td>
                        <td><strong>${data.copro || 'Non spécifiée'}</strong></td>
                        <td style="max-width: 300px; word-wrap: break-word;">${data.description || 'Aucune description'}</td>
                        <td>
                            <div style="display: flex; align-items: center; gap: 0.5rem;">
                                <i class="fas fa-user-circle" style="color: var(--primary);"></i>
                                ${data.employee || 'Anonyme'}
                            </div>
                        </td>
                        <td>${imgHTML || '<span style="color: var(--text-light);">Aucune image</span>'}</td>
                        <td>
                            <div style="display: flex; align-items: center; gap: 0.5rem;">
                                <i class="fas fa-calendar-alt" style="color: var(--text-light);"></i>
                                ${data.createdAt ? data.createdAt.toDate().toLocaleString('fr-FR') : 'Date inconnue'}
                            </div>
                        </td>
                    `;

                    rows.appendChild(tr);
                    index++;
                });

                // Animation d'entrée pour les lignes
                const style = document.createElement('style');
                style.textContent = `
                    .table-row-animated {
                        opacity: 0;
                        transform: translateY(20px);
                        animation: slideInRow 0.5s ease-out forwards;
                    }
                    @keyframes slideInRow {
                        to {
                            opacity: 1;
                            transform: translateY(0);
                        }
                    }
                `;
                document.head.appendChild(style);

            } catch (err) {
                console.error(err);
                rows.innerHTML = `
                    <tr>
                        <td colspan="6" class="empty-state">
                            <i class="fas fa-exclamation-triangle" style="color: var(--accent);"></i>
                            <div>Erreur lors du chargement des données</div>
                        </td>
                    </tr>
                `;
                showNotification('Erreur lors du chargement des données', 'error');
            }
        }

        async function deleteSelected() {
            const selected = document.querySelectorAll(".rowCheckbox:checked");
            if (selected.length === 0) {
                showNotification('Veuillez sélectionner au moins un signalement', 'warning');
                return;
            }

            if (!confirm(`ÃŠtes-vous sûr de vouloir supprimer ${selected.length} signalement(s) ?`)) return;

            showNotification('Suppression en cours...', 'info');

            try {
                for (let checkbox of selected) {
                    const deleteUrls = JSON.parse(checkbox.dataset.urls || "[]");
                    for (let url of deleteUrls) {
                        await deleteFromImgBB(url);
                    }
                    await deleteDoc(doc(db, "signalements", checkbox.dataset.id));
                }
                showNotification(`${selected.length} signalement(s) supprimé(s) avec succès`, 'success');
                load();
            } catch (error) {
                console.error(error);
                showNotification('Erreur lors de la suppression', 'error');
            }
        }

        // Événements
        document.addEventListener('DOMContentLoaded', () => {
            document.getElementById('gate')?.remove();
            document.getElementById('dashboard').style.display = 'block';
            load();
        });

        document.getElementById('refresh').addEventListener('click', () => {
            const refreshBtn = document.getElementById('refresh');
            const originalContent = refreshBtn.innerHTML;
            refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Chargement...';
            refreshBtn.disabled = true;

            setTimeout(() => {
                load().then(() => {
                    refreshBtn.innerHTML = originalContent;
                    refreshBtn.disabled = false;
                    showNotification('Données actualisées', 'success');
                });
            }, 500);
        });

        document.getElementById('sortByDate').addEventListener('click', () => {
            currentSort = "createdAt";
            showNotification('Tri par date appliqué', 'info');
            load();
        });

        document.getElementById('sortByEmployee').addEventListener('click', () => {
            currentSort = "employee";
            showNotification('Tri par employé appliqué', 'info');
            load();
        });

        document.getElementById('deleteSelected').addEventListener('click', deleteSelected);

        document.getElementById('selectAll').addEventListener('change', (e) => {
            const checkboxes = document.querySelectorAll('.rowCheckbox');
            checkboxes.forEach(cb => cb.checked = e.target.checked);

            const count = checkboxes.length;
            if (e.target.checked && count > 0) {
                showNotification(`${count} signalement(s) sélectionné(s)`, 'info');
            }
        });

        // Notifications modernes
        function showNotification(message, type = 'info') {
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed;
                top: 2rem;
                right: 2rem;
                background: ${type === 'success' ? 'linear-gradient(135deg, #10b981, #059669)' :
                    type === 'warning' ? 'linear-gradient(135deg, #f59e0b, #d97706)' :
                        type === 'error' ? 'linear-gradient(135deg, #ef4444, #dc2626)' :
                            'linear-gradient(135deg, #3b82f6, #2563eb)'};
                color: white;
                padding: 1rem 1.5rem;
                border-radius: 12px;
                box-shadow: 0 10px 25px rgba(0,0,0,0.2);
                z-index: 1000;
                font-weight: 600;
                animation: slideInRight 0.3s ease-out;
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.2);
            `;

            const icons = {
                success: 'fas fa-check-circle',
                warning: 'fas fa-exclamation-triangle',
                error: 'fas fa-times-circle',
                info: 'fas fa-info-circle'
            };

            notification.innerHTML = `<i class="${icons[type]}"></i> ${message}`;
            document.body.appendChild(notification);

            setTimeout(() => {
                notification.style.animation = 'slideOutRight 0.3s ease-out forwards';
                setTimeout(() => notification.remove(), 300);
            }, 4000);
        }

        // Styles pour les animations
        const additionalStyles = document.createElement('style');
        additionalStyles.textContent = `
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOutRight {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
            @keyframes shake {
                0%, 100% { transform: translateX(0); }
                10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
                20%, 40%, 60%, 80% { transform: translateX(5px); }
            }
        `;
        document.head.appendChild(additionalStyles);

// Section 2
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js')
      .then(reg => console.log('âœ… Service Worker enregistré', reg))
      .catch(err => console.error('âŒ Erreur Service Worker', err));
  }

