// js/pwa-install.js
// Détection et modale d'installation PWA (iOS / Android)

function isAppInstalled() {
  return window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;
}

function detectPlatform() {
  const ua = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return 'ios';
  if (/android/.test(ua)) return 'android';
  return 'other';
}

function buildModalHTML(platform) {
  const iosSteps = `
    <div class="pwa-steps">
      <div class="pwa-step">
        <div class="pwa-step-icon"><i class="fas fa-share-square"></i></div>
        <div class="pwa-step-text">
          <strong>1. Appuyez sur Partager</strong>
          <span>Le bouton <i class="fas fa-share-square"></i> en bas de Safari</span>
        </div>
      </div>
      <div class="pwa-step-arrow"><i class="fas fa-chevron-down"></i></div>
      <div class="pwa-step">
        <div class="pwa-step-icon"><i class="fas fa-plus-square"></i></div>
        <div class="pwa-step-text">
          <strong>2. Sur l'écran d'accueil</strong>
          <span>Faites défiler et appuyez sur « Sur l'écran d'accueil »</span>
        </div>
      </div>
      <div class="pwa-step-arrow"><i class="fas fa-chevron-down"></i></div>
      <div class="pwa-step">
        <div class="pwa-step-icon"><i class="fas fa-check-circle"></i></div>
        <div class="pwa-step-text">
          <strong>3. Ajouter</strong>
          <span>Appuyez sur « Ajouter » en haut à droite</span>
        </div>
      </div>
    </div>
    <div class="pwa-browser-note">
      <i class="fab fa-safari"></i> Fonctionne uniquement avec <strong>Safari</strong>
    </div>
  `;

  const androidSteps = `
    <div class="pwa-steps">
      <div class="pwa-step">
        <div class="pwa-step-icon"><i class="fas fa-ellipsis-v"></i></div>
        <div class="pwa-step-text">
          <strong>1. Menu du navigateur</strong>
          <span>Appuyez sur les 3 points en haut à droite</span>
        </div>
      </div>
      <div class="pwa-step-arrow"><i class="fas fa-chevron-down"></i></div>
      <div class="pwa-step">
        <div class="pwa-step-icon"><i class="fas fa-mobile-alt"></i></div>
        <div class="pwa-step-text">
          <strong>2. Ajouter à l'écran d'accueil</strong>
          <span>Sélectionnez « Ajouter à l'écran d'accueil »</span>
        </div>
      </div>
      <div class="pwa-step-arrow"><i class="fas fa-chevron-down"></i></div>
      <div class="pwa-step">
        <div class="pwa-step-icon"><i class="fas fa-check-circle"></i></div>
        <div class="pwa-step-text">
          <strong>3. Confirmer</strong>
          <span>Appuyez sur « Ajouter » pour confirmer</span>
        </div>
      </div>
    </div>
    <div class="pwa-browser-note">
      <i class="fab fa-chrome"></i> Compatible avec <strong>Chrome</strong> et <strong>Edge</strong>
    </div>
  `;

  const otherSteps = `
    <div class="pwa-tabs">
      <button class="pwa-tab active" data-tab="ios">
        <i class="fab fa-apple"></i> iOS
      </button>
      <button class="pwa-tab" data-tab="android">
        <i class="fab fa-android"></i> Android
      </button>
    </div>
    <div class="pwa-tab-content active" id="pwa-tab-ios">${iosSteps}</div>
    <div class="pwa-tab-content" id="pwa-tab-android">${androidSteps}</div>
  `;

  const platformTitle = platform === 'ios'
    ? '<i class="fab fa-apple"></i> Installation sur iPhone / iPad'
    : platform === 'android'
      ? '<i class="fab fa-android"></i> Installation sur Android'
      : '<i class="fas fa-download"></i> Installer l\'application';

  const stepsHTML = platform === 'ios'
    ? iosSteps
    : platform === 'android'
      ? androidSteps
      : otherSteps;

  return `
    <div class="pwa-modal-overlay" id="pwaModalOverlay">
      <div class="pwa-modal">
        <div class="pwa-modal-header">
          <div class="pwa-modal-logo">
            <img src="img/logo.png" alt="Propre Eco" width="48">
          </div>
          <div>
            <h2>Propre Eco Assistant</h2>
            <p>${platformTitle}</p>
          </div>
          <button class="pwa-modal-close" id="pwaModalClose" aria-label="Fermer">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="pwa-modal-body">
          <div class="pwa-intro">
            <i class="fas fa-rocket"></i>
            <p>Installez l'application pour un accès rapide!</p>
          </div>
          ${stepsHTML}
        </div>

        <div class="pwa-modal-footer">
          <button class="pwa-btn-dismiss" id="pwaDismiss">
            Continuer dans le navigateur
          </button>
        </div>
      </div>
    </div>
  `;
}

function initPWAInstallModal() {
  if (isAppInstalled()) return;

  const platform = detectPlatform();

  // Injecter la modale dans le DOM
  document.body.insertAdjacentHTML('beforeend', buildModalHTML(platform));

  // Gestion des onglets (desktop / plateforme inconnue)
  document.querySelectorAll('.pwa-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.pwa-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.pwa-tab-content').forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(`pwa-tab-${tab.dataset.tab}`).classList.add('active');
    });
  });

  // Fermeture
  const closeModal = () => {
    const overlay = document.getElementById('pwaModalOverlay');
    if (overlay) {
      overlay.classList.add('pwa-modal-exit');
      setTimeout(() => overlay.remove(), 300);
    }
  };

  document.getElementById('pwaModalClose')?.addEventListener('click', closeModal);
  document.getElementById('pwaDismiss')?.addEventListener('click', closeModal);

  // Fermer en cliquant sur l'overlay
  document.getElementById('pwaModalOverlay')?.addEventListener('click', (e) => {
    if (e.target.id === 'pwaModalOverlay') closeModal();
  });
}

// Lancer immédiatement (module chargé après DOM ready)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPWAInstallModal);
} else {
  initPWAInstallModal();
}

