// ID du Gist et CSV initial (sera mis à jour automatiquement)
const gistId = "67645db75ea2d7228078345dc31667b1";
let csvUrl = "";

// Sélecteurs
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

let properties = [];
let selectedProperty = null;
let itinerary = [];

// Parse CSV simple mais prenant en compte les guillemets
function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  const headers = parseCsvLine(lines.shift());
  return lines.map(line => {
    const cols = parseCsvLine(line);
    let obj = {};
    headers.forEach((h, i) => {
      obj[h.toLowerCase()] = cols[i] ? cols[i].trim() : "";
    });
    return obj;
  });
}

// Parse une ligne CSV avec gestion des guillemets
function parseCsvLine(line) {
  const result = [];
  let current = '';
  let insideQuotes = false;

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

// Charge le CSV depuis csvUrl
async function loadCsv() {
  if (!csvUrl) {
    propertiesList.innerHTML = '<div class="empty-state" style="color:red;">Aucune URL CSV disponible</div>';
    return;
  }
  propertiesList.innerHTML = '<div class="empty-state">Chargement des copropriétés...</div>';
  try {
    const resp = await fetch(csvUrl, { cache: "no-store" });
    if (!resp.ok) throw new Error("Erreur lors du chargement du fichier CSV");
    const text = await resp.text();
    properties = parseCsv(text);
    renderPropertiesList();
  } catch (err) {
    propertiesList.innerHTML = `<div class="empty-state" style="color: red;">Erreur : ${err.message}</div>`;
    properties = [];
  }
}

// Affiche toutes les copropriétés
function renderPropertiesList() {
  if (!properties.length) {
    propertiesList.innerHTML = '<div class="empty-state">Aucune copropriété trouvée</div>';
    return;
  }
  propertiesList.innerHTML = "";
  properties.forEach((p, idx) => {
    const div = document.createElement('div');
    div.className = "property-card";
    div.innerHTML = `
      <div class="property-card-info">
        <div class="property-field"><label>Nom:</label> ${p.nom || "-"}</div>
        <div class="property-field"><label>Adresse:</label> ${p.adresse || "-"}</div>
        <div class="property-field"><label>Code:</label> ${p.code || "-"}</div>
      </div>
      <div class="property-actions">
        <button class="btn btn-small" data-idx="${idx}">Voir</button>
      </div>
    `;
    propertiesList.appendChild(div);
    div.querySelector('button').addEventListener('click', () => {
      selectProperty(idx);
    });
  });
}

// Recherche en temps réel
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

// Fermer la liste résultats si clic en dehors
document.addEventListener('click', e => {
  if (!searchResults.contains(e.target) && e.target !== searchInput) {
    searchResults.classList.remove('show');
  }
});

// Affiche les détails d'une copropriété
function showPropertyDetails(p) {
  propertyInfo.innerHTML = `
    <div><strong>Nom :</strong> ${p.nom || '-'}</div>
    <div><strong>Adresse :</strong> ${p.adresse || '-'}</div>
    <div><strong>Code :</strong> ${p.code || '-'}</div>
  `;
  propertyDetails.style.display = 'block';
}

// Ajoute à l'itinéraire
addToItineraryBtn.addEventListener('click', () => {
  if (!selectedProperty) return alert("Veuillez sélectionner une copropriété");
  if (itinerary.find(p => p.nom === selectedProperty.nom)) {
    alert("Cette copropriété est déjà dans votre itinéraire");
    return;
  }
  itinerary.push(selectedProperty);
  renderItinerary();
});

// Affiche l'itinéraire
function renderItinerary() {
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
      </div>
      <div class="property-actions">
        <button class="btn btn-danger btn-small" data-idx="${idx}">Supprimer</button>
      </div>
    `;
    itineraryList.appendChild(div);
    div.querySelector('button').addEventListener('click', () => {
      itinerary.splice(idx, 1);
      renderItinerary();
    });
  });
}

optimizeItineraryBtn.addEventListener('click', () => {
  if (!itinerary.length) return alert("Votre itinéraire est vide");

  const baseUrl = "https://www.google.com/maps/dir/";
  const waypoints = itinerary.map(p => encodeURIComponent(p.adresse)).join('/');

  // "Current Location" force Google Maps à partir de la position GPS actuelle
  const mapsUrl = `${baseUrl}Current+Location/${waypoints}`;
  window.open(mapsUrl, '_blank');
});


// Vider l'itinéraire
clearItineraryBtn.addEventListener('click', () => {
  if (confirm("Voulez-vous vraiment vider votre itinéraire ?")) {
    itinerary = [];
    renderItinerary();
  }
});


// Affiche une notification temporaire
function showNotification(message, color = "#28a745") {
  const notif = document.createElement("div");
  notif.className = "sync-notification";
  notif.textContent = message;
  notif.style.background = color;
  document.body.appendChild(notif);

  // Apparition
  setTimeout(() => notif.classList.add("show"), 50);

  // Disparition
  setTimeout(() => {
    notif.classList.remove("show");
    setTimeout(() => notif.remove(), 400);
  }, 2500);
}

// Synchroniser CSV depuis API GitHub avec animation
syncCsvBtn.addEventListener('click', async () => {
  try {
    // Animation bouton
    syncCsvBtn.classList.add("btn-loading");

    const resp = await fetch(`https://api.github.com/gists/${gistId}`);
    if (!resp.ok) throw new Error("Impossible de récupérer le Gist");
    const data = await resp.json();

    const files = data.files;
    const firstFile = Object.values(files)[0];
    csvUrl = firstFile.raw_url;

    await loadCsv();

    // Notification de succès
    showNotification("✅ Données mises à jour");
  } catch (err) {
    showNotification("❌ Erreur de mise à jour", "#dc3545");
  } finally {
    // Retire l'animation du bouton
    syncCsvBtn.classList.remove("btn-loading");
  }
});


// Sélection depuis la liste complète
function selectProperty(idx) {
  const p = properties[idx];
  selectedProperty = p;
  searchInput.value = p.nom;
  searchResults.innerHTML = "";
  searchResults.classList.remove('show');
  showPropertyDetails(p);
}

// Initialisation : récupère la dernière URL CSV avant chargement
(async function init() {
  try {
    const resp = await fetch(`https://api.github.com/gists/${gistId}`);
    if (resp.ok) {
      const data = await resp.json();
      const files = data.files;
      const firstFile = Object.values(files)[0];
      csvUrl = firstFile.raw_url;
    }
  } catch (err) {
    console.error("Erreur lors de la récupération initiale du CSV :", err);
  }
  loadCsv();
  renderItinerary();
})();
