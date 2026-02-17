// Système de modal de mise Ã  jour
const UpdateModal = {
    MODAL_VERSION: 'update_v2.2.0',

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
                            <span class="version-badge">v2.2.0</span>
                            <span class="version-date">Février 2026</span>
                        </div>

                     <div class="update-features">

    <div class="update-feature">
        <div class="feature-icon feature-new">
            <i class="fas fa-code-branch"></i>
        </div>
        <div class="feature-content">
            <h3>🗂️ Code JS externalisé</h3>
            <p>Les pages Feuilles, Signaler et Spécifique ont leur code JavaScript dans des fichiers séparés pour une meilleure stabilité.</p>
        </div>
    </div>

    <div class="update-feature">
        <div class="feature-icon feature-improved">
            <i class="fas fa-layer-group"></i>
        </div>
        <div class="feature-content">
            <h3>✨ Modales chargement & succès</h3>
            <p>Toutes les pages affichent désormais une animation pendant l'envoi et une confirmation visuelle avec barre de progression.</p>
        </div>
    </div>

    <div class="update-feature">
        <div class="feature-icon feature-improved">
            <i class="fas fa-compress-arrows-alt"></i>
        </div>
        <div class="feature-content">
            <h3>📸 Compression d'images améliorée</h3>
            <p>Algorithme plus robuste avec fallback automatique et support étendu des formats (JPEG, PNG, WebP, GIF).</p>
        </div>
    </div>

    <div class="update-feature">
        <div class="feature-icon feature-new">
            <i class="fas fa-boxes"></i>
        </div>
        <div class="feature-content">
            <h3>📦 Signalement consommables</h3>
            <p>Nouveau type de signalement pour déclarer les consommables utilisés avec type, quantité et photos à l'appui.</p>
        </div>
    </div>

    <div class="update-feature">
        <div class="feature-icon feature-fixed">
            <i class="fas fa-save"></i>
        </div>
        <div class="feature-content">
            <h3>🔒 Nom d'agent mémorisé</h3>
            <p>Votre prénom est sauvegardé automatiquement et pré-rempli à chaque visite sur toutes les pages.</p>
        </div>
    </div>

    <div class="update-feature">
        <div class="feature-icon feature-fixed">
            <i class="fas fa-trash-alt"></i>
        </div>
        <div class="feature-content">
            <h3>🗑️ Suppression photo individuelle</h3>
            <p>Retirez une photo précise de votre sélection avant envoi, sans recommencer toute la sélection.</p>
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