// Import Firebase
import { db } from './config.js';
import { collection, getDocs, getDoc, deleteDoc, doc, updateDoc, addDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { initCoproManagement } from './dashboard-copro.js';
//TEMPS PAR DEFAUT POUR LE CHIFFRAGE (en minutes)
const TEMPS_DEFAUT = {
    'Vitres Standard': 6,
    'Baies Vitrées': 8,
    'Vitres Hautes': 10,
    'Vélux': 10,
    'Portes vitrées': 3,
    'Chambres avec placard': 30,
    'Chambres sans placard': 20,
    'Placards seuls': 10,
    'Grande SDB avec douche': 120,
    'Grande SDB avec baignoire': 120,
    'Grande SDB et dressing': 120,
    'Petite SDB avec douche': 60,
    'Petite SDB avec baignoire': 60,
    'WC seul': 15,
    'Dortoir avec placards': 60,
    'Mezzanine': 60,
    'Dressing': 30,
    'Petite cuisine': 40,
    'Grande cuisine': 60,
    'Sauna': 45,
    'Aspi trappe VMC': 20,
    'Cellier': 60,
    'Buanderie': 60,
    'WC lave-mains': 20,
    'Salle vidéo': 30,
    'Local technique': 30,
    'Escalier': 15,
    'Rambarde': 30,
    'Skiroom': 60,
    'Terrasse': 60,
    'Balcon': 30,
    'Chaufferie': 60,
    'Aspiration poutraison + mur': 60,
    'Ascenseur': 30,
    'Tapis entrée': 10,
    'Bureau': 30,
    'Garage': 60
};
// Configuration
const PASSWORD = "110389";
const ITEMS_PER_PAGE = 10;

let currentTab = 'overview';
let currentGalleryPhotos = [];
let currentPhotoIndex = 0;
let annoncePhotos = [];

// Données paginées
let allData = {
    feuilles_passage: [],
    photos_chantiers: [],
    signalements: [],
    consommables: [],
    devis: []
};

let currentPages = {
    feuilles_passage: 1,
    photos_chantiers: 1,
    signalements: 1,
    consommables: 1
};

// Init
document.addEventListener('DOMContentLoaded', () => {
    init();
});

function init() {
    checkAuth();
    setupEventListeners();
    setupSearch();

    // Initialiser les dates de la semaine courante pour l'onglet Heures
    const today = new Date();
    const currentWeek = getWeekNumber(today);
    const weekString = `${today.getFullYear()}-W${currentWeek.toString().padStart(2, '0')}`;

    // Définir les valeurs par défaut
    const weekStartInput = document.getElementById('filterWeekStart');
    const weekEndInput = document.getElementById('filterWeekEnd');
    if (weekStartInput) weekStartInput.value = weekString;
    if (weekEndInput) weekEndInput.value = weekString;
}

function getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

// ========== AUTH ==========
function checkAuth() {
    if (sessionStorage.getItem('dashboard_auth') === 'true') {
        showDashboard();
    } else {
        showLogin();
    }
}

function showLogin() {
    document.getElementById('loginModal').style.display = 'flex';
    document.getElementById('dashboardContent').style.display = 'none';
}

function showDashboard() {
    document.getElementById('loginModal').style.display = 'none';
    document.getElementById('dashboardContent').style.display = 'block';
    switchTab(currentTab);
}

function handleLogin(e) {
    e.preventDefault();
    const password = document.getElementById('passwordInput').value;

    if (password === PASSWORD) {
        sessionStorage.setItem('dashboard_auth', 'true');
        showDashboard();
    } else {
        const errorDiv = document.getElementById('loginError');
        errorDiv.style.display = 'flex';
        setTimeout(() => errorDiv.style.display = 'none', 3000);
    }
}

function handleLogout() {
    sessionStorage.removeItem('dashboard_auth');
    showLogin();
}

// ========== EVENT LISTENERS ==========
function setupEventListeners() {
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('logoutBtn')?.addEventListener('click', handleLogout);

    document.querySelectorAll('.tab-btn[data-tab]').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    document.getElementById('btnCreateAnnonce')?.addEventListener('click', showAnnonceForm);
    document.getElementById('btnCancelAnnonce')?.addEventListener('click', hideAnnonceForm);
    document.getElementById('btnSaveAnnonce')?.addEventListener('click', saveAnnonce);
    document.getElementById('annoncePhotos')?.addEventListener('change', handleAnnoncePhotos);

    document.getElementById('downloadAllFeuilles')?.addEventListener('click', downloadAllFeuilles);
    document.getElementById('downloadAllPhotosChantiers')?.addEventListener('click', downloadAllPhotosChantiers);
}

// ========== ONGLETS ==========
function switchTab(tab) {
    currentTab = tab;

    if (tab !== 'heures' && typeof heuresCache !== 'undefined') {
        heuresCache = {};
    }

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tab);
    });

    document.querySelectorAll('.card-section').forEach(section => {
        section.style.display = 'none';
    });

    const section = document.getElementById(`section-${tab}`);
    if (section) {
        section.style.display = 'block';
        loadCurrentTab();
    }
}

function loadCurrentTab() {
    switch (currentTab) {
        case 'overview':
            loadOverview();
            break;
        case 'feuilles_passage':
            loadFeuillesPassage();
            break;
        case 'photos_chantiers':
            loadPhotosChantiers();
            break;
        case 'signalements':
            loadSignalements();
            break;
        case 'consommables':
            loadConsommables();
            break;
        case 'annonces':
            loadAnnonces();
            break;
        case 'devis':
            loadDevis();
            break;
        case 'heures':
            loadHeures();
            break;
        case 'copro':
            initCoproManagement();
            break;
    }
}
// ========== VUE D'ENSEMBLE ==========
async function loadOverview() {
    showLoading('overview');

    // Date affichée
    const today = new Date();
    const dateEl = document.getElementById('overviewDate');
    if (dateEl) {
        dateEl.textContent = today.toLocaleDateString('fr-FR', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
        });
    }

    // Semaine courante
    const currentWeek = getWeekNumber(today);
    const weekString = `${today.getFullYear()}-W${currentWeek.toString().padStart(2, '0')}`;

    // Timestamp début de semaine (lundi)
    const dayOfWeek = today.getDay() || 7;
    const monday = new Date(today);
    monday.setDate(today.getDate() - dayOfWeek + 1);
    monday.setHours(0, 0, 0, 0);

    try {
        // Charger tout en parallèle
        const [
            photosSnap,
            consommablesSnap,
            signalementsSnap,
            devisSnap,
            coprosSnap
        ] = await Promise.all([
            getDocs(collection(db, 'photos_chantiers')),
            getDocs(collection(db, 'consommables')),
            getDocs(collection(db, 'signalements')),
            getDocs(collection(db, 'devis')),
            getDocs(collection(db, 'coproprietes'))
        ]);

        // 📸 Photos chantiers
        const totalChantiers = photosSnap.size;

        document.getElementById('kpi-photos').textContent = totalChantiers;


        // 🧴 Consommables à facturer
        let aFacturer = 0;
        consommablesSnap.forEach(doc => {
            if (!doc.data().facture) aFacturer++;
        });

        // 🚨 Signalements
        const totalSignalements = signalementsSnap.size;

        // 📑 Devis en attente
        let devisEnAttente = 0;
        devisSnap.forEach(doc => {
            if (doc.data().status !== 'chiffre') devisEnAttente++;
        });

        // 🏢 Copros incomplètes (logique identique à ton module copro)
        let coprosIncompletes = 0;
        coprosSnap.forEach(doc => {
            const c = doc.data();
            const hasProcedures = c.procedures && c.procedures.trim().length > 0;
            const hasCode = c.code && c.code.trim().length > 0;

            if (!hasProcedures || !hasCode) {
                coprosIncompletes++;
            }
        });


        // const totalHeuresSemaine = weekResults.reduce((a, b) => a + b, 0);

        // Afficher les KPIs
        const kpiMap = {
            'kpi-photos': totalChantiers,
            'kpi-consommables': aFacturer,
            'kpi-signalements': totalSignalements,
            'kpi-devis': devisEnAttente,
            'kpi-copros': coprosIncompletes
        };

        Object.entries(kpiMap).forEach(([id, value]) => {
            const el = document.getElementById(id);
            if (!el) return;
            el.textContent = value;
            const card = el.closest('.kpi-card');
            if (card) card.style.display = value === 0 ? 'none' : '';
        });

      // Badge rouge si signalements ou devis en attente
        const kpiSignEl = document.getElementById('kpi-signalements');
        if (totalSignalements > 0) kpiSignEl.closest('.kpi-card').classList.add('kpi-alert');

        const kpiDevisEl = document.getElementById('kpi-devis');
        if (devisEnAttente > 0) kpiDevisEl.closest('.kpi-card').classList.add('kpi-alert');

        showContent('overview'); // ← doit être présent ici

    } catch (error) {
        console.error('Erreur overview:', error);
        showError('overview', error.message);
    }
}

window.switchTabPublic = function (tab) {
    switchTab(tab);
};


// ========== FEUILLES DE PASSAGE ==========
async function loadFeuillesPassage() {
    showLoading('feuilles_passage');

    try {
        const snapshot = await getDocs(collection(db, 'feuilles_passage'));

        allData.feuilles_passage = [];
        snapshot.forEach(doc => {
            allData.feuilles_passage.push({ id: doc.id, ...doc.data() });
        });

        // Trier par date
        allData.feuilles_passage.sort((a, b) => {
            const dateA = a.createdAt?.seconds || 0;
            const dateB = b.createdAt?.seconds || 0;
            return dateB - dateA;
        });

        window.allFeuillesPassage = allData.feuilles_passage;
        renderFeuillesPassage();
        showContent('feuilles_passage');
    } catch (error) {
        console.error('Erreur feuilles:', error);
        showError('feuilles_passage', error.message);
    }
}

