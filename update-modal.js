// Système de modal de mise à jour
const UpdateModal = {
    MODAL_VERSION: 'update_v2.2.0', // ⚠️ CHANGE pour réafficher

    init() {
        // Créer la modal si elle n'existe pas déjà
        if (!document.getElementById('updateModal')) {
            this.createModal();
        }

        // Vérifier si déjà vue
        if (!localStorage.getItem(this.MODAL_VERSION)) {
            setTimeout(() => this.show(), 1000);
        }
    },

    createModal() {
        const modalHTML = `
            <div id="updateModal" class="update-modal">
                <div class="update-modal-content">
                    <div class="update-modal-header">
                        <div class="update-icon">
                            <i class="fas fa-rocket"></i>
                        </div>
                        <h2>Nouvelles fonctionnalités !</h2>
                        <button class="update-modal-close" onclick="UpdateModal.hide()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <div class="update-modal-body">
                        <div class="update-version">
                            <span class="version-badge">v2.0.0</span>
                            <span class="version-date">Février 2026</span>
                        </div>

                        <div class="update-features">
                            <div class="update-feature">
                                <div class="feature-icon feature-new">
                                    <i class="fas fa-bullhorn"></i>
                                </div>
                                <div class="feature-content">
                                    <h3>📢 Système d'annonces</h3>
                                    <p>Envoyez des annonces à tous les employés avec photos et carousel interactif. Navigation au clavier et swipe mobile.</p>
                                </div>
                            </div>

                            <div class="update-feature">
                                <div class="feature-icon feature-new">
                                    <i class="fas fa-file-invoice"></i>
                                </div>
                                <div class="feature-content">
                                    <h3>📋 Système de devis</h3>
                                    <p>Nouvelle page complète pour créer des devis avec formulaire détaillé, upload de photos.</p>
                                </div>
                            </div>

                    

                            <div class="update-feature">
                                <div class="feature-icon feature-improved">
                                    <i class="fas fa-calculator"></i>
                                </div>
                                <div class="feature-content">
                                    <h3>💰 Chiffrage de devis</h3>
                                    <p>Tableau de chiffrage avec calcul automatique des totaux et sauvegarde dans Firebase.</p>
                                </div>
                            </div>

                            <div class="update-feature">
                                <div class="feature-icon feature-fixed">
                                    <i class="fas fa-wrench"></i>
                                </div>
                                <div class="feature-content">
                                    <h3>🛠️ Corrections et optimisations</h3>
                                    <p>Amélioration du CSS, correction des bugs d'affichage et optimisation des performances.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="update-modal-footer">
                        <button class="update-modal-btn" onclick="UpdateModal.hide()">
                            <i class="fas fa-check"></i>
                            J'ai compris
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.attachEvents();
    },

    attachEvents() {
        const modal = document.getElementById('updateModal');
        
        // Fermer en cliquant sur le fond
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.hide();
            }
        });

        // Fermer avec Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('show')) {
                this.hide();
            }
        });
    },

    show() {
        document.getElementById('updateModal').classList.add('show');
    },

    hide() {
        const modal = document.getElementById('updateModal');
        modal.classList.remove('show');
        localStorage.setItem(this.MODAL_VERSION, 'seen');
    }
};

// Auto-init au chargement
document.addEventListener('DOMContentLoaded', () => {
    UpdateModal.init();
});