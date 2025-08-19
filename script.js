// =======================
// Configuration & Variables
// =======================
const gistId = "67645db75ea2d7228078345dc31667b1";
let csvUrl = "";

const searchInput = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');
const propertyDetails = document.getElementById('propertyDetails');
const propertyInfo = document.getElementById('propertyInfo');
const addToItineraryBtn = document.getElementById('addToItinerary');
const syncCsvBtn = document.getElementById('syncCsv');
const itineraryList = document.getElementById('itineraryList');
const optimizeItineraryBtn = document.getElementById('optimizeItinerary');
const clearItineraryBtn = document.getElementById('clearItinerary');
const propertiesList = document.getElementById('propertiesList');
const showMoreBtn = document.getElementById('showMoreBtn');

let properties = [];
let selectedProperty = null;
let itinerary = [];
let visibleCount = 4;
const VISIBLE_STEP = 4;

// =======================
// Parsing CSV
// =======================
function parseCsv(text) {
  if (!text) return [];
  const lines = text.trim().split(/\r?\n/).filter(l => l.trim() !== "");
  if (!lines.length) return [];

  const headers = parseCsvLine(lines.shift()).map(h => h.trim());
  return lines.map(line => {
    const cols = parseCsvLine(line);
    let obj = {};
    headers.forEach((h, i) => obj[h.toLowerCase()] = cols[i] ? cols[i].trim() : "");
    return obj;
  });
}

