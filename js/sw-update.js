// sw-update.js — Détection et bannière de mise à jour PWA
function initSWUpdateBanner() {
  if (!('serviceWorker' in navigator)) return;

  navigator.serviceWorker.register('/service-worker.js').then(registration => {

    // Cas 1 : Un SW en attente existe déjà au chargement
    if (registration.waiting) {
      showUpdateBanner(registration.waiting);
    }

    // Cas 2 : Nouveau SW détecté pendant la session
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          showUpdateBanner(newWorker);
        }
      });
    });
  });

  // Cas 3 : Le SW vient de prendre le contrôle → reload propre
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) {
      refreshing = true;
      window.location.reload();
    }
  });
}

function showUpdateBanner(worker) {
  // Évite les doublons
  if (document.getElementById('sw-update-banner')) return;

  const banner = document.createElement('div');
  banner.id = 'sw-update-banner';
  banner.innerHTML = `
    <span>🔄 Mise à jour disponible</span>
    <button id="sw-update-btn">Actualiser</button>
    <button id="sw-dismiss-btn">✕</button>
  `;

  Object.assign(banner.style, {
    position: 'fixed',
    bottom: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    background: '#1a6b3a',
    color: '#fff',
    padding: '12px 20px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    zIndex: '99999',
    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
    fontSize: '14px',
    fontFamily: 'inherit',
    whiteSpace: 'nowrap'
  });

  const btnStyle = {
    background: 'rgba(255,255,255,0.2)',
    border: '1px solid rgba(255,255,255,0.4)',
    color: '#fff',
    padding: '6px 14px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px'
  };

  Object.assign(document.getElementById ? document : banner, {});
  document.body.appendChild(banner);

  // Applique les styles aux boutons après insertion
  Object.assign(banner.querySelector('#sw-update-btn').style, btnStyle);
  Object.assign(banner.querySelector('#sw-dismiss-btn').style, { ...btnStyle, padding: '6px 10px' });

  banner.querySelector('#sw-update-btn').addEventListener('click', () => {
    worker.postMessage({ action: 'SKIP_WAITING' });
    banner.remove();
  });

  banner.querySelector('#sw-dismiss-btn').addEventListener('click', () => {
    banner.remove();
  });
}

// Auto-init
initSWUpdateBanner();