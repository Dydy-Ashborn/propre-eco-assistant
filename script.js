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
const showMoreBtn = document.getElementById('showMoreBtn');

let properties = [];
let selectedProperty = null;
let itinerary = [];

// Pagination simple pour "Afficher plus"
let visibleCount = 4; // affiche 4 éléments au départ
const VISIBLE_STEP = 4;

// Parse CSV simple mais prenant en compte les guillemets
function parseCsv(text) {
  if (!text) return [];
  const lines = text.trim().split(/\r?\n/).filter(l => l.trim() !== "");
  if (!lines.length) return [];
  const headers = parseCsvLine(lines.shift()).map(h => h.trim());
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
  // reset pagination
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
    const text = await resp.text();
    properties = parseCsv(text);
    renderPropertiesList();
  } catch (err) {
    propertiesList.innerHTML = `<div class="empty-state" style="color: red;">Erreur : ${err.message}</div>`;
    properties = [];
    showMoreBtn.style.display = "none";
  }
}

// Affiche les copropriétés (avec pagination "Afficher plus")
function renderPropertiesList() {
  if (!properties.length) {
    propertiesList.innerHTML = '<div class="empty-state">Aucune copropriété trouvée</div>';
    showMoreBtn.style.display = "none";
    return;
  }

  propertiesList.innerHTML = "";

  const visibleSlice = properties.slice(0, visibleCount);
  visibleSlice.forEach((p, idx) => {
    const globalIdx = idx; // index relatif à la slice
    const div = document.createElement('div');
    div.className = "property-card";
    div.innerHTML = `
      <div class="property-card-info">
        <div class="property-field"><label>Nom:</label> ${p.nom || "-"}</div>
        <div class="property-field"><label>Adresse:</label> ${p.adresse || "-"}</div>
        <div class="property-field"><label>Code:</label> ${p.code || "-"}</div>
      </div>
      <div class="property-actions">
        <button class="btn btn-small" data-idx="${globalIdx}">Voir</button>
      </div>
    `;
    // bouton "Voir" doit référencer l'index réel dans "properties"
    // calcul de l'index réel = index dans visibleSlice + offset (ici 0)
    propertiesList.appendChild(div);
    div.querySelector('button').addEventListener('click', () => {
      // find the correct property by name (safer si index local)
      const prop = p;
      const idxReal = properties.indexOf(prop);
      if (idxReal >= 0) selectProperty(idxReal);
    });
  });

  // gestion du bouton "Afficher plus"
  if (visibleCount >= properties.length) {
    showMoreBtn.style.display = "none";
  } else {
    showMoreBtn.style.display = "inline-block";
  }
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
        if (!procedureRaw) {
          alert("Aucune procédure enregistrée pour cette copropriété.");
          return;
        }

        // Séparer en lignes et transformer en liste HTML
        const lines = procedureRaw.split("\n").map(l => l.trim()).filter(l => l);
        let html = "";
        lines.forEach(line => {
          if (line.startsWith("->")) {
            html += `<li>${line.replace("->", "").trim()}</li>`;
          } else {
            html += `<p><strong>${line}</strong></p>`;
          }
        });

        document.getElementById('procedureTitle').textContent = p.nom;
        document.getElementById('procedureText').innerHTML = `<ul>${html}</ul>`;
        document.getElementById('procedureModal').style.display = 'block';
      });
  });
}

// Fermer la modale (croix et clic extérieur)
document.querySelector('#procedureModal .close-btn').addEventListener('click', () => {
  document.getElementById('procedureModal').style.display = 'none';
});
window.addEventListener('click', (e) => {
  if (e.target.id === 'procedureModal') {
    document.getElementById('procedureModal').style.display = 'none';
  }
});



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
        <div><strong>Code : </strong>${p.code}</div>
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

// Ouvrir itinéraire Google Maps optimisé avec départ à la position actuelle
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
    console.error(err);
  } finally {
    // Retire l'animation du bouton
    syncCsvBtn.classList.remove("btn-loading");
  }
});

// Bouton "Afficher plus"
showMoreBtn.addEventListener('click', () => {
  visibleCount += VISIBLE_STEP;
  renderPropertiesList();
});

// Sélection depuis la liste complète (index réel)
function selectProperty(idx) {
  const p = properties[idx];
  if (!p) return;
  selectedProperty = p;
  searchInput.value = p.nom || "";
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
      const files = data.files || {};
      const firstFile = Object.values(files)[0];
      if (firstFile && firstFile.raw_url) {
        csvUrl = firstFile.raw_url;
      }
    }
  } catch (err) {
    console.error("Erreur lors de la récupération initiale du CSV :", err);
  }
  await loadCsv();
  renderItinerary();
})();

function openModal() {
  document.getElementById('procedureModal').style.display = 'block';
  document.body.style.overflow = 'hidden'; // ✅ bloque le scroll de la page
}

function closeModal() {
  document.getElementById('procedureModal').style.display = 'none';
  document.body.style.overflow = ''; // ✅ réactive le scroll de la page
}

document.querySelector('#procedureModal .close-btn').addEventListener('click', closeModal);
window.addEventListener('click', (e) => {
  if (e.target.id === 'procedureModal') closeModal();
});