function parseCsvLine(line) {
  const result = [];
  let current = '', insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"' && (i === 0 || line[i - 1] !== '\\')) {
      insideQuotes = !insideQuotes;
    } else if (char === ',' && !insideQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

// =======================
// Affichage des propriétés
// =======================
async function loadCsv() {
  visibleCount = VISIBLE_STEP;

  if (!csvUrl) {
    if (propertiesList) {
      propertiesList.innerHTML = '<div class="empty-state" style="color:red;">Aucune URL CSV disponible</div>';
    }
    if (showMoreBtn) showMoreBtn.style.display = "none";
    return;
  }

  if (propertiesList) {
    propertiesList.innerHTML = '<div class="empty-state">Chargement des copropriétés...</div>';
  }

  try {
    const resp = await fetch(csvUrl, { cache: "no-store" });
    if (!resp.ok) throw new Error("Erreur lors du chargement du fichier CSV");
    properties = parseCsv(await resp.text());
    renderPropertiesList();
  } catch (err) {
    if (propertiesList) {
      propertiesList.innerHTML = `<div class="empty-state" style="color: red;">Erreur : ${err.message}</div>`;
    }
    properties = [];
    if (showMoreBtn) showMoreBtn.style.display = "none";
  }
}


function renderPropertiesList() {
  if (!properties.length) {
    propertiesList.innerHTML = '<div class="empty-state">Aucune copropriété trouvée</div>';
    showMoreBtn.style.display = "none";
    return;
  }

  propertiesList.innerHTML = "";
  const visibleSlice = properties.slice(0, visibleCount);
  visibleSlice.forEach((p) => {
    const div = document.createElement('div');
    div.className = "property-card";
    div.innerHTML = `
    <div class="property-card-info">
      <div class="property-field"><label>Nom:</label> ${p.nom || "-"}</div>
      <div class="property-field"><label>Adresse:</label> ${p.adresse || "-"}</div>
      <div class="property-field"><label>Code:</label> ${p.code || "-"}</div>
    </div>
    <div class="property-actions">
      <button class="btn btn-small">Voir</button>
    </div>
  `;

    div.querySelector('button').addEventListener('click', () => {
      selectProperty(properties.indexOf(p));  // ton code existant
      const detailsSection = document.getElementById('searchInput');
      if (detailsSection) {
        detailsSection.scrollIntoView({ behavior: 'smooth' });
      }
    });

    propertiesList.appendChild(div);
  });


  showMoreBtn.style.display = visibleCount >= properties.length ? "none" : "inline-block";
}

function selectProperty(idx) {
  const p = properties[idx];
  if (!p) return;
  selectedProperty = p;
  searchInput.value = p.nom || "";
  searchResults.innerHTML = "";
  searchResults.classList.remove('show');
  showPropertyDetails(p);
}

// =======================
// Recherche
// =======================
if (searchInput) {
  searchInput.addEventListener('input', () => {
    const val = searchInput.value.trim().toLowerCase();
    searchResults.innerHTML = "";
    propertyDetails.style.display = 'none';
    selectedProperty = null;

    if (!val) {
      searchResults.classList.remove('show');
      return;
    }

    const filtered = properties.filter(p => p.nom && p.nom.toLowerCase().includes(val));
    if (!filtered.length) {
      searchResults.innerHTML = `<div class="search-result-item">Aucune copropriété trouvée</div>`;
      searchResults.classList.add('show');
      return;
    }

    filtered.forEach(p => {
      const div = document.createElement('div');
      div.className = 'search-result-item';
      div.textContent = p.nom;
      div.addEventListener('click', () => {
        selectedProperty = p;
        searchInput.value = p.nom;
        searchResults.innerHTML = "";
        searchResults.classList.remove('show');
        showPropertyDetails(p);
      });
      searchResults.appendChild(div);
    });

    searchResults.classList.add('show');
  });
}


document.addEventListener('click', e => {
  const searchResults = document.getElementById('searchResults');
  const searchInput = document.getElementById('searchInput');
  if (!searchResults || !searchInput) return; // si l'un des deux n'existe pas, on sort

  if (!searchResults.contains(e.target) && e.target !== searchInput) {
    searchResults.classList.remove('show');
  }
});


// =======================
// Détails & Procédures
// =======================
function showPropertyDetails(p) {
  propertyInfo.innerHTML = `
    <div><strong>Nom :</strong> ${p.nom || '-'}</div>
    <div><strong>Adresse :</strong> ${p.adresse || '-'}</div>
    <div><strong>Code :</strong> ${p.code || '-'}</div>
    <div style="margin-top:10px; display:flex; gap:10px;">
      <button class="btn-action btn-procedure" id="showProcedureBtn">📄 Procédure</button>
    </div>
  `;
  propertyDetails.style.display = 'block';
  selectedProperty = p;

  document.getElementById('showProcedureBtn').addEventListener('click', () => {
    fetch('procedures.json')
      .then(res => res.json())
      .then(data => {
        const procedureRaw = data[p.nom];
        if (!procedureRaw) return alert("Aucune procédure enregistrée pour cette copropriété.");

        const lines = procedureRaw.split("\n").map(l => l.trim()).filter(l => l);
        let html = "";
        lines.forEach(line => {
          if (line.startsWith("->")) html += `<li>${line.replace("->", "").trim()}</li>`;
          else html += `<p><strong>${line}</strong></p>`;
        });

        document.getElementById('procedureTitle').textContent = p.nom;
        document.getElementById('procedureText').innerHTML = `<ul>${html}</ul>`;
        openModal();
      });
  });
}

function openModal() {
  document.getElementById('procedureModal').style.display = 'block';
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('procedureModal').style.display = 'none';
  document.body.style.overflow = '';
}

const closeBtn = document.querySelector('#procedureModal .close-btn');
const procedureModal = document.getElementById('procedureModal');

if (closeBtn) {
  closeBtn.addEventListener('click', closeModal);
}

if (procedureModal) {
  window.addEventListener('click', (e) => {
    if (e.target === procedureModal) closeModal();
  });
}


// =======================
// Itinéraire
// =======================
function renderItinerary() {
  const itineraryList = document.getElementById("itineraryList");
  if (!itineraryList) return; // si pas d'élément, on sort

  localStorage.setItem('itinerary', JSON.stringify(itinerary));

  if (!itinerary.length) {
    itineraryList.innerHTML = '<div class="empty-state">Aucune copropriété dans votre itinéraire pour aujourd\'hui</div>';
    return;
  }
  itineraryList.innerHTML = '';
  itinerary.forEach((p, idx) => {
    const div = document.createElement('div');
    div.className = 'property-card';
    div.innerHTML = `
      <div class="property-card-info">
        <div><strong>${p.nom}</strong></div>
        <div>${p.adresse}</div>
        <div><strong>Code : </strong>${p.code}</div>
      </div>
      <div class="property-actions">
        <button class="btn btn-danger btn-small">Supprimer</button>
      </div>
    `;
    div.querySelector('button').addEventListener('click', () => {
      itinerary.splice(idx, 1);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(itinerary));

      renderItinerary();
    });
    itineraryList.appendChild(div);
  });
}

