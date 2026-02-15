// Fonctions utilitaires partagées

/**
 * Formatte une date en français
 */
export function formatDate(date, format = 'full') {
  const d = date instanceof Date ? date : new Date(date);
  
  if (format === 'full') {
    return d.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  } else if (format === 'short') {
    return d.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } else if (format === 'time') {
    return d.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  return d.toLocaleDateString('fr-FR');
}

/**
 * Affiche un toast notification
 */
export function showToast(message, type = 'info', duration = 3000) {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  
  const styles = {
    position: 'fixed',
    bottom: '2rem',
    right: '2rem',
    padding: '1rem 1.5rem',
    borderRadius: '12px',
    background: type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6',
    color: 'white',
    fontWeight: '600',
    boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
    zIndex: '10002',
    animation: 'slideInRight 0.3s ease-out'
  };
  
  Object.assign(toast.style, styles);
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideOutRight 0.3s ease-out';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

/**
 * Debounce function pour optimiser les événements
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Formate un nombre avec des espaces comme séparateurs de milliers
 */
export function formatNumber(number) {
  return new Intl.NumberFormat('fr-FR').format(number);
}

/**
 * Vérifie si une valeur est vide
 */
export function isEmpty(value) {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

/**
 * Clone un objet en profondeur
 */
export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Attend un certain temps (utile pour les async/await)
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Toggle une classe sur un élément
 */
export function toggleClass(element, className) {
  if (!element) return;
  element.classList.toggle(className);
}

/**
 * Ajoute une classe avec animation
 */
export function addClass(element, className) {
  if (!element) return;
  element.classList.add(className);
}

/**
 * Retire une classe avec animation
 */
export function removeClass(element, className) {
  if (!element) return;
  element.classList.remove(className);
}

/**
 * Scroll smooth vers un élément
 */
export function scrollToElement(element, offset = 0) {
  if (!element) return;
  const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
  const offsetPosition = elementPosition - offset;

  window.scrollTo({
    top: offsetPosition,
    behavior: 'smooth'
  });
}

/**
 * Vérifie si un élément est visible dans le viewport
 */
export function isInViewport(element) {
  if (!element) return false;
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

/**
 * Génère un ID unique
 */
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Copie du texte dans le presse-papier
 */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast('Copié dans le presse-papier', 'success');
    return true;
  } catch (err) {
    showToast('Erreur lors de la copie', 'error');
    return false;
  }
}
