// Import Firebase
import { db } from './config.js';
import { collection, getDocs, query, orderBy } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Section 1
// Variables globales
    let properties = [];
    let procedures = {};
    let currentItinerary = [];
    let userLocation = null;
    let displayedProperties = 0;
    const propertiesPerPage = 12;
    let selectedProperty = null;

    // Éléments DOM
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');
    const propertyDetails = document.getElementById('propertyDetails');
    const propertyInfo = document.getElementById('propertyInfo');
    const addToItineraryBtn = document.getElementById('addToItinerary');
    const showProcedureBtn = document.getElementById('showProcedureBtn');
    const itineraryList = document.getElementById('itineraryList');
    const optimizeBtn = document.getElementById('optimizeItinerary');
    const clearBtn = document.getElementById('clearItinerary');
    const propertiesList = document.getElementById('propertiesList');
    const showMoreBtn = document.getElementById('showMoreBtn');
    const procedureModal = document.getElementById('procedureModal');
    const locationStatus = document.getElementById('locationStatus');


  // Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', function () {
  // Initialisation modifiee
  loadStoredData();
  getCurrentLocation();

  // Charger les procedures PUIS les proprietes pour que les boutons apparaissent
  loadProcedures().then(() => {
    loadProperties();
    updateItineraryDisplay();
  });
});
    // Chargement des données depuis le stockage local
    function loadStoredData() {
      const stored = localStorage.getItem('itinerary');
      if (stored) {
        try {
          currentItinerary = JSON.parse(stored);
        } catch (error) {
          console.error('Erreur lors du chargement de l\'itinéraire:', error);
          currentItinerary = [];
        }
      }
    }

    // Géolocalisation
    function getCurrentLocation() {
      // Vérifier d'abord si on a une position récente en cache
      const cachedLocation = localStorage.getItem('userLocation');
      const cacheTime = localStorage.getItem('userLocationTime');
      const now = Date.now();

      // Si on a une position de moins de 10 minutes, l'utiliser
      if (cachedLocation && cacheTime && (now - parseInt(cacheTime)) < 600000) { // 10 minutes au lieu de 30
        try {
          const cached = JSON.parse(cachedLocation);
          userLocation = cached;
          updateLocationStatus('success', 'Position utilisée depuis le cache');
          return;
        } catch (e) {
          // Nettoyer le cache corrompu
          localStorage.removeItem('userLocation');
          localStorage.removeItem('userLocationTime');
        }
      }

      if (!navigator.geolocation) {
        updateLocationStatus('error', 'Géolocalisation non supportée par votre navigateur');
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };

          // Sauvegarder en cache
          localStorage.setItem('userLocation', JSON.stringify(userLocation));
          localStorage.setItem('userLocationTime', now.toString());

          updateLocationStatus('success', `Position détectée (Â±${Math.round(position.coords.accuracy)}m)`);
        },
        (error) => {
          // Nettoyer le cache en cas d'erreur
          localStorage.removeItem('userLocation');
          localStorage.removeItem('userLocationTime');

          let errorMessage = 'Erreur de géolocalisation';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Autorisation de géolocalisation refusée';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Position non disponible';
              break;
            case error.TIMEOUT:
              errorMessage = 'Délai de géolocalisation dépassé';
              break;
          }
          updateLocationStatus('error', errorMessage);
        },
        {
          enableHighAccuracy: true, // Remis Ã  true
          timeout: 10000,
          maximumAge: 600000 // 10 minutes
        }
      );
    }
    // Fonction utilitaire pour forcer une nouvelle géolocalisation
    function forceLocationRefresh() {
      localStorage.removeItem('userLocation');
      localStorage.removeItem('userLocationTime');
      getCurrentLocation();
    }

    function updateLocationStatus(type, message) {
      locationStatus.className = `geolocation-status ${type}`;

      const icons = {
        success: 'fas fa-map-marker-alt',
        error: 'fas fa-exclamation-triangle',
        loading: 'fas fa-spinner fa-spin'
      };

      locationStatus.innerHTML = `<i class="${icons[type]}"></i> ${message}`;
    }

    // Chargement des données depuis GitHub Gist
import { getAllCoproprietes } from './firebase-copro.js';

async function loadProperties() {
  try {
    showLoadingState();
    
    const q = query(collection(db, 'coproprietes'), orderBy('nom'));
    const snapshot = await getDocs(q);
    
    properties = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        nom: data.nom || '',
        adresse: data.adresse || '',
        code: data.code || '',
        procedures: data.procedures || ''
      };
    });
    
    displayProperties();
    
  } catch (error) {
    console.error('Erreur:', error);
    showErrorState('Erreur lors du chargement depuis Firebase');
  }
}

    // Chargement des procédures depuis le fichier JSON