// Clé dans le localStorage
const STORAGE_KEY = "itineraireDuJour";

// Charger l'itinéraire depuis le localStorage au démarrage
itinerary = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
renderItinerary(); // Affiche l'itinéraire au chargement de la page

if (addToItineraryBtn) {
  addToItineraryBtn.addEventListener('click', () => {
    if (!selectedProperty) {
      return alert("Veuillez sélectionner une copropriété");
    }
    if (itinerary.find(p => p.nom === selectedProperty.nom)) {
      return alert("Cette copropriété est déjà dans votre itinéraire");
    }
    itinerary.push(selectedProperty);

    // Sauvegarder dans le localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(itinerary));

    renderItinerary();
  });
}


if (optimizeItineraryBtn) {
  optimizeItineraryBtn.addEventListener('click', () => {
    if (!itinerary.length) return alert("Votre itinéraire est vide");

    const openGoogleMaps = (startCoords = null) => {
      const waypoints = itinerary.map(p => encodeURIComponent(p.adresse)).join('/');
      
      // URL app Google Maps pour iOS
      let gmapsAppUrl;
      if (startCoords) {
        gmapsAppUrl = `comgooglemaps://?saddr=${startCoords.lat},${startCoords.lng}&daddr=${waypoints}&directionsmode=driving`;
      } else {
        gmapsAppUrl = `comgooglemaps://?daddr=${waypoints}&directionsmode=driving`;
      }

      // URL web fallback
      const gmapsWebUrl = startCoords
        ? `https://www.google.com/maps/dir/${startCoords.lat},${startCoords.lng}/${waypoints}`
        : `https://www.google.com/maps/dir/${waypoints}`;

      // Essayer d'ouvrir l'app Google Maps
      window.location.href = gmapsAppUrl;

      // Fallback web après 1s si app non installée
      setTimeout(() => {
        window.open(gmapsWebUrl, '_blank');
      }, 1000);
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        position => {
          const { latitude, longitude } = position.coords;
          openGoogleMaps({ lat: latitude, lng: longitude });
        },
        error => {
          alert("Impossible de récupérer la position actuelle. Google Maps ouvrira sans point de départ précis.");
          openGoogleMaps();
        }
      );
    } else {
      alert("La géolocalisation n'est pas supportée par votre navigateur.");
      openGoogleMaps();
    }
  });
}


if (clearItineraryBtn) {
  clearItineraryBtn.addEventListener('click', () => {
    if (confirm("Voulez-vous vraiment vider votre itinéraire ?")) {
      itinerary = [];
      localStorage.removeItem(STORAGE_KEY); // supprime du localStorage

      renderItinerary();
    }
  });
}


// =======================
// Utilitaires
// =======================
function showNotification(message, color = "#28a745") {
  const notif = document.createElement("div");
  notif.className = "sync-notification";
  notif.textContent = message;
  notif.style.background = color;
  document.body.appendChild(notif);

  setTimeout(() => notif.classList.add("show"), 50);
  setTimeout(() => {
    notif.classList.remove("show");
    setTimeout(() => notif.remove(), 400);
  }, 2500);
}

