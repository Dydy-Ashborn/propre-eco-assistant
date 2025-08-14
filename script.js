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
    propertiesList.innerHTML = '<div class="empty-state" style="color:red;">Aucune URL CSV disponible</div>';
    showMoreBtn.style.display = "none";
    return;
  }
  propertiesList.innerHTML = '<div class="empty-state">Chargement des copropriétés...</div>';
  try {
    const resp = await fetch(csvUrl, { cache: "no-store" });
    if (!resp.ok) throw new Error("Erreur lors du chargement du fichier CSV");
    properties = parseCsv(await resp.text());
    renderPropertiesList();
  } catch (err) {
    propertiesList.innerHTML = `<div class="empty-state" style="color: red;">Erreur : ${err.message}</div>`;
    properties = [];
    showMoreBtn.style.display = "none";
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

document.addEventListener('click', e => {
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
      <button class="btn-action btn-procedure" id="showProcedureBtn">📄 Procédures</button>
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

document.querySelector('#procedureModal .close-btn').addEventListener('click', closeModal);
window.addEventListener('click', (e) => {
  if (e.target.id === 'procedureModal') closeModal();
});

// =======================
// Itinéraire
// =======================
function renderItinerary() {
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
      renderItinerary();
    });
    itineraryList.appendChild(div);
  });
}

addToItineraryBtn.addEventListener('click', () => {
  if (!selectedProperty) return alert("Veuillez sélectionner une copropriété");
  if (itinerary.find(p => p.nom === selectedProperty.nom)) {
    return alert("Cette copropriété est déjà dans votre itinéraire");
  }
  itinerary.push(selectedProperty);
  renderItinerary();
});

optimizeItineraryBtn.addEventListener('click', () => {
  if (!itinerary.length) return alert("Votre itinéraire est vide");

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(position => {
      const { latitude, longitude } = position.coords;
      const waypoints = itinerary.map(p => encodeURIComponent(p.adresse)).join('/');
      // On utilise la latitude et longitude pour le point de départ
      window.open(`https://www.google.com/maps/dir/${latitude},${longitude}/${waypoints}`, '_blank');
    }, error => {
      alert("Impossible de récupérer la position actuelle. Google Maps ouvrira sans point de départ précis.");
      const waypoints = itinerary.map(p => encodeURIComponent(p.adresse)).join('/');
      window.open(`https://www.google.com/maps/dir/${waypoints}`, '_blank');
    });
  } else {
    alert("La géolocalisation n'est pas supportée par votre navigateur.");
    const waypoints = itinerary.map(p => encodeURIComponent(p.adresse)).join('/');
    window.open(`https://www.google.com/maps/dir/${waypoints}`, '_blank');
  }
});


clearItineraryBtn.addEventListener('click', () => {
  if (confirm("Voulez-vous vraiment vider votre itinéraire ?")) {
    itinerary = [];
    renderItinerary();
  }
});

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

showMoreBtn.addEventListener('click', () => {
  visibleCount += VISIBLE_STEP;
  renderPropertiesList();
});

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
