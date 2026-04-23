export function initNavigation() {
  // Sidebar supprimé — bottom nav uniquement
  // On garde le listener Escape au cas où
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeFab();
  });
}

export function setActiveNavItem(pageName) {
  document.querySelectorAll('.bottom-nav .nav-tab').forEach(tab => {
    tab.classList.remove('active');
    if (tab.getAttribute('href')?.includes(pageName)) {
      tab.classList.add('active');
    }
  });
}

// ── Speed Dial ───────────────────────────────────
function closeFab() {
  document.getElementById('fabBtn')?.classList.remove('open');
  document.getElementById('speedDial')?.classList.remove('open');
  document.getElementById('sdOverlay')?.classList.remove('open');
}

window.toggleFab = function () {
  const fab     = document.getElementById('fabBtn');
  const dial    = document.getElementById('speedDial');
  const overlay = document.getElementById('sdOverlay');
  if (!fab || !dial || !overlay) return;

  const isOpen = dial.classList.toggle('open');
  fab.classList.toggle('open', isOpen);
  overlay.classList.toggle('open', isOpen);
};
export function setActiveNavItem(pageName) {
  document.querySelectorAll('.bottom-nav .nav-tab').forEach(tab => {
    tab.classList.remove('active');
    if (tab.getAttribute('href')?.includes(pageName)) {
      tab.classList.add('active');
    }
  });
}