if (syncCsvBtn) {
  syncCsvBtn.addEventListener('click', async () => {
    try {
      syncCsvBtn.classList.add("btn-loading");
      const resp = await fetch(`https://api.github.com/gists/${gistId}`);
      if (!resp.ok) throw new Error("Impossible de récupérer le Gist");
      const data = await resp.json();
      csvUrl = Object.values(data.files)[0].raw_url;
      await loadCsv();
      showNotification("✅ Données mises à jour");
    } catch (err) {
      showNotification("❌ Erreur de mise à jour", "#dc3545");
      console.error(err);
    } finally {
      syncCsvBtn.classList.remove("btn-loading");
    }
  });
}

if (showMoreBtn) {
  showMoreBtn.addEventListener('click', () => {
    visibleCount += VISIBLE_STEP;
    renderPropertiesList();
  });
}


// =======================
// Navigation Mobile
// =======================
const navToggle = document.querySelector('.nav-toggle');
const navMenu = document.querySelector('.nav-menu');
navToggle.addEventListener('click', () => {
  navMenu.classList.toggle('show');
  navToggle.classList.toggle('active');
});

// =======================
// Initialisation
// =======================
(async function init() {
  try {
    const resp = await fetch(`https://api.github.com/gists/${gistId}`);
    if (resp.ok) {
      const data = await resp.json();
      const file = Object.values(data.files)[0];
      if (file?.raw_url) csvUrl = file.raw_url;
    }
  } catch (err) {
    console.error("Erreur lors de la récupération initiale du CSV :", err);
  }
  await loadCsv();
  renderItinerary();
})();
// --------------------
// Gestion Annonce
// --------------------
const announcementModal = document.getElementById("announcementModal");
const closeAnnouncement = document.getElementById("closeAnnouncement");
const ackCheckbox = document.getElementById("ackCheckbox");

// Carrousel
const track = document.querySelector(".carousel-track");
const prevBtn = document.querySelector(".carousel-btn.prev");
const nextBtn = document.querySelector(".carousel-btn.next");
let index = 0;

// Affiche la modale si non validée
window.addEventListener("load", () => {
  const announcementModal = document.getElementById("announcementModal");
  if (announcementModal) {
    const seen = localStorage.getItem("announcementSeen");
    if (!seen) {
      announcementModal.style.display = "block";
    }
  }
});

// Navigation carrousel
// nextBtn.addEventListener("click", () => {
//   const items = document.querySelectorAll(".carousel img");
//   index = (index + 1) % items.length;
//   track.style.transform = `translateX(-${index * 100}%)`;
// });

// prevBtn.addEventListener("click", () => {
//   const items = document.querySelectorAll(".carousel img");
//   index = (index - 1 + items.length) % items.length;
//   track.style.transform = `translateX(-${index * 100}%)`;
// });

// Fermer la modale
// closeAnnouncement.addEventListener("click", () => {
//   if (ackCheckbox.checked) {
//     localStorage.setItem("announcementSeen", "true");
//     announcementModal.style.display = "none";
//   } else {
//     alert("⚠️ Merci de cocher la case avant de fermer l’annonce.");
//   }
// });
// --- Import Firebase Firestore et Storage ---
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-storage.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

// --- Config identique à app.js ---
const firebaseConfig = {
  apiKey: "AIzaSyBzXEN0e-4dgh9NVVF7JGzpKtJrPnuzo0Y",
  authDomain: "copro-256d7.firebaseapp.com",
  projectId: "copro-256d7",
  storageBucket: "copro-256d7.firebasestorage.app",
  messagingSenderId: "665588381388",
  appId: "1:665588381388:web:a0567533ff1a62407db469",
  measurementId: "G-Y7YNZDDCTD"
};

// --- Initialisation ---
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);



