// Système de modal de mise Ã  jour
const UpdateModal = {
MODAL_VERSION: 'update_v3.0.0',

    init() {
        // Créer la modal si elle n'existe pas déjÃ 
        if (!document.getElementById('updateModal')) {
            this.createModal();
        }

        // Vérifier si déjÃ  vue
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
                        <h2>Quoi de neuf ?</h2>
                        <button class="update-modal-close" onclick="UpdateModal.hide()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <div class="update-modal-body">
                        <div class="update-version">
                            <span class="version-badge">v2.0</span>
                            <span class="version-date">Février 2026</span>
                        </div>

                        <div class="update-features">
                            <div class="update-feature">
                                <div class="feature-icon feature-improved">
                                    <i class="fas fa-paint-brush"></i>
                                </div>
                                <div class="feature-content">
                                    <h3>🎨 Tableau de bord tout neuf</h3>
                                    <p>Le tableau de bord a été entièrement repensé pour être plus clair, plus rapide et plus agréable à utiliser au quotidien.</p>
                                </div>
                            </div>

                            <div class="update-feature">
                                <div class="feature-icon feature-new">
                                    <i class="fas fa-bullhorn"></i>
                                </div>
                                <div class="feature-content">
                                    <h3>📢 Annonces</h3>
                                    <p>Besoin de faire passer un message à toute l'équipe ? Créez une annonce et tous les employés la verront à leur prochaine connexion.</p>
                                </div>
                            </div>

                            <div class="update-feature">
                                <div class="feature-icon feature-new">
                                    <i class="fas fa-file-invoice"></i>
                                </div>
                                <div class="feature-content">
                                    <h3>📋 Devis depuis le tableau de bord</h3>
                                    <p>Consultez, chiffrez et gérez tous vos devis directement depuis le tableau de bord, sans changer de page.</p>
                                </div>
                            </div>

                            <div class="update-feature">
                                <div class="feature-icon feature-new">
                                    <i class="fas fa-clipboard-list"></i>
                                </div>
                                <div class="feature-content">
                                    <h3>📝 Page de demande de devis</h3>
                                    <p>Une nouvelle page dédiée permet d'envoyer une demande de devis complète avec photos et détails du chantier.</p>
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