function renderFeuillesPassage() {
    const container = document.getElementById('content-feuilles_passage');
    const page = currentPages.feuilles_passage;
    const start = (page - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    const pageData = allData.feuilles_passage.slice(start, end);

    container.innerHTML = '<div class="chantiers-list"></div>';
    const listContainer = container.querySelector('.chantiers-list');

    pageData.forEach((feuille, index) => {
        const globalIndex = start + index;
        const date = formatDate(feuille.createdAt);
        listContainer.innerHTML += `
            <div class="chantier-item">
                <div class="chantier-thumb-container">
                    <img src="${feuille.url}" class="chantier-thumb" 
                         onclick="openFeuilleGallery('${feuille.id}')"" alt="Feuille">
                </div>
                <div class="chantier-info">
                    <div class="chantier-name">${feuille.copro || 'Non specifiee'}</div>
                    <div class="chantier-meta">${feuille.agent || 'Non specifie'}</div>
                </div>
                <div class="chantier-date">${date}</div>
                <div class="chantier-actions">
                    <button class="btn-icon danger" onclick="deleteFeuille('${feuille.id}')" title="Supprimer">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    });

    renderPagination('feuilles_passage', allData.feuilles_passage.length);
}
// Fonction de suppression de feuille
window.deleteFeuille = async function (feuilleId) {
    showConfirmModal({
        title: 'Supprimer cette feuille de passage ?',
        message: 'Cette action est irréversible. La feuille sera définitivement supprimée.',
        confirmText: 'Supprimer',
        cancelText: 'Annuler',
        onConfirm: async () => {
            try {
                await deleteDoc(doc(db, 'feuilles_passage', feuilleId));

                // Supprimer de allData
                allData.feuilles_passage = allData.feuilles_passage.filter(f => f.id !== feuilleId);

                // Re-render
                renderFeuillesPassage();

                showNotification('Feuille supprimee avec succès', 'success');
            } catch (error) {
                console.error('Erreur suppression feuille:', error);
                showNotification('Erreur lors de la suppression', 'error');
            }
        }
    });
};

// ========== PHOTOS CHANTIERS ==========
async function loadPhotosChantiers() {
    showLoading('photos_chantiers');

    try {
        const snapshot = await getDocs(collection(db, 'photos_chantiers'));

        allData.photos_chantiers = [];
        snapshot.forEach(doc => {
            allData.photos_chantiers.push({ id: doc.id, ...doc.data() });
        });

        allData.photos_chantiers.sort((a, b) => {
            const dateA = a.createdAt?.seconds || 0;
            const dateB = b.createdAt?.seconds || 0;
            return dateB - dateA;
        });

        window.allPhotosChantiers = allData.photos_chantiers;
        renderPhotosChantiers();
        showContent('photos_chantiers');
    } catch (error) {
        console.error('Erreur chantiers:', error);
        showError('photos_chantiers', error.message);
    }
}

function renderPhotosChantiers() {
    const container = document.getElementById('content-photos_chantiers');
    const page = currentPages.photos_chantiers;
    const start = (page - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    const pageData = allData.photos_chantiers.slice(start, end);

    container.innerHTML = '';

    pageData.forEach((chantier, index) => {
        const globalIndex = start + index;
        const date = formatDate(chantier.createdAt);
        const photoCount = chantier.photos?.length || 0;
        const firstPhoto = chantier.photos?.[0]?.url || '';
        const description = chantier.description ? chantier.description.substring(0, 50) + (chantier.description.length > 50 ? '...' : '') : '';

        container.innerHTML += `
            <div class="chantier-item">
                <div class="chantier-thumb-container">
                    <img src="${firstPhoto}" class="chantier-thumb" 
                         onclick="openPhotoGallery('${chantier.id}', 0)" alt="Chantier">
                    <span class="photo-badge">+${photoCount}</span>
                </div>
                <div class="chantier-info">
                    <div class="chantier-name">${chantier.chantier || 'Non spécifié'}</div>
                    <div class="chantier-meta">${chantier.agent || 'Agent non spécifié'}${description ? ' - ' + description : ''}</div>
                </div>
                <div class="chantier-date">${date}</div>
                <div class="chantier-actions">
                    <button class="btn-icon" onclick="downloadSingleChantier('${chantier.id}')" title="Télécharger">
                        <i class="fas fa-download"></i>
                    </button>
                    <button class="btn-icon danger" onclick="deleteChantier('${chantier.id}')" title="Supprimer">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    });

    renderPagination('photos_chantiers', allData.photos_chantiers.length);
}

// ========== SIGNALEMENTS ==========
async function loadSignalements() {
    showLoading('signalements');

    try {
        const snapshot = await getDocs(collection(db, 'signalements'));

        allData.signalements = [];
        snapshot.forEach(doc => {
            allData.signalements.push({ id: doc.id, ...doc.data() });
        });

        allData.signalements.sort((a, b) => {
            const dateA = a.createdAt?.seconds || 0;
            const dateB = b.createdAt?.seconds || 0;
            return dateB - dateA;
        });

        window.allSignalements = allData.signalements;
        renderSignalements();
        showContent('signalements');
    } catch (error) {
        console.error('Erreur signalements:', error);
        showError('signalements', error.message);
    }
}

function renderSignalements() {
    const container = document.getElementById('content-signalements');
    const page = currentPages.signalements;
    const start = (page - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    const pageData = allData.signalements.slice(start, end);

    container.innerHTML = '';

    pageData.forEach((signalement, index) => {
        const date = formatDate(signalement.createdAt);
        const photoCount = signalement.images?.length || 0;
        const firstPhoto = signalement.images?.[0]?.url || '';
        const description = signalement.description ? signalement.description.substring(0, 50) + (signalement.description.length > 50 ? '...' : '') : '';

        container.innerHTML += `
            <div class="chantier-item">
                ${photoCount > 0 ? `
                    <div class="chantier-thumb-container">
                        <img src="${firstPhoto}" class="chantier-thumb" 
                             onclick="openSignalementGallery('${signalement.id}', 0)" alt="Signalement">
                        ${photoCount > 1 ? `<span class="photo-badge">+${photoCount}</span>` : ''}
                    </div>
                ` : ''}
                <div class="chantier-info">
                    <div class="chantier-name">${signalement.copro || 'Non spécifiée'}</div>
                    <div class="chantier-meta">${signalement.employee || 'Employé non spécifié'}${description ? ' - ' + description : ''}</div>
                </div>
                <div class="chantier-date">${date}</div>
                <div class="chantier-actions">
                    <button class="btn-icon danger" onclick="deleteSignalement('${signalement.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    });

    renderPagination('signalements', allData.signalements.length);
}

// ========== CONSOMMABLES ==========
async function loadConsommables() {
    showLoading('consommables');

    try {
        const snapshot = await getDocs(collection(db, 'consommables'));

        allData.consommables = [];
        snapshot.forEach(doc => {
            allData.consommables.push({ id: doc.id, ...doc.data() });
        });

        allData.consommables.sort((a, b) => {
            const dateA = a.createdAt?.seconds || 0;
            const dateB = b.createdAt?.seconds || 0;
            return dateB - dateA;
        });

        renderConsommables();
        showContent('consommables');
    } catch (error) {
        console.error('Erreur consommables:', error);
        showError('consommables', error.message);
    }
}

function renderConsommables() {
    const container = document.getElementById('content-consommables');
    const page = currentPages.consommables;
    const start = (page - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    const pageData = allData.consommables.slice(start, end);

    container.innerHTML = '';

    pageData.forEach((item) => {
        const date = formatDate(item.createdAt);
        const photoUrl = item.images?.[0]?.url || '';
        const factureStatus = item.facture ?
            '<span style="color: #059669;"><i class="fas fa-check-circle"></i> Facturé</span>' :
            '<span style="color: #d97706;"><i class="fas fa-clock"></i> A facturer</span>';

        container.innerHTML += `
            <div class="chantier-item">
                ${photoUrl ? `
                    <div class="chantier-thumb-container">
                        <img src="${photoUrl}" class="chantier-thumb"
                             onclick="openConsommableGallery('${item.id}')" alt="Consommable">
                    </div>
                ` : ''}
                <div class="chantier-info">
                    <div class="chantier-name">${item.type || 'Non spécifié'} - ${item.quantite || 0} unité(s)</div>
                    <div class="chantier-meta">${item.copro || 'Copro non spécifiée'} - ${item.employee || 'Employé non spécifié'}</div>
                    <div class="chantier-meta">${factureStatus}</div>
                </div>
                <div class="chantier-date">${date}</div>
                <div class="chantier-actions">
                    ${!item.facture ? `
                        <button class="btn-icon" onclick="marquerFacture('${item.id}')" title="Facturer">
                            <i class="fas fa-file-invoice-dollar"></i>
                        </button>
                    ` : ''}
                    <button class="btn-icon danger" onclick="deleteConsommable('${item.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    });

    renderPagination('consommables', allData.consommables.length);
}


// ========== PAGINATION ==========
function renderPagination(tab, totalItems) {
    const container = document.getElementById(`pagination-${tab}`);
    if (!container) return;

    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    const currentPage = currentPages[tab];

    if (totalPages <= 1) {
        container.style.display = 'none';
        return;
    }

    container.style.display = 'flex';

    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE + 1;
    const endIndex = Math.min(currentPage * ITEMS_PER_PAGE, totalItems);

    container.innerHTML = `
        <div class="pagination-info">
            Affichage de ${startIndex} à  ${endIndex} sur ${totalItems} éléments
        </div>
        <div class="pagination-controls">
            <button class="btn-pagination" ${currentPage === 1 ? 'disabled' : ''} onclick="changePage('${tab}', -1)">
                <i class="fas fa-chevron-left"></i> Précédent
            </button>
            <div class="page-numbers">
                ${generatePageNumbers(currentPage, totalPages, tab)}
            </div>
            <button class="btn-pagination" ${currentPage === totalPages ? 'disabled' : ''} onclick="changePage('${tab}', 1)">
                Suivant <i class="fas fa-chevron-right"></i>
            </button>
        </div>
    `;
}

function generatePageNumbers(current, total, tab) {
    let html = '';

    for (let i = 1; i <= total; i++) {
        if (i === 1 || i === total || (i >= current - 2 && i <= current + 2)) {
            html += `<button class="page-number ${i === current ? 'active' : ''}" onclick="goToPage('${tab}', ${i})">${i}</button>`;
        } else if (i === current - 3 || i === current + 3) {
            html += '<span>...</span>';
        }
    }

    return html;
}

window.changePage = function (tab, delta) {
    const totalPages = Math.ceil(allData[tab].length / ITEMS_PER_PAGE);
    const newPage = currentPages[tab] + delta;

    if (newPage >= 1 && newPage <= totalPages) {
        currentPages[tab] = newPage;

        // Re-render selon le type
        if (tab === 'feuilles_passage') renderFeuillesPassage();
        else if (tab === 'photos_chantiers') renderPhotosChantiers();
        else if (tab === 'signalements') renderSignalements();
        else if (tab === 'consommables') renderConsommables();

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
};

window.goToPage = function (tab, page) {
    currentPages[tab] = page;

    if (tab === 'feuilles_passage') renderFeuillesPassage();
    else if (tab === 'photos_chantiers') renderPhotosChantiers();
    else if (tab === 'signalements') renderSignalements();
    else if (tab === 'consommables') renderConsommables();

    window.scrollTo({ top: 0, behavior: 'smooth' });
};

// ========== ANNONCES ==========
async function loadAnnonces() {
    showLoading('annonces');

    try {
        const snapshot = await getDocs(collection(db, 'annonces'));

        const container = document.getElementById('content-annonces');
        container.innerHTML = '';

        const annonces = [];
        snapshot.forEach(doc => {
            annonces.push({ id: doc.id, ...doc.data() });
        });

        if (annonces.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-inbox"></i><p>Aucune annonce</p></div>';
        } else {
            annonces.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
            annonces.forEach(annonce => {
                const date = formatDate(annonce.createdAt);

                let photosHtml = '';
                if (annonce.photos && annonce.photos.length > 0) {
                    photosHtml = `
                        <div class="photos-preview" style="margin-top: 1rem;">
                            ${annonce.photos.map(photo => `
                                <div class="preview-item">
                                    <img src="${photo}" alt="Photo" onclick="window.open('${photo}', '_blank')" style="cursor: pointer;">
                                </div>
                            `).join('')}
                        </div>
                    `;
                }

                container.innerHTML += `
                    <div class="annonce-card">
                        <div class="annonce-header">
                            <div>
                                <h3 class="annonce-title">${escapeHtml(annonce.title || annonce.titre || '')}</h3>
                                <div class="annonce-date">${date}</div>
                            </div>
                            <button class="btn-icon danger" onclick="deleteAnnonce('${annonce.id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                        <div class="annonce-message">${escapeHtml(annonce.message || '')}</div>
                        ${photosHtml}
                    </div>
                `;
            });
        }

        showContent('annonces');
    } catch (error) {
        console.error('Erreur annonces:', error);
        showError('annonces', error.message);
    }
}

function showAnnonceForm() {
    document.getElementById('formAnnonce').style.display = 'block';
}

function hideAnnonceForm() {
    document.getElementById('formAnnonce').style.display = 'none';
    document.getElementById('annonceTitre').value = '';
    document.getElementById('annonceMessage').value = '';
    document.getElementById('annoncePhotos').value = '';
    document.getElementById('annoncePreview').innerHTML = '';
    annoncePhotos = [];
}

function handleAnnoncePhotos(e) {
    const files = Array.from(e.target.files);

    files.forEach(file => {
        const reader = new FileReader();
        reader.onload = (event) => {
            annoncePhotos.push(event.target.result);
            updateAnnoncePreview();
        };
        reader.readAsDataURL(file);
    });
}

function updateAnnoncePreview() {
    const preview = document.getElementById('annoncePreview');
    preview.innerHTML = annoncePhotos.map((photo, index) => `
        <div class="preview-item">
            <img src="${photo}" alt="Photo">
            <button class="remove-photo" onclick="removeAnnoncePhoto(${index})">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `).join('');
}

window.removeAnnoncePhoto = function (index) {
    annoncePhotos.splice(index, 1);
    updateAnnoncePreview();
};

async function uploadAnnoncePhotoToImgBB(base64Data) {
    const IMGBB_API_KEY = "5667189ac916d67ca3e097312dd0443a";
    const base64Clean = base64Data.split(',')[1];
    const formData = new FormData();
    formData.append('image', base64Clean);

    const resp = await fetch('https://api.imgbb.com/1/upload?key=' + IMGBB_API_KEY, {
        method: 'POST',
        body: formData
    });

    if (!resp.ok) throw new Error('Upload ImgBB failed');
    const data = await resp.json();
    return data.data.url;
}

async function saveAnnonce() {
    const titre = document.getElementById('annonceTitre').value.trim();
    const message = document.getElementById('annonceMessage').value.trim();

    if (!titre || !message) {
        alert('Veuillez remplir le titre et le message');
        return;
    }

    try {
        // Upload photos sur ImgBB
        let photoUrls = [];
        if (annoncePhotos.length > 0) {
            const btn = document.getElementById('btnSaveAnnonce');
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Upload photos...';
            btn.disabled = true;

            for (let i = 0; i < annoncePhotos.length; i++) {
                btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Photo ' + (i + 1) + '/' + annoncePhotos.length + '...';
                try {
                    const url = await uploadAnnoncePhotoToImgBB(annoncePhotos[i]);
                    photoUrls.push(url);
                } catch (err) {
                    console.error('Erreur upload photo ' + (i + 1) + ':', err);
                }
            }

            btn.innerHTML = originalText;
            btn.disabled = false;
        }

        await addDoc(collection(db, 'annonces'), {
            title: titre,
            message: message,
            photos: photoUrls,
            createdAt: new Date()
        });

        alert('Annonce publiée !');
        hideAnnonceForm();
        loadAnnonces();
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors de la publication');
    }
}


// ========== DEVIS ==========
async function loadDevis() {
    showLoading('devis');

    try {
        const snapshot = await getDocs(collection(db, 'devis'));

        const container = document.getElementById('content-devis');
        container.innerHTML = '';

        const devisList = [];
        snapshot.forEach(doc => {
            devisList.push({ id: doc.id, ...doc.data() });
        });

        allData.devis = devisList; // Stocker pour le chiffrage

        if (devisList.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-inbox"></i><p>Aucun devis</p></div>';
        } else {
            devisList.sort((a, b) => (b.dateCreation || 0) - (a.dateCreation || 0));
            devisList.forEach(devis => {
                container.innerHTML += createDevisCard(devis);
            });
        }

        showContent('devis');
    } catch (error) {
        console.error('Erreur devis:', error);
        showError('devis', error.message);
    }
}

function createDevisCard(devis) {
    let dateAffichee = 'Date inconnue';
    if (devis.dateCreation) {
        const dateObj = devis.dateCreation.toDate ? devis.dateCreation.toDate() : new Date(devis.dateCreation);
        dateAffichee = dateObj.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    const totalElements =
        (devis.vitres?.standard || 0) +
        (devis.vitres?.baies || 0) +
        (devis.vitres?.hautes ? 1 : 0) +
        (devis.chambres?.total || 0) +
        (devis.sallesDeBain?.total || 0) +
        (devis.piecesAnnexes?.length || 0) +
        (devis.exterieurs?.balcon ? 1 : 0) +
        (devis.exterieurs?.terrasse ? 1 : 0);

    const isChiffre = devis.status === 'chiffre';
    const statusLabel = isChiffre ? 'Chiffré' : 'En attente';
    const statusClass = isChiffre ? 'success' : 'warning';

    let tempsFormate = '--';
    if (devis.totalTemps) {
        const tempsMn = devis.totalTempsMn || (devis.totalTemps * 60);
        const heures = Math.floor(tempsMn / 60);
        const minutes = Math.round(tempsMn % 60);
        tempsFormate = `${heures}h${minutes.toString().padStart(2, '0')}`;
    }

    const prixHT = devis.totalPrixHT || devis.totalPrix || 0;
    const prixTTC = devis.totalPrixTTC || (prixHT * 1.22);

    return `
        <div class="devis-card ${isChiffre ? 'devis-card--chiffre' : ''}" id="devis-${devis.id}">
            <div class="devis-card-header">
                <div class="devis-info">
                    <h3>${escapeHtml(devis.nomChantier || 'Devis sans nom')}</h3>
                    <div class="devis-meta">
                        <span><i class="fas fa-calendar"></i> ${dateAffichee}</span>
                        <span><i class="fas fa-home"></i> ${totalElements} éléments</span>
                        <span class="badge badge-${statusClass}">${statusLabel}</span>
                    </div>
                </div>
                <div class="devis-header-right">
                    ${isChiffre ? `
                        <div class="devis-totaux-inline">
                            <div class="devis-total-tag temps-tag">
                                <i class="fas fa-clock"></i>
                                <span>${tempsFormate}</span>
                            </div>
                            <div class="devis-total-tag prix-tag prix-ht-tag">
                                <div class="prix-label">HT</div>
                                <span>${prixHT.toFixed(2)}€</span>
                            </div>
                            <div class="devis-total-tag prix-tag prix-ttc-tag">
                                <div class="prix-label">TTC</div>
                                <span>${prixTTC.toFixed(2)}€</span>
                            </div>
                            <button class="btn-icon-action btn-icon-edit" onclick="event.stopPropagation(); openChiffrageModal('${devis.id}')" title="Modifier le chiffrage">
                                <i class="fas fa-pen"></i>
                            </button>
                            <button class="btn-icon-action btn-icon-pdf" onclick="event.stopPropagation(); downloadDevisPDF('${devis.id}')" title="Télécharger PDF">
                                <i class="fas fa-file-pdf"></i>
                            </button>
                            <button class="btn-icon-action btn-icon-delete" onclick="event.stopPropagation(); deleteDevis('${devis.id}')" title="Supprimer">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    ` : `
                        <button class="btn btn-primary" onclick="event.stopPropagation(); openChiffrageModal('${devis.id}')">
                            <i class="fas fa-calculator"></i> Chiffrer
                        </button>
                        <button class="btn-icon-action btn-icon-delete" onclick="event.stopPropagation(); deleteDevis('${devis.id}')" title="Supprimer">
                            <i class="fas fa-trash"></i>
                        </button>
                    `}
                </div>
            </div>
            <div class="devis-details" id="details-${devis.id}">
                ${createDevisDetails(devis)}
            </div>
        </div>
    `;
}

function createDevisDetails(devis) {
    let html = '<div class="detail-section"><h4><i class="fas fa-home"></i> Détails du bien</h4><div class="detail-grid">';

    // Section Vitres
    if (devis.vitres?.standard > 0) html += `<div class="detail-item"><strong>Vitres Standard</strong><span>${devis.vitres.standard}</span></div>`;
    if (devis.vitres?.baies > 0) html += `<div class="detail-item"><strong>Baies vitrées</strong><span>${devis.vitres.baies}</span></div>`;
    if (devis.vitres?.hautes > 0) html += `<div class="detail-item"><strong>Vitres hautes</strong><span>${devis.vitres.hautes}</span></div>`;

    // Section Chambres
    if (devis.chambres?.avecPlacard > 0) html += `<div class="detail-item"><strong>Chambres (+placard)</strong><span>${devis.chambres.avecPlacard}</span></div>`;
    if (devis.chambres?.sansPlacard > 0) html += `<div class="detail-item"><strong>Chambres (simple)</strong><span>${devis.chambres.sansPlacard}</span></div>`;

    // Section Salles de bain
    if (devis.sallesDeBain?.total > 0) html += `<div class="detail-item"><strong>Salles de bain (Total)</strong><span>${devis.sallesDeBain.total}</span></div>`;

    html += '</div></div>';

    // Section Grattage
    if (devis.grattage && Object.values(devis.grattage).some(v => v === true)) {
        html += '<div class="detail-section"><h4><i class="fas fa-exclamation-triangle"></i> Grattage nécessaire</h4><div class="grattage-tags">';
        if (devis.grattage.standard) html += '<span class="grattage-tag">Vitres standard</span>';
        if (devis.grattage.baies) html += '<span class="grattage-tag">Baies vitrées</span>';
        if (devis.grattage.velux) html += '<span class="grattage-tag">Vélux</span>';
        if (devis.grattage.hautes) html += '<span class="grattage-tag">Vitres hautes</span>';
        html += '</div></div>';
    }

    // Section Remarques
    if (devis.remarques) {
        html += `<div class="detail-section"><h4><i class="fas fa-comment"></i> Remarques agent</h4><p style="background: #f9fafb; padding: 1rem; border-radius: 6px;">${escapeHtml(devis.remarques)}</p></div>`;
    }

    return html;
}

window.toggleDevisDetails = function (id) {
    const details = document.getElementById(`details-${id}`);
    details.classList.toggle('show');
};

// ========== CAROUSEL ==========
window.openPhotoGallery = function (chantierID, startIndex = 0) {
    const chantier = window.allPhotosChantiers.find(c => c.id === chantierID);
    if (!chantier || !chantier.photos || chantier.photos.length === 0) return;

    currentGalleryPhotos = chantier.photos;
    currentPhotoIndex = startIndex;

    createAndShowGalleryModal(chantier.chantier, chantier.description);
};

window.openFeuilleGallery = function (feuilleId) {
    const feuille = allData.feuilles_passage.find(f => f.id === feuilleId);
    if (!feuille) return;

    currentGalleryPhotos = [{ url: feuille.url }];
    currentPhotoIndex = 0;

    createAndShowGalleryModal(feuille.copro, feuille.agent);
};


window.openSignalementGallery = function (signalementID, startIndex = 0) {
    const signalement = window.allSignalements.find(s => s.id === signalementID);
    if (!signalement || !signalement.images || signalement.images.length === 0) return;

    currentGalleryPhotos = signalement.images;
    currentPhotoIndex = startIndex;

    createAndShowGalleryModal(signalement.copro, signalement.description);
};

window.openConsommableGallery = function (consommableID, startIndex = 0) {
    const consommable = allData.consommables.find(c => c.id === consommableID);
    if (!consommable || !consommable.images || consommable.images.length === 0) return;

    currentGalleryPhotos = consommable.images;
    currentPhotoIndex = startIndex;

    createAndShowGalleryModal(consommable.type || 'Consommable', consommable.copro || '');
};

function createAndShowGalleryModal(title, description) {
    let modal = document.getElementById('photoGalleryModal');

    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'photoGalleryModal';
        modal.className = 'photo-gallery-modal';
        modal.innerHTML = `
            <div class="gallery-overlay" onclick="closePhotoGallery()"></div>
            <div class="gallery-container">
                <div class="gallery-header">
                    <div class="gallery-info">
                        <h3 id="galleryTitle"></h3>
                        <p id="galleryDescription"></p>
                    </div>
                    <button class="gallery-close" onclick="closePhotoGallery()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="gallery-main">
                    <div class="gallery-image-container">
                        <button class="gallery-nav gallery-prev" onclick="prevPhoto()">
                            <i class="fas fa-chevron-left"></i>
                        </button>
                        <div class="gallery-image-wrapper">
                            <img id="galleryMainImage" src="" alt="Photo">
                        </div>
                        <button class="gallery-nav gallery-next" onclick="nextPhoto()">
                            <i class="fas fa-chevron-right"></i>
                        </button>
                        <div class="gallery-counter">
                            <span id="photoCounter"></span>
                        </div>
                    </div>
                    <div class="gallery-thumbnails" id="galleryThumbnails"></div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            const m = document.getElementById('photoGalleryModal');
            if (!m || !m.classList.contains('active')) return;
            if (e.key === 'ArrowLeft') prevPhoto();
            else if (e.key === 'ArrowRight') nextPhoto();
            else if (e.key === 'Escape') closePhotoGallery();
        });
    }

    document.getElementById('galleryTitle').textContent = title || 'Photos';
    document.getElementById('galleryDescription').textContent = description || '';

    updateGalleryImage();
    updateGalleryThumbnails();

    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    setTimeout(() => modal.classList.add('active'), 10);
}

function updateGalleryImage() {
    const img = document.getElementById('galleryMainImage');
    const counter = document.getElementById('photoCounter');

    if (currentGalleryPhotos[currentPhotoIndex]) {
        img.src = currentGalleryPhotos[currentPhotoIndex].url;
        counter.textContent = `${currentPhotoIndex + 1} / ${currentGalleryPhotos.length}`;
    }

    // Hide nav/thumbnails if only one photo
    const single = currentGalleryPhotos.length <= 1;
    document.querySelectorAll('.gallery-nav').forEach(btn => btn.style.display = single ? 'none' : '');
    const thumbs = document.getElementById('galleryThumbnails');
    if (thumbs) thumbs.style.display = single ? 'none' : '';
    if (counter) counter.parentElement.style.display = single ? 'none' : '';
}

function updateGalleryThumbnails() {
    const container = document.getElementById('galleryThumbnails');
    container.innerHTML = currentGalleryPhotos.map((photo, index) => `
        <img src="${photo.url}" 
             class="gallery-thumb ${index === currentPhotoIndex ? 'active' : ''}" 
             onclick="goToPhoto(${index})" 
             alt="Thumbnail">
    `).join('');
}

window.prevPhoto = function () {
    currentPhotoIndex = currentPhotoIndex > 0 ?
        currentPhotoIndex - 1 :
        currentGalleryPhotos.length - 1;
    updateGalleryImage();
    updateGalleryThumbnails();
};

window.nextPhoto = function () {
    currentPhotoIndex = (currentPhotoIndex + 1) % currentGalleryPhotos.length;
    updateGalleryImage();
    updateGalleryThumbnails();
};

window.goToPhoto = function (index) {
    currentPhotoIndex = index;
    updateGalleryImage();
    updateGalleryThumbnails();
};

window.closePhotoGallery = function () {
    const modal = document.getElementById('photoGalleryModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        setTimeout(() => modal.style.display = 'none', 300);
    }
};


// ========== TÉLÉCHARGEMENT ZIP AMÉLIORÉ ==========
async function downloadAllFeuilles() {
    const btn = document.getElementById('downloadAllFeuilles');
    const originalContent = btn.innerHTML;

    try {
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Téléchargement...';
        btn.disabled = true;

        if (allData.feuilles_passage.length === 0) {
            alert('Aucune feuille à télécharger');
            return;
        }

        const zip = new JSZip();
        let processed = 0;

        for (const feuille of allData.feuilles_passage) {
            if (!feuille.url) continue;

            try {
                const response = await fetch(feuille.url);
                const blob = await response.blob();

                const date = feuille.createdAt?.toDate ?
                    formatDateFilename(feuille.createdAt.toDate()) :
                    'date_inconnue';
                const copro = cleanFilename(feuille.copro || 'copro');
                const agent = cleanFilename(feuille.agent || 'agent');

                const filename = `${date}_${copro}_${agent}.jpg`;
                zip.file(filename, blob);
                processed++;
            } catch (error) {
                console.error('Erreur photo:', error);
            }
        }

        const content = await zip.generateAsync({ type: 'blob' });
        const url = window.URL.createObjectURL(content);
        const a = document.createElement('a');
        a.href = url;
        a.download = `feuilles_passage_${formatDateFilename(new Date())}.zip`;
        a.click();
        window.URL.revokeObjectURL(url);

        alert(`${processed} feuilles téléchargées`);
    } catch (error) {
        console.error('Erreur ZIP:', error);
        alert('Erreur lors de la création du ZIP');
    } finally {
        btn.innerHTML = originalContent;
        btn.disabled = false;
    }
}

async function downloadAllPhotosChantiers() {
    const btn = document.getElementById('downloadAllPhotosChantiers');
    const originalContent = btn.innerHTML;

    try {
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Téléchargement...';
        btn.disabled = true;

        if (allData.photos_chantiers.length === 0) {
            alert('Aucun chantier à télécharger');
            return;
        }

        const zip = new JSZip();
        let totalPhotos = 0;

        for (const chantier of allData.photos_chantiers) {
            if (!chantier.photos || chantier.photos.length === 0) continue;

            const date = chantier.createdAt?.toDate ?
                formatDateFilename(chantier.createdAt.toDate()) :
                'date_inconnue';
            const chantierName = cleanFilename(chantier.chantier || 'chantier');
            const agent = cleanFilename(chantier.agent || 'agent');

            const folderName = `${date}_${chantierName}_${agent}`;

            for (let i = 0; i < chantier.photos.length; i++) {
                const photo = chantier.photos[i];
                if (!photo.url) continue;

                try {
                    const response = await fetch(photo.url);
                    const blob = await response.blob();

                    zip.file(`${folderName}/photo_${i + 1}.jpg`, blob);
                    totalPhotos++;
                } catch (error) {
                    console.error('Erreur photo:', error);
                }
            }
        }

        const content = await zip.generateAsync({ type: 'blob' });
        const url = window.URL.createObjectURL(content);
        const a = document.createElement('a');
        a.href = url;
        a.download = `photos_chantiers_${formatDateFilename(new Date())}.zip`;
        a.click();
        window.URL.revokeObjectURL(url);

        alert(`${totalPhotos} photos téléchargées`);
    } catch (error) {
        console.error('Erreur ZIP:', error);
        alert('Erreur lors de la création du ZIP');
    } finally {
        btn.innerHTML = originalContent;
        btn.disabled = false;
    }
}

window.downloadSingleChantier = async function (chantierID) {
    const chantier = allData.photos_chantiers.find(c => c.id === chantierID);
    if (!chantier || !chantier.photos || chantier.photos.length === 0) {
        alert('Aucune photo à télécharger');
        return;
    }

    try {
        const zip = new JSZip();

        for (let i = 0; i < chantier.photos.length; i++) {
            const photo = chantier.photos[i];
            if (!photo.url) continue;

            const response = await fetch(photo.url);
            const blob = await response.blob();

            zip.file(`photo_${i + 1}.jpg`, blob);
        }

        const content = await zip.generateAsync({ type: 'blob' });
        const url = window.URL.createObjectURL(content);
        const a = document.createElement('a');

        const chantierName = cleanFilename(chantier.chantier || 'chantier');
        const date = chantier.createdAt?.toDate ?
            formatDateFilename(chantier.createdAt.toDate()) :
            formatDateFilename(new Date());

        a.href = url;
        a.download = `${date}_${chantierName}.zip`;
        a.click();
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors du téléchargement');
    }
};

// ========== ACTIONS ==========
window.deleteChantier = async function (id) {
    showConfirmModal({
        title: 'Supprimer ce chantier ?',
        message: 'Cette action est irréversible. Le chantier et ses photos seront définitivement supprimés.',
        confirmText: 'Supprimer',
        cancelText: 'Annuler',
        onConfirm: async () => {
            try {
                await deleteDoc(doc(db, 'photos_chantiers', id));
                showNotification('Chantier supprimé avec succès', 'success');
                currentPages.photos_chantiers = 1;
                loadPhotosChantiers();
            } catch (error) {
                console.error('Erreur:', error);
                showNotification('Erreur lors de la suppression', 'error');
            }
        }
    });
};

window.deleteSignalement = async function (id) {
    showConfirmModal({
        title: 'Supprimer ce signalement ?',
        message: 'Cette action est irréversible. Le signalement sera définitivement supprimé.',
        confirmText: 'Supprimer',
        cancelText: 'Annuler',
        onConfirm: async () => {
            try {
                await deleteDoc(doc(db, 'signalements', id));
                showNotification('Signalement supprimé avec succès', 'success');
                currentPages.signalements = 1;
                loadSignalements();
            } catch (error) {
                console.error('Erreur:', error);
                showNotification('Erreur lors de la suppression', 'error');
            }
        }
    });
};

window.deleteConsommable = async function (id) {
    showConfirmModal({
        title: 'Supprimer ce consommable ?',
        message: 'Cette action est irréversible. Le consommable sera définitivement supprimé.',
        confirmText: 'Supprimer',
        cancelText: 'Annuler',
        onConfirm: async () => {
            try {
                await deleteDoc(doc(db, 'consommables', id));
                showNotification('Consommable supprimé avec succès', 'success');
                currentPages.consommables = 1;
                loadConsommables();
            } catch (error) {
                console.error('Erreur:', error);
                showNotification('Erreur lors de la suppression', 'error');
            }
        }
    });
};

window.deleteAnnonce = async function (id) {
    showConfirmModal({
        title: 'Supprimer cette annonce ?',
        message: 'Cette action est irréversible. L\'annonce sera définitivement supprimée.',
        confirmText: 'Supprimer',
        cancelText: 'Annuler',
        onConfirm: async () => {
            try {
                await deleteDoc(doc(db, 'annonces', id));
                showNotification('Annonce supprimée avec succès', 'success');
                loadAnnonces();
            } catch (error) {
                console.error('Erreur:', error);
                showNotification('Erreur lors de la suppression', 'error');
            }
        }
    });
};

window.deleteDevis = async function (id) {
    showConfirmModal({
        title: 'Supprimer ce devis ?',
        message: 'Cette action est irréversible. Le devis sera définitivement supprimé.',
        confirmText: 'Supprimer',
        cancelText: 'Annuler',
        onConfirm: async () => {
            try {
                await deleteDoc(doc(db, 'devis', id));
                showNotification('Devis supprimé avec succès', 'success');
                loadDevis();
            } catch (error) {
                console.error('Erreur:', error);
                showNotification('Erreur lors de la suppression', 'error');
            }
        }
    });
};

// Fonction générique pour afficher une modale de confirmation moderne
function showConfirmModal({ title, message, confirmText = 'Confirmer', cancelText = 'Annuler', onConfirm }) {
    const modalHTML = `
        <div class="confirm-modal">
            <div class="confirm-modal-content">
                <div class="confirm-modal-header">
                    <div class="confirm-modal-icon">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <h3>${escapeHtml(title)}</h3>
                </div>
                <div class="confirm-modal-body">
                    <p>${escapeHtml(message)}</p>
                </div>
                <div class="confirm-modal-footer">
                    <button class="confirm-modal-btn confirm-modal-btn-cancel" onclick="this.closest('.confirm-modal').remove()">
                        <i class="fas fa-times"></i>
                        ${escapeHtml(cancelText)}
                    </button>
                    <button class="confirm-modal-btn confirm-modal-btn-delete" id="confirmModalBtn">
                        <i class="fas fa-trash"></i>
                        ${escapeHtml(confirmText)}
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    const modal = document.querySelector('.confirm-modal');
    const confirmBtn = document.getElementById('confirmModalBtn');

    confirmBtn.addEventListener('click', async () => {
        modal.remove();
        if (onConfirm) await onConfirm();
    });

    // Fermer la modale en cliquant sur le fond
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

window.marquerFacture = async function (id) {
    showConfirmModal({
        title: 'Marquer comme facturé ?',
        message: 'Ce consommable sera marqué comme facturé.',
        confirmText: 'Confirmer',
        cancelText: 'Annuler',
        onConfirm: async () => {
            try {
                await updateDoc(doc(db, 'consommables', id), { facture: true });
                showNotification('Marqué comme facturé', 'success');
                loadConsommables();
            } catch (error) {
                console.error('Erreur:', error);
                showNotification('Erreur lors de la mise à jour', 'error');
            }
        }
    });
};

// ========== UTILS ==========
function showLoading(tab) {
    document.getElementById(`loading-${tab}`).style.display = 'block';
    const content = document.getElementById(`content-${tab}`);
    if (content) content.style.display = 'none';
}

function showContent(tab) {
    document.getElementById(`loading-${tab}`).style.display = 'none';
    const content = document.getElementById(`content-${tab}`);
    if (content) content.style.display = 'block';
}

function showError(tab, message) {
    const loading = document.getElementById(`loading-${tab}`);
    loading.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-exclamation-triangle" style="color: #dc2626;"></i>
            <p>Erreur: ${message}</p>
        </div>
    `;
}

function formatDate(timestamp) {
    if (!timestamp) return 'Date inconnue';

    let date;
    if (timestamp.toDate) {
        date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
        date = timestamp;
    } else {
        date = new Date(timestamp);
    }

    return date.toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatDateFilename(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
}

function cleanFilename(name) {
    // Nettoyer le nom : garder lettres, chiffres et espaces
    // Remplacer espaces par underscores
    // Enlever accents
    let clean = name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Enlever accents
        .replace(/[^a-zA-Z0-9 ]/g, '') // Garder seulement lettres, chiffres, espaces
        .replace(/\s+/g, '_') // Remplacer espaces par underscore
        .replace(/_+/g, '_') // Enlever underscores multiples
        .replace(/^_|_$/g, ''); // Enlever underscores début/fin

    return clean || 'inconnu';
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ========== RECHERCHE ==========
let searchTimeout = null;

function setupSearch() {
    const searchFeuilles = document.getElementById('searchFeuilles');
    const searchChantiers = document.getElementById('searchChantiers');

    if (searchFeuilles) {
        searchFeuilles.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                filterAndRenderFeuilles(e.target.value);
            }, 300);
        });
    }

    if (searchChantiers) {
        searchChantiers.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                filterAndRenderChantiers(e.target.value);
            }, 300);
        });
    }
}

function filterAndRenderFeuilles(searchTerm) {
    if (!searchTerm) {
        currentPages.feuilles_passage = 1;
        renderFeuillesPassage();
        return;
    }

    const term = searchTerm.toLowerCase();
    allData.feuilles_passage = window.allFeuillesPassage.filter(f =>
        (f.copro && f.copro.toLowerCase().includes(term)) ||
        (f.agent && f.agent.toLowerCase().includes(term))
    );

    currentPages.feuilles_passage = 1;
    renderFeuillesPassage();
}

function filterAndRenderChantiers(searchTerm) {
    if (!searchTerm) {
        currentPages.photos_chantiers = 1;
        renderPhotosChantiers();
        return;
    }

    const term = searchTerm.toLowerCase();
    allData.photos_chantiers = window.allPhotosChantiers.filter(c =>
        (c.chantier && c.chantier.toLowerCase().includes(term)) ||
        (c.agent && c.agent.toLowerCase().includes(term)) ||
        (c.description && c.description.toLowerCase().includes(term))
    );

    currentPages.photos_chantiers = 1;
    renderPhotosChantiers();
}

// ========== ONGLET HEURES ==========
const employeeNames = {
    'dylan': 'Dylan',
    'oceane': 'Océane',
    'samuel': 'Samuel',
    'jeremie': 'Jérémie',
    'carlos': 'Carlos',
    'sandra': 'Sandra',
    'manon': 'Manon',
    'stephane': 'Stéphane',
    'isabelle': 'Isabelle',
    'caroline': 'Caroline',
    'nadjet': 'Nadjet',
    'remy': 'Rémy',
    'maxime': 'Maxime',
    'shana': 'Shana'
};

// Cache pour les heures (évite de recharger les mêmes données)
let heuresCache = {};

async function loadHeures() {
    const weekStart = document.getElementById('filterWeekStart').value;
    const weekEnd = document.getElementById('filterWeekEnd').value;
    const selectedEmployee = document.getElementById('filterEmployee').value;

    if (!weekStart || !weekEnd) {
        const content = document.getElementById('content-heures');
        content.innerHTML = '<div class="empty-state"><i class="fas fa-info-circle"></i><p>Veuillez sélectionner une période</p></div>';
        showContent('heures');
        return;
    }

    // Clé de cache
    const cacheKey = `${weekStart}_${weekEnd}_${selectedEmployee}`;

    // Si en cache, affichage instantané !
    if (heuresCache[cacheKey]) {
        console.log('âÃ…â€œ"¦ Données en cache - affichage instantané');
        renderHeures(...heuresCache[cacheKey]);
        showContent('heures');
        return;
    }

    showLoading('heures');

    try {
        const employeeIds = selectedEmployee ? [selectedEmployee] : Object.keys(employeeNames);
        const weeksToLoad = getWeeksBetween(weekStart, weekEnd);

        let totalHoursGlobal = 0;
        let totalKmGlobal = 0;
        let totalChantiersGlobal = 0;

        // OPTIMISATION : Promise.all pour charger tous les employés en parallèle
        const results = await Promise.all(
            employeeIds.map(async (employeeId) => {
                let employeeTotalHours = 0;
                let employeeTotalKm = 0;
                let employeeTotalChantiers = 0;
                const kmValues = [];
                let weeksCount = 0;

                // OPTIMISATION : Promise.all pour charger toutes les semaines en parallèle
                const weekResults = await Promise.all(
                    weeksToLoad.map(async (week) => {
                        try {
                            const weekDocRef = doc(db, 'employees', employeeId, 'weeks', week);
                            const weekDocSnap = await getDoc(weekDocRef);

                            if (weekDocSnap.exists()) {
                                const data = weekDocSnap.data();
                                let weekHours = 0;

                                if (data.days) {
                                    data.days.forEach(day => {
                                        const hours = parseFloat(day.hours) || 0;
                                        weekHours += Math.round(hours * 100) / 100;
                                    });
                                }

                                const km = parseFloat(data.kilometrage) || 0;
                                const projectsCount = data.projects ? data.projects.length : 0;

                                return {
                                    weekHours,
                                    km,
                                    projectsCount
                                };
                            }
                        } catch (error) {
                            console.error(`Erreur semaine ${week}:`, error);
                        }
                        return null;
                    })
                );

                // Traiter les résultats
                weekResults.forEach(result => {
                    if (result) {
                        employeeTotalHours += result.weekHours;
                        if (result.km > 0) kmValues.push(result.km);
                        employeeTotalChantiers += result.projectsCount;
                        weeksCount++;
                    }
                });

                // Calculer KM
                if (kmValues.length > 0) {
                    kmValues.sort((a, b) => a - b);
                    employeeTotalKm = Math.max(0, kmValues[kmValues.length - 1] - kmValues[0]);
                }

                if (employeeTotalHours > 0 || employeeTotalChantiers > 0) {
                    return {
                        id: employeeId,
                        name: employeeNames[employeeId],
                        weeks: weeksCount,
                        totalHours: employeeTotalHours,
                        totalKm: employeeTotalKm,
                        totalChantiers: employeeTotalChantiers
                    };
                }
                return null;
            })
        );

        // Filtrer les résultats null et calculer les totaux
        const employeeData = results.filter(emp => emp !== null);
        employeeData.forEach(emp => {
            totalHoursGlobal += emp.totalHours;
            totalKmGlobal += emp.totalKm;
            totalChantiersGlobal += emp.totalChantiers;
        });

        // Mettre en cache
        heuresCache[cacheKey] = [employeeData, totalHoursGlobal, totalKmGlobal, totalChantiersGlobal];

        renderHeures(employeeData, totalHoursGlobal, totalKmGlobal, totalChantiersGlobal);
        showContent('heures');
    } catch (error) {
        console.error('Erreur heures:', error);
        showError('heures', error.message);
    }
}
window.loadHeures = loadHeures; // Export pour onclick

function getWeeksBetween(weekStart, weekEnd) {
    const weeks = [];
    const [startYear, startWeek] = weekStart.split('-W').map(Number);
    const [endYear, endWeek] = weekEnd.split('-W').map(Number);

    for (let year = startYear; year <= endYear; year++) {
        const startW = (year === startYear) ? startWeek : 1;
        const endW = (year === endYear) ? endWeek : 52;

        for (let week = startW; week <= endW; week++) {
            weeks.push(`${year}-W${week.toString().padStart(2, '0')}`);
        }
    }

    return weeks;
}

function renderHeures(employeeData, totalHours, totalKm, totalChantiers) {
    const container = document.getElementById('content-heures');

    // Afficher le bouton export si des données existent
    const exportBtn = document.getElementById('btnExportHeures');
    if (exportBtn) {
        exportBtn.style.display = employeeData.length > 0 ? 'flex' : 'none';
    }

    // Stocker les données pour l'export
    window.lastHeuresData = { employeeData, totalHours, totalKm, totalChantiers };

    let html = `
        <div style="padding: 1.5rem;">
            <div class="stats-grid">
                <div class="stat-card">
                    <i class="fas fa-clock" style="color: #10b981; font-size: 2rem;"></i>
                    <div>
                        <div class="stat-value">${totalHours.toFixed(2)}h</div>
                        <div class="stat-label">Total heures</div>
                    </div>
                </div>
                <div class="stat-card">
                    <i class="fas fa-route" style="color: #3b82f6; font-size: 2rem;"></i>
                    <div>
                        <div class="stat-value">${totalKm} km</div>
                        <div class="stat-label">Total kilomètres</div>
                    </div>
                </div>
                <div class="stat-card">
                    <i class="fas fa-hard-hat" style="color: #8b5cf6; font-size: 2rem;"></i>
                    <div>
                        <div class="stat-value">${totalChantiers}</div>
                        <div class="stat-label">Chantiers spécifiques</div>
                    </div>
                </div>
            </div>
            
            <div class="table-responsive" style="margin-top: 2rem;">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Employé</th>
                            <th>Semaines</th>
                            <th>Total heures</th>
                            <th>Kilomètres</th>
                            <th>Chantiers</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${employeeData.map(emp => `
                            <tr>
                                <td data-label="Employé"><strong>${emp.name}</strong></td>
                                <td data-label="Semaines">${emp.weeks} semaine(s)</td>
                                <td data-label="Total heures" style="color: #10b981; font-weight: 600;">${emp.totalHours.toFixed(2)}h</td>
                                <td data-label="Kilomètres">${emp.totalKm} km</td>
                                <td data-label="Chantiers">${emp.totalChantiers} chantier(s)</td>
                                <td>
                                    <button class="btn btn-primary" style="padding: 0.5rem 1rem; font-size: 0.9rem;" onclick="viewEmployeeDetails('${emp.id}')">
                                        <i class="fas fa-eye"></i> Détails
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;

    container.innerHTML = html;
}

// ========== EXPORT EXCEL HEURES ==========
window.exportHeuresExcel = function () {
    const data = window.lastHeuresData;
    if (!data || !data.employeeData || data.employeeData.length === 0) {
        showNotification('Aucune donnée à exporter', 'error');
        return;
    }

    const weekStart = document.getElementById('filterWeekStart').value;
    const weekEnd = document.getElementById('filterWeekEnd').value;

    // Formater les semaines pour le nom de fichier
    const periodeLabel = weekStart === weekEnd
        ? weekStart.replace('-W', '_S')
        : `${weekStart.replace('-W', '_S')}_au_${weekEnd.replace('-W', '_S')}`;

    // En-tête du fichier avec info période
    const periode = weekStart === weekEnd
        ? `Semaine ${weekStart.replace('-W', ' S')}`
        : `Semaines ${weekStart.replace('-W', ' S')} à ${weekEnd.replace('-W', ' S')}`;

    // BOM UTF-8 pour Excel + séparateur point-virgule (standard FR)
    const BOM = '\uFEFF';
    const SEP = ';';

    const lines = [];

    // Titre et période
    lines.push(`Relevé d'heures Propre Eco${SEP}${SEP}${SEP}${SEP}`);
    lines.push(`Période${SEP}${periode}${SEP}${SEP}${SEP}`);
    lines.push(`Exporté le${SEP}${new Date().toLocaleDateString('fr-FR')}${SEP}${SEP}${SEP}`);
    lines.push(`${SEP}${SEP}${SEP}${SEP}`);

    // En-têtes colonnes
    lines.push([
        'Employé',
        'Semaines travaillées',
        'Total heures',
        'Kilomètres parcourus',
        'Chantiers spécifiques'
    ].join(SEP));

    // Lignes employés
    data.employeeData.forEach(emp => {
        lines.push([
            emp.name,
            emp.weeks,
            emp.totalHours.toFixed(2).replace('.', ','),
            emp.totalKm,
            emp.totalChantiers
        ].join(SEP));
    });

    // Ligne séparatrice
    lines.push(`${SEP}${SEP}${SEP}${SEP}`);

    // Ligne TOTAL
    lines.push([
        'TOTAL',
        data.employeeData.length + ' employé(s)',
        data.totalHours.toFixed(2).replace('.', ','),
        data.totalKm,
        data.totalChantiers
    ].join(SEP));

    const csvContent = BOM + lines.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `heures_propre_eco_${periodeLabel}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    showNotification(`Export réussi — ${data.employeeData.length} employé(s)`, 'success');
};

// ========== CHIFFRAGE DEVIS DÉTAILLÉ ==========
window.openChiffrageDetailModal = async function (devisId) {
    const devis = allData.devis?.find(d => d.id === devisId);
    if (!devis) return;

    const modal = document.createElement('div');
    modal.className = 'chiffrage-modal';
    modal.innerHTML = `
        <div class="modal-overlay" onclick="this.parentElement.remove()"></div>
        <div class="modal-content-large" onclick="event.stopPropagation()">
            <div class="modal-header">
                <h2><i class="fas fa-calculator"></i> Chiffrage détaillé</h2>
                <button class="modal-close" onclick="this.closest('.chiffrage-modal').remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <h3>${escapeHtml(devis.titre || 'Devis')}</h3>
                
                <div class="chiffrage-form">
                    ${createChiffrageElements(devis)}
                </div>
                
                <div class="chiffrage-totals">
                    <div class="total-line">
                        <span>Total temps estimé:</span>
                        <strong id="totalTemps">0h</strong>
                    </div>
                    <div class="total-line">
                        <span>Total prix:</span>
                        <strong id="totalPrix" style="color: #10b981; font-size: 1.5rem;">0€</strong>
                    </div>
                </div>
                
                <div style="display: flex; gap: 1rem; margin-top: 2rem;">
                    <button class="btn btn-primary" onclick="saveChiffrage('${devisId}')">
                        <i class="fas fa-save"></i> Enregistrer le chiffrage
                    </button>
                    <button class="btn btn-cancel" onclick="this.closest('.chiffrage-modal').remove()">
                        <i class="fas fa-times"></i> Annuler
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Ajouter les event listeners pour calculer les totaux
    modal.querySelectorAll('input').forEach(input => {
        input.addEventListener('input', calculateChiffrageTotals);
    });

    calculateChiffrageTotals();
};
function createChiffrageElements(devis) {
    let html = '<div class="chiffrage-grid">';

    const elements = [];

    // Vitres
    const nbVitres = devis.vitres?.standard || 0;
    const nbBaies = devis.vitres?.baies || 0;
    const nbVelux = devis.vitres?.velux || 0;
    const vitresHautes = devis.vitres?.hautes || false;

    if (nbVitres > 0) elements.push({ label: 'Vitres Standard', qty: nbVitres, temps: 0.1, taux: 43.40 });
    if (nbBaies > 0) elements.push({ label: 'Baies Vitrées', qty: nbBaies, temps: 0.13, taux: 43.40 });
    if (nbVelux > 0) elements.push({ label: 'Vélux', qty: nbVelux, temps: 0.17, taux: 43.40 });
    if (vitresHautes) elements.push({ label: 'Vitres Hautes', qty: 1, temps: 0.17, taux: 43.40 });

    // Grattage
    const grattage = devis.grattage || {};
    if (grattage.standard) elements.push({ label: 'Vitres Standard Grattage', qty: 1, temps: 0.13, taux: 43.40 });
    if (grattage.baies) elements.push({ label: 'Baies Vitrees Grattage', qty: 1, temps: 0.17, taux: 43.40 });
    if (grattage.velux) elements.push({ label: 'Velux Grattage', qty: 1, temps: 0.33, taux: 43.40 });
    if (grattage.hautes) elements.push({ label: 'Vitres Hautes Grattage', qty: 1, temps: 0.25, taux: 43.40 });

    // Cuisine
    const petiteCuisine = devis.cuisine?.petite || 0;
    const grandeCuisine = devis.cuisine?.grande || 0;
    if (petiteCuisine > 0) elements.push({ label: 'Petite cuisine', qty: petiteCuisine, temps: 0.67, taux: 43.40 });
    if (grandeCuisine > 0) elements.push({ label: 'Grande cuisine', qty: grandeCuisine, temps: 1, taux: 43.40 });

    // Chambres
    const chAvecPlacard = devis.chambres?.avecPlacard || 0;
    const chSansPlacard = devis.chambres?.sansPlacard || 0;
    const dortoir = devis.chambres?.dortoir || 0;
    const mezzanine = devis.chambres?.mezzanine || 0;
    const dressing = devis.chambres?.dressing || 0;

    if (chAvecPlacard > 0) elements.push({ label: 'Chambres avec placard', qty: chAvecPlacard, temps: 0.5, taux: 43.40 });
    if (chSansPlacard > 0) elements.push({ label: 'Chambres sans placard', qty: chSansPlacard, temps: 0.33, taux: 43.40 });
    if (dortoir > 0) elements.push({ label: 'Dortoir avec placards', qty: dortoir, temps: 1, taux: 43.40 });
    if (mezzanine > 0) elements.push({ label: 'Mezzanine', qty: mezzanine, temps: 1, taux: 43.40 });
    if (dressing > 0) elements.push({ label: 'Dressing', qty: dressing, temps: 0.5, taux: 43.40 });

    // Salles de bain
    const gDouche = devis.sallesDeBain?.grandeSdbDouche || 0;
    const gBaignoire = devis.sallesDeBain?.grandeSdbBaignoire || 0;
    const pDouche = devis.sallesDeBain?.petiteSdbDouche || 0;
    const pBaignoire = devis.sallesDeBain?.petiteSdbBaignoire || 0;
    const wcLaveMain = devis.sallesDeBain?.wcLaveMain || 0;

    if (gDouche > 0) elements.push({ label: 'Grande SDB avec douche', qty: gDouche, temps: 2, taux: 43.40 });
    if (gBaignoire > 0) elements.push({ label: 'Grande SDB avec baignoire', qty: gBaignoire, temps: 2, taux: 43.40 });
    if (pDouche > 0) elements.push({ label: 'Petite SDB avec douche', qty: pDouche, temps: 1, taux: 43.40 });
    if (pBaignoire > 0) elements.push({ label: 'Petite SDB avec baignoire', qty: pBaignoire, temps: 1, taux: 43.40 });
    if (wcLaveMain > 0) elements.push({ label: 'WC lave-mains', qty: wcLaveMain, temps: 0.33, taux: 43.40 });

    // Pieces annexes
    const annexes = devis.piecesAnnexes || {};
    if (annexes.sauna > 0) elements.push({ label: 'Sauna', qty: annexes.sauna, temps: 0.75, taux: 43.40 });
    if (annexes.buanderie > 0) elements.push({ label: 'Buanderie', qty: annexes.buanderie, temps: 1, taux: 43.40 });
    if (annexes.localTechnique > 0) elements.push({ label: 'Local technique', qty: annexes.localTechnique, temps: 0.5, taux: 43.40 });
    if (annexes.cellier > 0) elements.push({ label: 'Cellier', qty: annexes.cellier, temps: 1, taux: 43.40 });
    if (annexes.bureau > 0) elements.push({ label: 'Bureau', qty: annexes.bureau, temps: 0.5, taux: 43.40 });
    if (annexes.garage > 0) elements.push({ label: 'Garage', qty: annexes.garage, temps: 1, taux: 43.40 });
    if (annexes.skiroom > 0) elements.push({ label: 'Skiroom', qty: annexes.skiroom, temps: 1, taux: 43.40 });
    if (annexes.salleVideo > 0) elements.push({ label: 'Salle vidéo', qty: annexes.salleVideo, temps: 0.5, taux: 43.40 });
    if (annexes.chaufferie > 0) elements.push({ label: 'Chaufferie', qty: annexes.chaufferie, temps: 1, taux: 43.40 });
    if (annexes.escalier > 0) elements.push({ label: 'Escalier', qty: annexes.escalier, temps: 0.25, taux: 43.40 });
    if (annexes.ascenseur > 0) elements.push({ label: 'Ascenseur', qty: annexes.ascenseur, temps: 0.5, taux: 43.40 });

    // Checkboxes annexes
    if (annexes.tapisEntree) elements.push({ label: 'Tapis entrée', qty: 1, temps: 0.17, taux: 43.40 });
    if (annexes.aspiVmc) elements.push({ label: 'Aspi trappe VMC', qty: 1, temps: 0.33, taux: 43.40 });
    if (annexes.rambarde) elements.push({ label: 'Rambarde', qty: 1, temps: 0.5, taux: 43.40 });
    if (annexes.aspiPoutraison) elements.push({ label: 'Aspiration poutraison + mur', qty: 1, temps: 1, taux: 43.40 });

    // Autres annexes (texte libre)
    if (annexes.autres && Array.isArray(annexes.autres)) {
        annexes.autres.forEach(autre => {
            elements.push({ label: autre, qty: 1, temps: 0.75, taux: 43.40 });
        });
    }

    // Exterieurs
    const balcon = devis.exterieurs?.balcon || 0;
    const terrasse = devis.exterieurs?.terrasse || 0;

    if (balcon > 0) elements.push({ label: 'Balcon', qty: balcon, temps: 0.5, taux: 43.40 });
    if (terrasse > 0) elements.push({ label: 'Terrasse', qty: terrasse, temps: 1, taux: 43.40 });

    // Si devis deja chiffre, recuperer les valeurs sauvegardees
    const savedElements = devis.elements || [];

    elements.forEach(elem => {
        const saved = savedElements.find(s => s.label === elem.label);
        const temps = saved?.tempsUnitaire ?? elem.temps;
        const taux = saved?.prixUnitaire ?? elem.taux;
        const qty = saved?.quantite ?? elem.qty;

        html += `
            <div class="chiffrage-item">
                <div class="item-header">
                    <strong>${elem.label}</strong>
                    <span class="qty-badge">${qty}x</span>
                </div>
                <div class="item-inputs">
                    <div class="input-group-chiffrage">
                        <label>Temps unitaire (h)</label>
                        <input type="number" class="temps-input" data-qty="${qty}" value="${temps}" min="0" step="0.25">
                    </div>
                    <div class="input-group-chiffrage">
                        <label>Taux horaire (€/h)</label>
                        <input type="number" class="taux-input" data-qty="${qty}" value="${taux}" min="0" step="0.5">
                    </div>
                </div>
                <div class="item-total">
                    <span>Temps: <strong class="subtotal-temps">${(temps * qty).toFixed(2)}h</strong></span>
                    <span>Prix: <strong class="subtotal-prix">${(temps * qty * taux).toFixed(2)}€</strong></span>
                </div>
            </div>
        `;
    });

    if (elements.length === 0) {
        html += '<p style="text-align:center; color:#666; padding:2rem;">Aucun element a chiffrer dans ce devis</p>';
    }

    html += '</div>';
    return html;
}

function getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
}

function calculateChiffrageTotals() {
    let totalPrix = 0;
    let totalTemps = 0;

    document.querySelectorAll('.chiffrage-item').forEach(item => {
        const tempsInput = item.querySelector('.temps-input');
        const tauxInput = item.querySelector('.taux-input');
        const qty = parseFloat(tempsInput.dataset.qty);

        const tempsUnit = parseFloat(tempsInput.value) || 0;
        const taux = parseFloat(tauxInput.value) || 0;

        const subtotalTemps = tempsUnit * qty;
        const subtotalPrix = subtotalTemps * taux;

        item.querySelector('.subtotal-temps').textContent = `${subtotalTemps.toFixed(2)}h`;
        item.querySelector('.subtotal-prix').textContent = `${subtotalPrix.toFixed(2)}€`;

        totalTemps += subtotalTemps;
        totalPrix += subtotalPrix;
    });

    document.getElementById('totalTemps').textContent = `${totalTemps.toFixed(2)}h`;
    document.getElementById('totalPrix').textContent = `${totalPrix.toFixed(2)}€`;
}

window.saveChiffrage = async function (devisId) {
    try {
        const elements = [];
        const lignesChiffrage = [];
        let totalPrixHT = 0;
        let totalTempsHeures = 0;
        let totalTempsMn = 0;

        document.querySelectorAll('.chiffrage-item').forEach(item => {
            const label = item.querySelector('.item-header strong').textContent;
            const qty = parseFloat(item.querySelector('.temps-input').dataset.qty);
            const tempsUnitHeures = parseFloat(item.querySelector('.temps-input').value) || 0;
            const taux = parseFloat(item.querySelector('.taux-input').value) || 0;

            const tempsUnitaireMn = Math.round(tempsUnitHeures * 60);
            const tempsTotalMn = tempsUnitaireMn * qty;
            const tempsTotalHeures = tempsUnitHeures * qty;
            const totalLigne = tempsTotalHeures * taux;

            totalTempsHeures += tempsTotalHeures;
            totalTempsMn += tempsTotalMn;
            totalPrixHT += totalLigne;

            elements.push({
                label,
                quantite: qty,
                tempsUnitaire: tempsUnitHeures,
                prixUnitaire: taux,
                sousTotalTemps: tempsTotalHeures,
                sousTotal: totalLigne
            });

            lignesChiffrage.push({
                designation: label,
                quantite: qty,
                tempsUnitaireMn: tempsUnitaireMn,
                tauxHoraire: taux,
                totalLigne: totalLigne
            });
        });

        const totalPrixTTC = totalPrixHT * 1.22;

        await updateDoc(doc(db, 'devis', devisId), {
            elements,
            lignesChiffrage,
            totalPrix: totalPrixHT,
            totalPrixHT,
            totalPrixTTC,
            totalTemps: totalTempsHeures,
            totalTempsMn,
            status: 'chiffre',
            dateChiffrage: new Date()
        });

        showNotification('Chiffrage enregistre avec succes !', 'success');
        document.querySelector('.chiffrage-modal').remove();
        loadDevis();
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur lors de l\'enregistrement', 'error');
    }
};


// ========== DÉTAILS EMPLOYÉ (MODAL) ==========
window.viewEmployeeDetails = async function (employeeId) {
    const weekStart = document.getElementById('filterWeekStart').value;
    const weekEnd = document.getElementById('filterWeekEnd').value;
    const employeeName = employeeNames[employeeId];

    if (!weekStart || !weekEnd) {
        alert('Veuillez sélectionner une période');
        return;
    }

    // Créer le modal avec spinner
    const modal = document.createElement('div');
    modal.className = 'employee-details-modal';
    modal.innerHTML = `
        <div class="modal-overlay" onclick="this.parentElement.remove()"></div>
        <div class="modal-content-details" onclick="event.stopPropagation()">
            <div class="modal-header-details">
                <div>
                    <h2><i class="fas fa-user-clock"></i> ${employeeName}</h2>
                    <p>Semaines ${weekStart.replace('W', 'S')} à  ${weekEnd.replace('W', 'S')}</p>
                </div>
                <button class="modal-close" onclick="this.closest('.employee-details-modal').remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body-details">
                <div class="loading-spinner">
                    <i class="fas fa-spinner fa-spin"></i>
                    <p>Chargement des détails...</p>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    try {
        const weeksToLoad = getWeeksBetween(weekStart, weekEnd);
        const weeksData = [];
        let totalHours = 0;
        let firstKm = null;
        let lastKm = null;
        const allProjects = [];

        // Charger toutes les semaines
        for (const week of weeksToLoad) {
            const weekDocRef = doc(db, 'employees', employeeId, 'weeks', week);
            const weekDocSnap = await getDoc(weekDocRef);

            if (weekDocSnap.exists()) {
                const data = weekDocSnap.data();
                let weekHours = 0;

                const days = [];
                if (data.days) {
                    data.days.forEach(day => {
                        const hours = parseFloat(day.hours) || 0;
                        weekHours += hours;
                        days.push({
                            day: day.day || '',
                            hours: hours,
                            comments: day.comments || ''
                        });
                    });
                }

                const km = parseFloat(data.kilometrage) || 0;
                if (km > 0) {
                    if (firstKm === null) firstKm = km;
                    lastKm = km;
                }

                const projects = data.projects || [];
                projects.forEach(project => {
                    allProjects.push({
                        week: week,
                        date: project.date || '',
                        chantier: project.name || '',
                        equipe: project.team || '',
                        hours: parseFloat(project.totalHours || project.hours || 0)
                    });
                });

                weeksData.push({
                    week: week,
                    days: days,
                    totalHours: weekHours,
                    km: km
                });

                totalHours += weekHours;
            }
        }

        const parcourus = (firstKm !== null && lastKm !== null) ? lastKm - firstKm : 0;

        // Remplir le modal avec les données
        const modalBody = modal.querySelector('.modal-body-details');
        modalBody.innerHTML = renderEmployeeDetails(weeksData, totalHours, firstKm, lastKm, parcourus, allProjects);

    } catch (error) {
        console.error('Erreur détails:', error);
        modal.querySelector('.modal-body-details').innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-circle"></i>
                <p>Erreur lors du chargement des détails</p>
            </div>
        `;
    }
};

function renderEmployeeDetails(weeksData, totalHours, firstKm, lastKm, parcourus, projects) {
    let html = '';

    weeksData.forEach(weekData => {
        const [year, week] = weekData.week.split('-W');
        const weekFormatted = `S${week} ${year}`;

        html += `
            <div class="week-detail-card">
                <div class="week-header">
                    <i class="fas fa-calendar"></i>
                    <h3>Semaine ${weekFormatted}</h3>
                </div>
                
                <div class="days-table">
                    <table class="detail-table">
                        <thead>
                            <tr>
                                <th>JOUR</th>
                                <th>HEURES</th>
                                <th>COMMENTAIRES</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${weekData.days.map(day => `
                                <tr>
                                    <td data-label="Jour"><strong>${day.day}</strong></td>
                                    <td data-label="Heures" style="color: #10b981; font-weight: 600;">${day.hours}h</td>
                                    <td data-label="Commentaires">${day.comments}</td>
                                </tr>
                            `).join('')}
                            <tr class="total-row">
                                <td data-label="Total"><strong>TOTAL</strong></td>
                                <td data-label="Heures" style="font-size: 1.1rem;">${weekData.totalHours}h</td>
                                <td data-label="Kilometres"><strong>${weekData.km} km</strong></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    });

    const firstWeekFormatted = weeksData[0] ? `S${weeksData[0].week.split('-W')[1]} ${weeksData[0].week.split('-W')[0]}` : '';
    const lastWeekFormatted = weeksData[weeksData.length - 1] ? `S${weeksData[weeksData.length - 1].week.split('-W')[1]} ${weeksData[weeksData.length - 1].week.split('-W')[0]}` : '';

    html += `
        <div class="km-recap-card">
            <div class="km-header">
                <i class="fas fa-route"></i>
                <h3>Recapitulatif Kilometres</h3>
            </div>
            <div class="km-grid">
                <div class="km-item">
                    <div class="km-label">Debut (${firstWeekFormatted})</div>
                    <div class="km-value">${firstKm || 0} km</div>
                </div>
                <div class="km-item">
                    <div class="km-label">Fin (${lastWeekFormatted})</div>
                    <div class="km-value">${lastKm || 0} km</div>
                </div>
                <div class="km-item highlight">
                    <div class="km-label">Parcourus</div>
                    <div class="km-value">${parcourus} km</div>
                </div>
            </div>
            <div class="km-info">
                <i class="fas fa-info-circle"></i>
                Calcul : Kilometrage de fin - Kilometrage de debut
            </div>
        </div>
    `;

    if (projects.length > 0) {
        html += `
            <div class="projects-card">
                <div class="projects-header">
                    <i class="fas fa-hard-hat"></i>
                    <h3>Chantiers specifiques (${projects.length})</h3>
                </div>
                <div class="projects-table">
                    <table class="detail-table">
                        <thead>
                            <tr>
                                <th>SEMAINE</th>
                                <th>DATE</th>
                                <th>CHANTIER</th>
                                <th>EQUIPE</th>
                                <th>TOTAL</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${projects.map(project => {
            const dateFormatted = project.date ? project.date.split('-').reverse().join(' ') : '';
            const weekFormatted = `S${project.week.split('-W')[1]}`;

            return `
                                <tr>
                                    <td data-label="Semaine"><span class="week-badge">${weekFormatted}</span></td>
                                    <td data-label="Date">${dateFormatted}</td>
                                    <td data-label="Chantier"><strong>${project.chantier}</strong></td>
                                    <td data-label="Equipe">${project.equipe}</td>
                                    <td data-label="Total" style="color: #8b5cf6; font-weight: 600;">${project.hours}h</td>
                                </tr>
                                `;
        }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    return html;
}


// ========== GENERATION PDF DEVIS ==========
window.downloadDevisPDF = async function (devisId) {
    const devis = allData.devis.find(d => d.id === devisId);
    if (!devis || devis.status !== 'chiffre') {
        alert('Devis non chiffré ou introuvable');
        return;
    }

    try {
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF();

        const pageWidth = pdf.internal.pageSize.width;
        const pageHeight = pdf.internal.pageSize.height;
        const margin = 15;
        const contentWidth = pageWidth - (2 * margin);
        let y = margin;

        const vert = [16, 185, 129];
        const vertFonce = [5, 150, 105];
        const grisTexte = [55, 65, 81];
        const grisClair = [107, 114, 128];
        const grisTresClair = [241, 245, 249];

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(26);
        pdf.setTextColor(...vert);
        pdf.text('DEVIS', pageWidth / 2, y + 8, { align: 'center' });

        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(...grisClair);
        pdf.text('Réf: ' + devisId.substring(0, 8).toUpperCase(), pageWidth - margin, y + 14, { align: 'right' });

        y += 20;

        pdf.setDrawColor(...vert);
        pdf.setLineWidth(1.2);
        pdf.line(margin, y, pageWidth - margin, y);

        y += 10;

        const date = devis.dateCreation ?
            (devis.dateCreation.toDate ? devis.dateCreation.toDate() : new Date(devis.dateCreation))
                .toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
            : new Date().toLocaleDateString('fr-FR');

        const dateChiffrage = devis.dateChiffrage ?
            (devis.dateChiffrage.toDate ? devis.dateChiffrage.toDate() : new Date(devis.dateChiffrage))
                .toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
            : date;

        pdf.setFillColor(...grisTresClair);
        pdf.roundedRect(margin, y, contentWidth, 22, 3, 3, 'F');

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(12);
        pdf.setTextColor(...grisTexte);
        pdf.text(devis.nomChantier || 'Chantier sans nom', margin + 6, y + 9);

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8);
        pdf.setTextColor(...grisClair);

        const infoLine = [];
        if (devis.typeLogement) infoLine.push('Type: ' + devis.typeLogement);
        if (devis.surface) infoLine.push('Surface: ' + devis.surface + ' m²');
        infoLine.push('Date: ' + date);
        infoLine.push('Chiffré le: ' + dateChiffrage);

        pdf.text(infoLine.join('  "¢  '), margin + 6, y + 17);

        y += 28;

        const tableHeaderH = 9;
        pdf.setFillColor(...vert);
        pdf.roundedRect(margin, y, contentWidth, tableHeaderH, 2, 2, 'F');
        pdf.setFillColor(...vert);
        pdf.rect(margin, y + 3, contentWidth, tableHeaderH - 3, 'F');

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(7);
        pdf.setTextColor(255, 255, 255);
        const colX = {
            label: margin + 4,
            qty: margin + 75,
            temps: margin + 95,
            taux: margin + 123,
            total: margin + contentWidth - 4
        };
        pdf.text('DÉSIGNATION', colX.label, y + 6);
        pdf.text('QTÉ', colX.qty, y + 6);
        pdf.text('TEMPS', colX.temps, y + 6);
        pdf.text('TAUX', colX.taux, y + 6);
        pdf.text('TOTAL', colX.total, y + 6, { align: 'right' });

        y += tableHeaderH + 2;
        const lignes = devis.lignesChiffrage || [];
        const rowH = 8;
        pdf.setFontSize(8);

        lignes.forEach((ligne, index) => {
            if (y + rowH > pageHeight - 50) {
                pdf.addPage();
                y = margin;

                pdf.setFillColor(...vert);
                pdf.roundedRect(margin, y, contentWidth, tableHeaderH, 2, 2, 'F');
                pdf.setFillColor(...vert);
                pdf.rect(margin, y + 3, contentWidth, tableHeaderH - 3, 'F');

                pdf.setFont('helvetica', 'bold');
                pdf.setFontSize(7);
                pdf.setTextColor(255, 255, 255);
                pdf.text('DESIGNATION', colX.label, y + 6);
                pdf.text('QTE', colX.qty, y + 6);
                pdf.text('TEMPS', colX.temps, y + 6);
                pdf.text('TAUX', colX.taux, y + 6);
                pdf.text('TOTAL', colX.total, y + 6, { align: 'right' });

                y += tableHeaderH + 2;
                pdf.setFontSize(8);
            }

            // Gerer le texte long avec retour a la ligne
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(...grisTexte);

            const maxWidthLabel = 68;
            const designation = ligne.designation || '';
            const designationLines = pdf.splitTextToSize(designation, maxWidthLabel);

            // Calculer la hauteur necessaire
            const lineHeight = 4;
            const textHeight = designationLines.length * lineHeight;
            const cellHeight = Math.max(rowH, textHeight + 3);

            // Dessiner le fond alterne
            if (index % 2 === 0) {
                pdf.setFillColor(248, 250, 252);
                pdf.rect(margin, y - 1, contentWidth, cellHeight, 'F');
            }

            // Afficher le texte designation ligne par ligne
            const textStartY = y + ((cellHeight - textHeight) / 2) + lineHeight - 0.5;
            designationLines.forEach((line, i) => {
                pdf.text(line, colX.label, textStartY + (i * lineHeight));
            });

            // Centrer verticalement les autres colonnes
            const centerY = y + (cellHeight / 2) + 1.5;

            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(...grisTexte);
            pdf.text(String(ligne.quantite), colX.qty, centerY);

            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(...grisClair);
            pdf.text(ligne.tempsUnitaireMn + ' min', colX.temps, centerY);
            pdf.text(ligne.tauxHoraire.toFixed(2) + ' €/h', colX.taux, centerY);

            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(...vertFonce);
            pdf.text(ligne.totalLigne.toFixed(2) + ' €', colX.total, centerY, { align: 'right' });

            // Dessiner la ligne de separation
            pdf.setDrawColor(229, 231, 235);
            pdf.setLineWidth(0.15);
            pdf.line(margin, y + cellHeight - 1, margin + contentWidth, y + cellHeight - 1);

            y += cellHeight;
        });

        y += 2;

        const totalHT = devis.totalPrixHT || 0;
        const totalTTC = devis.totalPrixTTC || 0;
        const tempsTotalMn = devis.totalTempsMn || 0;
        const heures = Math.floor(tempsTotalMn / 60);
        const minutes = Math.round(tempsTotalMn % 60);
        const tempsStr = `${heures}h${minutes.toString().padStart(2, '0')}`;

        const totauxBoxW = 75;
        const totauxBoxX = margin + contentWidth - totauxBoxW;
        const totauxBoxH = 38;

        if (y + totauxBoxH > pageHeight - 15) {
            pdf.addPage();
            y = margin;
        }

        pdf.setFillColor(209, 250, 229);
        pdf.roundedRect(totauxBoxX, y, totauxBoxW, totauxBoxH, 3, 3, 'F');

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(7);
        pdf.setTextColor(...grisClair);
        pdf.text('Temps estimé', totauxBoxX + 4, y + 7);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(9);
        pdf.setTextColor(107, 33, 168);
        pdf.text(tempsStr, totauxBoxX + totauxBoxW - 4, y + 7, { align: 'right' });

        pdf.setDrawColor(...vert);
        pdf.setLineWidth(0.3);
        pdf.line(totauxBoxX + 4, y + 11, totauxBoxX + totauxBoxW - 4, y + 11);

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(7);
        pdf.setTextColor(...grisClair);
        pdf.text('Total HT', totauxBoxX + 4, y + 18);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(10);
        pdf.setTextColor(...vertFonce);
        pdf.text(totalHT.toFixed(2) + '€', totauxBoxX + totauxBoxW - 4, y + 18, { align: 'right' });

        pdf.setDrawColor(...vert);
        pdf.setLineWidth(0.3);
        pdf.line(totauxBoxX + 4, y + 23, totauxBoxX + totauxBoxW - 4, y + 23);

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(7);
        pdf.setTextColor(...grisClair);
        pdf.text('Total TTC', totauxBoxX + 4, y + 30);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(12);
        pdf.setTextColor(...vertFonce);
        pdf.text(totalTTC.toFixed(2) + '€', totauxBoxX + totauxBoxW - 4, y + 31, { align: 'right' });

        y += totauxBoxH + 8;

        if (devis.remarques && y < pageHeight - 40) {
            pdf.setFillColor(...grisTresClair);
            const remarquesLines = pdf.splitTextToSize(devis.remarques, contentWidth - 12);
            const boxH = 12 + (remarquesLines.length * 4);

            if (y + boxH > pageHeight - 35) {
                pdf.addPage();
                y = margin;
            }

            pdf.roundedRect(margin, y, contentWidth, boxH, 3, 3, 'F');

            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(8);
            pdf.setTextColor(...vertFonce);
            pdf.text('REMARQUES', margin + 6, y + 7);

            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(8);
            pdf.setTextColor(...grisTexte);
            pdf.text(remarquesLines, margin + 6, y + 13);

            y += boxH + 6;
        }


        const filename = 'Devis_' + (devis.nomChantier || 'Chantier').replace(/[^a-zA-Z0-9]/g, '_') + '_' + date.replace(/ /g, '_') + '.pdf';
        pdf.save(filename);

    } catch (error) {
        console.error('Erreur génération PDF:', error);
        alert('Erreur lors de la génération du PDF');
    }
};

// ========== MODAL DE MISE À JOUR ==========
function showUpdateModal() {
    const modalHTML = `
        <div class="update-modal show" id="updateModal">
            <div class="update-modal-content">
                <div class="update-modal-header">
                    <button class="update-modal-close" onclick="closeUpdateModal()">
                        <i class="fas fa-times"></i>
                    </button>
                    <div class="header-icon">
                        <i class="fas fa-rocket"></i>
                    </div>
                    <h2>Mise à jour v2.2.0 !</h2>
                    <p>Découvrez toutes les nouveautés</p>
                </div>
                
                <div class="update-modal-body">

                    <div class="update-section">
                        <div class="update-section-title">
                            <div class="icon"><i class="fas fa-layer-group"></i></div>
                            <span>Modales chargement & succès</span>
                            <span class="badge-new">NEW</span>
                        </div>
                        <ul class="update-list">
                            <li class="update-item">
                                <div class="update-item-icon"><i class="fas fa-spinner"></i></div>
                                <div class="update-item-content">
                                    <h4 class="update-item-title">Animation pendant l'envoi</h4>
                                    <p class="update-item-desc">Les pages Feuilles, Signaler et Spécifique affichent une animation de chargement et une confirmation visuelle à chaque envoi.</p>
                                </div>
                            </li>
                            <li class="update-item">
                                <div class="update-item-icon"><i class="fas fa-file-code"></i></div>
                                <div class="update-item-content">
                                    <h4 class="update-item-title">Code JavaScript externalisé</h4>
                                    <p class="update-item-desc">Le code de ces pages a été déplacé dans des fichiers JS séparés pour une meilleure stabilité.</p>
                                </div>
                            </li>
                        </ul>
                    </div>

                    <div class="update-section">
                        <div class="update-section-title">
                            <div class="icon"><i class="fas fa-file-invoice"></i></div>
                            <span>Refonte complète du formulaire devis</span>
                            <span class="badge-new">NEW</span>
                        </div>
                        <ul class="update-list">
                            <li class="update-item">
                                <div class="update-item-icon"><i class="fas fa-calculator"></i></div>
                                <div class="update-item-content">
                                    <h4 class="update-item-title">Nouveau formulaire et chiffrage</h4>
                                    <p class="update-item-desc">Le formulaire devis et le système de chiffrage ont été entièrement refondus pour plus de clarté et de précision.</p>
                                </div>
                            </li>
                            <li class="update-item">
                                <div class="update-item-icon"><i class="fas fa-bell"></i></div>
                                <div class="update-item-content">
                                    <h4 class="update-item-title">Notification à l'envoi</h4>
                                    <p class="update-item-desc">Une notification est envoyée automatiquement à chaque nouveau devis soumis.</p>
                                </div>
                            </li>
                        </ul>
                    </div>

                    <div class="update-section">
                        <div class="update-section-title">
                            <div class="icon"><i class="fas fa-exclamation-triangle"></i></div>
                            <span>Gestion des erreurs améliorée</span>
                            <span class="badge-new">NEW</span>
                        </div>
                        <ul class="update-list">
                            <li class="update-item">
                                <div class="update-item-icon"><i class="fas fa-times-circle"></i></div>
                                <div class="update-item-content">
                                    <h4 class="update-item-title">Modales d'erreur</h4>
                                    <p class="update-item-desc">Les pages Signaler, Feuilles et Spécifique affichent désormais un message clair en cas de problème lors de l'envoi.</p>
                                </div>
                            </li>
                        </ul>
                    </div>

                    <div class="update-section">
                        <div class="update-section-title">
                            <div class="icon"><i class="fas fa-save"></i></div>
                            <span>Améliorations formulaires</span>
                        </div>
                        <ul class="update-list">
                            <li class="update-item">
                                <div class="update-item-icon"><i class="fas fa-user"></i></div>
                                <div class="update-item-content">
                                    <h4 class="update-item-title">Nom d'agent mémorisé</h4>
                                    <p class="update-item-desc">Votre prénom est sauvegardé automatiquement et pré-rempli à chaque visite sur toutes les pages.</p>
                                </div>
                            </li>
                            <li class="update-item">
                                <div class="update-item-icon"><i class="fas fa-trash-alt"></i></div>
                                <div class="update-item-content">
                                    <h4 class="update-item-title">Suppression photo individuelle</h4>
                                    <p class="update-item-desc">Retirez une photo précise de votre sélection avant envoi, sans recommencer toute la sélection.</p>
                                </div>
                            </li>
                            <li class="update-item">
                                <div class="update-item-icon"><i class="fas fa-redo-alt"></i></div>
                                <div class="update-item-content">
                                    <h4 class="update-item-title">Réinitialisation automatique</h4>
                                    <p class="update-item-desc">Le formulaire se remet à zéro 3 secondes après un envoi réussi, sans perdre le nom de l'agent.</p>
                                </div>
                            </li>
                        </ul>
                    </div>

                </div>
                
                <div class="update-modal-footer">
                    <button class="btn btn-primary" onclick="closeUpdateModal()">
                        <i class="fas fa-thumbs-up"></i>
                        J'ai compris !
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

window.closeUpdateModal = function () {
    const modal = document.getElementById('updateModal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
        localStorage.setItem('updateModalShown_v2.2.0', 'true');
    }
}
// Afficher la modal au chargement si pas déjà vue
window.addEventListener('load', () => {
    setTimeout(() => {
        const loginModal = document.getElementById('loginModal');
        const isLoggedIn = !loginModal || loginModal.style.display === 'none';
        const alreadySeen = localStorage.getItem('updateModalShown_v2.2.0');

        console.log('Modal debug:', { isLoggedIn, alreadySeen, loginModal });

        if (isLoggedIn && !alreadySeen) {
            showUpdateModal();
        }
    }, 300);
});
function generateDevisInfos(devis) {
    window.currentDevisPhotos = {
        cuisine: devis.photos?.cuisine || [],
        sejour: devis.photos?.sejour || [],
        vitresHautes: devis.photos?.vitresHautes || []
    };

    let html = '<div class="devis-infos-section">';
    html += '<h3><i class="fas fa-info-circle"></i> Informations du bien</h3>';
    html += '<div class="devis-infos-grid">';

    if (devis.typeLogement) {
        html += `<div class="devis-info-item">
            <div class="info-label">Type de logement</div>
            <div class="info-value">${devis.typeLogement}</div>
        </div>`;
    }

    if (devis.surface) {
        html += `<div class="devis-info-item">
            <div class="info-label">Surface</div>
            <div class="info-value">${devis.surface} m²</div>
        </div>`;
    }

    if (devis.remarques) {
        html += `<div class="devis-info-item" style="grid-column: 1 / -1;">
            <div class="info-label">Remarques</div>
            <div class="info-value">${escapeHtml(devis.remarques)}</div>
        </div>`;
    }

    html += '</div>';

    const cuisinePhotos = devis.photos?.cuisine || [];
    const sejourPhotos = devis.photos?.sejour || [];
    const vitresHautesPhotos = devis.photos?.vitresHautes || [];

    if (cuisinePhotos.length > 0) {
        html += `<div class="devis-photos-section">
            <h4><i class="fas fa-utensils"></i> Photos cuisine (${cuisinePhotos.length})</h4>
            <div class="devis-photos-grid">
                ${cuisinePhotos.map((photo, index) => `
                    <div class="devis-photo-item" onclick="openPhotoModal('cuisine', ${index})">
                        <img src="${photo.url}" alt="Cuisine ${index + 1}">
                        <div class="photo-overlay">
                            <i class="fas fa-search-plus"></i>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>`;
    }

    if (sejourPhotos.length > 0) {
        html += `<div class="devis-photos-section">
            <h4><i class="fas fa-couch"></i> Photos séjour (${sejourPhotos.length})</h4>
            <div class="devis-photos-grid">
                ${sejourPhotos.map((photo, index) => `
                    <div class="devis-photo-item" onclick="openPhotoModal('sejour', ${index})">
                        <img src="${photo.url}" alt="Séjour ${index + 1}">
                        <div class="photo-overlay">
                            <i class="fas fa-search-plus"></i>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>`;
    }

    if (vitresHautesPhotos.length > 0) {
        html += `<div class="devis-photos-section">
        <h4><i class="fas fa-window-maximize"></i> Photos vitres hautes (${vitresHautesPhotos.length})</h4>
        <div class="devis-photos-grid">
            ${vitresHautesPhotos.map((photo, index) => `
                <div class="devis-photo-item" onclick="openPhotoModal('vitresHautes', ${index})">
                    <img src="${photo.url}" alt="Vitres hautes ${index + 1}">
                    <div class="photo-overlay">
                        <i class="fas fa-search-plus"></i>
                    </div>
                </div>
            `).join('')}
        </div>
    </div>`;
    }

    html += '</div>';
    return html;
}
async function openChiffrageModal(devisId) {
    const devisRef = doc(db, "devis", devisId);
    const docSnap = await getDoc(devisRef);
    const devis = { id: docSnap.id, ...docSnap.data() };
    const isEdit = devis.status === 'chiffre';

    const modalHTML = `
        <div id="chiffrageModal" class="chiffrage-modal show">
            <div class="chiffrage-modal-content">
                
                <div class="chiffrage-modal-header ${isEdit ? 'chiffrage-modal-header--edit' : ''}">
                    <div class="chiffrage-modal-title">
                        <i class="fas fa-${isEdit ? 'pen' : 'calculator'}"></i>
                        <div>
                            <h2>${isEdit ? 'Modifier le chiffrage' : 'Chiffrage'}</h2>
                            <span class="devis-name">${escapeHtml(devis.nomChantier || 'Sans nom')}</span>
                        </div>
                    </div>
                    <button class="chiffrage-modal-close" onclick="document.getElementById('chiffrageModal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>

                <div class="chiffrage-modal-body">
                    ${generateDevisInfos(devis)}
                    <table class="chiffrage-table">
                        <thead>
                            <tr>
                                <th class="col-designation">DÉSIGNATION</th>
                                <th class="col-center">Quantité</th>
                                <th class="col-center">TEMPS (min)</th>
                                <th class="col-center">TAUX (€/h)</th>
                                <th class="col-right">TOTAL</th>
                            </tr>
                        </thead>
                        <tbody id="chiffrageBody">
                            ${generateChiffrageRows(devis)}
                        </tbody>
                    </table>
                </div>

                <div class="chiffrage-modal-footer">
                    <div class="chiffrage-totaux">
                        <div class="chiffrage-total-item temps">
                            <div class="chiffrage-total-label"><i class="fas fa-clock"></i> Temps total</div>
                            <div class="chiffrage-total-value" id="tempsHeures">0h00</div>
                            <span id="grandTemps" style="display:none;">0</span>
                            <span id="grandTempsMn" style="display:none;">0</span>
                        </div>
                        <div class="chiffrage-total-item prix">
                            <div class="chiffrage-total-label"><i class="fas fa-euro-sign"></i> Total HT</div>
                            <div class="chiffrage-total-value"><span id="grandTotal">0.00</span>€</div>
                        </div>
                        <div class="chiffrage-total-item prix-ttc">
                            <div class="chiffrage-total-label"><i class="fas fa-euro-sign"></i> Total TTC</div>
                            <div class="chiffrage-total-value"><span id="grandTotalTTC">0.00</span>€</div>
                        </div>
                    </div>
                    <div class="chiffrage-actions">
                        <button class="btn btn-secondary" onclick="document.getElementById('chiffrageModal').remove()">
                            <i class="fas fa-times"></i> Annuler
                        </button>
                        <button class="btn btn-primary" onclick="saveChiffrage('${devisId}')">
                            <i class="fas fa-${isEdit ? 'save' : 'check'}"></i> ${isEdit ? 'Enregistrer les modifications' : 'Valider le chiffrage'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    calculerTotalDevis();
}
function generateChiffrageRows(devis) {
    const items = [];

    if (devis.vitres?.standard > 0) {
        const needsGrattage = devis.grattage?.standard;
        items.push({
            label: 'Vitres Standard',
            nb: devis.vitres.standard,
            tempsMn: TEMPS_DEFAUT['Vitres Standard'] || 6,
            taux: 43.40,
            grattage: needsGrattage
        });
    }
    if (devis.vitres?.baies > 0) {
        const needsGrattage = devis.grattage?.baies;
        items.push({
            label: 'Baies Vitrées',
            nb: devis.vitres.baies,
            tempsMn: TEMPS_DEFAUT['Baies Vitrées'] || 8,
            taux: 43.40,
            grattage: needsGrattage
        });
    }
    if (devis.vitres?.velux > 0) {
        const needsGrattage = devis.grattage?.velux;
        items.push({
            label: 'Vélux',
            nb: devis.vitres.velux,
            tempsMn: TEMPS_DEFAUT['Vélux'] || 10,
            taux: 43.40,
            grattage: needsGrattage
        });
    }
    if (devis.vitres?.portes > 0) {
        const needsGrattage = devis.grattage?.portes;
        items.push({
            label: 'Portes vitrées',
            nb: devis.vitres.portes,
            tempsMn: TEMPS_DEFAUT['Portes vitrées'] || 6,
            taux: 43.40,
            grattage: needsGrattage
        });
    }
    if (devis.vitres?.hautes) {
        const needsGrattage = devis.grattage?.hautes;
        items.push({
            label: 'Vitres Hautes',
            nb: 1,
            tempsMn: TEMPS_DEFAUT['Vitres Hautes'] || 10,
            taux: 43.40,
            grattage: needsGrattage
        });
    }

    if (devis.chambres?.avecPlacard > 0) {
        items.push({ label: 'Chambres avec placard', nb: devis.chambres.avecPlacard, tempsMn: TEMPS_DEFAUT['Chambres avec placard'] || 30, taux: 43.40 });
    }
    if (devis.chambres?.sansPlacard > 0) {
        items.push({ label: 'Chambres sans placard', nb: devis.chambres.sansPlacard, tempsMn: TEMPS_DEFAUT['Chambres sans placard'] || 20, taux: 43.40 });
    }
    if (devis.chambres?.dortoir > 0) {
        items.push({ label: 'Dortoir avec placards', nb: devis.chambres.dortoir, tempsMn: TEMPS_DEFAUT['Dortoir avec placards'] || 60, taux: 43.40 });
    }
    if (devis.chambres?.mezzanine > 0) {
        items.push({ label: 'Mezzanine', nb: devis.chambres.mezzanine, tempsMn: TEMPS_DEFAUT['Mezzanine'] || 60, taux: 43.40 });
    }
    if (devis.chambres?.dressing > 0) {
        items.push({ label: 'Dressing', nb: devis.chambres.dressing, tempsMn: TEMPS_DEFAUT['Dressing'] || 30, taux: 43.40 });
    }
    if (devis.chambres?.placardsSeuls > 0) {
        items.push({ label: 'Placards seuls', nb: devis.chambres.placardsSeuls, tempsMn: TEMPS_DEFAUT['Placards seuls'] || 15, taux: 43.40 });
    }

    if (devis.sallesDeBain?.grandeSdbDouche > 0) {
        items.push({ label: 'Grande SDB avec douche', nb: devis.sallesDeBain.grandeSdbDouche, tempsMn: TEMPS_DEFAUT['Grande SDB avec douche'] || 120, taux: 43.40 });
    }
    if (devis.sallesDeBain?.grandeSdbBaignoire > 0) {
        items.push({ label: 'Grande SDB avec baignoire', nb: devis.sallesDeBain.grandeSdbBaignoire, tempsMn: TEMPS_DEFAUT['Grande SDB avec baignoire'] || 120, taux: 43.40 });
    }
    if (devis.sallesDeBain?.petiteSdbDouche > 0) {
        items.push({ label: 'Petite SDB avec douche', nb: devis.sallesDeBain.petiteSdbDouche, tempsMn: TEMPS_DEFAUT['Petite SDB avec douche'] || 60, taux: 43.40 });
    }
    if (devis.sallesDeBain?.petiteSdbBaignoire > 0) {
        items.push({ label: 'Petite SDB avec baignoire', nb: devis.sallesDeBain.petiteSdbBaignoire, tempsMn: TEMPS_DEFAUT['Petite SDB avec baignoire'] || 60, taux: 43.40 });
    }
    if (devis.sallesDeBain?.wcLaveMain > 0) {
        items.push({ label: 'WC lave-mains', nb: devis.sallesDeBain.wcLaveMain, tempsMn: TEMPS_DEFAUT['WC lave-mains'] || 20, taux: 43.40 });
    }
    if (devis.sallesDeBain?.wcSeul > 0) {
        items.push({ label: 'WC seul', nb: devis.sallesDeBain.wcSeul, tempsMn: TEMPS_DEFAUT['WC seul'] || 15, taux: 43.40 });
    }

    if (devis.cuisine?.petite > 0) {
        items.push({ label: 'Petite cuisine', nb: devis.cuisine.petite, tempsMn: TEMPS_DEFAUT['Petite cuisine'] || 40, taux: 43.40 });
    }
    if (devis.cuisine?.grande > 0) {
        items.push({ label: 'Grande cuisine', nb: devis.cuisine.grande, tempsMn: TEMPS_DEFAUT['Grande cuisine'] || 60, taux: 43.40 });
    }

    // Pieces annexes (structure objet)
    const annexes = devis.piecesAnnexes || {};
    if (annexes.sauna > 0) items.push({ label: 'Sauna', nb: annexes.sauna, tempsMn: TEMPS_DEFAUT['Sauna'] || 45, taux: 43.40 });
    if (annexes.buanderie > 0) items.push({ label: 'Buanderie', nb: annexes.buanderie, tempsMn: TEMPS_DEFAUT['Buanderie'] || 60, taux: 43.40 });
    if (annexes.localTechnique > 0) items.push({ label: 'Local technique', nb: annexes.localTechnique, tempsMn: TEMPS_DEFAUT['Local technique'] || 30, taux: 43.40 });
    if (annexes.cellier > 0) items.push({ label: 'Cellier', nb: annexes.cellier, tempsMn: TEMPS_DEFAUT['Cellier'] || 60, taux: 43.40 });
    if (annexes.bureau > 0) items.push({ label: 'Bureau', nb: annexes.bureau, tempsMn: TEMPS_DEFAUT['Bureau'] || 30, taux: 43.40 });
    if (annexes.garage > 0) items.push({ label: 'Garage', nb: annexes.garage, tempsMn: TEMPS_DEFAUT['Garage'] || 60, taux: 43.40 });
    if (annexes.skiroom > 0) items.push({ label: 'Skiroom', nb: annexes.skiroom, tempsMn: TEMPS_DEFAUT['Skiroom'] || 60, taux: 43.40 });
    if (annexes.salleVideo > 0) items.push({ label: 'Salle vidéo', nb: annexes.salleVideo, tempsMn: TEMPS_DEFAUT['Salle vidéo'] || 30, taux: 43.40 });
    if (annexes.chaufferie > 0) items.push({ label: 'Chaufferie', nb: annexes.chaufferie, tempsMn: TEMPS_DEFAUT['Chaufferie'] || 60, taux: 43.40 });
    if (annexes.escalier > 0) items.push({ label: 'Escalier', nb: annexes.escalier, tempsMn: TEMPS_DEFAUT['Escalier'] || 15, taux: 43.40 });
    if (annexes.ascenseur > 0) items.push({ label: 'Ascenseur', nb: annexes.ascenseur, tempsMn: TEMPS_DEFAUT['Ascenseur'] || 30, taux: 43.40 });

    // Checkboxes annexes
    if (annexes.tapisEntree) items.push({ label: 'Tapis entrée', nb: 1, tempsMn: TEMPS_DEFAUT['Tapis entrée'] || 10, taux: 43.40 });
    if (annexes.aspiVmc) items.push({ label: 'Aspi trappe VMC', nb: 1, tempsMn: TEMPS_DEFAUT['Aspi trappe VMC'] || 20, taux: 43.40 });
    if (annexes.rambarde) items.push({ label: 'Rambarde', nb: 1, tempsMn: TEMPS_DEFAUT['Rambarde'] || 30, taux: 43.40 });
    if (annexes.aspiPoutraison) items.push({ label: 'Aspiration poutraison + mur', nb: 1, tempsMn: TEMPS_DEFAUT['Aspiration poutraison + mur'] || 60, taux: 43.40 });

    // Autres annexes (texte libre)
    if (annexes.autres && Array.isArray(annexes.autres)) {
        annexes.autres.forEach(autre => {
            items.push({ label: autre, nb: 1, tempsMn: TEMPS_DEFAUT[autre] || 45, taux: 43.40 });
        });
    }

    // Exterieurs
    if (devis.exterieurs?.balcon > 0) {
        items.push({ label: 'Balcon', nb: devis.exterieurs.balcon, tempsMn: TEMPS_DEFAUT['Balcon'] || 30, taux: 43.40 });
    }
    if (devis.exterieurs?.terrasse > 0) {
        items.push({ label: 'Terrasse', nb: devis.exterieurs.terrasse, tempsMn: TEMPS_DEFAUT['Terrasse'] || 60, taux: 43.40 });
    }

    if (devis.lignesChiffrage && devis.lignesChiffrage.length > 0) {
        items.forEach(item => {
            const ligneExistante = devis.lignesChiffrage.find(l => {
                const designationClean = l.designation.replace(/Grattage/g, '').trim();
                return designationClean === item.label || l.designation === item.label;
            });
            if (ligneExistante) {
                item.tempsMn = ligneExistante.tempsUnitaireMn || item.tempsMn;
                item.taux = ligneExistante.tauxHoraire || 43.40;
            }
        });
    }

    return items.map(item => `
        <tr class="chiffrage-row ${item.grattage ? 'row-grattage' : ''}">
            <td class="chiffrage-td-label" data-label="Élément">
                ${item.label}
                ${item.grattage ? '<span class="grattage-badge"><i class="fas fa-exclamation-triangle"></i> Grattage</span>' : ''}
            </td>
            <td class="chiffrage-td-center" data-label="Quantité"><input type="number" class="calc-nb chiffrage-input-readonly" value="${item.nb}" readonly></td>
            <td class="chiffrage-td-center" data-label="Temps (mn)"><input type="number" step="1" class="calc-temps chiffrage-input-editable" value="${item.tempsMn}" oninput="calculerTotalDevis()" placeholder="minutes"></td>
            <td class="chiffrage-td-center" data-label="Taux (€/h)"><input type="number" step="0.1" class="calc-taux chiffrage-input-editable" value="${item.taux}" oninput="calculerTotalDevis()"></td>
            <td class="chiffrage-td-total" data-label="Total"><span class="row-total-val">0.00</span>€</td>
        </tr>
    `).join('');
}


function formatTempsEnMinutes(heuresDecimales) {
    if (!heuresDecimales || heuresDecimales === 0) return '0mn';

    const heuresEntieres = Math.floor(heuresDecimales);
    const fractionnaire = heuresDecimales - heuresEntieres;
    const minutes = Math.round(fractionnaire * 60);

    if (heuresEntieres === 0) {
        return `${minutes}mn`;
    } else if (minutes === 0) {
        return `${heuresEntieres}h`;
    } else {
        return `${heuresEntieres}h${minutes < 10 ? '0' : ''}${minutes}`;
    }
}
// Formate des heures decimales pour affichage (ex: 1.5 -> 1,50h)
function formatHeuresDecimales(heures) {
    if (!heures) return '0mn';
    return formatTempsEnMinutes(heures);
}

function calculerTotalDevis() {
    let grandTotal = 0;
    let grandTempsMn = 0;
    const rows = document.querySelectorAll('#chiffrageBody tr');

    rows.forEach(row => {
        const nb = parseFloat(row.querySelector('.calc-nb')?.value) || 0;
        const tempsMn = parseFloat(row.querySelector('.calc-temps')?.value) || 0;
        const taux = parseFloat(row.querySelector('.calc-taux')?.value) || 0;

        const totalMinutes = nb * tempsMn;
        const totalHeures = totalMinutes / 60;
        const totalLignePrix = totalHeures * taux;

        const displayTotal = row.querySelector('.row-total-val');
        if (displayTotal) displayTotal.textContent = totalLignePrix.toFixed(2);

        grandTotal += totalLignePrix;
        grandTempsMn += totalMinutes;
    });

    const grandTotalTTC = grandTotal * 1.22;

    const heures = Math.floor(grandTempsMn / 60);
    const minutes = Math.round(grandTempsMn % 60);
    const tempsFormate = `${heures}h${minutes.toString().padStart(2, '0')}`;

    if (document.getElementById('grandTotal')) document.getElementById('grandTotal').textContent = grandTotal.toFixed(2);
    if (document.getElementById('grandTotalTTC')) document.getElementById('grandTotalTTC').textContent = grandTotalTTC.toFixed(2);
    if (document.getElementById('grandTemps')) document.getElementById('grandTemps').textContent = (grandTempsMn / 60).toFixed(2);
    if (document.getElementById('grandTempsMn')) document.getElementById('grandTempsMn').textContent = grandTempsMn;

    if (document.getElementById('tempsHeures')) {
        document.getElementById('tempsHeures').textContent = tempsFormate;
    }
}
async function saveChiffrage(devisId) {
    const totalHT = parseFloat(document.getElementById('grandTotal').textContent);
    const totalTTC = parseFloat(document.getElementById('grandTotalTTC').textContent);
    const tempsTotal = parseFloat(document.getElementById('grandTemps').textContent);
    const tempsTotalMn = parseFloat(document.getElementById('grandTempsMn').textContent);

    const existingDevis = allData.devis.find(d => d.id === devisId);
    const isEdit = existingDevis && existingDevis.status === 'chiffre';

    const lignesChiffrage = [];
    const rows = document.querySelectorAll('#chiffrageBody tr');

    rows.forEach(row => {
        const label = row.querySelector('.chiffrage-td-label')?.textContent;
        const nb = parseFloat(row.querySelector('.calc-nb')?.value) || 0;
        const tempsMn = parseFloat(row.querySelector('.calc-temps')?.value) || 0;
        const taux = parseFloat(row.querySelector('.calc-taux')?.value) || 0;

        if (nb > 0) {
            const totalMinutes = nb * tempsMn;
            const totalHeures = totalMinutes / 60;
            const totalLigne = totalHeures * taux;

            lignesChiffrage.push({
                designation: label,
                quantite: nb,
                tempsUnitaireMn: tempsMn,
                tauxHoraire: taux,
                totalLigne: totalLigne
            });
        }
    });

    try {
        const devisRef = doc(db, "devis", devisId);
        await updateDoc(devisRef, {
            lignesChiffrage: lignesChiffrage,
            totalPrixHT: totalHT,
            totalPrixTTC: totalTTC,
            totalTemps: tempsTotal,
            totalTempsMn: tempsTotalMn,
            status: 'chiffre',
            dateChiffrage: new Date()
        });

        document.getElementById('chiffrageModal').remove();

        showNotification('Chiffrage enregistré avec succès !', 'success');

        await loadDevis();

    } catch (error) {
        console.error("Erreur Firestore :", error);
        showNotification('Erreur lors de la sauvegarde : ' + error.message, 'error');
    }
}

function showNotification(message, type = 'success') {
    const existingNotif = document.querySelector('.dashboard-notification');
    if (existingNotif) existingNotif.remove();

    const notif = document.createElement('div');
    notif.className = `dashboard-notification ${type}`;
    notif.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    document.body.appendChild(notif);

    setTimeout(() => {
        notif.classList.add('show');
    }, 10);

    setTimeout(() => {
        notif.classList.remove('show');
        setTimeout(() => notif.remove(), 300);
    }, 3000);
}
function openPhotoModal(category, startIndex) {
    const photos = window.currentDevisPhotos[category];
    if (!photos || photos.length === 0) return;

    // Extraire les URLs (compatibilité ancien et nouveau format)
    const photoUrls = photos.map(photo => typeof photo === 'string' ? photo : photo.url);

    const modalHTML = `
        <div id="photoModal" class="photo-modal show">
            <div class="photo-modal-content">
                <button class="photo-modal-close" onclick="closePhotoModal()">
                    <i class="fas fa-times"></i>
                </button>
                
                ${photoUrls.length > 1 ? `
                    <button class="photo-nav photo-nav-prev" onclick="photoModalPrev()">
                        <i class="fas fa-chevron-left"></i>
                    </button>
                ` : ''}
                
                <div class="photo-modal-container">
                    <img id="photoModalImg" src="${photoUrls[startIndex]}" alt="Photo ${startIndex + 1}">
                    ${photoUrls.length > 1 ? `
                        <div class="photo-modal-counter">
                            <span id="photoModalIndex">${startIndex + 1}</span> / ${photoUrls.length}
                        </div>
                    ` : ''}
                </div>
                
                ${photoUrls.length > 1 ? `
                    <button class="photo-nav photo-nav-next" onclick="photoModalNext()">
                        <i class="fas fa-chevron-right"></i>
                    </button>
                ` : ''}
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    window.currentPhotoModalData = { photos: photoUrls, currentIndex: startIndex };
}
function closePhotoModal() {
    const modal = document.getElementById('photoModal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
    }
    window.currentPhotoModalData = null;
}

function photoModalPrev() {
    const data = window.currentPhotoModalData;
    if (!data) return;

    data.currentIndex = (data.currentIndex - 1 + data.photos.length) % data.photos.length;
    const img = document.getElementById('photoModalImg');
    const counter = document.getElementById('photoModalIndex');

    if (img) img.src = data.photos[data.currentIndex];
    if (counter) counter.textContent = data.currentIndex + 1;
}

function photoModalNext() {
    const data = window.currentPhotoModalData;
    if (!data) return;

    data.currentIndex = (data.currentIndex + 1) % data.photos.length;
    const img = document.getElementById('photoModalImg');
    const counter = document.getElementById('photoModalIndex');

    if (img) img.src = data.photos[data.currentIndex];
    if (counter) counter.textContent = data.currentIndex + 1;
}


// CRUCIAL : Exposer les fonctions au HTML
window.openChiffrageModal = openChiffrageModal;
window.calculerTotalDevis = calculerTotalDevis;
window.saveChiffrage = saveChiffrage;
window.openPhotoModal = openPhotoModal;
window.closePhotoModal = closePhotoModal;
window.photoModalPrev = photoModalPrev;
window.photoModalNext = photoModalNext;