async function loadProcedures() {
  try {
    const q = query(collection(db, 'coproprietes'));
    const snapshot = await getDocs(q);
    
    procedures = {};
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.procedures && data.nom) {
        procedures[data.nom] = data.procedures;
      }
    });
    
    console.log('Procedures chargees depuis Firebase:', Object.keys(procedures).length);
    return procedures;
    
  } catch (error) {
    console.error('Erreur lors du chargement des procedures:', error.message);
    procedures = {};
    return procedures;
  }
}
    function parseCsv(text) {
      if (!text) return [];
      const lines = text.trim().split(/\r?\n/).filter(Boolean);
      const headers = lines.shift().split(',').map(h => h.trim().replace(/"/g, '').toLowerCase());
      return lines.map(line => {
        const cols = line.split(',').map(c => c.trim().replace(/"/g, ''));
        const obj = {};
        headers.forEach((header, index) => {
          obj[header] = cols[index] || "";
        });
        return obj;
      });
    }

    function showLoadingState() {
      propertiesList.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-spinner fa-spin" style="font-size: 2rem; margin-bottom: 1rem; display: block;"></i>
          Chargement des copropriétés...
        </div>
      `;
    }

    function showErrorState(message) {
      propertiesList.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 1rem; display: block; color: var(--accent);"></i>
          ${message}
        </div>
      `;
    }

    // Affichage des propriétés
    function displayProperties() {
      const startIndex = displayedProperties;
      const endIndex = Math.min(startIndex + propertiesPerPage, properties.length);

      if (startIndex === 0) {
        propertiesList.innerHTML = '';
      }

      for (let i = startIndex; i < endIndex; i++) {
        const property = properties[i];
        const card = createPropertyCard(property);
        propertiesList.appendChild(card);
      }

      displayedProperties = endIndex;

      // Gestion du bouton "Afficher plus"
      if (displayedProperties < properties.length) {
        showMoreBtn.style.display = 'inline-flex';
      } else {
        showMoreBtn.style.display = 'none';
      }
    }

function createPropertyCard(property) {
  const card = document.createElement('div');
  card.className = 'property-card';
  const hasProcedure = procedures && procedures.hasOwnProperty(property.nom) && procedures[property.nom];

  card.innerHTML = `
    <h4>${property.nom || 'Nom non defini'}</h4>
    <p><i class="fas fa-map-marker-alt"></i> ${property.adresse || 'Adresse non definie'}</p>
    <p><i class="fas fa-hashtag"></i> Code: ${property.code || 'N/A'}</p>
    <div class="property-actions">
      <button class="btn" onclick="addPropertyToItinerary('${property.nom}')">
        <i class="fas fa-plus"></i> Ajouter</button>
      ${hasProcedure ? `
        <button class="btn btn-info" onclick="showProcedure('${property.nom}')">
          <i class="fas fa-list-ul"></i> Procedure
        </button>
      ` : ''}
    </div>
  `;
  return card;
}

    // Recherche
    let searchTimeout;
    searchInput.addEventListener('input', function () {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        const query = this.value.toLowerCase().trim();

        if (query.length < 2) {
          searchResults.style.display = 'none';
          propertyDetails.style.display = 'none';
          return;
        }

        const matches = properties.filter(prop =>
          (prop.nom || '').toLowerCase().includes(query) ||
          (prop.adresse || '').toLowerCase().includes(query) ||
          (prop.code || '').toLowerCase().includes(query)
        );

        displaySearchResults(matches);
      }, 300);
    });

    function displaySearchResults(matches) {
      if (matches.length === 0) {
        searchResults.innerHTML = `
          <div class="search-result-item" style="text-align: center; color: var(--text-light);">
            <i class="fas fa-search"></i> Aucun résultat trouvé
          </div>
        `;
        searchResults.style.display = 'block';
        return;
      }
      searchResults.innerHTML = matches.slice(0, 5).map(property => `
  <div class="search-result-item" data-value="${property.nom}">
    <strong>${property.nom || 'Nom non défini'}</strong>
    <br>
    <small><i class="fas fa-map-marker-alt"></i> ${property.adresse || 'Adresse non définie'}</small>
  </div>
`).join('');

      // Attache les événements après l'injection
      document.querySelectorAll('.search-result-item').forEach(item => {
        item.addEventListener('click', () => {
          selectProperty(item.dataset.value);
        });
      });


      searchResults.style.display = 'block';
    }

    // Sélection d'une propriété
window.selectProperty = function (propertyName) {
  const property = properties.find(p => p.nom === propertyName);
  if (!property) return;

  selectedProperty = property;
  const hasProcedure = procedures && procedures.hasOwnProperty(propertyName) && procedures[propertyName];

  propertyInfo.innerHTML = `
    <h3>${property.nom || 'Nom non defini'}</h3>
    <p><i class="fas fa-map-marker-alt"></i> <strong>Adresse:</strong> ${property.adresse || 'Non definie'}</p>
    <p><i class="fas fa-lock"></i> <strong>Code:</strong> ${property.code || 'N/A'}</p>
    ${hasProcedure ? `<p><i class="fas fa-list-ul"></i> <strong>Procedure disponible</strong></p>` : ''}
  `;

  addToItineraryBtn.onclick = () => addPropertyToItinerary(propertyName);

  if (hasProcedure) {
    showProcedureBtn.style.display = 'inline-flex';
    showProcedureBtn.onclick = () => showProcedure(propertyName);
  } else {
    showProcedureBtn.style.display = 'none';
  }

  propertyDetails.style.display = 'block';
  searchResults.style.display = 'none';
  searchInput.value = propertyName;
};

    // Gestion de l'itinéraire
    window.addPropertyToItinerary = function (propertyName) {
      const property = properties.find(p => p.nom === propertyName);
      if (!property) return;

      if (currentItinerary.some(item => item.nom === propertyName)) {
        showNotification('Cette copropriété est déjà dans votre itinéraire', 'warning');
        return;
      }

      currentItinerary.push(property);
      localStorage.setItem('itinerary', JSON.stringify(currentItinerary));
      updateItineraryDisplay();
      showNotification('Copropriété ajoutée à l\'itinéraire', 'success');
    };

 function updateItineraryDisplay() {
  if (currentItinerary.length === 0) {
    itineraryList.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-map-marked-alt" style="font-size: 2rem; margin-bottom: 1rem; display: block; color: var(--text-light);"></i>
        Aucune copropriété dans votre itinéraire pour aujourd'hui
      </div>
    `;
    return;
  }

  itineraryList.innerHTML = currentItinerary.map((property, index) => {
    const hasProcedure = procedures.hasOwnProperty(property.nom);
    return `
      <div class="itinerary-item">
        <div class="itinerary-item-content">
          <strong>${property.nom || 'Nom non défini'}</strong>
          <br>
          <small><i class="fas fa-map-marker-alt"></i> ${property.adresse || 'Adresse non définie'}</small><br>
          <small><i class="fas fa-lock"></i> ${property.code || 'Code non défini'}</small>
        </div>
        <div class="itinerary-item-actions">
          <button class="btn btn-copy" onclick="copyAddress('${property.adresse?.replace(/'/g, "\\'")}', ${index})" title="Copier l'adresse" style="padding: 0.5rem;">
            <i class="fas fa-copy" id="copy-icon-${index}"></i>
          </button>
          ${hasProcedure ? `
            <button class="btn btn-info" onclick="showProcedure('${property.nom}')" style="padding: 0.5rem;">
              <i class="fas fa-list-ul"></i>
            </button>
          ` : ''}
          <button class="btn btn-danger" onclick="removeFromItinerary(${index})" style="padding: 0.5rem;">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>
    `;
  }).join('');
}
    window.removeFromItinerary = function (index) {
      currentItinerary.splice(index, 1);
      localStorage.setItem('itinerary', JSON.stringify(currentItinerary));
      updateItineraryDisplay();
      showNotification('Copropriété supprimée de l\'itinéraire', 'success');
    };

    window.copyAddress = async function(address, index) {
  if (!address || address === 'Adresse non définie') {
    showNotification('Aucune adresse à copier', 'warning');
    return;
  }

  try {
    await navigator.clipboard.writeText(address);
    
    const icon = document.getElementById(`copy-icon-${index}`);
    if (icon) {
      icon.className = 'fas fa-check';
      setTimeout(() => {
        icon.className = 'fas fa-copy';
      }, 2000);
    }
    
    showNotification('Adresse copiée dans le presse-papier', 'success');
  } catch (err) {
    console.error('Erreur lors de la copie:', err);
    showNotification('Erreur lors de la copie de l\'adresse', 'error');
  }
};

    // Actions sur l'itinéraire avec géolocalisation
    optimizeBtn.addEventListener('click', function () {
      if (currentItinerary.length === 0) {
        showNotification('Votre itinéraire est vide', 'warning');
        return;
      }

      optimizeBtn.disabled = true;
      optimizeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Génération...';

      // Construction de l'URL Google Maps avec la position actuelle comme point de départ
      let googleMapsUrl = 'https://www.google.com/maps/dir/';

      // Ajouter la position actuelle si disponible
      if (userLocation) {
        googleMapsUrl += `${userLocation.lat},${userLocation.lng}/`;
        showNotification('Itinéraire généré depuis votre position actuelle', 'success');
      } else {
        showNotification('Position non disponible, itinéraire généré sans point de départ', 'warning');
      }

      // Ajouter toutes les adresses des copropriétés
      const addresses = currentItinerary
        .map(prop => encodeURIComponent(prop.adresse || prop.nom))
        .join('/');

      googleMapsUrl += addresses;

      // Ouvrir dans un nouvel onglet
      window.open(googleMapsUrl, '_blank');

      // Remettre le bouton Ã  l'état normal
      setTimeout(() => {
        optimizeBtn.disabled = false;
        optimizeBtn.innerHTML = '<i class="fas fa-external-link-alt"></i> Ouvrir dans Google Maps';
      }, 1000);
    });

    clearBtn.addEventListener('click', function () {
      if (currentItinerary.length === 0) {
        showNotification('Votre itinéraire est déjà  vide', 'warning');
        return;
      }

      if (confirm('ÃŠtes-vous sûr de vouloir vider votre itinéraire ?')) {
        currentItinerary = [];
        localStorage.removeItem('itinerary');
        updateItineraryDisplay();
        showNotification('Itinéraire vidé', 'success');
      }
    });



    // Bouton "Afficher plus"
    showMoreBtn.addEventListener('click', displayProperties);

    // Procédures - Modal moderne
    window.showProcedure = function (propertyName) {
      const procedure = procedures[propertyName];
      if (!procedure) {
        showNotification('Aucune procédure disponible pour cette copropriété', 'warning');
        return;
      }

      // Créer une modal moderne
      const modal = document.createElement('div');
      modal.className = 'procedure-modal-modern';
      
      // Formater le texte (remplacer \n par <br>, sections par puces)
      const formattedText = procedure
        .split('\n')
        .map(line => {
          const trimmed = line.trim();
          if (!trimmed) return '';
          
          // Détecter les sections (avec ->)
          if (trimmed.startsWith('->')) {
            return `<div class="procedure-item"><i class="fas fa-check-circle"></i>${trimmed.substring(2)}</div>`;
          }
          // Titres (texte en majuscules ou se terminant par :)
          else if (trimmed === trimmed.toUpperCase() || trimmed.endsWith(':')) {
            return `<h4 class="procedure-section">${trimmed}</h4>`;
          }
          // Texte normal
          else {
            return `<p class="procedure-text">${trimmed}</p>`;
          }
        })
        .filter(line => line)
        .join('');
      
      modal.innerHTML = `
        <div class="modal-overlay-procedure" onclick="this.parentElement.remove()"></div>
        <div class="modal-content-procedure" onclick="event.stopPropagation()">
          <div class="modal-header-procedure">
            <div>
              <h2><i class="fas fa-clipboard-list"></i> Procédure</h2>
              <p>${propertyName}</p>
            </div>
            <button class="modal-close-procedure" onclick="this.closest('.procedure-modal-modern').remove()">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="modal-body-procedure">
            ${formattedText}
          </div>
        </div>
      `;
      
      document.body.appendChild(modal);
    };

    // Fermeture de l'ancienne modale (garder pour compatibilité)
    document.querySelector('.close-btn')?.addEventListener('click', function () {
      procedureModal.style.display = 'none';
    });

    procedureModal?.addEventListener('click', function (e) {
      if (e.target === procedureModal) {
        procedureModal.style.display = 'none';
      }
    });

    // Notifications
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
        max-width: 300px;
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
      }, 3000);
    }

    // Styles pour les animations de notification
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
      }
    `;
    document.head.appendChild(style);

    // Fermer les résultats de recherche en cliquant ailleurs
    document.addEventListener('click', function (e) {
      if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
        searchResults.style.display = 'none';
      }
    });

    // Gestion des erreurs de géolocalisation en arrière-plan
    window.addEventListener('online', () => {
      if (!userLocation) {
        getCurrentLocation();
      }
    });

// Section 2
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js')
      .then(reg => console.log('âœ… Service Worker enregistré', reg))
      .catch(err => console.error('âŒ Erreur Service Worker', err));
  }

