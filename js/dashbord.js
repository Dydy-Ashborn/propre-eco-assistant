// Import Firebase
import { db } from './config.js';
import { collection, getDocs, getDoc, deleteDoc, doc, updateDoc, addDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { initCoproManagement } from './dashboard-copro.js';
//TEMPS PAR DEFAUT POUR LE CHIFFRAGE (en minutes)
const TEMPS_DEFAUT = {
    'Vitres Standard': 3,
    'Baies Vitrées': 4,
    'Vitres Hautes': 5,
    'Vélux': 5,
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
    'Garage': 60,
    'Séjour': 30,
    'Cuisine (photo)': 30
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
    const loginModal = document.getElementById('loginModal');
    const dashboardContent = document.getElementById('dashboardContent');

    if (localStorage.getItem('dashboard_auth') === 'true') {
        loginModal.style.display = 'none';
        dashboardContent.style.display = 'block';
        setupDashboard();
        return;
    }

    loginModal.style.display = 'flex';
    dashboardContent.style.display = 'none';

    document.getElementById('loginForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const input = document.getElementById('passwordInput');
        if (input.value === PASSWORD) {
            localStorage.setItem('dashboard_auth', 'true');
            loginModal.style.display = 'none';
            dashboardContent.style.display = 'block';
            setupDashboard();
        } else {
            const err = document.getElementById('loginError');
            if (err) err.style.display = 'flex';
        }
    });
}
function setupDashboard() {
    checkAuth();
    setupEventListeners();
    setupSearch();

    const today = new Date();
    const currentWeek = getWeekNumber(today);
    const weekString = `${today.getFullYear()}-W${currentWeek.toString().padStart(2, '0')}`;

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
    if (localStorage.getItem('dashboard_auth') === 'true') {
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
        localStorage.setItem('dashboard_auth', 'true');
        showDashboard();
    } else {
        const errorDiv = document.getElementById('loginError');
        errorDiv.style.display = 'flex';
        setTimeout(() => errorDiv.style.display = 'none', 3000);
    }
}

function handleLogout() {
    localStorage.removeItem('dashboard_auth');
    showLogin();
}

// ========== EVENT LISTENERS ==========
function setupEventListeners() {
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

    // Si on quitte l'onglet heures ou qu'on y revient, reset la vue facturation
    if (tab === 'heures') {
        const factView = document.getElementById('facturationView');
        const heuresNormal = document.getElementById('heuresNormal');
        if (factView) { factView.style.display = 'none'; factView.innerHTML = ''; }
        if (heuresNormal) heuresNormal.style.display = 'block';
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
        case 'planning':
            initPlanningTab();
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

        const DASHBOARD_EMPLOYEES = [
            { name: "Dylan", id: "dylan" },
            { name: "Océane", id: "oceane" },
            { name: "Samuel", id: "samuel" },
            { name: "Jérémie", id: "jeremie" },
            { name: "Carlos", id: "carlos" },
            { name: "Sandra", id: "sandra" },
            { name: "Manon", id: "manon" },
            { name: "Stéphane", id: "stephane" },
            { name: "Isabelle", id: "isabelle" },
            { name: "Caroline", id: "caroline" },
            { name: "Nadjet", id: "nadjet" },
            { name: "Rémy", id: "remy" },
            { name: "Maxime", id: "maxime" },
            { name: "Shana", id: "shana" }
        ];
        // ========== ALERTE HEURES MANQUANTES ==========
        async function checkHeuresManquantes() {
            const today = new Date();
            const hour = today.getHours();

            // Lundi de la semaine courante
            const dayOfWeek = today.getDay() || 7; // lundi=1 ... dimanche=7
            const monday = new Date(today);
            monday.setDate(today.getDate() - dayOfWeek + 1);
            monday.setHours(0, 0, 0, 0);

            // Hier à 23:59 — on n'inclut jamais aujourd'hui
            const hier = new Date(today);
            hier.setDate(today.getDate() - 1);
            hier.setHours(23, 59, 59, 999);

            const joursAVerifier = [];
            const cursor = new Date(monday);
            while (cursor <= hier) {
                const dow = cursor.getDay();
                if (dow >= 1 && dow <= 5) {
                    joursAVerifier.push(new Date(cursor));
                }
                cursor.setDate(cursor.getDate() + 1);
            }

            // if (joursAVerifier.length === 0) {
            //     renderAlerteHeures([], today, hour);
            //     return;
            // }

            // Clé semaine (ISO)
            const getWeekNum = (d) => {
                const tmp = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
                tmp.setUTCDate(tmp.getUTCDate() + 4 - (tmp.getUTCDay() || 7));
                const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
                return Math.ceil((((tmp - yearStart) / 86400000) + 1) / 7);
            };

            // Grouper les jours par semaine (en théorie une seule semaine ici)
            const semaineMap = {};
            joursAVerifier.forEach(d => {
                const wk = `${d.getFullYear()}-W${getWeekNum(d).toString().padStart(2, '0')}`;
                if (!semaineMap[wk]) semaineMap[wk] = [];
                semaineMap[wk].push({ date: d, index: d.getDay() - 1 }); // index 0=lundi
            });

            const manquants = []; // { emp, count, jours[] }

            await Promise.all(DASHBOARD_EMPLOYEES.map(async (emp) => {
                let joursManquants = [];

                await Promise.all(Object.entries(semaineMap).map(async ([weekString, jours]) => {
                    try {
                        const docRef = doc(db, 'employees', emp.id, 'weeks', weekString);
                        const snap = await getDoc(docRef);

                        jours.forEach(({ date, index }) => {
                            if (!snap.exists()) {
                                joursManquants.push(date);
                                return;
                            }
                            const days = snap.data().days || [];
                            const hours = days[index]?.hours;
                            const comments = (days[index]?.comments || '').toLowerCase().trim();
                            const isEmpty = hours === undefined || hours === null || hours === '' || (typeof hours === 'string' && hours.trim() === '');
                            const isZero = hours === 0 || hours === '0' || parseFloat(hours) === 0;
                            const isExplicit = comments.includes('repos') || comments.includes('cp') || comments.includes('congé') || comments.includes('conge') || comments.includes('absent') || comments.includes('maladie') || comments.includes('férié') || comments.includes('ferie');
                            if (isEmpty && !isZero && !isExplicit) {
                                joursManquants.push(date);
                            }
                        });
                    } catch (e) {
                        console.warn(`Erreur vérif heures ${emp.name}:`, e);
                    }
                }));

                if (joursManquants.length > 0) {
                    manquants.push({ emp, count: joursManquants.length, jours: joursManquants });
                }
            }));

            // renderAlerteHeures(manquants, hour);
        }
        //     function renderAlerteHeures(manquants, hour) {
        //         const existing = document.getElementById('alerte-heures-widget');
        //         if (existing) existing.remove();

        //         if (manquants.length === 0 || hour < 8) return;

        //         const widget = document.createElement('div');
        //         widget.id = 'alerte-heures-widget';
        //         widget.className = 'alerte-heures-widget';
        //         widget.innerHTML = `
        //     <div class="alerte-heures-header">
        //         <div class="alerte-heures-icon-wrap">
        //             <i class="fas fa-clock-rotate-left"></i>
        //         </div>
        //         <div class="alerte-heures-titles">
        //             <span class="alerte-heures-title">Heures manquantes</span>
        //             <span class="alerte-heures-sub">Semaine en cours · ${manquants.length} employé${manquants.length > 1 ? 's' : ''} concerné${manquants.length > 1 ? 's' : ''}</span>
        //         </div>
        //         <span class="alerte-heures-badge">${manquants.length}</span>
        //     </div>
        //     <div class="alerte-heures-list">
        //         ${manquants.map(({ emp, count }) => `
        //             <button class="alerte-emp-btn" onclick="naviguerVersHeuresEmploye('${emp.id}', '${emp.name}')">
        //                 <span class="alerte-emp-avatar">${emp.name.charAt(0).toUpperCase()}</span>
        //                 <div class="alerte-emp-info">
        //                     <span class="alerte-emp-name">${emp.name}</span>
        //                     <span class="alerte-emp-detail">${count} jour${count > 1 ? 's' : ''} non saisi${count > 1 ? 's' : ''}</span>
        //                 </div>
        //                 <span class="alerte-emp-tag ${count > 1 ? 'tag-retard' : 'tag-aremplir'}">${count > 1 ? 'En retard' : 'À remplir'}</span>
        //                 <i class="fas fa-chevron-right alerte-emp-arrow"></i>
        //             </button>
        //         `).join('')}
        //     </div>
        // `;

        //         const overviewGrid = document.querySelector('#content-overview .overview-grid');
        //         if (overviewGrid) {
        //             overviewGrid.parentNode.insertBefore(widget, overviewGrid.nextSibling);
        //         }
        //     }

        window.naviguerVersHeuresEmploye = function (empId, empName) {
            // Pré-sélectionner l'employé dans le filtre de l'onglet Heures
            const filterEmployee = document.getElementById('filterEmployee');
            if (filterEmployee) {
                filterEmployee.value = empId;
            }

            // Naviguer vers l'onglet Heures
            switchTab('heures');
        };
        await checkHeuresManquantes();
        showContent('overview');



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
        allData.feuilles_passage.sort((a, b) => {
            const dateA = a.createdAt?.seconds || 0;
            const dateB = b.createdAt?.seconds || 0;
            return dateB - dateA;
        });
        window.allFeuillesPassage = allData.feuilles_passage;
        renderFeuillesPassage();
        showContent('feuilles_passage');

        const btnMode = document.getElementById('btnModeSelection');
        if (btnMode) {
            btnMode.onclick = window.toggleModeSelection;
        }
    } catch (error) {
        console.error('Erreur feuilles:', error);
        showError('feuilles_passage', error.message);
    }
}

let modeSelectionActif = false;

window.toggleModeSelection = function () {
    modeSelectionActif = !modeSelectionActif;
    const btn = document.getElementById('btnModeSelection');
    if (modeSelectionActif) {
        btn.innerHTML = '<i class="fas fa-times"></i> Annuler';
        btn.classList.add('btn-warning');
        btn.classList.remove('btn-secondary');
    } else {
        btn.innerHTML = '<i class="fas fa-check-square"></i> Sélectionner';
        btn.classList.remove('btn-warning');
        btn.classList.add('btn-secondary');
    }
    renderFeuillesPassage();
};

window.toggleSelectAll = function () {
    const checkboxes = document.querySelectorAll('.feuille-checkbox');
    const allChecked = Array.from(checkboxes).every(cb => cb.checked);
    checkboxes.forEach(cb => cb.checked = !allChecked);
    onFeuilleCheckboxChange();
};

function onFeuilleCheckboxChange() {
    const checked = document.querySelectorAll('.feuille-checkbox:checked');
    const count = document.getElementById('bulkCount');
    const btnDelete = document.getElementById('btnDeleteSelection');
    if (count) count.textContent = `${checked.length} sélectionné(s)`;
    if (btnDelete) btnDelete.style.display = checked.length > 0 ? 'inline-flex' : 'none';
}

function renderFeuillesPassage() {
    const container = document.getElementById('content-feuilles_passage');
    const page = currentPages.feuilles_passage;
    const start = (page - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    const pageData = allData.feuilles_passage.slice(start, end);

    container.innerHTML = modeSelectionActif ? `
        <div class="bulk-actions-bar" id="bulkActionsBar">
            <button class="btn-icon" onclick="toggleSelectAll()" title="Tout sélectionner">
                <i class="fas fa-check-double"></i>
            </button>
            <span id="bulkCount">0 sélectionné(s)</span>
            <button class="btn btn-danger btn-sm" id="btnDeleteSelection"
                style="display:none;" onclick="deleteSelectedFeuilles()">
                <i class="fas fa-trash"></i> Supprimer
            </button>
        </div>
        <div class="chantiers-list"></div>
    ` : '<div class="chantiers-list"></div>';

    const listContainer = container.querySelector('.chantiers-list');

    pageData.forEach((feuille) => {
        const date = formatDate(feuille.createdAt);
        const item = document.createElement('div');
        item.className = 'chantier-item' + (modeSelectionActif ? ' selectable-item' : '');
        item.dataset.id = feuille.id;

        if (modeSelectionActif) {
            item.onclick = () => {
                const cb = item.querySelector('.feuille-checkbox');
                cb.checked = !cb.checked;
                onFeuilleCheckboxChange();
            };
        }

        item.innerHTML = `
            ${modeSelectionActif ? `
            <div class="select-checkbox">
                <input type="checkbox" class="feuille-checkbox" data-id="${feuille.id}"
                    onclick="event.stopPropagation();" onchange="onFeuilleCheckboxChange()">
            </div>` : ''}
            <div class="chantier-thumb-container">
                <img src="${feuille.url}" class="chantier-thumb"
                     onclick="${modeSelectionActif ? 'event.stopPropagation()' : `openFeuilleGallery('${feuille.id}')`}"
                     alt="Feuille">
            </div>
            <div class="chantier-info">
                <div class="chantier-name">${feuille.copro || 'Non spécifiée'}</div>
                <div class="chantier-meta">${feuille.agent || 'Non spécifié'}</div>
            </div>
            <div class="chantier-date">${date}</div>
            <div class="chantier-actions">
                ${!modeSelectionActif ? `
                <button class="btn-icon danger" onclick="deleteFeuille('${feuille.id}')" title="Supprimer">
                    <i class="fas fa-trash"></i>
                </button>` : ''}
            </div>
        `;
        listContainer.appendChild(item);
    });

    renderPagination('feuilles_passage', allData.feuilles_passage.length);
}

window.deleteSelectedFeuilles = async function () {
    const checked = document.querySelectorAll('.feuille-checkbox:checked');
    const ids = Array.from(checked).map(cb => cb.dataset.id);
    if (ids.length === 0) return;

    showConfirmModal({
        title: `Supprimer ${ids.length} feuille(s) ?`,
        message: 'Cette action est irréversible. Les feuilles sélectionnées seront définitivement supprimées.',
        confirmText: 'Supprimer',
        cancelText: 'Annuler',
        onConfirm: async () => {
            try {
                await Promise.all(ids.map(id => deleteDoc(doc(db, 'feuilles_passage', id))));
                allData.feuilles_passage = allData.feuilles_passage.filter(f => !ids.includes(f.id));
                modeSelectionActif = false;
                const btn = document.getElementById('btnModeSelection');
                if (btn) {
                    btn.innerHTML = '<i class="fas fa-check-square"></i> Sélectionner';
                    btn.classList.remove('btn-warning');
                    btn.classList.add('btn-secondary');
                }
                renderFeuillesPassage();
                showNotification(`${ids.length} feuille(s) supprimée(s) avec succès`, 'success');
            } catch (error) {
                console.error('Erreur suppression multiple:', error);
                showNotification('Erreur lors de la suppression', 'error');
            }
        }
    });
};

window.deleteFeuille = async function (feuilleId) {
    showConfirmModal({
        title: 'Supprimer cette feuille de passage ?',
        message: 'Cette action est irréversible. La feuille sera définitivement supprimée.',
        confirmText: 'Supprimer',
        cancelText: 'Annuler',
        onConfirm: async () => {
            try {
                await deleteDoc(doc(db, 'feuilles_passage', feuilleId));
                allData.feuilles_passage = allData.feuilles_passage.filter(f => f.id !== feuilleId);
                renderFeuillesPassage();
                showNotification('Feuille supprimée avec succès', 'success');
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
function toggleMetaDesc(btn, metaId, fullText, shortText) {
    const el = document.getElementById(metaId);
    const meta = el.closest('.chantier-meta');
    const isExpanded = btn.dataset.expanded === '1';
    el.textContent = isExpanded ? shortText : fullText;
    btn.textContent = isExpanded ? 'Afficher plus' : 'Réduire';
    btn.dataset.expanded = isExpanded ? '0' : '1';
    meta.classList.toggle('expanded', !isExpanded);
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
        const description = chantier.description || '';
        const metaId = `meta-desc-${globalIndex}`;

        const div = document.createElement('div');
        div.className = 'chantier-item';

        div.innerHTML = `
    <div class="chantier-thumb-container">
        <img src="${firstPhoto}" class="chantier-thumb"
             onclick="openPhotoGallery('${chantier.id}', 0)" alt="Chantier">
        <span class="photo-badge">+${photoCount}</span>
    </div>
    <div class="chantier-info">
        <div class="chantier-name">${chantier.chantier || 'Non spécifié'}</div>
        <div class="chantier-meta">
            ${chantier.agent || 'Agent non spécifié'}${description ? ' - <span id="' + metaId + '">' + escapeHtml(description) + '</span>' : ''}
            ${description ? '<button class="btn-show-more" data-expanded="0" data-meta-id="' + metaId + '">Afficher plus</button>' : ''}
        </div>
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
`;

        if (description) {
            const btn = div.querySelector('.btn-show-more');
            const meta = div.querySelector('.chantier-meta');

            requestAnimationFrame(() => requestAnimationFrame(() => {
                void document.body.offsetHeight; // force reflow global
                if (meta.scrollWidth > meta.clientWidth) {
                    btn.style.display = 'block';
                }
            }));

            btn.addEventListener('click', () => {
                const isExpanded = btn.dataset.expanded === '1';
                if (isExpanded) {
                    meta.classList.remove('expanded');
                    div.querySelector(`#${metaId}`).textContent = description.length > 40 ? description.substring(0, 40) + '…' : description;
                    btn.textContent = 'Afficher plus';
                    btn.dataset.expanded = '0';
                } else {
                    meta.classList.add('expanded');
                    div.querySelector(`#${metaId}`).textContent = description;
                    btn.textContent = 'Réduire';
                    btn.dataset.expanded = '1';
                }
            });
        }

        container.appendChild(div);
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

    const today = new Date().toISOString().split('T')[0];

    pageData.forEach((signalement, index) => {
        const globalIndex = start + index;
        const date = formatDate(signalement.createdAt);
        const photoCount = signalement.images?.length || 0;
        const firstPhoto = signalement.images?.[0]?.url || '';
        const description = signalement.description || '';
        const metaId = `meta-sign-${globalIndex}`;

        const rappelDate = signalement.rappelDate || null;
        const rappelFait = signalement.rappelFait || false;
        const isRappelToday = rappelDate === today;

        let rappelBadge = '';
        if (rappelDate && !rappelFait) {
            const isPast = rappelDate < today;
            const color = isRappelToday ? '#f59e0b' : (isPast ? '#ef4444' : '#6b7280');
            const icon = isPast ? 'fa-exclamation-circle' : 'fa-bell';
            const label = rappelDate.split('-').reverse().join('/');
            rappelBadge = `<span style="display:inline-flex;align-items:center;gap:0.3rem;background:${color}18;color:${color};border:1px solid ${color}40;border-radius:20px;padding:0.2rem 0.6rem;font-size:0.75rem;font-weight:700;margin-top:0.3rem;">
                <i class="fas ${icon}"></i> Rappel ${label}
            </span>`;
        } else if (rappelFait) {
            rappelBadge = `<span style="display:inline-flex;align-items:center;gap:0.3rem;background:#10b98118;color:#10b981;border:1px solid #10b98140;border-radius:20px;padding:0.2rem 0.6rem;font-size:0.75rem;font-weight:700;margin-top:0.3rem;">
                <i class="fas fa-check-circle"></i> Fait
            </span>`;
        }

        const div = document.createElement('div');
        div.className = 'chantier-item';
        if (isRappelToday && !rappelFait) div.style.borderLeft = '3px solid #f59e0b';

        div.innerHTML = `
            ${photoCount > 0 ? `
                <div class="chantier-thumb-container">
                    <img src="${firstPhoto}" class="chantier-thumb"
                         onclick="openSignalementGallery('${signalement.id}', 0)" alt="Signalement">
                    ${photoCount > 1 ? `<span class="photo-badge">+${photoCount}</span>` : ''}
                </div>
            ` : ''}
            <div class="chantier-info">
                <div class="chantier-name">${signalement.copro || 'Non spécifiée'}</div>
                <div class="chantier-meta">
                    ${signalement.employee || 'Employé non spécifié'}${description ? ' - <span id="' + metaId + '">' + escapeHtml(description) + '</span>' : ''}
                    ${description ? '<button class="btn-show-more" data-expanded="0">Afficher plus</button>' : ''}
                </div>
                <div style="margin-top:0.25rem;">${rappelBadge}</div>
            </div>
            <div class="chantier-date">${date}</div>
            <div class="chantier-actions" style="flex-direction:column;gap:0.4rem;">
                <button class="btn-icon" onclick="ouvrirRappelModal('${signalement.id}', 'signalements', '${rappelDate || ''}')" title="Définir rappel">
                    <i class="fas fa-bell"></i>
                </button>
                ${rappelDate && !rappelFait ? `
                <button class="btn-icon" style="color:#10b981;" onclick="marquerRappelFait('${signalement.id}', 'signalements')" title="Marquer fait">
                    <i class="fas fa-check"></i>
                </button>` : ''}
                <button class="btn-icon danger" onclick="deleteSignalement('${signalement.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;

        container.appendChild(div);

        if (description) {
            const btn = div.querySelector('.btn-show-more');
            const meta = div.querySelector('.chantier-meta');
            requestAnimationFrame(() => requestAnimationFrame(() => {
                if (meta.scrollWidth > meta.clientWidth) btn.style.display = 'block';
            }));
            btn.addEventListener('click', () => {
                const isExpanded = btn.dataset.expanded === '1';
                meta.classList.toggle('expanded', !isExpanded);
                btn.textContent = isExpanded ? 'Afficher plus' : 'Réduire';
                btn.dataset.expanded = isExpanded ? '0' : '1';
            });
        }
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
    const prixTTC = parseFloat((prixHT * 1.2).toFixed(2));

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
                    <h3 id="galleryTitle"></h3>
                </div>
                <div class="gallery-main">
                    <div class="gallery-image-container">
                        <button class="gallery-nav gallery-prev" onclick="prevPhoto()">
                            <i class="fas fa-chevron-left"></i>
                        </button>
                        <div class="gallery-image-wrapper" id="galleryImageWrapper">
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
                <!-- Barre fixe bas : prev | close | next + counter -->
                <div class="gallery-bottom-bar">
                    <button class="gallery-nav gallery-prev" onclick="prevPhoto()">
                        <i class="fas fa-chevron-left"></i>
                    </button>
                    <div class="gallery-counter">
                        <span id="photoCounterBar"></span>
                    </div>
                    <button class="gallery-close" onclick="closePhotoGallery()">
                        <i class="fas fa-times"></i>
                    </button>
                    <div class="gallery-counter" style="opacity:0;pointer-events:none;">
                        <!-- spacer symétrique -->
                        <span></span>
                    </div>
                    <button class="gallery-nav gallery-next" onclick="nextPhoto()">
                        <i class="fas fa-chevron-right"></i>
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // ── Keyboard ──
        document.addEventListener('keydown', (e) => {
            const m = document.getElementById('photoGalleryModal');
            if (!m || !m.classList.contains('active')) return;
            if (e.key === 'ArrowLeft') prevPhoto();
            else if (e.key === 'ArrowRight') nextPhoto();
            else if (e.key === 'Escape') closePhotoGallery();
        });

        // ── Swipe gauche/droite + swipe down to close ──
        const wrapper = modal.querySelector('#galleryImageWrapper');
        let touchStartY = 0;
        let touchStartX = 0;
        let isDragging = false;

        wrapper.addEventListener('touchstart', (e) => {
            touchStartY = e.touches[0].clientY;
            touchStartX = e.touches[0].clientX;
            isDragging = false;
        }, { passive: true });

        wrapper.addEventListener('touchmove', (e) => {
            const deltaY = e.touches[0].clientY - touchStartY;
            const deltaX = e.touches[0].clientX - touchStartX;
            if (Math.abs(deltaY) > Math.abs(deltaX) && deltaY > 0) {
                isDragging = true;
                const img = document.getElementById('galleryMainImage');
                img.style.transform = `translateY(${deltaY}px)`;
                img.style.opacity = Math.max(0, 1 - deltaY / 250);
                e.preventDefault();
            }
        }, { passive: false });

        wrapper.addEventListener('touchend', (e) => {
            const deltaY = e.changedTouches[0].clientY - touchStartY;
            const deltaX = e.changedTouches[0].clientX - touchStartX;
            const img = document.getElementById('galleryMainImage');

            if (isDragging && deltaY > 90) {
                closePhotoGallery();
            } else if (!isDragging && Math.abs(deltaX) > 50) {
                if (deltaX < 0) nextPhoto();
                else prevPhoto();
                img.style.transform = '';
                img.style.opacity = '';
            } else {
                img.style.transition = 'transform 0.25s ease, opacity 0.25s ease';
                img.style.transform = '';
                img.style.opacity = '';
                setTimeout(() => img.style.transition = '', 260);
            }
            isDragging = false;
        }, { passive: true });
    }

    document.getElementById('galleryTitle').textContent = title || 'Photos';

    const img = document.getElementById('galleryMainImage');
    if (img) { img.style.transform = ''; img.style.opacity = ''; }

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

window.ouvrirRappelModal = function (id, collection, currentDate) {
    const modalHTML = `
        <div class="confirm-modal" id="rappelModal">
            <div class="confirm-modal-content">
                <div class="confirm-modal-header">
                    <div class="confirm-modal-icon" style="background:#f59e0b20;color:#f59e0b;">
                        <i class="fas fa-bell"></i>
                    </div>
                    <h3>Définir un rappel</h3>
                </div>
                <div class="confirm-modal-body">
                    <p style="margin-bottom:0.75rem;">Date du prochain passage :</p>
                    <input type="date" id="rappelDateInput" value="${currentDate}"
                        style="width:100%;padding:0.65rem;border:1.5px solid #e5e7eb;border-radius:10px;font-size:1rem;box-sizing:border-box;">
                    <p style="margin-top:0.5rem;font-size:0.8rem;color:#6b7280;">Laissez vide pour supprimer le rappel.</p>
                </div>
                <div class="confirm-modal-footer">
                    <button class="confirm-modal-btn confirm-modal-btn-cancel" onclick="document.getElementById('rappelModal').remove()">
                        <i class="fas fa-times"></i> Annuler
                    </button>
                    <button class="confirm-modal-btn confirm-modal-btn-delete" style="background:#f59e0b;"
                        onclick="sauvegarderRappel('${id}', '${collection}')">
                        <i class="fas fa-bell"></i> Enregistrer
                    </button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
};

window.sauvegarderRappel = async function (id, col) {
    const dateVal = document.getElementById('rappelDateInput').value || null;
    document.getElementById('rappelModal').remove();
    try {
        await updateDoc(doc(db, col, id), { rappelDate: dateVal, rappelFait: false });
        showNotification('Rappel enregistré', 'success');
        if (col === 'signalements') loadSignalements();
        else loadConsommables();
    } catch (e) {
        showNotification('Erreur lors de l\'enregistrement', 'error');
    }
};

window.marquerRappelFait = async function (id, col) {
    try {
        await updateDoc(doc(db, col, id), { rappelFait: true });
        showNotification('Rappel marqué comme fait', 'success');
        if (col === 'signalements') loadSignalements();
        else loadConsommables();
    } catch (e) {
        showNotification('Erreur', 'error');
    }
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

// ========== COMPTEUR D'HEURES ==========
let compteurState = {
    mode: null,       // 'pioche' | 'ajoute' | 'ajuste'
    empId: null,
    empName: null,
    solde: 0,
    semaine: null,
    totalHeureSemaine: 0
};

window.ouvrirCompteur = async function (empId, empName, semaine, totalHeureSemaine) {
    const solde = await fetchSoldeCompteur(empId);
    compteurState = { mode: 'compteur', empId, empName, solde, semaine, totalHeureSemaine };

    document.getElementById('compteurModalIcon').style.background = 'linear-gradient(135deg,#10b981,#059669)';
    document.getElementById('compteurModalIconI').className = 'fas fa-exchange-alt';
    document.getElementById('compteurModalTitle').textContent = `Compteur — ${empName}`;
    document.getElementById('compteurModalSub').textContent = '+Xh pioche du compteur · -Xh verse au compteur';
    document.getElementById('compteurSoldeActuel').textContent = formatSolde(solde);
    document.getElementById('compteurSoldeActuel').style.color = solde >= 0 ? '#10b981' : '#ef4444';
    document.getElementById('compteurInfoSemaine').style.display = 'block';
    document.getElementById('compteurSemaineLabel').textContent = semaine.replace('-W', '-S'); document.getElementById('compteurTotalSemaine').textContent = totalHeureSemaine.toFixed(2) + 'h';
    document.getElementById('compteurExcedentRow').style.display = 'none';
    document.getElementById('compteurMontantLabel').textContent = 'Heures (+pioche / -verse au compteur)';
    document.getElementById('compteurMontantHint').innerHTML = `+2 = pioche 2h du compteur et les ajoute à la semaine<br>-2 = verse 2h au compteur et les retire de la semaine`; document.getElementById('compteurMontantInput').min = '';
    document.getElementById('compteurMontantInput').step = '0.25';
    document.getElementById('compteurConfirmBtn').style.background = 'linear-gradient(135deg,#10b981,#059669)';
    document.getElementById('compteurConfirmIcon').className = 'fas fa-check';
    document.getElementById('compteurConfirmLabel').textContent = 'Confirmer';
    document.getElementById('compteurMontantInput').value = '';
    document.getElementById('compteurNouveauSolde').textContent = '—';

    document.getElementById('compteurMontantInput').oninput = () => updateCompteurPreview();
    document.getElementById('modalCompteur').style.display = 'flex';
};

window.ouvrirCompteurAjouter = async function (empId, empName, semaine, totalHeureSemaine) {
    const solde = await fetchSoldeCompteur(empId);
    const excedent = Math.max(0, totalHeureSemaine - 35);
    compteurState = { mode: 'ajoute', empId, empName, solde, semaine, totalHeureSemaine, excedent };

    document.getElementById('compteurModalIcon').style.background = 'linear-gradient(135deg,#10b981,#059669)';
    document.getElementById('compteurModalIconI').className = 'fas fa-arrow-up';
    document.getElementById('compteurModalTitle').textContent = `Ajouter au compteur — ${empName}`;
    document.getElementById('compteurModalSub').textContent = 'Verser un excédent d\'heures dans le compteur';
    document.getElementById('compteurSoldeActuel').textContent = formatSolde(solde);
    document.getElementById('compteurSoldeActuel').style.color = solde >= 0 ? '#10b981' : '#ef4444';
    document.getElementById('compteurInfoSemaine').style.display = 'block';
    document.getElementById('compteurSemaineLabel').textContent = semaine;
    document.getElementById('compteurTotalSemaine').textContent = totalHeureSemaine.toFixed(2) + 'h';
    document.getElementById('compteurExcedentRow').style.display = 'flex';
    document.getElementById('compteurExcedent').textContent = excedent.toFixed(2) + 'h';
    document.getElementById('compteurMontantLabel').textContent = 'Heures à verser au compteur';
    document.getElementById('compteurMontantHint').textContent = `Excédent max disponible : ${excedent.toFixed(2)}h (base contrat 35h)`;
    document.getElementById('compteurConfirmBtn').style.background = 'linear-gradient(135deg,#10b981,#059669)';
    document.getElementById('compteurConfirmIcon').className = 'fas fa-arrow-up';
    document.getElementById('compteurConfirmLabel').textContent = 'Ajouter';
    document.getElementById('compteurMontantInput').value = '';
    document.getElementById('compteurNouveauSolde').textContent = '—';

    document.getElementById('compteurMontantInput').oninput = () => updateCompteurPreview();
    document.getElementById('modalCompteur').style.display = 'flex';
};

window.ouvrirCompteurAjuster = async function (empId, empName) {
    const solde = await fetchSoldeCompteur(empId);
    compteurState = { mode: 'ajuste', empId, empName, solde, semaine: null, totalHeureSemaine: 0 };

    document.getElementById('compteurModalIcon').style.background = 'linear-gradient(135deg,#6366f1,#4f46e5)';
    document.getElementById('compteurModalIconI').className = 'fas fa-sliders-h';
    document.getElementById('compteurModalTitle').textContent = `Ajuster le compteur — ${empName}`;
    document.getElementById('compteurModalSub').textContent = 'Correction manuelle du solde';
    document.getElementById('compteurSoldeActuel').textContent = formatSolde(solde);
    document.getElementById('compteurSoldeActuel').style.color = solde >= 0 ? '#10b981' : '#ef4444';
    document.getElementById('compteurInfoSemaine').style.display = 'none';
    document.getElementById('compteurMontantLabel').textContent = 'Nouveau solde (positif ou négatif)';
    document.getElementById('compteurMontantHint').textContent = 'Entrez le solde exact souhaité (ex: -2 ou 5.5)';
    document.getElementById('compteurConfirmBtn').style.background = 'linear-gradient(135deg,#6366f1,#4f46e5)';
    document.getElementById('compteurConfirmIcon').className = 'fas fa-check';
    document.getElementById('compteurConfirmLabel').textContent = 'Ajuster';
    document.getElementById('compteurMontantInput').value = solde;
    document.getElementById('compteurMontantInput').min = '';
    document.getElementById('compteurNouveauSolde').textContent = formatSolde(solde);

    document.getElementById('compteurMontantInput').oninput = () => updateCompteurPreview();
    document.getElementById('modalCompteur').style.display = 'flex';
};

function updateCompteurPreview() {
    const val = parseFloat(document.getElementById('compteurMontantInput').value);
    if (isNaN(val)) { document.getElementById('compteurNouveauSolde').textContent = '—'; return; }
    const { mode, solde, totalHeureSemaine } = compteurState;

    let nouveauSolde, nouvellesHeures;
    if (mode === 'compteur') {
        // +val = pioche du compteur → solde diminue, heures augmentent
        // -val = verse au compteur → solde augmente, heures diminuent
        nouveauSolde = Math.round((solde - val) * 100) / 100;
        nouvellesHeures = Math.round((totalHeureSemaine + val) * 100) / 100;
    } else if (mode === 'ajuste') {
        nouveauSolde = val;
        nouvellesHeures = null;
    }

    const soldeEl = document.getElementById('compteurNouveauSolde');
    soldeEl.textContent = formatSolde(nouveauSolde);
    soldeEl.style.color = nouveauSolde >= 0 ? '#10b981' : '#ef4444';

    if (nouvellesHeures !== null) {
        document.getElementById('compteurTotalSemaine').textContent = nouvellesHeures.toFixed(2) + 'h';
    }
}
window.confirmerActionCompteur = async function () {
    const val = parseFloat(document.getElementById('compteurMontantInput').value);
    if (isNaN(val) || val === 0) { showNotification('Entrez un nombre d\'heures valide', 'error'); return; }

    const { mode, empId, empName, solde, semaine } = compteurState;

    let nouveauSolde, deltaHeuresSemaine, typeHistorique, commentaire;

    if (mode === 'compteur') {
        // +val = pioche du compteur (solde baisse, heures montent)
        // -val = verse au compteur (solde monte, heures baissent)
        nouveauSolde = Math.round((solde - val) * 100) / 100;
        deltaHeuresSemaine = val; // +val sur les heures du dernier jour
        typeHistorique = val > 0 ? 'pioche' : 'ajout';
        commentaire = val > 0
            ? `Compteur utilisé +${val}h`
            : `-${Math.abs(val)}h ajouté au compteur`;
    } else {
        // Ajustement manuel
        nouveauSolde = Math.round(val * 100) / 100;
        deltaHeuresSemaine = null;
        typeHistorique = 'ajustement';
        commentaire = `Ajustement compteur → ${val}h`;
    }

    try {
        const empRef = doc(db, 'employees', empId);
        await setDoc(empRef, { compteurHeures: nouveauSolde }, { merge: true });

        const historiqueRef = collection(db, 'employees', empId, 'compteurHistorique');
        await addDoc(historiqueRef, {
            date: new Date().toISOString().split('T')[0],
            semaine: semaine || null,
            heures: Math.abs(val),
            type: typeHistorique,
            commentaire,
            timestamp: new Date()
        });

        if (deltaHeuresSemaine !== null && semaine) {
            await ajouterCommentaireDernierJour(empId, semaine, commentaire, deltaHeuresSemaine);
        }

        showNotification(`Compteur mis à jour — ${empName} : ${formatSolde(nouveauSolde)}`, 'success');
        fermerModalCompteur();
        heuresCache = {};
        if (currentTab === 'heures') loadHeures();

    } catch (error) {
        console.error('Erreur compteur:', error);
        showNotification('Erreur lors de la mise à jour du compteur', 'error');
    }
};

async function ajouterCommentaireDernierJour(empId, semaine, commentaire, deltaHeures) {
    try {
        const weekRef = doc(db, 'employees', empId, 'weeks', semaine);
        const weekSnap = await getDoc(weekRef);
        if (!weekSnap.exists()) return;

        const data = weekSnap.data();
        const days = data.days || [];

        // Trouver le dernier jour avec des heures
        let dernierIndex = -1;
        for (let i = days.length - 1; i >= 0; i--) {
            if (days[i].hours && parseFloat(days[i].hours) > 0) {
                dernierIndex = i;
                break;
            }
        }
        if (dernierIndex === -1) dernierIndex = days.length - 1;

        // Ajouter le commentaire
        const existingComment = days[dernierIndex].comments || '';
        days[dernierIndex].comments = existingComment
            ? `${existingComment} — ${commentaire}`
            : commentaire;

        // Mettre à jour les heures du dernier jour (pioche = +deltaHeures, ajout = -deltaHeures)
        const heuresActuelles = parseFloat(days[dernierIndex].hours) || 0;
        const nouvellesHeures = Math.round((heuresActuelles + deltaHeures) * 100) / 100;
        days[dernierIndex].hours = nouvellesHeures > 0 ? String(nouvellesHeures) : '0';

        await setDoc(weekRef, { days }, { merge: true });
    } catch (e) {
        console.error('Erreur commentaire jour:', e);
    }
}

async function fetchSoldeCompteur(empId) {
    try {
        const empSnap = await getDoc(doc(db, 'employees', empId));
        if (empSnap.exists() && typeof empSnap.data().compteurHeures === 'number') {
            return empSnap.data().compteurHeures;
        }
    } catch (e) { }
    return 0;
}

function formatSolde(val) {
    const sign = val > 0 ? '+' : '';
    return `${sign}${val.toFixed(2)}h`;
}

window.fermerModalCompteur = function () {
    document.getElementById('modalCompteur').style.display = 'none';
};

window.ouvrirHistoriqueCompteur = async function (empId, empName) {
    document.getElementById('historiqueCompteurTitle').textContent = `Historique compteur — ${empName}`;
    document.getElementById('historiqueCompteurBody').innerHTML = '<p style="color:#6b7280; text-align:center;">Chargement...</p>';
    document.getElementById('modalHistoriqueCompteur').style.display = 'flex';

    try {
        const { query, orderBy, limit } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");
        const historiqueRef = collection(db, 'employees', empId, 'compteurHistorique');
        const q = query(historiqueRef, orderBy('timestamp', 'desc'), limit(20));
        const snap = await getDocs(q);

        if (snap.empty) {
            document.getElementById('historiqueCompteurBody').innerHTML = '<p style="color:#6b7280; text-align:center;">Aucun mouvement enregistré</p>';
            return;
        }

        const typeConfig = {
            pioche: { label: 'Pioche', color: '#f59e0b', icon: 'fa-arrow-down' },
            ajout: { label: 'Ajout', color: '#10b981', icon: 'fa-arrow-up' },
            ajustement: { label: 'Ajustement', color: '#6366f1', icon: 'fa-sliders-h' }
        };

        let html = '<div style="display:flex; flex-direction:column; gap:0.75rem;">';
        snap.forEach(d => {
            const mv = d.data();
            const cfg = typeConfig[mv.type] || typeConfig.ajustement;
            const sign = mv.type === 'pioche' ? '-' : '+';
            html += `
                <div style="background:#f9fafb; border:1.5px solid #e5e7eb; border-radius:10px; padding:0.75rem 1rem; display:flex; align-items:center; gap:0.75rem;">
                    <div style="background:${cfg.color}20; width:36px; height:36px; border-radius:8px; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
                        <i class="fas ${cfg.icon}" style="color:${cfg.color};"></i>
                    </div>
                    <div style="flex:1;">
                        <div style="font-weight:700; font-size:0.9rem; color:#111827;">${mv.commentaire || cfg.label}</div>
<div style="font-size:0.78rem; color:#6b7280;">${mv.date ? mv.date.split('-').reverse().join('-') : ''}${mv.semaine ? ` · ${mv.semaine.replace('-W', '-S')}` : ''}</div>                    </div>
                    <div style="font-weight:800; font-size:1rem; color:${cfg.color};">${sign}${Math.abs(mv.heures).toFixed(2)}h</div>
                </div>`;
        });
        html += '</div>';
        document.getElementById('historiqueCompteurBody').innerHTML = html;

    } catch (e) {
        console.error(e);
        document.getElementById('historiqueCompteurBody').innerHTML = '<p style="color:#ef4444; text-align:center;">Erreur de chargement</p>';
    }
};

window.fermerModalHistorique = function () {
    document.getElementById('modalHistoriqueCompteur').style.display = 'none';
};

// ========== RENDER HEURES (avec compteur) ==========
async function renderHeures(employeeData, totalHours, totalKm, totalChantiers) {
    const container = document.getElementById('content-heures');

    const exportBtn = document.getElementById('btnExportHeures');
    if (exportBtn) exportBtn.style.display = employeeData.length > 0 ? 'flex' : 'none';

    window.lastHeuresData = { employeeData, totalHours, totalKm, totalChantiers };

    const soldes = await Promise.all(employeeData.map(emp => fetchSoldeCompteur(emp.id)));
    const semaine = document.getElementById('filterWeekStart').value;

    const getInitiales = name => name.split(' ').map(n => n[0]).join('').toUpperCase();

    const compteurBadge = (solde) => {
        if (solde > 0) return `<span class="heures-compteur-badge positif"><i class="fas fa-plus"></i>${solde.toFixed(2)}h</span>`;
        if (solde < 0) return `<span class="heures-compteur-badge negatif"><i class="fas fa-minus"></i>${Math.abs(solde).toFixed(2)}h</span>`;
        return `<span class="heures-compteur-badge zero">0.00h</span>`;
    };

    let html = `
        <div class="heures-stats-grid">
            <div class="heures-stat-card">
                <div class="heures-stat-icon green"><i class="fas fa-clock"></i></div>
                <div>
                    <div class="heures-stat-value">${formatHeuresFactu(totalHours)}</div>
                    <div class="heures-stat-label">Total heures</div>
                </div>
            </div>
            <div class="heures-stat-card">
                <div class="heures-stat-icon blue"><i class="fas fa-route"></i></div>
                <div>
                    <div class="heures-stat-value">${totalKm} km</div>
                    <div class="heures-stat-label">Total kilomètres</div>
                </div>
            </div>
            <div class="heures-stat-card">
                <div class="heures-stat-icon purple"><i class="fas fa-hard-hat"></i></div>
                <div>
                    <div class="heures-stat-value">${totalChantiers}</div>
                    <div class="heures-stat-label">Chantiers spécifiques</div>
                </div>
            </div>
        </div>

        <div class="heures-table-wrap">
            <table class="heures-emp-table">
                <thead>
                    <tr>
                        <th>Employé</th>
                        <th>Semaines</th>
                        <th>Total heures</th>
                        <th>Kilomètres</th>
                        <th>Chantiers</th>
                        <th>Compteur</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${employeeData.map((emp, i) => {
        const solde = soldes[i];
        const excedent = Math.max(0, emp.totalHours - 35);
        return `
                        <tr>
                            <td data-label="Employé">
                                <div class="heures-emp-name">
                                    <div class="heures-emp-avatar">${getInitiales(emp.name)}</div>
                                    <span class="heures-emp-label">${emp.name}</span>
                                </div>
                            </td>
                            <td data-label="Semaines">${emp.weeks} sem.</td>
                            <td data-label="Total heures">
                                <span class="heures-badge-hours">${formatHeuresFactu(emp.totalHours)}</span>
                            </td>
                            <td data-label="Kilomètres">${emp.totalKm} km</td>
                            <td data-label="Chantiers">${emp.totalChantiers}</td>
                            <td data-label="Compteur">${compteurBadge(solde)}</td>
                            <td>
                              <div class="heures-actions">
    <button class="btn-heures-detail" onclick="viewEmployeeDetails('${emp.id}')">
        <i class="fas fa-eye"></i> Détails
    </button>
    <button class="btn-heures-pioche" onclick="ouvrirCompteur('${emp.id}','${emp.name}','${semaine}',${emp.totalHours})">
        <i class="fas fa-exchange-alt"></i> Compteur
    </button>
    <button class="btn-heures-ajuster" onclick="ouvrirCompteurAjuster('${emp.id}','${emp.name}')">
        <i class="fas fa-sliders-h"></i> Ajuster
    </button>
    <button class="btn-heures-historique" onclick="ouvrirHistoriqueCompteur('${emp.id}','${emp.name}')">
        <i class="fas fa-history"></i>
    </button>
</div>
                            </td>
                        </tr>`;
    }).join('')}
                </tbody>
            </table>
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

        const totalPrixTTC = totalPrixHT * 1.2; // TVA 20%

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
<td data-label="Heures" style="color: #10b981; font-weight: 600;">${formatHeuresFactu(parseFloat(day.hours) || 0)}</td>                                    <td data-label="Commentaires">${day.comments}</td>
                                </tr>
                            `).join('')}
                            <tr class="total-row">
                                <td data-label="Total"><strong>TOTAL</strong></td>
                                <td data-label="Heures" style="font-size: 1.1rem;">${formatHeuresFactu(weekData.totalHours)}</td>
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

        const totalHT = devis.totalPrixHT || devis.totalPrix || 0;
        const totalTTC = parseFloat((totalHT * 1.2).toFixed(2));
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
// function showUpdateModal() {
//     if (localStorage.getItem('updateModalShown_v2.4.0')) return;

//     const modalHTML = `
//         <div class="update-modal show" id="updateModal">
//             <div class="update-modal-content">
//                 <div class="update-modal-header">
//                     <button class="update-modal-close" onclick="closeUpdateModal()">
//                         <i class="fas fa-times"></i>
//                     </button>
//                     <div class="header-icon">
//                         <i class="fas fa-rocket"></i>
//                     </div>
//                     <h2>Mise à jour v2.4.0 !</h2>
//                     <p>Découvrez toutes les nouveautés</p>
//                 </div>

//                 <div class="update-modal-body">

//                     <div class="update-section">
//                         <div class="update-section-title">
//                             <div class="icon"><i class="fas fa-triangle-exclamation"></i></div>
//                             <span>Alertes heures manquantes</span>
//                             <span class="badge-new">NEW</span>
//                         </div>
//                         <ul class="update-list">
//                             <li class="update-item">
//                                 <div class="update-item-icon"><i class="fas fa-clock-rotate-left"></i></div>
//                                 <div class="update-item-content">
//                                     <h4 class="update-item-title">Détection automatique depuis le lundi</h4>
//                                     <p class="update-item-desc">La vue d'ensemble signale les employés n'ayant pas saisi leurs heures depuis le lundi de la semaine courante, avec le nombre de jours manquants.</p>
//                                 </div>
//                             </li>
//                             <li class="update-item">
//                                 <div class="update-item-icon"><i class="fas fa-arrow-right"></i></div>
//                                 <div class="update-item-content">
//                                     <h4 class="update-item-title">Navigation rapide</h4>
//                                     <p class="update-item-desc">Cliquer sur un employé dans l'alerte redirige directement vers l'onglet Heures filtré sur son nom.</p>
//                                 </div>
//                             </li>
//                         </ul>
//                     </div>

//                     <div class="update-section">
//                         <div class="update-section-title">
//                             <div class="icon"><i class="fas fa-calendar-check"></i></div>
//                             <span>Rappel repos & congés</span>
//                             <span class="badge-new">NEW</span>
//                         </div>
//                         <ul class="update-list">
//                             <li class="update-item">
//                                 <div class="update-item-icon"><i class="fas fa-bell"></i></div>
//                                 <div class="update-item-content">
//                                     <h4 class="update-item-title">Rappel quotidien</h4>
//                                     <p class="update-item-desc">La modale de rappel s'affiche une fois par jour pour prendre l'habitude de renseigner les jours non travaillés.</p>
//                                 </div>
//                             </li>
//                             <li class="update-item">
//                                 <div class="update-item-icon"><i class="fas fa-tag"></i></div>
//                                 <div class="update-item-content">
//                                     <h4 class="update-item-title">Mots-clés reconnus</h4>
//                                     <p class="update-item-desc">Indiquez <strong>0</strong> dans les heures + un mot-clé dans les commentaires pour éviter les fausses alertes : <strong>repos, cp, congé, absent, maladie, férié</strong>.</p>
//                                 </div>
//                             </li>
//                         </ul>
//                     </div>

//                 </div>

//                 <div class="update-modal-footer">
//                     <button class="btn btn-primary" onclick="closeUpdateModal()">
//                         <i class="fas fa-thumbs-up"></i>
//                         J'ai compris !
//                     </button>
//                 </div>
//             </div>
//         </div>
//     `;

//     document.body.insertAdjacentHTML('beforeend', modalHTML);
// }

// window.closeUpdateModal = function () {
//     const modal = document.getElementById('updateModal');
//     if (modal) {
//         modal.classList.remove('show');
//         setTimeout(() => modal.remove(), 300);
//         localStorage.setItem('updateModalShown_v2.4.0', 'true');
//     }
// }
// Afficher la modal au chargement si pas déjà vue
// window.addEventListener('load', () => {
//     setTimeout(() => {
//         const loginModal = document.getElementById('loginModal');
//         const isLoggedIn = !loginModal || loginModal.style.display === 'none';

//         if (isLoggedIn) {
//             showUpdateModal();
//         }
//     }, 300);
// });
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
    const isCopro = devis.typeDevis === 'copro' || devis.typeDevis === 'copro-multiple' || devis.typeDevis === 'copro-similaire';
    const frequence = devis.frequence || 1;

    const freqBlock = isCopro ? `
        <div class="chiffrage-frequence-block">
            <label for="copro-frequence"><i class="fas fa-calendar-alt"></i> Fréquence de passage (passages / mois)</label>
            <input type="number" id="copro-frequence" class="chiffrage-input-editable"
                   min="1" step="1" value="${frequence}" oninput="calculerTotalDevis()">
        </div>` : '';

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
                    ${freqBlock}
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

                    <div class="custom-lines-section">
                        <div class="custom-lines-header">
                            <span class="custom-lines-title">
                                <i class="fas fa-plus-circle"></i> Prestations supplémentaires
                            </span>
                            <button class="btn-add-custom" type="button" onclick="addCustomLine()">
                                <i class="fas fa-plus"></i> Ajouter une ligne
                            </button>
                        </div>
                        <div id="custom-lines-container">
                            ${(devis.lignesPersonnalisees || []).map(l => `
                            <div class="custom-line-row">
                                <input type="text"
                                       class="custom-input custom-name-input"
                                       placeholder="Désignation"
                                       value="${escapeHtml(l.designation || '')}"
                                       oninput="calculerTotalDevis()" />
                                <input type="number"
                                       class="custom-input custom-qty-input"
                                       placeholder="Qté"
                                       min="0"
                                       value="${l.quantite || ''}"
                                       oninput="calculerTotalDevis()" />
                                <input type="number"
                                       class="custom-input custom-time-input"
                                       placeholder="Temps (min)"
                                       min="0"
                                       value="${l.tempsMn || ''}"
                                       oninput="calculerTotalDevis()" />
                                <input type="number"
                                       class="custom-input custom-taux-input"
                                       placeholder="Taux (€/h)"
                                       min="0"
                                       value="${l.tauxHoraire || ''}"
                                       oninput="calculerTotalDevis()" />
                                <span class="custom-line-total">
                                    <span class="custom-total-val">${l.totalLigne > 0 ? l.totalLigne.toFixed(2) : '—'}</span>€
                                </span>
                                <button class="btn-remove-custom" type="button" onclick="removeCustomLine(this)">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>`).join('')}
                        </div>
                    </div>
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
window.openChiffrageModal = openChiffrageModal;
function addCustomLine() {
    const container = document.getElementById('custom-lines-container');
    const div = document.createElement('div');
    div.className = 'custom-line-row';
    div.innerHTML = `
        <input type="text"
               class="custom-input custom-name-input"
               placeholder="Désignation"
               oninput="calculerTotalDevis()" />
        <input type="number"
               class="custom-input custom-qty-input"
               placeholder="Qté"
               min="0"
               oninput="calculerTotalDevis()" />
        <input type="number"
               class="custom-input custom-time-input"
               placeholder="Temps (min)"
               min="0"
               oninput="calculerTotalDevis()" />
        <input type="number"
               class="custom-input custom-taux-input"
               placeholder="Taux (€/h)"
               min="0"
               oninput="calculerTotalDevis()" />
        <span class="custom-line-total">
            <span class="custom-total-val">—</span>€
        </span>
        <button class="btn-remove-custom" type="button" onclick="removeCustomLine(this)">
            <i class="fas fa-trash"></i>
        </button>
    `;
    container.appendChild(div);
    calculerTotalDevis();
}
window.addCustomLine = addCustomLine;

window.saveChiffrage = saveChiffrage;
window.openChiffrageModal = openChiffrageModal;

function removeCustomLine(btn) {
    btn.closest('.custom-line-row')?.remove();
    calculerTotalDevis();
}
window.removeCustomLine = removeCustomLine;
function generateChiffrageRowsCopro(devis) {
    const items = [];
    const taux = devis.detailsCopro?.tauxHoraire || 37.30;

    // ── Copro Multiple : une ligne par bâtiment ──────────
    if (devis.typeDevis === 'copro-multiple' && Array.isArray(devis.sections)) {
        return devis.sections.map((bat, i) => `
            <tr class="chiffrage-row chiffrage-row--batiment-header">
                <td colspan="5" class="chiffrage-td-batiment">
                    <i class="fas fa-building"></i> ${escapeHtml(bat.nom || `Bâtiment ${i + 1}`)}
                </td>
            </tr>
            ${generateCoproLignes(bat, i)}
        `).join('');
    }

    // ── Copro Similaire : lignes × nb bâtiments ──────────
    if (devis.typeDevis === 'copro-similaire') {
        const nb = devis.batiments?.nb || 1;
        const rows = generateCoproLignes(devis.detailsCopro, 0, taux);
        // Injecter le multiplicateur dans le footer
        return rows + `
            <tr class="chiffrage-row chiffrage-row--multiplicateur">
                <td colspan="4" class="chiffrage-td-label" style="font-weight:700;">
                    <i class="fas fa-clone"></i> × ${nb} bâtiments identiques
                </td>
                <td class="chiffrage-td-total">
                    <input type="number" class="calc-nb-batiments chiffrage-input-editable"
                           value="${nb}" min="1" oninput="calculerTotalDevis()"
                           style="width:60px;">
                </td>
            </tr>
        `;
    }

    // ── Copro Unique ──────────────────────────────────────
    return generateCoproLignes(devis.detailsCopro, 0, taux);
}

function generateCoproLignes(details, batIndex, taux) {
    if (!details) return '';
    taux = taux || details.tauxHoraire || 37.30;
    const idx = batIndex !== undefined ? `_${batIndex}` : '';
    const rows = [];

    // Communs
    const c = details.communs || {};
    if (c.hallMn > 0) rows.push({
        label: 'Hall', nb: 1, tempsMn: c.hallMn, taux,
        extraClass: 'row-copro-communs'
    });

    // Escaliers — nouveau format etagesTempsMn[] ou ancien format rétrocompat
    if (c.etagesTempsMn && c.etagesTempsMn.length > 0) {
        c.etagesTempsMn.forEach((tempsMn, i) => {
            if (tempsMn > 0) rows.push({
                label: `Escaliers — Étage ${i + 1}`,
                nb: 1, tempsMn, taux,
                extraClass: 'row-copro-communs'
            });
        });
    } else if (c.escaliersMnParEtage > 0 && c.nbEtages > 0) {
        for (let e = 1; e <= c.nbEtages; e++) {
            rows.push({
                label: `Escaliers — Étage ${e}`,
                nb: 1, tempsMn: c.escaliersMnParEtage, taux,
                extraClass: 'row-copro-communs'
            });
        }
    }

    if (c.ascenseurMn > 0) rows.push({
        label: 'Ascenseur', nb: 1, tempsMn: c.ascenseurMn, taux,
        extraClass: 'row-copro-communs'
    });
    if (c.localPoubelleMn > 0) rows.push({
        label: 'Local poubelle', nb: 1, tempsMn: c.localPoubelleMn, taux,
        extraClass: 'row-copro-communs'
    });
    if (c.localVelosMn > 0) rows.push({
        label: 'Local vélos', nb: 1, tempsMn: c.localVelosMn, taux,
        extraClass: 'row-copro-communs'
    });
    if (c.accesM1Mn > 0) rows.push({
        label: 'Accès -1', nb: 1, tempsMn: c.accesM1Mn, taux,
        extraClass: 'row-copro-communs'
    });
    if (c.cavesMn > 0) rows.push({
        label: 'Caves', nb: 1, tempsMn: c.cavesMn, taux,
        extraClass: 'row-copro-communs'
    });

    // Garages (m²)
    const g = details.garages || {};
    if (g.surface > 0) rows.push({
        label: `Garages (${g.surface} m²)`,
        nb: g.surface, tempsMn: 0, taux: 0,
        prixFixe: g.surface * (g.prixM2 || 0.41),
        extraClass: 'row-copro-garages'
    });

    // Moquettes
    const m = details.moquettes || {};
    if (m.surface > 0) rows.push({
        label: `Moquettes surface (${m.surface} m²)`,
        nb: m.surface, tempsMn: 0, taux: 0,
        prixFixe: m.surface * (m.prixM2 || 3.62),
        extraClass: 'row-copro-moquettes'
    });
    if (m.vapeurMn > 0) rows.push({
        label: 'Moquettes — Passage vapeur',
        nb: 1, tempsMn: m.vapeurMn, taux,
        extraClass: 'row-copro-moquettes'
    });
    if (m.shampoingMn > 0) rows.push({
        label: 'Moquettes — Shampoing',
        nb: 1, tempsMn: m.shampoingMn, taux,
        extraClass: 'row-copro-moquettes'
    });

    // Trajet
    const tr = details.trajet || {};
    if (tr.minutes > 0) rows.push({
        label: 'Trajet', nb: 1, tempsMn: tr.minutes, taux,
        extraClass: 'row-copro-trajet'
    });

    // Consommables (prix fixe)
    const conso = details.consommables || {};
    ['poubelles', 'savon', 'essuieMain', 'jumbo'].forEach(key => {
        const line = conso[key];
        if (line?.quantite > 0) rows.push({
            label: `${key.charAt(0).toUpperCase() + key.slice(1)} (conso)`,
            nb: line.quantite, tempsMn: 0, taux: 0,
            prixFixe: line.quantite * (line.prixUnit || 0),
            extraClass: 'row-copro-conso'
        });
    });

    return rows.map(item => {
        const totalLigne = item.prixFixe !== undefined
            ? item.prixFixe
            : (item.nb * item.tempsMn / 60) * item.taux;

        return `
        <tr class="chiffrage-row ${item.extraClass || ''}">
            <td class="chiffrage-td-label" data-label="Élément">${item.label}</td>
            <td class="chiffrage-td-center" data-label="Quantité">
                <input type="number" class="calc-nb chiffrage-input-editable"
                       value="${item.nb}" min="0" oninput="calculerTotalDevis()">
            </td>
            <td class="chiffrage-td-center" data-label="Temps (mn)">
                ${item.prixFixe !== undefined
                ? `<span class="chiffrage-prix-fixe">Prix fixe</span>`
                : `<input type="number" step="1" class="calc-temps chiffrage-input-editable"
                             value="${item.tempsMn}" oninput="calculerTotalDevis()">`
            }
            </td>
            <td class="chiffrage-td-center" data-label="Taux (€/h)">
                ${item.prixFixe !== undefined
                ? `<input type="number" step="0.01" class="calc-prix-fixe chiffrage-input-editable"
                             value="${item.prixFixe.toFixed(2)}" oninput="calculerTotalDevis()">`
                : `<input type="number" step="0.1" class="calc-taux chiffrage-input-editable"
                             value="${item.taux}" oninput="calculerTotalDevis()">`
            }
            </td>
            <td class="chiffrage-td-total" data-label="Total">
                <span class="row-total-val">${totalLigne.toFixed(2)}</span>€
            </td>
        </tr>`;
    }).join('');
}
function generateChiffrageRowsBureau(devis) {
    const b = devis.detailsBureau;
    if (!b) return '';
    const taux = b.tauxHoraire || 37.30;
    const rows = [];

    const sections = {
        'Bureaux & Accueil': {
            'Aspiration / Lavage sols': b.taches?.accueil?.aspi,
            'Mobilier / Téléphones': b.taches?.accueil?.mobilier,
            'Poubelles': b.taches?.accueil?.poubelles,
            'Vitres portes': b.taches?.accueil?.vitres,
        },
        'Showroom': {
            'Aspiration / Lavage sols': b.taches?.showroom?.aspi,
            'Toiles d\'araignée': b.taches?.showroom?.toiles,
            'Vitres portes': b.taches?.showroom?.vitres,
        },
        'Sanitaires': {
            'Sols': b.taches?.sanitaires?.sols,
            'WC': b.taches?.sanitaires?.wc,
            'Lavabos': b.taches?.sanitaires?.lavabos,
        },
        'Vitres spécifiques': {
            'Façades showroom Int/Ext': b.taches?.vitres?.facades,
            'Porte sectionnelle': b.taches?.vitres?.porte,
            'Vitres bureaux': b.taches?.vitres?.bureaux,
        }
    };

    let html = '';
    Object.entries(sections).forEach(([sectionLabel, taches]) => {
        html += `
            <tr class="chiffrage-row chiffrage-row--section-header">
                <td colspan="5" class="chiffrage-td-section">
                    <i class="fas fa-folder"></i> ${sectionLabel}
                </td>
            </tr>`;
        Object.entries(taches).forEach(([label, t]) => {
            if (!t) return;
            const mn = t.mn || 0;
            const qty = t.qty || 0;
            const freq = t.freq || 0;
            const total = (mn / 60) * qty * freq * taux;
            html += `
            <tr class="chiffrage-row row-bureau">
                <td class="chiffrage-td-label" data-label="Élément">${label}</td>
                <td class="chiffrage-td-center" data-label="Quantité">
                    <input type="number" class="calc-nb chiffrage-input-editable"
                           value="${qty}" min="0" oninput="calculerTotalDevis()">
                </td>
                <td class="chiffrage-td-center" data-label="Temps (mn)">
                    <input type="number" step="1" class="calc-temps chiffrage-input-editable"
                           value="${mn}" oninput="calculerTotalDevis()">
                </td>
                <td class="chiffrage-td-center" data-label="Taux (€/h)">
                    <input type="number" step="0.1" class="calc-taux chiffrage-input-editable"
                           value="${taux}" oninput="calculerTotalDevis()">
                    <span class="bureau-freq-label">×${freq}/mois</span>
                    <input type="number" class="calc-freq chiffrage-input-editable"
                           value="${freq}" min="0" oninput="calculerTotalDevis()"
                           style="width:40px;">
                </td>
                <td class="chiffrage-td-total" data-label="Total">
                    <span class="row-total-val">${total.toFixed(2)}</span>€
                </td>
            </tr>`;
        });
    });

    // Trajet bureau
    if (b.trajet?.minutes > 0) {
        const totalTrajet = (b.trajet.minutes / 60) * (b.frequenceMois || 4) * taux;
        html += `
            <tr class="chiffrage-row row-bureau">
                <td class="chiffrage-td-label">Trajet</td>
                <td class="chiffrage-td-center">
                    <input type="number" class="calc-nb chiffrage-input-editable"
                           value="${b.frequenceMois || 4}" min="0" oninput="calculerTotalDevis()">
                </td>
                <td class="chiffrage-td-center">
                    <input type="number" step="1" class="calc-temps chiffrage-input-editable"
                           value="${b.trajet.minutes}" oninput="calculerTotalDevis()">
                </td>
                <td class="chiffrage-td-center">
                    <input type="number" step="0.1" class="calc-taux chiffrage-input-editable"
                           value="${taux}" oninput="calculerTotalDevis()">
                    <input type="number" class="calc-freq chiffrage-input-editable"
                           value="1" min="0" style="display:none;" oninput="calculerTotalDevis()">
                </td>
                <td class="chiffrage-td-total">
                    <span class="row-total-val">${totalTrajet.toFixed(2)}</span>€
                </td>
            </tr>`;
    }
    return html;
}
function generateChiffrageRows(devis) {
    const items = [];

    const taux = devis.detailsCopro?.tauxHoraire || devis.detailsBureau?.tauxHoraire || 43.40;

    // ── COPRO (unique, similaire, multiple) ──────────────
    if (['copro', 'copro-similaire', 'copro-multiple'].includes(devis.typeDevis)) {
        return generateChiffrageRowsCopro(devis);
    }

    // ── BUREAU ───────────────────────────────────────────
    if (devis.typeDevis === 'bureau') {
        return generateChiffrageRowsBureau(devis);
    }

    if (devis.vitres?.standard > 0) {
        const needsGrattage = devis.grattage?.standard;
        items.push({
            label: 'Vitres Standard',
            nb: devis.vitres.standard,
            tempsMn: (TEMPS_DEFAUT['Vitres Standard'] || 3) * (needsGrattage ? 2 : 1), taux: 43.40,
            grattage: needsGrattage
        });
    }
    if (devis.vitres?.baies > 0) {
        const needsGrattage = devis.grattage?.baies;
        items.push({
            label: 'Baies Vitrées',
            nb: devis.vitres.baies,
            tempsMn: (TEMPS_DEFAUT['Baies Vitrées'] || 4) * (needsGrattage ? 2 : 1), taux: 43.40,
            grattage: needsGrattage
        });
    }
    if (devis.vitres?.velux > 0) {
        const needsGrattage = devis.grattage?.velux;
        items.push({
            label: 'Vélux',
            nb: devis.vitres.velux,
            tempsMn: TEMPS_DEFAUT['Vélux'] || 10, tempsMn: (TEMPS_DEFAUT['Vélux'] || 5) * (needsGrattage ? 2 : 1),
            taux: 43.40,
            grattage: needsGrattage
        });
    }
    if (devis.vitres?.portes > 0) {
        const needsGrattage = devis.grattage?.portes;
        items.push({
            label: 'Portes vitrées',
            nb: devis.vitres.portes,
            tempsMn: (TEMPS_DEFAUT['Portes vitrées'] || 3) * (needsGrattage ? 2 : 1), taux: 43.40,
            grattage: needsGrattage
        });
    }
    if (devis.vitres?.hautes > 0) {
        const needsGrattage = devis.grattage?.hautes;
        items.push({
            label: 'Vitres Hautes',
            nb: devis.vitres.hautes,
            tempsMn: (TEMPS_DEFAUT['Vitres Hautes'] || 5) * (needsGrattage ? 2 : 1), taux: 43.40,
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

    // Ligne automatique si photo séjour uploadée
    if (devis.photos?.sejour?.length > 0) {
        items.push({ label: 'Séjour (photo)', nb: 1, tempsMn: TEMPS_DEFAUT['Séjour'] || 30, taux: 43.40 });
    }

    // Ligne automatique si photo cuisine uploadée
    if (devis.photos?.cuisine?.length > 0) {
        items.push({ label: 'Cuisine (photo)', nb: 1, tempsMn: TEMPS_DEFAUT['Cuisine (photo)'] || 30, taux: 43.40 });
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
    if (devis.exterieurs?.piscine > 0) {
        items.push({ label: 'Piscine', nb: devis.exterieurs.piscine, tempsMn: TEMPS_DEFAUT['Piscine'] || 45, taux: 43.40 });
    }
    if (devis.trajet > 0) {
        items.push({ label: 'Trajet', nb: 1, tempsMn: devis.trajet, taux: 43.40 });
    }

    if (devis.lignesChiffrage && devis.lignesChiffrage.length > 0) {
        items.forEach(item => {
            const ligneExistante = devis.lignesChiffrage.find(l => {
                const designationClean = l.designation.replace(/Grattage/g, '').trim();
                return designationClean === item.label || l.designation === item.label;
            });
            if (ligneExistante) {
                item.nb = ligneExistante.quantite || item.nb;
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
            <td class="chiffrage-td-center" data-label="Quantité"><input type="number" class="calc-nb chiffrage-input-editable" value="${item.nb}" min="0" oninput="calculerTotalDevis()"></td>
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

    // Lignes standard
    const rows = document.querySelectorAll('#chiffrageBody tr');
    rows.forEach(row => {
        const nb = parseFloat(row.querySelector('.calc-nb')?.value) || 0;
        const tempsMn = parseFloat(row.querySelector('.calc-temps')?.value) || 0;
        const taux = parseFloat(row.querySelector('.calc-taux')?.value) || 0;
        const totalMinutes = nb * tempsMn;
        const totalLignePrix = (totalMinutes / 60) * taux;

        // Prix fixe (garages, moquettes m², consommables)
        const prixFixeInput = row.querySelector('.calc-prix-fixe');
        if (prixFixeInput) {
            const prixFixe = parseFloat(prixFixeInput.value) || 0;
            const displayTotal = row.querySelector('.row-total-val');
            if (displayTotal) displayTotal.textContent = prixFixe.toFixed(2);
            grandTotal += prixFixe;
            return;
        }

        // Bureau : × fréquence par ligne
        const freqInput = row.querySelector('.calc-freq');
        const freq = freqInput ? (parseFloat(freqInput.value) || 1) : 1;
        const totalLignePrixFinal = totalLignePrix * freq;

        const displayTotal = row.querySelector('.row-total-val');
        if (displayTotal) displayTotal.textContent = totalLignePrixFinal.toFixed(2);
        grandTotal += totalLignePrixFinal;
        grandTempsMn += totalMinutes;
    });

    // Lignes personnalisées
    const customRows = document.querySelectorAll('#custom-lines-container .custom-line-row');
    customRows.forEach(row => {
        const qty = parseFloat(row.querySelector('.custom-qty-input')?.value) || 0;
        const tempsMn = parseFloat(row.querySelector('.custom-time-input')?.value) || 0;
        const taux = parseFloat(row.querySelector('.custom-taux-input')?.value) || 0;
        const totalMinutes = qty * tempsMn;
        const totalLigne = (totalMinutes / 60) * taux;

        const displayTotal = row.querySelector('.custom-total-val');
        if (displayTotal) displayTotal.textContent = totalLigne > 0 ? totalLigne.toFixed(2) : '—';
        grandTotal += totalLigne;
        grandTempsMn += totalMinutes;
    });

    // Multiplicateur copro-similaire
    const nbBatInput = document.querySelector('.calc-nb-batiments');
    if (nbBatInput) {
        const nbBat = parseFloat(nbBatInput.value) || 1;
        grandTotal *= nbBat;
        grandTempsMn *= nbBat;
    }

    // Fréquence globale copro
    const freqGlobaleInput = document.getElementById('copro-frequence');
    if (freqGlobaleInput) {
        const freqGlobale = parseFloat(freqGlobaleInput.value) || 1;
        grandTotal *= freqGlobale;
        grandTempsMn *= freqGlobale;
    }

    const grandTotalTTC = grandTotal * 1.2;
    const heures = Math.floor(grandTempsMn / 60);
    const minutes = Math.round(grandTempsMn % 60);
    const tempsFormate = `${heures}h${minutes.toString().padStart(2, '0')}`;

    if (document.getElementById('grandTotal')) document.getElementById('grandTotal').textContent = grandTotal.toFixed(2);
    if (document.getElementById('grandTotalTTC')) document.getElementById('grandTotalTTC').textContent = grandTotalTTC.toFixed(2);
    if (document.getElementById('grandTemps')) document.getElementById('grandTemps').textContent = (grandTempsMn / 60).toFixed(2);
    if (document.getElementById('grandTempsMn')) document.getElementById('grandTempsMn').textContent = grandTempsMn;
    if (document.getElementById('tempsHeures')) document.getElementById('tempsHeures').textContent = tempsFormate;
}
async function saveChiffrage(devisId) {
    const totalHT = parseFloat(document.getElementById('grandTotal').textContent);
    const totalTTC = parseFloat(document.getElementById('grandTotalTTC').textContent);
    const tempsTotal = parseFloat(document.getElementById('grandTemps').textContent);
    const tempsTotalMn = parseFloat(document.getElementById('grandTempsMn').textContent);

    const existingDevis = allData.devis.find(d => d.id === devisId);
    const isEdit = existingDevis && existingDevis.status === 'chiffre';

    // Lignes standard
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

    // Lignes personnalisées
    const lignesPersonnalisees = [];
    const customRows = document.querySelectorAll('#custom-lines-container .custom-line-row');
    customRows.forEach(row => {
        const designation = row.querySelector('.custom-name-input')?.value?.trim();
        const qty = parseFloat(row.querySelector('.custom-qty-input')?.value) || 0;
        const tempsMn = parseFloat(row.querySelector('.custom-time-input')?.value) || 0;
        const taux = parseFloat(row.querySelector('.custom-taux-input')?.value) || 0;

        if (designation || qty > 0 || tempsMn > 0) {
            const totalMinutes = qty * tempsMn;
            const totalHeures = totalMinutes / 60;
            const totalLigne = totalHeures * taux;
            lignesPersonnalisees.push({
                designation: designation || 'Prestation',
                quantite: qty,
                tempsMn: tempsMn,
                tauxHoraire: taux,
                totalLigne: totalLigne
            });
        }
    });

    try {
        const devisRef = doc(db, "devis", devisId);
        await updateDoc(devisRef, {
            lignesChiffrage: lignesChiffrage,
            lignesPersonnalisees: lignesPersonnalisees,
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
window.saveChiffrage = saveChiffrage;

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

// ========== SAISIE HEURES ADMIN ==========
const JOURS_SEMAINE = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

window.ouvrirModalSaisieHeures = function () {
    const modal = document.getElementById('modalSaisieHeures');
    modal.style.display = 'flex';

    // Pré-remplir la semaine courante
    const today = new Date();
    const weekNum = getWeekNumber(today);
    const weekStr = `${today.getFullYear()}-W${weekNum.toString().padStart(2, '0')}`;
    document.getElementById('saisieWeek').value = weekStr;

    // Pré-remplir l'employé si filtré
    const filterEmp = document.getElementById('filterEmployee').value;
    if (filterEmp) document.getElementById('saisieEmp').value = filterEmp;

    document.getElementById('saisiTableContainer').style.display = 'none';
};

window.fermerModalSaisieHeures = function () {
    document.getElementById('modalSaisieHeures').style.display = 'none';
    document.getElementById('saisiTableContainer').style.display = 'none';
    document.getElementById('saisieEmp').value = '';
    document.getElementById('saisieKm').value = '';
};

window.chargerDonneesSaisie = async function () {
    const empId = document.getElementById('saisieEmp').value;
    const week = document.getElementById('saisieWeek').value;

    if (!empId || !week) {
        showNotification('Sélectionnez un employé et une semaine', 'error');
        return;
    }

    try {
        const weekDocRef = doc(db, 'employees', empId, 'weeks', week);
        const snap = await getDoc(weekDocRef);

        const tbody = document.getElementById('saisieTableBody');
        tbody.innerHTML = '';

        const existingDays = snap.exists() ? (snap.data().days || []) : [];
        const existingKm = snap.exists() ? (snap.data().kilometrage || '') : '';

        JOURS_SEMAINE.forEach((jour, index) => {
            const dayData = existingDays[index] || {};
            const row = document.createElement('tr');
            row.style.borderBottom = '1px solid #f3f4f6';
            row.style.borderBottom = '1px solid #f3f4f6';
            row.style.transition = 'background 0.15s';
            row.onmouseenter = () => row.style.background = '#f9fafb';
            row.onmouseleave = () => row.style.background = '';
            row.innerHTML = `
    <td style="padding:0.65rem 1rem; font-weight:600; color:#374151; font-size:0.9rem;">${jour}</td>
    <td style="padding:0.65rem 1rem; text-align:center;">
        <input type="number" class="saisie-hours" min="0" max="24" step="0.25"
            placeholder="0" value="${dayData.hours || ''}"
            style="width:75px; padding:0.45rem; border:1.5px solid #e5e7eb; border-radius:8px; text-align:center; font-size:0.95rem; font-weight:600; color:#10b981;">
    </td>
    <td style="padding:0.65rem 1rem;">
        <input type="text" class="saisie-comments" placeholder="Commentaires..."
            value="${dayData.comments || ''}"
            style="width:100%; padding:0.45rem 0.6rem; border:1.5px solid #e5e7eb; border-radius:8px; font-size:0.9rem; box-sizing:border-box;">
    </td>
`;
            tbody.appendChild(row);
        });

        document.getElementById('saisieKm').value = existingKm;
        document.getElementById('saisiTableContainer').style.display = 'block';

    } catch (error) {
        console.error('Erreur chargement:', error);
        showNotification('Erreur lors du chargement', 'error');
    }
};

window.sauvegarderSaisieHeures = async function () {
    const empId = document.getElementById('saisieEmp').value;
    const week = document.getElementById('saisieWeek').value;

    if (!empId || !week) {
        showNotification('Employé ou semaine manquant', 'error');
        return;
    }

    const hoursInputs = document.querySelectorAll('.saisie-hours');
    const commentsInputs = document.querySelectorAll('.saisie-comments');

    const days = JOURS_SEMAINE.map((jour, index) => ({
        day: jour,
        hours: hoursInputs[index]?.value || '',
        comments: commentsInputs[index]?.value || ''
    }));

    const km = document.getElementById('saisieKm').value;

    try {
        const { setDoc } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");
        const weekDocRef = doc(db, 'employees', empId, 'weeks', week);
        await setDoc(weekDocRef, {
            days,
            kilometrage: km,
            lastUpdate: new Date()
        }, { merge: true });

        showNotification(`Heures enregistrées pour ${employeeNames[empId]} — ${week}`, 'success');
        fermerModalSaisieHeures();

        // Invalider le cache et recharger si onglet heures actif
        heuresCache = {};
        if (currentTab === 'heures') loadHeures();

    } catch (error) {
        console.error('Erreur sauvegarde:', error);
        showNotification('Erreur lors de la sauvegarde', 'error');
    }
};

// ─── FACTURATION CHANTIERS SPÉCIFIQUES ───────────────────────────────────────

const STOPWORDS = new Set(['le', 'la', 'les', 'de', 'du', 'des', 'un', 'une', 'au', 'aux', 'et', 'en', 'à', 'a', 'l', 'd', 'ext', 'parking', 'int', 'bat', 'bât', 'appt', 'app', 'rez', 'rdc', 'entrée', 'entree', 'hall', 'cave', 'local', 'passage', 'bloc']);

function getMotsSignificatifs(name) {
    return name.toLowerCase().trim().split(/\s+/).filter(w => w.length > 2 && !STOPWORDS.has(w));
}

function motsEnCommun(a, b) {
    const setA = new Set(getMotsSignificatifs(a));
    const setB = new Set(getMotsSignificatifs(b));
    return [...setA].filter(w => setB.has(w));
}

function levenshtein(a, b) {
    const m = a.length, n = b.length;
    const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            dp[i][j] = a[i - 1] === b[j - 1]
                ? dp[i - 1][j - 1]
                : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
        }
    }
    return dp[m][n];
}

function normalizeChantierName(name) {
    return name.toLowerCase().trim().replace(/\s+/g, ' ');
}
function formatHeuresFactu(h) {
    if (!h || h === 0) return '0';
    const rounded = Math.round(h * 100) / 100;
    if (rounded % 1 === 0) return String(rounded);
    return rounded.toFixed(2).replace(/\.?0+$/, '').replace('.', ',');
}

function groupChantiers(allPassages) {
    const SIMILARITY_THRESHOLD = 0.3;
    const groups = [];

    for (const passage of allPassages) {
        const norm = normalizeChantierName(passage.name);
        let matched = null;
        let matchCertain = false;
        let bestRatio = Infinity;

        for (const g of groups) {
            const canonNorm = normalizeChantierName(g.names[0]);
            const sameDate = g.passages.some(p => p.date === passage.date);
            const commun = motsEnCommun(passage.name, g.names[0]);
            if (sameDate && commun.length >= 2) {
                matched = g;
                matchCertain = true;
                break;
            }
            const dist = levenshtein(norm, canonNorm);
            const ratio = dist / Math.max(norm.length, canonNorm.length);
            if (ratio < bestRatio) {
                bestRatio = ratio;
                if (ratio === 0) { matched = g; matchCertain = true; break; }
                if (ratio <= SIMILARITY_THRESHOLD) { matched = g; matchCertain = false; }
            }
        }

        if (!matched) {
            groups.push({ key: passage.name, names: [passage.name], passages: [passage], totalH: passage.hours, uncertain: false });
        } else {
            matched.passages.push(passage);
            matched.totalH += passage.hours;
            if (!matched.names.includes(passage.name)) {
                matched.names.push(passage.name);
                if (!matchCertain) matched.uncertain = true;
            }
        }
    }

    return groups.sort((a, b) => b.totalH - a.totalH);
}

let factSearchTimeout = null;

function showFacturationView() {
    document.getElementById('facturationView').style.display = 'block';
    document.getElementById('heuresNormal').style.display = 'none';
    document.getElementById('facturationView').scrollIntoView({ behavior: 'smooth' });
    loadFacturationData();
}

function hideFacturationView() {
    const factView = document.getElementById('facturationView');
    factView.style.display = 'none';
    factView.innerHTML = '';
    document.getElementById('heuresNormal').style.display = 'block';
}

async function loadFacturationData() {
    const container = document.getElementById('facturationView');

    const weekVal = container.querySelector('#fact-week')?.value;
    const empFilter = container.querySelector('#fact-emp')?.value || '';
    const searchVal = (container.querySelector('#fact-search')?.value || '').toLowerCase().trim();

    const now = new Date();
    const y = now.getFullYear();
    const d = new Date(Date.UTC(y, now.getMonth(), now.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const wn = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    const defaultWeek = `${y}-W${wn.toString().padStart(2, '0')}`;
    const targetWeek = weekVal || defaultWeek;

    // Toujours re-render le shell si les filtres ne sont pas dans le DOM
    if (!container.querySelector('#fact-week')) {
        renderFacturationShell(container, targetWeek, empFilter, searchVal);
    } else {
        // Shell déjà en place, juste spinner sur les cards
    }

    const cardsEl = container.querySelector('#fact-cards');
    if (cardsEl) cardsEl.innerHTML = `<div style="text-align:center;padding:2rem;color:#6b7280;font-size:14px;"><i class="fas fa-spinner fa-spin"></i> Chargement…</div>`;

    const empNames = employeeNames;
    const employeeIds = Object.keys(empNames);
    const allPassages = [];

    await Promise.all(employeeIds.map(async (empId) => {
        if (empFilter && empFilter !== empId) return;
        try {
            const snap = await getDoc(doc(db, 'employees', empId, 'weeks', targetWeek));
            if (!snap.exists()) return;
            const data = snap.data();
            if (!data.projects || !data.projects.length) return;
            data.projects.forEach(p => {
                if (!p.name || !p.name.trim()) return;
                const h = parseFloat((p.totalHours || '0').replace('h', '').replace(',', '.')) || 0;
                allPassages.push({
                    empId,
                    empName: empNames[empId] || empId,
                    date: p.date || '',
                    name: p.name.trim(),
                    team: p.team || '',
                    hours: h
                });
            });
        } catch (e) { console.error(e); }
    }));

    const filtered = searchVal
        ? allPassages.filter(p => p.name.toLowerCase().includes(searchVal))
        : allPassages;

    const groups = groupChantiers(filtered);
    const totalH = groups.reduce((s, g) => s + g.totalH, 0);
    const totalPassages = groups.reduce((s, g) => s + new Set(g.passages.map(p => p.date)).size, 0);
    renderFacturationCards(container, groups, totalH, totalPassages);
}

function renderFacturationShell(container, targetWeek, empFilter, searchVal) {
    const empOptions = Object.entries(employeeNames)
        .map(([id, n]) => `<option value="${id}" ${empFilter === id ? 'selected' : ''}>${n}</option>`)
        .join('');

    container.innerHTML = `
        <div class="card-section" style="margin-bottom:1rem;">
            <div class="card-section-header">
                <h2 class="card-section-title">
                    <i class="fas fa-file-invoice-dollar"></i>
                    Facturation chantiers spécifiques
                </h2>
                <button onclick="hideFacturationView()"
                    style="display:inline-flex;align-items:center;gap:6px;background:none;border:1.5px solid #d1d5db;color:#6b7280;padding:6px 14px;border-radius:8px;cursor:pointer;font-size:13px;font-weight:500;transition:all 0.15s;"
                    onmouseover="this.style.background='#f3f4f6'" onmouseout="this.style.background='none'">
                    <i class="fas fa-arrow-left"></i> Retour
                </button>
            </div>

            <div class="heures-filters">
                <div class="filter-group">
                    <label><i class="fas fa-calendar"></i> Semaine</label>
                    <input id="fact-week" type="week" value="${targetWeek}" class="filter-input"
                        onchange="loadFacturationData()" />
                </div>
                <div class="filter-group">
                    <label><i class="fas fa-user"></i> Employé</label>
                    <select id="fact-emp" class="filter-input" onchange="loadFacturationData()">
                        <option value="">Tous les employés</option>
                        ${empOptions}
                    </select>
                </div>
                <div class="filter-group">
                    <label><i class="fas fa-search"></i> Chantier</label>
                    <input id="fact-search" type="text" placeholder="Rechercher…" value="${searchVal}" class="filter-input"
                        oninput="clearTimeout(factSearchTimeout);factSearchTimeout=setTimeout(loadFacturationData,400)" />
                </div>
            </div>

            <div id="fact-stats" class="heures-stats-grid" style="margin-bottom:1rem;">
                <div class="heures-stat-card">
                    <div class="heures-stat-icon green"><i class="fas fa-hard-hat"></i></div>
                    <div><div class="heures-stat-value">—</div><div class="heures-stat-label">Chantiers</div></div>
                </div>
                <div class="heures-stat-card">
                    <div class="heures-stat-icon blue"><i class="fas fa-calendar-check"></i></div>
                    <div><div class="heures-stat-value">—</div><div class="heures-stat-label">Passages</div></div>
                </div>
                <div class="heures-stat-card">
                    <div class="heures-stat-icon purple"><i class="fas fa-clock"></i></div>
                    <div><div class="heures-stat-value">—</div><div class="heures-stat-label">Total heures</div></div>
                </div>
            </div>

            <div id="fact-cards"></div>
        </div>
    `;
}

function getInitialesFactu(name) {
    return name.split(' ').map(n => n[0]?.toUpperCase() || '').join('').slice(0, 2);
}

function formatDateFactu(dateStr) {
    if (!dateStr) return '—';
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

function renderFacturationCards(container, groups, totalH, totalPassages) {
    const statsEl = container.querySelector('#fact-stats');
    if (statsEl) {
        statsEl.innerHTML = `
            <div class="heures-stat-card">
                <div class="heures-stat-icon green"><i class="fas fa-hard-hat"></i></div>
                <div><div class="heures-stat-value">${groups.length}</div><div class="heures-stat-label">Chantiers</div></div>
            </div>
            <div class="heures-stat-card">
                <div class="heures-stat-icon blue"><i class="fas fa-calendar-check"></i></div>
                <div><div class="heures-stat-value">${totalPassages}</div><div class="heures-stat-label">Passages</div></div>
            </div>
            <div class="heures-stat-card">
                <div class="heures-stat-icon purple"><i class="fas fa-clock"></i></div>
                <div><div class="heures-stat-value">${formatHeuresFactu(totalH)}</div><div class="heures-stat-label">Total heures</div></div>
            </div>
        `;
    }

    const cardsEl = container.querySelector('#fact-cards');
    if (!cardsEl) return;

    if (!groups.length) {
        cardsEl.innerHTML = `<div class="loading-state"><i class="fas fa-inbox"></i><p>Aucun chantier spécifique pour cette période.</p></div>`;
        return;
    }

    cardsEl.innerHTML = `
        <div class="heures-table-wrap">
            <table class="heures-emp-table">
                <thead>
                    <tr>
                        <th>Chantier</th>
                        <th>Date(s)</th>
                        <th>Passages</th>
                        <th>Total heures</th>
                        <th>Détail par employé</th>
                    </tr>
                </thead>
                <tbody>
                    ${groups.map(g => {
        const dates = [...new Set(g.passages.map(p => formatDateFactu(p.date)))].join(', ');
        const nbPassages = new Set(g.passages.map(p => p.date)).size;
        const groupId = `fact-noms-${Math.random().toString(36).slice(2, 7)}`;
        const badge = g.uncertain
            ? `<span class="badge badge-warning" style="font-size:10px;cursor:pointer;"
                                onclick="const el=document.getElementById('${groupId}');el.style.display=el.style.display==='none'?'block':'none'">
                                ⚠ Incertain — voir noms</span>`
            : g.names.length > 1
                ? `<span class="badge badge-success" style="font-size:10px;cursor:pointer;"
                                    onclick="const el=document.getElementById('${groupId}');el.style.display=el.style.display==='none'?'block':'none'">
                                    ✓ Regroupé (${g.names.length} noms)</span>`
                : `<span class="badge badge-success" style="font-size:10px;">✓ Regroupé</span>`;

        const nomsDetail = g.names.length > 1
            ? `<div id="${groupId}" style="display:none;margin-top:4px;">
                                ${g.names.map(n => `<div style="font-size:11px;color:${g.uncertain ? '#854F0B' : '#059669'};font-style:italic;">"${n}"</div>`).join('')}
                               </div>`
            : '';

        const passageRows = g.passages
            .sort((a, b) => a.date > b.date ? 1 : -1)
            .map(p => `
                                <div style="display:flex;align-items:center;gap:8px;padding:3px 0;font-size:12px;">
                                    <span style="color:#6b7280;min-width:55px;">${formatDateFactu(p.date)}</span>
                                    <div class="heures-emp-avatar" style="width:20px;height:20px;font-size:9px;display:inline-flex;flex-shrink:0;">${getInitialesFactu(p.empName)}</div>
                                    <span style="flex:1;color:#374151;">${p.empName}</span>
                                    <span class="heures-badge-hours" style="font-size:11px;padding:2px 7px;">${formatHeuresFactu(p.hours)}</span>
                                </div>
                            `).join('');

        return `
                            <tr>
                                <td data-label="Chantier">
                                    <strong style="font-size:13px;">${g.names[0]}</strong>
                                    ${nomsDetail}
                                    <div style="margin-top:5px;">${badge}</div>
                                </td>
                                <td data-label="Date(s)" style="font-size:13px;color:#6b7280;white-space:nowrap;">${dates}</td>
<td data-label="Passages" style="text-align:center;font-weight:600;">${nbPassages}</td>                                <td data-label="Total heures">
                                    <span class="heures-badge-hours">${formatHeuresFactu(g.totalH)}</span>
                                </td>
                                <td data-label="Détail">
                                    <div style="min-width:180px;">${passageRows}</div>
                                </td>
                            </tr>
                        `;
    }).join('')}
                </tbody>
            </table>
        </div>
    `;
}
// CRUCIAL : Exposer les fonctions au HTML
window.showFacturationView = showFacturationView;
// ========== ONGLET PLANNING ==========
const PRENOM_DISPLAY = {
    'oceane': 'Océane', 'jeremie': 'Jérémie', 'stephanie': 'Stéphanie',
    'stephane': 'Stéphane', 'nadjet': 'Nadjet', 'remy': 'Rémy',
    'chloe': 'Chloé', 'jocelyne': 'Jocelyne', 'nadia': 'Nadia',
    'mina': 'Mina', 'isabelle': 'Isabelle', 'caroline': 'Caroline',
    'carlos': 'Carlos', 'sandra': 'Sandra', 'samuel': 'Samuel',
    'dylan': 'Dylan', 'maxime': 'Maxime', 'manon': 'Manon',
    'shana': 'Shana', 'oceane': 'Océane'
};

const PLANNING_EMPLOYEES = [
    'carlos', 'caroline', 'chloe', 'dylan', 'isabelle', 'jeremie',
    'jocelyne', 'manon', 'maxime', 'mina', 'nadia', 'nadjet',
    'oceane', 'remy', 'samuel', 'sandra', 'stephane', 'shana'
];

function normalizeNom(str) {
    return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

function parseHeuresPlanning(str) {
    if (!str) return 0;
    return parseFloat(str.replace(',', '.').trim()) || 0;
}

function parseSectionHeaderPlanning(texte) {
    const t = texte.trim();
    const binomeMatch = t.match(/^(.+?)\s+en\s+bin[oô]me\s+avec\s+(.+)$/i);
    if (binomeMatch) {
        return {
            prenom: normalizeNom(binomeMatch[1]),
            prenomDisplay: binomeMatch[1].trim(),
            binome: normalizeNom(binomeMatch[2]),
            binomeDisplay: binomeMatch[2].trim(),
            label: t
        };
    }
    return {
        prenom: normalizeNom(t),
        prenomDisplay: t.trim(),
        binome: null,
        binomeDisplay: null,
        label: t
    };
}

function detectAbsencePlanning(texte) {
    const t = texte.toUpperCase().trim();
    if (t.includes('CONGES') || t.includes('CONGÉS')) return 'CONGES_PAYES';
    if (t.includes('MALADIE')) return 'ABSENCE_MALADIE';
    if (t === 'ABSENT' || t === 'ABSENTE') return 'ABSENT';
    return null;
}

function parseDatePlanning(str) {
    const mois = {
        'jan': '01',
        'fév': '02', 'fev': '02',
        'mar': '03',
        'avr': '04',
        'mai': '05',
        'juin': '06', 'jun': '06',
        'juil': '07', 'jul': '07',
        'aoû': '08', 'aou': '08',
        'sep': '09',
        'oct': '10',
        'nov': '11',
        'déc': '12', 'dec': '12'
    };
    const parts = str.toLowerCase().replace(/\s/g, '').split(/[-\/]/);
    if (parts.length !== 2) return null;
    const jour = parts[0].padStart(2, '0');
    const moisStr = parts[1];
    // Tester 4 chars en priorité pour lever l'ambiguïté juin/juillet
    const moisNum = mois[moisStr.substring(0, 4)] || mois[moisStr.substring(0, 3)];
    if (!moisNum) return null;
    return `${new Date().getFullYear()}-${moisNum}-${jour}`;
}

// Parser épuré — extrait employés + chantiers, zéro détection d'annotations
function parserPlanningTexte(texte) {
    const result = { date: null, employes: {} };
    const lines = texte.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);

    let currentSection = null;
    let currentChantiers = [];

    const SKIP = [
        'planning jour', 'date / nb heures', 'prénom et son binôme',
        'prenom et son binome', 'total général', 'total general'
    ];

    const isLigneEmploye = (texte) => {
        const t = normalizeNom(texte);
        if (/en\s+bin[oô]me\s+avec/i.test(texte)) return true;
        return PLANNING_EMPLOYEES.some(emp => t === emp || t.startsWith(emp + ' '));
    };

    const flushSection = () => {
        if (!currentSection) return;
        const { prenom, prenomDisplay, binome, binomeDisplay } = currentSection;
        if (!result.employes[prenom]) {
            result.employes[prenom] = { total: 0, chantiers: [], absence: null, display: prenomDisplay };
        }
        const emp = result.employes[prenom];
        emp.total = parseFloat((emp.total + currentSection.total).toFixed(2));
        for (const c of currentChantiers) {
            emp.chantiers.push({ ...c, binome: binome || null, binomeDisplay: binomeDisplay || null });
        }
        if (currentChantiers.length === 1 && detectAbsencePlanning(currentChantiers[0].nom)) {
            emp.absence = detectAbsencePlanning(currentChantiers[0].nom);
        }
    };

    for (const line of lines) {
        const parts = line.split(/\t+/).map(p => p.trim());
        if (parts.length < 2) continue;

        const col1 = parts[0];
        const col2 = parts[parts.length - 1];

        // Détecter la date EN PREMIER avant tout skip
        if (!result.date) {
            const dateMatch = col2.match(/(\d{1,2}[-\/]\w+)/);
            if (dateMatch) {
                const parsed = parseDatePlanning(dateMatch[1]);
                if (parsed) result.date = parsed;
            }
        }

        if (SKIP.some(s => col1.toLowerCase().includes(s))) continue;

        const heures = parseHeuresPlanning(col2);

        if (isLigneEmploye(col1)) {
            flushSection();
            const parsed = parseSectionHeaderPlanning(col1);
            currentSection = { ...parsed, total: heures };
            currentChantiers = [];
        } else if (currentSection && col1) {
            currentChantiers.push({
                nom: col1.trim(),
                heures,
                annotations: [],
                controle: false,
                absence: detectAbsencePlanning(col1) || null
            });
        }
    }
    flushSection();

    if (!result.date) {
        const dateInput = document.getElementById('planning-date-input')?.value;
        if (dateInput) result.date = dateInput;
    }

    return result;
}

// ── État temporaire du planning en cours d'édition ──
let planningEnCours = null;

window.ouvrirModalImportPlanning = function () {
    document.getElementById('modal-import-planning')?.remove();

    const modal = document.createElement('div');
    modal.id = 'modal-import-planning';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:9999;display:flex;align-items:center;justify-content:center;padding:0.75rem;';
    modal.innerHTML = `
        <div id="import-planning-card" style="background:white;border-radius:20px;width:100%;max-width:960px;height:calc(100vh - 1.5rem);display:flex;flex-direction:column;box-shadow:0 25px 80px rgba(0,0,0,0.3);overflow:hidden;">
            <!-- Header -->
            <div style="padding:1.25rem 1.5rem;background:linear-gradient(135deg,#f0fdf4,#dcfce7);border-bottom:1px solid #bbf7d0;display:flex;align-items:center;justify-content:space-between;flex-shrink:0;">
                <div style="display:flex;align-items:center;gap:0.75rem;">
                    <div style="background:#10b981;width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;">
                        <i class="fas fa-paper-plane" style="color:white;font-size:0.9rem;"></i>
                    </div>
                    <div>
                        <div style="font-weight:700;color:#111827;font-size:1rem;">Envoyer un planning</div>
                        <div style="font-size:0.75rem;color:#6b7280;" id="import-modal-subtitle">Collez le tableau Excel</div>
                    </div>
                </div>
                <button onclick="document.getElementById('modal-import-planning').remove();planningEnCours=null;"
                    style="background:#f3f4f6;border:none;width:32px;height:32px;border-radius:50%;cursor:pointer;color:#6b7280;font-size:0.9rem;display:flex;align-items:center;justify-content:center;">
                    <i class="fas fa-times"></i>
                </button>
            </div>

            <!-- Body dynamique -->
            <div id="import-modal-body" style="padding:1.5rem;overflow-y:auto;flex:1;display:flex;flex-direction:column;">
                <div style="font-size:0.75rem;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:1px;margin-bottom:0.5rem;">
                    Coller le tableau Excel (Ctrl+V)
                </div>

                <!-- Textarea cachée après paste — valeur lue par testerImportPlanning -->
                <textarea id="planning-paste-zone"
                    placeholder="Collez ici votre planning copié depuis Excel..."
                    style="width:100%;height:100%;min-height:200px;border:2px dashed #d1d5db;border-radius:12px;padding:0.85rem;color:#6b7280;font-size:0.85rem;resize:none;box-sizing:border-box;transition:border-color 0.2s;background:#fafafa;outline:none;font-family:monospace;"
                    onfocus="this.style.borderColor='#10b981';this.style.color='#111827';this.style.background='white';"
                    onblur="this.style.borderColor='#d1d5db';"></textarea>

                <!-- Preview formatée — affichée après paste -->
                <div id="planning-paste-preview" style="display:none;flex:1;flex-direction:column;gap:0.5rem;">
                    <div id="planning-paste-preview-content"
                        style="flex:1;border:2px solid #10b981;border-radius:12px;padding:0.85rem;font-size:0.85rem;font-family:monospace;background:white;white-space:pre-wrap;word-break:break-word;line-height:1.7;overflow-y:auto;min-height:200px;"></div>
                    <button onclick="window._resetPlanningPaste()"
                        style="align-self:flex-start;background:none;border:none;color:#9ca3af;font-size:0.78rem;cursor:pointer;display:flex;align-items:center;gap:5px;padding:2px 0;">
                        <i class="fas fa-pen"></i> Modifier le texte
                    </button>
                </div>

                <p style="font-size:0.75rem;color:#9ca3af;margin-top:0.5rem;" id="planning-paste-hint">
                    <i class="fas fa-info-circle" style="margin-right:4px;"></i>
                    Copiez le tableau directement depuis Excel ou Google Sheets avec Ctrl+A puis Ctrl+C.
                </p>
            </div>

            <!-- Footer -->
            <div id="import-modal-footer" style="padding:1rem 1.5rem;border-top:1px solid #e5e7eb;flex-shrink:0;background:white;">
                <button id="btn-verifier-planning" onclick="testerImportPlanning()"
                    style="width:100%;background:linear-gradient(135deg,#10b981,#059669);color:white;border:none;border-radius:12px;padding:0.9rem;font-weight:700;font-size:0.95rem;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;box-shadow:0 4px 12px rgba(16,185,129,0.3);">
                    <i class="fas fa-eye"></i> Vérifier et annoter
                </button>
            </div>
        </div>
    `;

    modal.addEventListener('click', e => {
        if (e.target === modal) { modal.remove(); planningEnCours = null; }
    });
    document.body.appendChild(modal);

    const textarea = document.getElementById('planning-paste-zone');

    const formaterTexte = (texte) => texte;

    textarea.addEventListener('paste', () => {
        setTimeout(() => {
            const texte = textarea.value;
            if (!texte.trim()) return;

            const preview = document.getElementById('planning-paste-preview');
            const content = document.getElementById('planning-paste-preview-content');
            content.innerHTML = formaterTexte(texte);

            textarea.style.display = 'none';
            preview.style.display = 'flex';
            document.getElementById('planning-paste-hint').style.display = 'none';
        }, 0);
    });

    // Reset : revenir à la textarea
    window._resetPlanningPaste = function () {
        const textarea = document.getElementById('planning-paste-zone');
        const preview = document.getElementById('planning-paste-preview');
        textarea.style.display = 'block';
        textarea.style.height = '100%';
        preview.style.display = 'none';
        document.getElementById('planning-paste-hint').style.display = 'block';
        textarea.focus();
        textarea.select();
    };

    setTimeout(() => textarea.focus(), 100);
};
// ── Tester = parser + afficher l'interface de review ──
const TRAVAUX_GENERIQUES = ['travaux à définir', 'travaux a definir', 'à définir', 'a definir'];

function detecterTravauxGeneriques(planning) {
    const resultats = [];
    // Détecte : "travaux à définir", "travaux a definir", "travaux 4", "travaux 14", "travaux" seul
    const re = /^travaux(\s+\d+|\s+[àa]\s+d[ée]finir)?$/i;
    for (const [prenom, emp] of Object.entries(planning.employes)) {
        if (emp.absence) continue;
        (emp.chantiers || []).forEach((c, ci) => {
            const nomNorm = c.nom.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
            const estGenerique = re.test(nomNorm) || TRAVAUX_GENERIQUES.some(t => nomNorm === t);
            if (estGenerique) {
                const nom = emp.display || PRENOM_DISPLAY[prenom] || prenom.charAt(0).toUpperCase() + prenom.slice(1);
                resultats.push({ prenom, ci, nom, nomActuel: c.nom });
            }
        });
    }
    return resultats;
}

window.testerImportPlanning = function () {
    const texte = document.getElementById('planning-paste-zone').value.trim();
    if (!texte) { showNotification('Collez le tableau Excel avant de vérifier', 'error'); return; }

    const planning = parserPlanningTexte(texte);
    if (Object.keys(planning.employes).length === 0) {
        showNotification('Aucun employé détecté — vérifiez le format collé', 'error');
        return;
    }

    planningEnCours = planning;

    const travauxGeneriques = detecterTravauxGeneriques(planning);
    if (travauxGeneriques.length > 0) {
        afficherModalTravaux(planning, travauxGeneriques);
    } else {
        afficherReviewDansModal(planning);
    }
};

function afficherModalTravaux(planning, travaux) {
    document.getElementById('modal-travaux-definir')?.remove();

    const modal = document.createElement('div');
    modal.id = 'modal-travaux-definir';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:10000;display:flex;align-items:center;justify-content:center;padding:0.75rem;';

    const lignesHTML = travaux.map((t, i) => `
        <div style="background:#f9fafb;border:1.5px solid #e5e7eb;border-radius:10px;padding:0.85rem 1rem;margin-bottom:0.5rem;">
            <div style="font-size:0.78rem;font-weight:600;color:#6b7280;margin-bottom:0.4rem;">
                <i class="fas fa-user" style="color:#10b981;margin-right:5px;"></i>${t.nom}
            </div>
            <input
                id="travaux-input-${i}"
                type="text"
                value="Travaux "
                placeholder="Nom du chantier..."
                style="width:100%;border:1.5px solid #d1d5db;border-radius:8px;padding:0.55rem 0.75rem;font-size:0.9rem;font-weight:600;color:#111827;box-sizing:border-box;outline:none;"
                onfocus="this.style.borderColor='#10b981'"
                onblur="this.style.borderColor='#d1d5db'"
            />
        </div>
    `).join('');

    modal.innerHTML = `
        <div style="background:white;border-radius:16px;width:100%;max-width:480px;max-height:90vh;display:flex;flex-direction:column;box-shadow:0 25px 80px rgba(0,0,0,0.3);overflow:hidden;">
            <div style="padding:1.25rem 1.5rem;background:linear-gradient(135deg,#fffbeb,#fef3c7);border-bottom:1px solid #fde68a;display:flex;align-items:center;gap:0.75rem;flex-shrink:0;">
                <div style="background:#f59e0b;width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                    <i class="fas fa-hard-hat" style="color:white;font-size:0.9rem;"></i>
                </div>
                <div>
                    <div style="font-weight:700;color:#111827;font-size:1rem;">Chantiers à préciser</div>
                    <div style="font-size:0.75rem;color:#92400e;">${travaux.length} chantier${travaux.length > 1 ? 's' : ''} avec un nom générique détecté</div>
                </div>
            </div>
            <div style="padding:1.25rem 1.5rem;overflow-y:auto;flex:1;">
                ${lignesHTML}
            </div>
            <div style="padding:1rem 1.5rem;border-top:1px solid #e5e7eb;display:flex;gap:0.75rem;background:white;flex-shrink:0;">
                <button id="btn-confirmer-travaux"
                    style="flex:1;background:linear-gradient(135deg,#10b981,#059669);color:white;border:none;border-radius:10px;padding:0.8rem;font-weight:700;font-size:0.95rem;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;box-shadow:0 4px 12px rgba(16,185,129,0.3);">
                    <i class="fas fa-eye"></i> Vérifier et annoter
                </button>
                <button id="btn-ignorer-travaux"
                    style="background:#f3f4f6;color:#374151;border:none;border-radius:10px;padding:0.8rem 1rem;font-weight:600;font-size:0.85rem;cursor:pointer;white-space:nowrap;">
                    Ignorer
                </button>
            </div>
        </div>`;

    document.body.appendChild(modal);

    document.getElementById('btn-confirmer-travaux').addEventListener('click', () => {
        travaux.forEach((t, i) => {
            const val = document.getElementById(`travaux-input-${i}`)?.value.trim();
            if (val) planningEnCours.employes[t.prenom].chantiers[t.ci].nom = val;
        });
        modal.remove();
        afficherReviewDansModal(planningEnCours);
    });

    document.getElementById('btn-ignorer-travaux').addEventListener('click', () => {
        modal.remove();
        afficherReviewDansModal(planningEnCours);
    });

    setTimeout(() => document.getElementById('travaux-input-0')?.focus(), 100);
}

function afficherReviewDansModal(planning) {
    const subtitle = document.getElementById('import-modal-subtitle');
    if (subtitle) subtitle.textContent = 'Vérification & annotations';

    const body = document.getElementById('import-modal-body');
    const footer = document.getElementById('import-modal-footer');
    if (!body || !footer) {
        afficherInterfaceReview(planning);
        return;
    }

    const [y, m, d] = (planning.date || '').split('-').map(Number);
    const dateObj = planning.date
        ? new Date(y, m - 1, d).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
        : 'Date non détectée';

    const formatH = h => {
        if (!h) return '0h';
        const hh = Math.floor(h); const mm = Math.round((h - hh) * 60);
        return mm === 0 ? `${hh}h` : `${hh}h${String(mm).padStart(2, '0')}`;
    };

    const absLabels = { CONGES_PAYES: 'Congés payés', ABSENCE_MALADIE: 'Absence maladie', ABSENT: 'Absent' };
    const absColors = { CONGES_PAYES: '#3b82f6', ABSENCE_MALADIE: '#ef4444', ABSENT: '#9ca3af' };
    const nbChantiers = Object.values(planning.employes).reduce((s, e) => s + (e.chantiers || []).length, 0);
    const norm = s => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

    let empHTML = '';
    for (const [prenom, emp] of Object.entries(planning.employes)) {
        const nom = emp.display || PRENOM_DISPLAY[prenom] || prenom.charAt(0).toUpperCase() + prenom.slice(1);

        let chantiersHTML = '';
        if (emp.absence) {
            chantiersHTML = `<div style="font-size:0.85rem;color:${absColors[emp.absence] || '#9ca3af'};font-style:italic;padding:8px 0;">${absLabels[emp.absence] || emp.absence}</div>`;
        } else {
            (emp.chantiers || []).forEach((c, ci) => {
                const key = `${prenom}__${ci}`;

                let binomeLabel = c.binomeDisplay || (c.binome ? (PRENOM_DISPLAY[c.binome] || c.binome.charAt(0).toUpperCase() + c.binome.slice(1)) : null);
                if (!binomeLabel) {
                    const collègues = [];
                    for (const [autrePrenom, autreEmp] of Object.entries(planning.employes)) {
                        if (autrePrenom === prenom) continue;
                        if ((autreEmp.chantiers || []).some(ac => norm(ac.nom) === norm(c.nom))) {
                            collègues.push(autreEmp.display || PRENOM_DISPLAY[autrePrenom] || autrePrenom.charAt(0).toUpperCase() + autrePrenom.slice(1));
                        }
                    }
                    if (collègues.length > 0) binomeLabel = collègues.join(', ');
                }

                const isFiche = estChantierFiche(c.nom);

                chantiersHTML += `
                    <div style="border-bottom:1px solid #f3f4f6;padding:10px 0;" id="chantier-block-${key}">
                        <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;">
                            <div style="flex:1;min-width:0;display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
                                ${binomeLabel ? `<span style="font-size:0.7rem;background:#e0f2fe;color:#0369a1;border-radius:4px;padding:2px 7px;font-weight:600;white-space:nowrap;flex-shrink:0;">avec ${binomeLabel}</span>` : ''}
                                <span style="font-size:0.9rem;color:#111827;font-weight:500;">${c.nom}</span>
                            </div>
                            <div style="display:flex;align-items:center;gap:6px;flex-shrink:0;flex-wrap:wrap;">
                                <span style="font-size:0.88rem;font-weight:700;color:#6b7280;white-space:nowrap;">${formatH(c.heures)}</span>
                                ${isFiche ? `
                                <button onclick="ouvrirModaleFiche('${c.nom.replace(/'/g, "\\'")}')"
                                    style="background:#fff7ed;border:1.5px solid #fed7aa;color:#ea580c;border-radius:7px;padding:5px 10px;font-size:0.75rem;font-weight:700;cursor:pointer;white-space:nowrap;">
                                    <i class="fas fa-file-alt" style="margin-right:3px;"></i>Fiche
                                </button>` : ''}
                                <label style="display:flex;align-items:center;gap:4px;cursor:pointer;padding:5px 9px;border-radius:7px;border:1px solid ${c.controle ? '#fbbf24' : '#e5e7eb'};background:${c.controle ? '#fef9c3' : '#f9fafb'};" title="Visite de contrôle qualité" id="controle-label-${key}">
                                    <input type="checkbox" ${c.controle ? 'checked' : ''}
                                        onchange="toggleControle('${prenom}',${ci},this.checked);const l=document.getElementById('controle-label-${key}');l.style.borderColor=this.checked?'#fbbf24':'#e5e7eb';l.style.background=this.checked?'#fef9c3':'#f9fafb';"
                                        style="accent-color:#eab308;width:14px;height:14px;">
                                    <i class="fas fa-clipboard-check" style="font-size:0.78rem;color:${c.controle ? '#d97706' : '#9ca3af'};"></i>
                                </label>
                                <button onclick="ajouterAnnotation('${prenom}',${ci})"
                                    style="background:#f0fdf4;border:1px solid #bbf7d0;color:#10b981;border-radius:7px;padding:5px 12px;font-size:0.8rem;font-weight:600;cursor:pointer;white-space:nowrap;">
                                    <i class="fas fa-plus" style="font-size:0.7rem;margin-right:3px;"></i>Annotation
                                </button>
                            </div>
                        </div>
                        <div id="annotations-${key}" style="display:flex;flex-direction:column;gap:4px;margin-top:6px;">
                            ${(c.annotations || []).map((a, ai) => renderAnnotationTag(prenom, ci, ai, a)).join('')}
                        </div>
                    </div>`;
            });
        }

        empHTML += `
            <div style="background:white;border:1.5px solid #e5e7eb;border-radius:12px;padding:1rem;margin-bottom:0.75rem;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:${emp.absence ? '0' : '0.5rem'};">
                    <span style="font-size:1rem;font-weight:700;color:#111827;">${nom}</span>
                    <span style="font-size:0.9rem;font-weight:700;color:#10b981;">${formatH(emp.total)}</span>
                </div>
                ${chantiersHTML}
            </div>`;
    }

    // Reset styles body pour scroll correct
    body.style.cssText = 'padding:0;overflow:hidden;flex:1;display:flex;flex-direction:column;';

    body.innerHTML = `
        <div style="padding:1rem 1.5rem;flex-shrink:0;border-bottom:1px solid #f3f4f6;">
            <div style="background:#fffbeb;border:1.5px solid #fde68a;border-radius:10px;padding:0.6rem 0.85rem;display:flex;align-items:center;gap:8px;margin-bottom:0.6rem;">
                <i class="fas fa-calendar-day" style="color:#f59e0b;font-size:0.85rem;flex-shrink:0;"></i>
                <span style="font-size:0.8rem;color:#92400e;font-weight:600;text-transform:capitalize;">${dateObj}</span>
                <span style="margin-left:auto;font-size:0.75rem;color:#9ca3af;">${Object.keys(planning.employes).length} employé${Object.keys(planning.employes).length > 1 ? 's' : ''} · ${nbChantiers} chantier${nbChantiers > 1 ? 's' : ''}</span>
            </div>
            <div style="font-size:0.72rem;color:#6b7280;">
                <i class="fas fa-lightbulb" style="color:#f59e0b;margin-right:4px;"></i>
                Ajoutez des <strong>annotations</strong> (rouge) · Cochez <i class="fas fa-clipboard-check" style="color:#d97706;"></i> pour contrôle · <i class="fas fa-file-alt" style="color:#ea580c;margin-left:3px;"></i> pour créer une fiche
            </div>
        </div>
        <div id="review-body" style="overflow-y:auto;flex:1;padding:1rem 1.5rem;">
            ${empHTML}
        </div>
    `;

    footer.innerHTML = `
        <div style="display:flex;gap:0.75rem;">
            <button onclick="planningEnCours=null;ouvrirModalImportPlanning()"
                style="background:#f3f4f6;color:#374151;border:none;border-radius:10px;padding:0.75rem 1rem;font-weight:600;font-size:0.85rem;cursor:pointer;display:flex;align-items:center;gap:6px;">
                <i class="fas fa-arrow-left"></i> Retour
            </button>
            <button id="btn-envoyer-planning" onclick="publierPlanningDepuisReview()"
                style="flex:1;background:linear-gradient(135deg,#10b981,#059669);color:white;border:none;border-radius:10px;padding:0.75rem;font-weight:700;font-size:0.95rem;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;box-shadow:0 4px 12px rgba(16,185,129,0.3);">
                <i class="fas fa-paper-plane"></i> Envoyer le planning
            </button>
        </div>
    `;
}

// ── Importer directement sans passer par le test ──
window.importerPlanning = async function () {
    const texte = document.getElementById('planning-paste-zone').value.trim();
    if (!texte) { showNotification('Collez le tableau Excel avant d\'importer', 'error'); return; }

    if (!planningEnCours) {
        planningEnCours = parserPlanningTexte(texte);
    }
    if (Object.keys(planningEnCours.employes).length === 0) {
        showNotification('Aucun employé détecté', 'error');
        return;
    }
    await publierPlanning(planningEnCours);
};

// ── Interface review avec ajout d'annotations ──
// ── Détecte si un chantier est un débarras / fin de chantier (pas copro) ──
function estChantierFiche(nomChantier) {
    return false;
}

// ── Normalise un nom de chantier en slug Firestore ──
function slugFiche(nom) {
    return nom.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// ── Ouvre la modale de création/édition de fiche d'intervention ──
async function ouvrirModaleFiche(nomChantier) {
    const slug = slugFiche(nomChantier);
    const ref = doc(db, 'fiches', slug);
    const snap = await getDoc(ref);
    const existante = snap.exists() ? snap.data() : null;

    if (existante) {
        const choix = await new Promise(resolve => {
            const d = document.createElement('div');
            d.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:10001;display:flex;align-items:center;justify-content:center;padding:1rem;';
            d.innerHTML = `
                <div style="background:white;border-radius:16px;padding:1.5rem;max-width:400px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,0.3);">
                    <div style="display:flex;align-items:center;gap:10px;margin-bottom:1rem;">
                        <div style="width:40px;height:40px;border-radius:50%;background:#fef3c7;display:flex;align-items:center;justify-content:center;">
                            <i class="fas fa-folder-open" style="color:#d97706;font-size:1.1rem;"></i>
                        </div>
                        <div>
                            <div style="font-weight:700;color:#111827;font-size:0.95rem;">Fiche existante</div>
                            <div style="font-size:0.8rem;color:#6b7280;">${nomChantier}</div>
                        </div>
                    </div>
                    <p style="font-size:0.85rem;color:#374151;margin-bottom:1.25rem;">Une fiche d'intervention existe déjà pour ce chantier. Que souhaitez-vous faire ?</p>
                    <div style="display:flex;flex-direction:column;gap:0.5rem;">
                        <button id="choix-modifier" style="background:#f0fdf4;border:1.5px solid #bbf7d0;color:#065f46;border-radius:10px;padding:0.7rem;font-weight:700;cursor:pointer;font-size:0.88rem;">
                            <i class="fas fa-edit" style="margin-right:6px;"></i>Modifier la fiche existante
                        </button>
                        <button id="choix-remplacer" style="background:#fff7ed;border:1.5px solid #fed7aa;color:#9a3412;border-radius:10px;padding:0.7rem;font-weight:700;cursor:pointer;font-size:0.88rem;">
                            <i class="fas fa-sync-alt" style="margin-right:6px;"></i>Remplacer par une nouvelle fiche
                        </button>
                        <button id="choix-annuler" style="background:#f3f4f6;border:none;color:#6b7280;border-radius:10px;padding:0.7rem;font-weight:600;cursor:pointer;font-size:0.88rem;">
                            Annuler
                        </button>
                    </div>
                </div>`;
            document.body.appendChild(d);
            d.querySelector('#choix-modifier').onclick = () => { d.remove(); resolve('modifier'); };
            d.querySelector('#choix-remplacer').onclick = () => { d.remove(); resolve('remplacer'); };
            d.querySelector('#choix-annuler').onclick = () => { d.remove(); resolve(null); };
        });
        if (!choix) return;
        _afficherFormFiche(nomChantier, slug, choix === 'modifier' ? existante : null);
    } else {
        _afficherFormFiche(nomChantier, slug, null);
    }
}

// ── Formulaire de création/édition fiche ──
function _afficherFormFiche(nomChantier, slug, existante) {
    document.getElementById('modal-fiche-intervention')?.remove();

    const tachesExistantes = (existante?.taches || []).map(t =>
        `<div class="fiche-tache-row" style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
            <input type="text" value="${t.label.replace(/"/g, '&quot;')}" placeholder="Tâche..."
                style="flex:1;border:1px solid #e5e7eb;border-radius:8px;padding:7px 10px;font-size:0.88rem;">
            <button onclick="this.parentElement.remove()" style="background:#fee2e2;border:none;border-radius:6px;width:30px;height:30px;cursor:pointer;color:#ef4444;font-size:0.9rem;">
                <i class="fas fa-times"></i>
            </button>
        </div>`
    ).join('');

    const modal = document.createElement('div');
    modal.id = 'modal-fiche-intervention';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.65);z-index:10001;display:flex;align-items:center;justify-content:center;padding:0.5rem;';
    modal.innerHTML = `
        <div style="background:white;border-radius:16px;width:100%;max-width:680px;max-height:95vh;display:flex;flex-direction:column;box-shadow:0 25px 80px rgba(0,0,0,0.35);overflow:hidden;">

            <div style="padding:1.25rem 1.5rem;background:linear-gradient(135deg,#fff7ed,#ffedd5);border-bottom:1px solid #fed7aa;display:flex;align-items:center;justify-content:space-between;flex-shrink:0;">
                <div>
                    <div style="display:flex;align-items:center;gap:8px;margin-bottom:2px;">
                        <i class="fas fa-file-alt" style="color:#ea580c;font-size:1rem;"></i>
                        <span style="font-size:1rem;font-weight:700;color:#111827;">Fiche d'intervention</span>
                    </div>
                    <div style="font-size:0.8rem;color:#9a3412;font-weight:600;">${nomChantier}</div>
                </div>
                <button onclick="document.getElementById('modal-fiche-intervention').remove()"
                    style="background:#f3f4f6;border:none;width:34px;height:34px;border-radius:50%;cursor:pointer;color:#6b7280;font-size:1rem;display:flex;align-items:center;justify-content:center;">
                    <i class="fas fa-times"></i>
                </button>
            </div>

            <div style="padding:1.25rem 1.5rem;overflow-y:auto;flex:1;display:flex;flex-direction:column;gap:1.25rem;">

                <!-- Adresse -->
                <div>
                    <label style="font-size:0.8rem;font-weight:700;color:#374151;display:block;margin-bottom:5px;">
                        <i class="fas fa-map-marker-alt" style="color:#ea580c;margin-right:5px;"></i>Adresse
                    </label>
                    <input type="text" id="fiche-adresse" value="${existante?.adresse || ''}"
                        placeholder="12 rue des Lilas, 74000 Annecy"
                        style="width:100%;border:1.5px solid #e5e7eb;border-radius:10px;padding:9px 12px;font-size:0.88rem;box-sizing:border-box;">
                </div>

                <!-- Texte libre collé -->
                <div>
                    <label style="font-size:0.8rem;font-weight:700;color:#374151;display:block;margin-bottom:5px;">
                        <i class="fas fa-paste" style="color:#ea580c;margin-right:5px;"></i>Informations (devis, mail, notes…)
                    </label>
                    <textarea id="fiche-texte" rows="6"
                        placeholder="Collez ici le contenu du devis, mail ou toute information utile…"
                        style="width:100%;border:1.5px solid #e5e7eb;border-radius:10px;padding:9px 12px;font-size:0.85rem;resize:vertical;font-family:inherit;box-sizing:border-box;">${existante?.texteLibre || ''}</textarea>
                </div>

                <!-- Tâches -->
                <div>
                    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
                        <label style="font-size:0.8rem;font-weight:700;color:#374151;">
                            <i class="fas fa-tasks" style="color:#ea580c;margin-right:5px;"></i>Tâches à réaliser
                        </label>
                        <button onclick="_ficheParseTaches()" style="background:#fff7ed;border:1px solid #fed7aa;color:#ea580c;border-radius:7px;padding:4px 10px;font-size:0.75rem;font-weight:700;cursor:pointer;">
                            <i class="fas fa-magic" style="margin-right:4px;"></i>Extraire du texte
                        </button>
                    </div>
                    <div id="fiche-taches-list">${tachesExistantes}</div>
                    <button onclick="_ficheAjouterTache()" style="background:#f9fafb;border:1.5px dashed #d1d5db;color:#6b7280;border-radius:10px;padding:8px;width:100%;cursor:pointer;font-size:0.83rem;margin-top:4px;">
                        <i class="fas fa-plus" style="margin-right:5px;"></i>Ajouter une tâche
                    </button>
                </div>

                <!-- Photos -->
                <div>
                    <label style="font-size:0.8rem;font-weight:700;color:#374151;display:block;margin-bottom:8px;">
                        <i class="fas fa-images" style="color:#ea580c;margin-right:5px;"></i>Photos
                    </label>
                    <div id="fiche-photos-preview" style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:8px;">
                        ${(existante?.photos || []).map((p, i) => `
                            <div style="position:relative;width:80px;height:80px;border-radius:8px;overflow:hidden;flex-shrink:0;" data-url="${p.url}" data-delete="${p.delete_url || ''}">
                                <img src="${p.url}" style="width:100%;height:100%;object-fit:cover;">
                                <button onclick="this.parentElement.remove()" style="position:absolute;top:2px;right:2px;background:rgba(0,0,0,0.6);border:none;border-radius:50%;width:20px;height:20px;color:white;cursor:pointer;font-size:0.65rem;display:flex;align-items:center;justify-content:center;">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>`).join('')}
                    </div>
                    <label style="display:flex;align-items:center;gap:8px;background:#f9fafb;border:1.5px dashed #d1d5db;border-radius:10px;padding:10px 14px;cursor:pointer;">
                        <i class="fas fa-camera" style="color:#ea580c;"></i>
                        <span style="font-size:0.83rem;color:#6b7280;">Ajouter des photos</span>
                        <input type="file" id="fiche-photos-input" accept="image/*" multiple style="display:none;" onchange="_fichePreviewPhotos(this)">
                    </label>
                    <div id="fiche-upload-progress" style="display:none;font-size:0.78rem;color:#6b7280;margin-top:6px;text-align:center;"></div>
                </div>

            </div>

            <div style="padding:1rem 1.5rem;border-top:1px solid #e5e7eb;display:flex;gap:0.75rem;flex-shrink:0;background:white;">
                <button onclick="_sauvegarderFiche('${slug}', '${nomChantier.replace(/'/g, "\\'")}')"
                    style="flex:1;background:linear-gradient(135deg,#ea580c,#c2410c);color:white;border:none;border-radius:10px;padding:0.8rem;font-weight:700;font-size:0.95rem;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;">
                    <i class="fas fa-save"></i> Enregistrer la fiche
                </button>
            </div>
        </div>`;

    document.body.appendChild(modal);
    modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
}

// ── Ajoute une ligne tâche vide ──
window._ficheAjouterTache = function (label = '') {
    const list = document.getElementById('fiche-taches-list');
    const row = document.createElement('div');
    row.className = 'fiche-tache-row';
    row.style.cssText = 'display:flex;align-items:center;gap:8px;margin-bottom:6px;';
    row.innerHTML = `
        <input type="text" value="${label.replace(/"/g, '&quot;')}" placeholder="Tâche..."
            style="flex:1;border:1px solid #e5e7eb;border-radius:8px;padding:7px 10px;font-size:0.88rem;">
        <button onclick="this.parentElement.remove()" style="background:#fee2e2;border:none;border-radius:6px;width:30px;height:30px;cursor:pointer;color:#ef4444;font-size:0.9rem;">
            <i class="fas fa-times"></i>
        </button>`;
    list.appendChild(row);
    row.querySelector('input').focus();
};

// ── Extrait les tâches depuis le texte collé ──
window._ficheParseTaches = function () {
    const texte = document.getElementById('fiche-texte').value;
    if (!texte.trim()) return;

    const ignorer = /^(bonjour|cordialement|merci|objet|de\s*:|à\s*:|cc\s*:|les zones|en tenir compte|je rappelle|camille|gros|\s*$)/i;
    const tachesMotsCles = /^(afonso|a tous|tissot|cornillon|vernis|smc|scm|cuvettes|dépose|achèvement|jardinières)/i;

    const lignes = texte.split('\n').map(l => l.trim()).filter(l => l.length > 5);

    const taches = [];
    for (const ligne of lignes) {
        if (ignorer.test(ligne)) continue;

        // Lignes avec puce explicite
        const matchPuce = ligne.match(/^[\*\-•·➢➤→✓✗]\s+(.+)/);
        const matchNum = ligne.match(/^\d+[\.\)]\s+(.+)/);

        if (matchPuce) {
            taches.push(matchPuce[1].trim());
        } else if (matchNum) {
            taches.push(matchNum[1].trim());
        } else if (tachesMotsCles.test(ligne)) {
            // Lignes sans puce mais qui commencent par un nom d'intervenant ou une action
            taches.push(ligne);
        } else if (ligne.length > 10 && ligne.length < 120 && !ligne.endsWith(':')) {
            // Lignes courtes qui ressemblent à des tâches (pas des paragraphes)
            taches.push(ligne);
        }
    }

    if (!taches.length) {
        alert('Aucune tâche détectée.');
        return;
    }

    document.getElementById('fiche-taches-list').innerHTML = '';
    taches.forEach(t => window._ficheAjouterTache(t));
};

// ── Preview photos sélectionnées ──
window._fichePreviewPhotos = function (input) {
    const preview = document.getElementById('fiche-photos-preview');
    Array.from(input.files).forEach(file => {
        const reader = new FileReader();
        reader.onload = e => {
            const div = document.createElement('div');
            div.style.cssText = 'position:relative;width:80px;height:80px;border-radius:8px;overflow:hidden;flex-shrink:0;';
            div.dataset.file = file.name;
            div.dataset.newFile = '1';
            div.innerHTML = `
                <img src="${e.target.result}" style="width:100%;height:100%;object-fit:cover;" data-blob="${e.target.result}">
                <button onclick="this.parentElement.remove()" style="position:absolute;top:2px;right:2px;background:rgba(0,0,0,0.6);border:none;border-radius:50%;width:20px;height:20px;color:white;cursor:pointer;font-size:0.65rem;display:flex;align-items:center;justify-content:center;">
                    <i class="fas fa-times"></i>
                </button>`;
            preview.appendChild(div);
        };
        reader.readAsDataURL(file);
    });
    input.value = '';
};

// ── Upload ImgBB ──
async function _ficheUploadImgBB(base64) {
    const IMGBB_KEY = '0cdd5d2bedcb6d1f2c838c4e5ecc1e59';
    const data = base64.includes(',') ? base64.split(',')[1] : base64;
    const form = new FormData();
    form.append('image', data);
    const r = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_KEY}`, { method: 'POST', body: form });
    const j = await r.json();
    return { url: j.data.url, delete_url: j.data.delete_url };
}

// ── Sauvegarde Firestore ──
window._sauvegarderFiche = async function (slug, nomChantier) {
    const btn = document.querySelector('#modal-fiche-intervention button[onclick*="_sauvegarderFiche"]');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enregistrement…';

    try {
        const adresse = document.getElementById('fiche-adresse').value.trim();
        const texteLibre = document.getElementById('fiche-texte').value.trim();

        // Tâches
        const taches = Array.from(document.querySelectorAll('#fiche-taches-list .fiche-tache-row input'))
            .map(i => ({ label: i.value.trim(), faite: false }))
            .filter(t => t.label);

        // Photos — upload les nouvelles
        const prog = document.getElementById('fiche-upload-progress');
        const photoDivs = Array.from(document.querySelectorAll('#fiche-photos-preview > div'));
        const photos = [];

        for (let i = 0; i < photoDivs.length; i++) {
            const div = photoDivs[i];
            if (div.dataset.newFile) {
                prog.style.display = 'block';
                prog.textContent = `Upload photo ${i + 1}/${photoDivs.length}…`;
                const blob = div.querySelector('img').dataset.blob;
                const uploaded = await _ficheUploadImgBB(blob);
                photos.push(uploaded);
            } else {
                photos.push({ url: div.dataset.url, delete_url: div.dataset.delete || '' });
            }
        }
        prog.style.display = 'none';

        const fiche = {
            nomChantier,
            slug,
            adresse,
            texteLibre,
            taches,
            photos,
            updatedAt: new Date().toISOString()
        };

        await setDoc(doc(db, 'fiches', slug), fiche);

        btn.innerHTML = '<i class="fas fa-check"></i> Enregistré !';
        btn.style.background = 'linear-gradient(135deg,#10b981,#059669)';
        setTimeout(() => document.getElementById('modal-fiche-intervention')?.remove(), 800);

    } catch (err) {
        console.error('Erreur sauvegarde fiche:', err);
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-save"></i> Enregistrer la fiche';
        alert('Erreur lors de l\'enregistrement.');
    }
};
window.ouvrirModaleFiche = ouvrirModaleFiche;

// ── Interface review avec ajout d'annotations ──
function afficherInterfaceReview(planning) {
    document.getElementById('modal-review-planning')?.remove();

    const dateObj = planning.date ? (() => {
        const [y, m, d] = planning.date.split('-').map(Number);
        return new Date(y, m - 1, d).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    })() : 'Date non détectée';

    const formatH = h => {
        if (!h) return '0h';
        const hh = Math.floor(h); const mm = Math.round((h - hh) * 60);
        return mm === 0 ? `${hh}h` : `${hh}h${String(mm).padStart(2, '0')}`;
    };

    const absLabels = { CONGES_PAYES: 'Congés payés', ABSENCE_MALADIE: 'Absence maladie', ABSENT: 'Absent' };
    const absColors = { CONGES_PAYES: '#3b82f6', ABSENCE_MALADIE: '#ef4444', ABSENT: '#9ca3af' };

    let empHTML = '';
    for (const [prenom, emp] of Object.entries(planning.employes)) {
        const nom = emp.display || PRENOM_DISPLAY[prenom] || prenom.charAt(0).toUpperCase() + prenom.slice(1);

        let chantiersHTML = '';
        if (emp.absence) {
            chantiersHTML = `<div style="font-size:0.85rem;color:${absColors[emp.absence] || '#9ca3af'};font-style:italic;padding:8px 0;">${absLabels[emp.absence] || emp.absence}</div>`;
        } else {
            (emp.chantiers || []).forEach((c, ci) => {
                const key = `${prenom}__${ci}`;
                const binomeLabel = c.binomeDisplay || (c.binome ? (PRENOM_DISPLAY[c.binome] || c.binome.charAt(0).toUpperCase() + c.binome.slice(1)) : null);
                const isFiche = estChantierFiche(c.nom);

                chantiersHTML += `
                    <div style="border-bottom:1px solid #f3f4f6;padding:10px 0;" id="chantier-block-${key}">
                        <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
                            <div style="flex:1;min-width:0;display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
                                ${binomeLabel ? `<span style="font-size:0.7rem;background:#e0f2fe;color:#0369a1;border-radius:4px;padding:2px 7px;font-weight:600;white-space:nowrap;flex-shrink:0;">avec ${binomeLabel}</span>` : ''}
                                <span style="font-size:0.9rem;color:#111827;font-weight:700;">${c.nom}</span>
                            </div>
                            <div style="display:flex;align-items:center;gap:6px;flex-shrink:0;">
                                <span style="font-size:0.88rem;font-weight:700;color:#6b7280;white-space:nowrap;">${formatH(c.heures)}</span>
                                ${isFiche ? `
                                <button onclick="ouvrirModaleFiche('${c.nom.replace(/'/g, "\\'")}')"
                                    title="Fiche d'intervention"
                                    style="background:#fff7ed;border:1.5px solid #fed7aa;color:#ea580c;border-radius:7px;padding:5px 10px;font-size:0.75rem;font-weight:700;cursor:pointer;white-space:nowrap;">
                                    <i class="fas fa-file-alt" style="margin-right:3px;"></i>Fiche
                                </button>` : ''}
                                <label style="display:flex;align-items:center;gap:4px;cursor:pointer;padding:5px 9px;border-radius:7px;border:1px solid ${c.controle ? '#fbbf24' : '#e5e7eb'};background:${c.controle ? '#fef9c3' : '#f9fafb'};" title="Visite de contrôle qualité" id="controle-label-${key}">
                                    <input type="checkbox" ${c.controle ? 'checked' : ''}
                                        onchange="toggleControle('${prenom}',${ci},this.checked);const l=document.getElementById('controle-label-${key}');l.style.borderColor=this.checked?'#fbbf24':'#e5e7eb';l.style.background=this.checked?'#fef9c3':'#f9fafb';"
                                        style="accent-color:#eab308;width:14px;height:14px;">
                                    <i class="fas fa-clipboard-check" style="font-size:0.78rem;color:${c.controle ? '#d97706' : '#9ca3af'};"></i>
                                </label>
                                <button onclick="ajouterAnnotation('${prenom}',${ci})"
                                    style="background:#f0fdf4;border:1px solid #bbf7d0;color:#10b981;border-radius:7px;padding:5px 12px;font-size:0.8rem;font-weight:600;cursor:pointer;white-space:nowrap;">
                                    <i class="fas fa-plus" style="font-size:0.7rem;margin-right:3px;"></i>Annotation
                                </button>
                            </div>
                        </div>
                        <div id="annotations-${key}" style="display:flex;flex-direction:column;gap:4px;margin-top:6px;">
                            ${(c.annotations || []).map((a, ai) => renderAnnotationTag(prenom, ci, ai, a)).join('')}
                        </div>
                    </div>`;
            });
        }

        empHTML += `
            <div style="background:white;border:1.5px solid #e5e7eb;border-radius:12px;padding:1rem;margin-bottom:0.75rem;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:${emp.absence ? '0' : '0.5rem'};">
                    <span style="font-size:1rem;font-weight:700;color:#111827;">${nom}</span>
                    <span style="font-size:0.9rem;font-weight:700;color:#10b981;">${formatH(emp.total)}</span>
                </div>
                ${chantiersHTML}
            </div>`;
    }

    const nbChantiers = Object.values(planning.employes).reduce((s, e) => s + (e.chantiers || []).length, 0);

    const modal = document.createElement('div');
    modal.id = 'modal-review-planning';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:9999;display:flex;align-items:center;justify-content:center;padding:0.5rem;';
    modal.innerHTML = `
        <div style="background:white;border-radius:16px;width:100%;max-width:960px;max-height:97vh;display:flex;flex-direction:column;box-shadow:0 25px 80px rgba(0,0,0,0.3);overflow:hidden;">

            <div style="padding:1.25rem 1.5rem;background:linear-gradient(135deg,#f0fdf4,#dcfce7);border-bottom:1px solid #bbf7d0;display:flex;align-items:center;justify-content:space-between;gap:1rem;flex-shrink:0;">
                <div>
                    <div style="display:flex;align-items:center;gap:8px;margin-bottom:3px;">
                        <i class="fas fa-edit" style="color:#10b981;font-size:1rem;"></i>
                        <span style="font-size:1.05rem;font-weight:700;color:#111827;">Vérification du planning</span>
                    </div>
                    <div style="font-size:0.82rem;color:#6b7280;text-transform:capitalize;">${dateObj}</div>
                </div>
                <button onclick="document.getElementById('modal-review-planning').remove();planningEnCours=null;"
                    style="background:#f3f4f6;border:none;width:34px;height:34px;border-radius:50%;cursor:pointer;color:#6b7280;font-size:1rem;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                    <i class="fas fa-times"></i>
                </button>
            </div>

            <div style="padding:0.75rem 1.5rem;background:#fffbeb;border-bottom:1px solid #fef3c7;flex-shrink:0;display:flex;align-items:center;gap:8px;">
                <i class="fas fa-lightbulb" style="color:#f59e0b;font-size:0.85rem;flex-shrink:0;"></i>
                <span style="font-size:0.78rem;color:#92400e;">Ajoutez des <strong>annotations</strong> · Cochez <i class="fas fa-clipboard-check" style="color:#d97706;"></i> pour contrôle qualité · <i class="fas fa-file-alt" style="color:#ea580c;"></i> pour créer une fiche d'intervention</span>
            </div>

            <div style="padding:1.25rem 1.5rem;overflow-y:auto;flex:1;" id="review-body">
                <div style="font-size:0.8rem;color:#9ca3af;margin-bottom:1rem;">
                    ${Object.keys(planning.employes).length} employé${Object.keys(planning.employes).length > 1 ? 's' : ''} · ${nbChantiers} chantier${nbChantiers > 1 ? 's' : ''}
                </div>
                ${empHTML}
            </div>

            <div style="padding:1rem 1.5rem;border-top:1px solid #e5e7eb;display:flex;gap:0.75rem;flex-shrink:0;background:white;">
                <button onclick="publierPlanningDepuisReview()" id="btn-envoyer-planning"
                    style="flex:1;background:linear-gradient(135deg,#10b981,#059669);color:white;border:none;border-radius:10px;padding:0.8rem;font-weight:700;font-size:0.95rem;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;box-shadow:0 4px 12px rgba(16,185,129,0.3);">
                    <i class="fas fa-paper-plane"></i> Envoyer le planning
                </button>
                <button onclick="document.getElementById('modal-review-planning').remove();planningEnCours=null;"
                    style="background:#f3f4f6;color:#374151;border:none;border-radius:10px;padding:0.8rem 1.5rem;font-weight:600;font-size:0.88rem;cursor:pointer;">
                    Annuler
                </button>
            </div>
        </div>`;

    modal.addEventListener('click', e => {
        if (e.target === modal) { modal.remove(); planningEnCours = null; }
    });

    document.body.appendChild(modal);

    const feedback = document.getElementById('planning-import-feedback');
    if (feedback) feedback.style.display = 'none';
}

function renderAnnotationTag(prenom, ci, ai, texte) {
    const safePrenom = prenom.replace(/'/g, "\\'");
    return `
        <div style="display:flex;align-items:center;gap:4px;background:#fef2f2;border:1px solid #fecaca;border-radius:6px;padding:3px 8px;" id="ann-${prenom}-${ci}-${ai}">
            <i class="fas fa-circle-exclamation" style="color:#ef4444;font-size:0.65rem;flex-shrink:0;"></i>
            <input type="text" value="${escapeHtml(texte)}"
                onchange="modifierAnnotation('${safePrenom}', ${ci}, ${ai}, this.value)"
                placeholder="Décrivez l'annotation..."
                style="flex:1;border:none;background:transparent;font-size:0.75rem;color:#ef4444;font-style:italic;outline:none;min-width:0;">
            <button onclick="supprimerAnnotation('${safePrenom}', ${ci}, ${ai})"
                style="background:none;border:none;color:#fca5a5;cursor:pointer;font-size:0.75rem;flex-shrink:0;padding:0 2px;">
                <i class="fas fa-times"></i>
            </button>
        </div>`;
}

// Trouve les chantiers binômes correspondants (même nom de chantier, binôme = prenom)
function trouverChantiersBinomes(prenom, ci) {
    if (!planningEnCours) return [];
    const chantier = planningEnCours.employes[prenom]?.chantiers[ci];
    if (!chantier?.binome) return [];

    const binomePrenom = chantier.binome;
    const binomeEmp = planningEnCours.employes[binomePrenom];
    if (!binomeEmp) return [];

    const results = [];
    (binomeEmp.chantiers || []).forEach((c, ciBinome) => {
        // Même nom de chantier ET binôme = prenom
        if (c.nom === chantier.nom && c.binome === prenom) {
            results.push({ prenom: binomePrenom, ci: ciBinome });
        }
    });
    return results;
}

window.ajouterAnnotation = function (prenom, ci) {
    if (!planningEnCours?.employes[prenom]?.chantiers[ci]) return;
    const c = planningEnCours.employes[prenom].chantiers[ci];
    if (!c.annotations) c.annotations = [];
    const ai = c.annotations.length;
    c.annotations.push('');

    const container = document.getElementById(`annotations-${prenom}__${ci}`);
    if (container) {
        container.insertAdjacentHTML('beforeend', renderAnnotationTag(prenom, ci, ai, ''));
        const inputs = container.querySelectorAll('input[type=text]');
        if (inputs.length) {
            const newInput = inputs[inputs.length - 1];
            newInput.focus();

            // Propagation en temps réel aux binômes
            newInput.addEventListener('input', (e) => {
                const valeur = e.target.value;
                modifierAnnotation(prenom, ci, ai, valeur);

                trouverChantiersBinomes(prenom, ci).forEach(({ prenom: bp, ci: bci }) => {
                    const bc = planningEnCours.employes[bp]?.chantiers[bci];
                    if (!bc) return;
                    if (!bc.annotations) bc.annotations = [];
                    // Synchroniser à l'index ai
                    while (bc.annotations.length <= ai) bc.annotations.push('');
                    bc.annotations[ai] = valeur;
                    // Mettre à jour l'input du binôme si visible
                    const bContainer = document.getElementById(`annotations-${bp}__${bci}`);
                    if (bContainer) {
                        const bInputs = bContainer.querySelectorAll('input[type=text]');
                        if (bInputs[ai]) {
                            bInputs[ai].value = valeur;
                        } else {
                            // Ajouter le tag si pas encore présent
                            if (bc.annotations.length > bContainer.querySelectorAll('[id^="ann-"]').length) {
                                bContainer.insertAdjacentHTML('beforeend', renderAnnotationTag(bp, bci, ai, valeur));
                            }
                        }
                    }
                });
            });
        }
    }

    // Ajouter le slot annotation aux binômes aussi
    trouverChantiersBinomes(prenom, ci).forEach(({ prenom: bp, ci: bci }) => {
        const bc = planningEnCours.employes[bp]?.chantiers[bci];
        if (!bc) return;
        if (!bc.annotations) bc.annotations = [];
        while (bc.annotations.length <= ai) bc.annotations.push('');
        const bContainer = document.getElementById(`annotations-${bp}__${bci}`);
        if (bContainer && bContainer.querySelectorAll('[id^="ann-"]').length <= ai) {
            bContainer.insertAdjacentHTML('beforeend', renderAnnotationTag(bp, bci, ai, ''));
        }
    });
};

window.modifierAnnotation = function (prenom, ci, ai, valeur) {
    if (!planningEnCours?.employes[prenom]?.chantiers[ci]) return;
    planningEnCours.employes[prenom].chantiers[ci].annotations[ai] = valeur;
};

window.supprimerAnnotation = function (prenom, ci, ai) {
    if (!planningEnCours?.employes[prenom]?.chantiers[ci]) return;
    planningEnCours.employes[prenom].chantiers[ci].annotations.splice(ai, 1);

    // Propager la suppression aux binômes
    trouverChantiersBinomes(prenom, ci).forEach(({ prenom: bp, ci: bci }) => {
        const bc = planningEnCours.employes[bp]?.chantiers[bci];
        if (!bc) return;
        bc.annotations.splice(ai, 1);
        const bContainer = document.getElementById(`annotations-${bp}__${bci}`);
        if (bContainer) {
            bContainer.innerHTML = bc.annotations
                .map((a, newAi) => renderAnnotationTag(bp, bci, newAi, a)).join('');
        }
    });

    // Re-render annotations de ce chantier
    const container = document.getElementById(`annotations-${prenom}__${ci}`);
    if (container) {
        container.innerHTML = planningEnCours.employes[prenom].chantiers[ci].annotations
            .map((a, newAi) => renderAnnotationTag(prenom, ci, newAi, a)).join('');
    }
};

window.toggleControle = function (prenom, ci, checked) {
    if (!planningEnCours?.employes[prenom]?.chantiers[ci]) return;
    planningEnCours.employes[prenom].chantiers[ci].controle = checked;

    // Propager aux binômes
    trouverChantiersBinomes(prenom, ci).forEach(({ prenom: bp, ci: bci }) => {
        const bc = planningEnCours.employes[bp]?.chantiers[bci];
        if (!bc) return;
        bc.controle = checked;

        // Mettre à jour visuellement la checkbox du binôme
        const bKey = `${bp}__${bci}`;
        const bLabel = document.getElementById(`controle-label-${bKey}`);
        const bCheckbox = bLabel?.querySelector('input[type=checkbox]');
        const bIcon = bLabel?.querySelector('i');
        if (bCheckbox) bCheckbox.checked = checked;
        if (bLabel) {
            bLabel.style.borderColor = checked ? '#fbbf24' : '#e5e7eb';
            bLabel.style.background = checked ? '#fef9c3' : '#f9fafb';
        }
        if (bIcon) bIcon.style.color = checked ? '#d97706' : '#9ca3af';
    });
};

function afficherPopupConflitIndispo(conflits, planningDate) {
    document.getElementById('modal-conflit-indispo')?.remove();

    const jours = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    const mois = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
    const nomJour = jours[planningDate.getDay()];
    const labelDate = `${nomJour} ${planningDate.getDate()} ${mois[planningDate.getMonth()]} ${planningDate.getFullYear()}`;

    const modal = document.createElement('div');
    modal.id = 'modal-conflit-indispo';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:10000;display:flex;align-items:center;justify-content:center;padding:1rem;backdrop-filter:blur(4px);';

    modal.innerHTML = `
        <div style="background:white;border-radius:20px;max-width:420px;width:100%;box-shadow:0 25px 80px rgba(0,0,0,0.3);overflow:hidden;">
            <div style="background:linear-gradient(135deg,#ef4444,#dc2626);padding:1.5rem;text-align:center;">
                <div style="width:56px;height:56px;background:rgba(255,255,255,0.2);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 12px;">
                    <i class="fas fa-calendar-xmark" style="color:white;font-size:1.5rem;"></i>
                </div>
                <div style="color:white;font-size:1.1rem;font-weight:700;">Conflit d'indisponibilité</div>
                <div style="color:rgba(255,255,255,0.85);font-size:0.82rem;margin-top:4px;">${labelDate}</div>
            </div>
            <div style="padding:1.5rem;">
                <p style="color:#374151;font-size:0.9rem;line-height:1.6;margin-bottom:1rem;">
                    ${conflits.length === 1
            ? `<strong>${conflits[0]}</strong> a signalé ne pas être disponible ce jour.`
            : `Les employés suivants ont signalé ne pas être disponibles ce jour :`}
                </p>
                ${conflits.length > 1 ? `
                    <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:1rem;">
                        ${conflits.map(nom => `
                            <div style="display:flex;align-items:center;gap:8px;background:#fef2f2;border:1px solid #fca5a5;border-radius:8px;padding:8px 12px;">
                                <i class="fas fa-user-xmark" style="color:#b91c1c;font-size:0.85rem;flex-shrink:0;"></i>
                                <span style="font-size:0.9rem;font-weight:600;color:#b91c1c;">${nom}</span>
                            </div>`).join('')}
                    </div>` : ''}
                <div style="background:#fffbeb;border:1px solid #fcd34d;border-radius:10px;padding:10px 12px;margin-bottom:1.25rem;display:flex;gap:8px;align-items:flex-start;">
                    <i class="fas fa-triangle-exclamation" style="color:#d97706;flex-shrink:0;margin-top:1px;"></i>
                    <span style="font-size:0.82rem;color:#92400e;line-height:1.5;">Retirez ${conflits.length > 1 ? 'ces employés' : 'cet employé'} du planning ou contactez-${conflits.length > 1 ? 'les' : 'le/la'} pour confirmer la disponibilité avant de publier.</span>
                </div>
                <button onclick="document.getElementById('modal-conflit-indispo').remove()"
                    style="width:100%;background:linear-gradient(135deg,#ef4444,#dc2626);color:white;border:none;border-radius:10px;padding:0.85rem;font-weight:700;font-size:0.95rem;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;">
                    <i class="fas fa-arrow-left"></i> Retour au planning
                </button>
            </div>
        </div>`;

    document.body.appendChild(modal);
}

window.publierPlanningDepuisReview = async function () {
    if (!planningEnCours) return;

    // Synchroniser les annotations depuis les inputs
    document.querySelectorAll('#review-body input[type=text]').forEach(input => {
        const annEl = input.closest('[id^="ann-"]');
        if (!annEl) return;
        const id = annEl.id.replace('ann-', '');
        const lastDash1 = id.lastIndexOf('-');
        const lastDash2 = id.lastIndexOf('-', lastDash1 - 1);
        const ai = parseInt(id.substring(lastDash1 + 1));
        const ci = parseInt(id.substring(lastDash2 + 1, lastDash1));
        const prenom = id.substring(0, lastDash2);
        if (planningEnCours.employes[prenom]?.chantiers[ci]) {
            if (!planningEnCours.employes[prenom].chantiers[ci].annotations)
                planningEnCours.employes[prenom].chantiers[ci].annotations = [];
            planningEnCours.employes[prenom].chantiers[ci].annotations[ai] = input.value;
        }
    });

    // ── Vérification indisponibilités week-end ──
    const dateStr = planningEnCours.date; // 'YYYY-MM-DD'
    if (dateStr) {
        const [py, pm, pd] = dateStr.split('-').map(Number);
        const planningDate = new Date(py, pm - 1, pd);
        const dayOfWeek = planningDate.getDay(); // 0=dim, 6=sam

        if (dayOfWeek === 0 || dayOfWeek === 6) {
            // Utiliser getDoc/doc déjà importés en haut de dashboard.js
            const conflits = [];

            await Promise.all(
                Object.entries(planningEnCours.employes).map(async ([prenom, emp]) => {
                    if (emp.absence) return;
                    try {
                        const indispoRef = doc(db, 'employees', prenom, 'indisponibilites', 'weekends');
                        const snap = await getDoc(indispoRef);
                        if (snap.exists() && Array.isArray(snap.data().dates)) {
                            if (snap.data().dates.includes(dateStr)) {
                                const nom = emp.display || PRENOM_DISPLAY[prenom] || prenom.charAt(0).toUpperCase() + prenom.slice(1);
                                conflits.push(nom);
                            }
                        }
                    } catch (e) {
                        console.warn(`Impossible de vérifier indispos pour ${prenom}`, e);
                    }
                })
            );

            if (conflits.length > 0) {
                afficherPopupConflitIndispo(conflits, planningDate);
                return; // BLOQUANT — on n'envoie pas
            }
        }
    }

    // Animation bouton
    const btn = document.getElementById('btn-envoyer-planning');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Envoi en cours…`;
        btn.style.opacity = '0.85';
    }

    await publierPlanning(planningEnCours);
};

async function publierPlanning(planning) {
    const date = planning.date || null;
    if (!date) { showNotification('Date manquante', 'error'); return; }

    try {
        // Détecte si le planning existait déjà avant d'écraser
        const existingSnap = await getDoc(doc(db, 'plannings', date));
        const isUpdate = existingSnap.exists();

        const employesData = {};
        for (const [prenom, emp] of Object.entries(planning.employes)) {
            employesData[prenom] = {
                total: emp.total,
                absence: emp.absence || null,
                display: emp.display || null,
                chantiers: (emp.chantiers || []).map(c => ({
                    nom: c.nom,
                    heures: c.heures,
                    binome: c.binome || null,
                    binomeDisplay: c.binomeDisplay || null,
                    absence: c.absence || null,
                    annotations: (c.annotations || []).filter(a => a && a.trim().length > 0),
                    controle: c.controle || false
                }))
            };
        }

        await setDoc(doc(db, 'plannings', date), {
            date,
            importedAt: new Date(),
            source: 'dashboard-paste',
            annuleRemplace: true,
            employes: employesData
        });

        envoyerNotifPlanning(date, Object.keys(planning.employes).length, planning.employes, isUpdate);

        planningEnCours = null;
        const pasteZone = document.getElementById('planning-paste-zone');
        if (pasteZone) pasteZone.value = '';
        document.getElementById('planning-import-feedback')?.style && (document.getElementById('planning-import-feedback').style.display = 'none');
        document.getElementById('modal-import-planning')?.remove();
        document.getElementById('modal-review-planning')?.remove();

        afficherModalPlanningPublie(date, Object.keys(planning.employes).length);
        loadPlanning();

    } catch (e) {
        console.error('Erreur publication:', e);
        showNotification('Erreur : ' + e.message, 'error');
    }
}
function afficherModalPlanningPublie(date, nbEmployes) {
    const [y, m, d] = date.split('-').map(Number);
    const dateLabel = new Date(y, m - 1, d).toLocaleDateString('fr-FR', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
    const dateTitre = dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1);

    // Supprimer ancienne si présente
    document.getElementById('modal-planning-publie')?.remove();

    const modal = document.createElement('div');
    modal.id = 'modal-planning-publie';
    modal.style.cssText = `
        position:fixed;inset:0;
        background:rgba(0,0,0,0.7);
        z-index:10000;
        display:flex;align-items:center;justify-content:center;
        padding:1rem;
        opacity:0;
        transition:opacity 0.25s ease;
    `;

    modal.innerHTML = `
        <div id="modal-publie-card" style="
            background:white;
            border-radius:24px;
            width:100%;max-width:480px;
            overflow:hidden;
            box-shadow:0 30px 100px rgba(0,0,0,0.3);
            transform:translateY(40px) scale(0.96);
            transition:transform 0.35s cubic-bezier(0.34,1.56,0.64,1), opacity 0.25s ease;
            opacity:0;
        ">
            <!-- Bandeau vert animé -->
            <div style="
                background:linear-gradient(135deg,#10b981,#059669);
                padding:2.5rem 2rem 2rem;
                text-align:center;
                position:relative;
                overflow:hidden;
            ">
                <!-- Cercles décoratifs -->
                <div style="position:absolute;top:-30px;right:-30px;width:120px;height:120px;border-radius:50%;background:rgba(255,255,255,0.08);"></div>
                <div style="position:absolute;bottom:-20px;left:-20px;width:80px;height:80px;border-radius:50%;background:rgba(255,255,255,0.06);"></div>

                <!-- Icône avec animation pulse -->
                <div id="publie-icon" style="
                    background:white;
                    width:80px;height:80px;
                    border-radius:50%;
                    display:flex;align-items:center;justify-content:center;
                    margin:0 auto 1.25rem;
                    box-shadow:0 8px 25px rgba(0,0,0,0.15);
                    transform:scale(0);
                    transition:transform 0.4s cubic-bezier(0.34,1.56,0.64,1) 0.2s;
                ">
                    <i class="fas fa-paper-plane" style="color:#10b981;font-size:1.8rem;"></i>
                </div>

                <h2 style="color:white;font-size:1.5rem;font-weight:800;margin-bottom:0.4rem;text-shadow:0 1px 3px rgba(0,0,0,0.1);">
                    Planning envoyé !
                </h2>
                <p style="color:rgba(255,255,255,0.85);font-size:0.9rem;text-transform:capitalize;font-weight:500;">
                    ${dateTitre}
                </p>
            </div>

            <!-- Corps -->
            <div style="padding:1.75rem 2rem;">

                <!-- Stat employés -->
                <div style="
                    display:flex;align-items:center;justify-content:center;gap:0.75rem;
                    background:#f0fdf4;border:1.5px solid #bbf7d0;
                    border-radius:14px;padding:1rem 1.25rem;
                    margin-bottom:1.25rem;
                ">
                    <div style="background:#10b981;width:40px;height:40px;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                        <i class="fas fa-users" style="color:white;font-size:1rem;"></i>
                    </div>
                    <div>
                        <div style="font-size:1.2rem;font-weight:800;color:#065f46;">${nbEmployes} employé${nbEmployes > 1 ? 's' : ''}</div>
                        <div style="font-size:0.8rem;color:#6b7280;">notification${nbEmployes > 1 ? 's' : ''} envoyée${nbEmployes > 1 ? 's' : ''} via ntfy</div>
                    </div>
                </div>

                <!-- Info ntfy -->
                <div style="
                    display:flex;align-items:flex-start;gap:0.6rem;
                    background:#fffbeb;border:1.5px solid #fde68a;
                    border-radius:12px;padding:0.85rem 1rem;
                    margin-bottom:1.5rem;
                ">
                    <i class="fas fa-bell" style="color:#f59e0b;font-size:0.9rem;margin-top:2px;flex-shrink:0;"></i>
                    <span style="font-size:0.8rem;color:#92400e;line-height:1.5;">
                        Chaque employé concerné recevra une notification sur son téléphone avec le détail de sa journée.
                    </span>
                </div>

                <!-- Bouton fermer -->
                <button onclick="document.getElementById('modal-planning-publie').remove()" style="
                    width:100%;
                    background:linear-gradient(135deg,#10b981,#059669);
                    color:white;border:none;
                    border-radius:14px;
                    padding:1rem;
                    font-weight:700;font-size:1rem;
                    cursor:pointer;
                    box-shadow:0 4px 15px rgba(16,185,129,0.4);
                    transition:transform 0.15s, box-shadow 0.15s;
                    display:flex;align-items:center;justify-content:center;gap:8px;
                " onmouseover="this.style.transform='translateY(-1px)';this.style.boxShadow='0 6px 20px rgba(16,185,129,0.5)'"
                   onmouseout="this.style.transform='';this.style.boxShadow='0 4px 15px rgba(16,185,129,0.4)'">
                    <i class="fas fa-check"></i> Parfait !
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Séquence d'animation
    requestAnimationFrame(() => {
        modal.style.opacity = '1';
        const card = document.getElementById('modal-publie-card');
        if (card) {
            card.style.transform = 'translateY(0) scale(1)';
            card.style.opacity = '1';
        }
        setTimeout(() => {
            const icon = document.getElementById('publie-icon');
            if (icon) icon.style.transform = 'scale(1)';
        }, 150);
    });

    modal.addEventListener('click', e => {
        if (e.target === modal) modal.remove();
    });
}
async function envoyerNotifPlanning(date, nbEmployes, employes, isUpdate = false) {
    try {
        const [y, m, d] = date.split('-').map(Number);
        const dateLabel = new Date(y, m - 1, d).toLocaleDateString('fr-FR', {
            weekday: 'long', day: 'numeric', month: 'long'
        });

        const moisNum = m;
        const emojiSaison = moisNum >= 3 && moisNum <= 5 ? '🌸' :
            moisNum >= 6 && moisNum <= 8 ? '☀️' :
                moisNum >= 9 && moisNum <= 11 ? '🍂' : '❄️';

        const titre = 'Propre Eco Assistant';
        const corps = isUpdate
            ? `Ton planning du ${dateLabel} a été modifié. Consulte Propre Eco Assistant pour voir les changements. ${emojiSaison}`
            : `Ton planning du ${dateLabel} est disponible. Consulte Propre Eco Assistant pour le voir. ${emojiSaison}`;

        const promises = Object.keys(employes).map(async prenom => {
            const topic = `planning-${prenom}`;
            const response = await fetch(`https://ntfy.sh/${topic}`, {
                method: 'POST',
                headers: {
                    'Title': titre,
                    'Priority': 'default',
                    'Tags': isUpdate ? 'repeat' : 'calendar',
                    'Content-Type': 'text/plain; charset=utf-8'
                },
                body: corps
            });

            if (!response.ok) {
                console.error(`Erreur ntfy pour ${prenom}: ${response.status}`);
            } else {
                console.log(`✅ Notif envoyée → ${topic}`);
            }
        });

        await Promise.all(promises);
        console.log('✅ Toutes les notifs ntfy envoyées');
    } catch (e) {
        console.error('Erreur notif ntfy:', e);
    }
}



// ── État pagination + recherche ──
let allPlanningDocs = [];
let planningPage = 1;
const PLANNING_PER_PAGE = 7;
let planningSearchTerm = '';

async function chargerBandeauIndispos() {
    const bandeau = document.getElementById('bandeau-indispos');
    if (!bandeau) return;

bandeau.innerHTML = `
                <div style="display:flex;align-items:center;gap:10px;padding:12px 16px;background:#f0fdf4;border-radius:10px;">
                    <i class="fas fa-calendar-check" style="color:#10b981;font-size:15px;flex-shrink:0;"></i>
                    <span style="font-size:13px;color:#065f46;font-weight:500;">Aucune indisponibilité déclarée dans les 30 prochains jours.</span>
                </div>`;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const limite = new Date(today); limite.setDate(today.getDate() + 30);

    try {
        // Charger tous les employés
        const empSnap = await getDocs(collection(db, 'employees'));
        const resultats = []; // { dateStr, nom, jour }

        await Promise.all(empSnap.docs.map(async empDoc => {
            const prenom = empDoc.id;
            const nom = PRENOM_DISPLAY[prenom] || prenom.charAt(0).toUpperCase() + prenom.slice(1);
            try {
                const indispoRef = doc(db, 'employees', prenom, 'indisponibilites', 'weekends');
                const snap = await getDoc(indispoRef);
                if (!snap.exists() || !Array.isArray(snap.data().dates)) return;
                snap.data().dates.forEach(dateStr => {
                    const [y, m, d] = dateStr.split('-').map(Number);
                    const dt = new Date(y, m - 1, d);
                    if (dt >= today && dt <= limite) {
                        resultats.push({ dateStr, nom, dt });
                    }
                });
            } catch (e) { /* silencieux */ }
        }));

        if (resultats.length === 0) {
            bandeau.innerHTML = `
                <div style="display:flex;align-items:center;gap:10px;padding:12px 16px;background:#f0fdf4;border-radius:10px;border:1px solid #bbf7d0;">
                    <i class="fas fa-calendar-check" style="color:#10b981;font-size:15px;flex-shrink:0;"></i>
                    <span style="font-size:13px;color:#065f46;font-weight:500;">Aucune indisponibilité déclarée dans les 30 prochains jours.</span>
                </div>`;
            return;
        }

        // Grouper par date
        const parDate = {};
        resultats.forEach(({ dateStr, nom, dt }) => {
            if (!parDate[dateStr]) parDate[dateStr] = { dt, noms: [] };
            parDate[dateStr].noms.push(nom);
        });

        const joursStr = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
        const moisStr = ['jan', 'fév', 'mar', 'avr', 'mai', 'juin', 'juil', 'août', 'sep', 'oct', 'nov', 'déc'];

        const cardsHTML = Object.entries(parDate)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([dateStr, { dt, noms }]) => {
                const isSam = dt.getDay() === 6;
                const labelJour = `${joursStr[dt.getDay()]} ${dt.getDate()} ${moisStr[dt.getMonth()]}`;
                const badgeColor = isSam ? '#b91c1c' : '#9d174d';
                const badgeBg = isSam ? '#fee2e2' : '#fce7f3';
                const badgeLabel = isSam ? 'SAM' : 'DIM';
                return `
                    <div style="display:flex;align-items:flex-start;gap:10px;background:#fff;border:1.5px solid #fca5a5;border-radius:10px;padding:10px 14px;flex-shrink:0;min-width:180px;max-width:240px;">
                        <div style="flex-shrink:0;margin-top:1px;">
                            <span style="font-size:10px;font-weight:700;background:${badgeBg};color:${badgeColor};border-radius:5px;padding:2px 7px;display:block;text-align:center;margin-bottom:4px;">${badgeLabel}</span>
                            <div style="font-size:12px;font-weight:700;color:#111827;white-space:nowrap;">${labelJour}</div>
                        </div>
                        <div style="flex:1;min-width:0;border-left:2px solid #fca5a5;padding-left:10px;">
                            ${noms.map(n => `
                                <div style="display:flex;align-items:center;gap:5px;margin-bottom:3px;">
                                    <i class="fas fa-user-xmark" style="color:#b91c1c;font-size:10px;flex-shrink:0;"></i>
                                    <span style="font-size:12px;font-weight:600;color:#b91c1c;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${n}</span>
                                </div>`).join('')}
                        </div>
                    </div>`;
            }).join('');

        bandeau.innerHTML = `
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
                <div style="width:28px;height:28px;background:#fef2f2;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                    <i class="fas fa-calendar-xmark" style="color:#b91c1c;font-size:13px;"></i>
                </div>
                <span style="font-size:13px;font-weight:700;color:#111827;">Indisponibilités — 30 prochains jours</span>
                <span style="font-size:11px;background:#fef2f2;color:#b91c1c;border:1px solid #fca5a5;border-radius:20px;padding:2px 9px;font-weight:600;">${resultats.length} déclaration${resultats.length > 1 ? 's' : ''}</span>
            </div>
            <div style="display:flex;gap:8px;overflow-x:auto;padding-bottom:6px;scrollbar-width:thin;scrollbar-color:#fca5a5 transparent;">
                ${cardsHTML}
            </div>`;

    } catch (e) {
        console.error('Erreur bandeau indispos:', e);
        bandeau.innerHTML = `<div style="color:#ef4444;font-size:13px;">Erreur de chargement des indisponibilités.</div>`;
    }
}
async function loadPlanning() {
    const container = document.getElementById('planning-list-container');
    if (!container) return;
    container.innerHTML = `<div style="text-align:center;padding:2rem;color:#6b7280;font-size:14px;"><i class="fas fa-spinner fa-spin"></i> Chargement...</div>`;
    try {
        const { query: fsQuery, orderBy: fsOrderBy } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");
        const snap = await getDocs(fsQuery(collection(db, 'plannings'), fsOrderBy('date', 'desc')));
        allPlanningDocs = [];
        snap.forEach(docSnap => allPlanningDocs.push({ id: docSnap.id, ...docSnap.data() }));
        planningPage = 1;
        remplirSelectMois();
        renderPlanningList();
    } catch (e) {
        console.error('Erreur chargement plannings:', e);
        container.innerHTML = `<div style="color:#ef4444;padding:1rem;">Erreur : ${e.message}</div>`;
    }
}

window.togglePlanningCard = function (date) {
    const body = document.getElementById(`planning-body-${date}`);
    const chevron = document.getElementById(`chevron-${date}`);
    if (!body) return;
    const isOpen = body.style.display !== 'none';
    body.style.display = isOpen ? 'none' : 'block';
    if (chevron) chevron.style.transform = isOpen ? '' : 'rotate(180deg)';
};

window.rechercherPlanning = function (term) {
    planningSearchTerm = term.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    planningPage = 1;
    renderPlanningList();
};

function getPlanningFiltered() {
    let docs = allPlanningDocs;

    if (window._planningMoisFilter) {
        docs = docs.filter(d => d.date.startsWith(window._planningMoisFilter));
    }

    if (!planningSearchTerm) return docs;

    const norm = s => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    const term = norm(planningSearchTerm);

    return docs.filter(data => {
        // Recherche par date
        const [y, m, d] = data.date.split('-').map(Number);
        const dateFr = norm(new Date(y, m - 1, d).toLocaleDateString('fr-FR', {
            day: 'numeric', month: 'long', year: 'numeric'
        }));
        const dateCompact = `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}`;
        if (dateFr.includes(term) || data.date.includes(term) || dateCompact.includes(term)) return true;

        // Recherche par prénom employé
        const empMatch = Object.entries(data.employes || {}).some(([prenom, emp]) => {
            const nom = norm(emp.display || PRENOM_DISPLAY[prenom] || prenom);
            return nom.includes(term) || norm(prenom).includes(term);
        });
        if (empMatch) return true;

        // Recherche par chantier / annotation
        return Object.values(data.employes || {}).some(emp =>
            (emp.chantiers || []).some(c =>
                norm(c.nom).includes(term) ||
                (c.annotations || []).some(a => norm(a).includes(term))
            )
        );
    });
}

function renderPlanningList() {
    const container = document.getElementById('planning-list-container');
    const paginationEl = document.getElementById('planning-pagination');
    if (!container) return;

    const todayStr = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })();
    const allFiltered = getPlanningFiltered();
    const todayItems = allFiltered.filter(d => d.date === todayStr);
    const restItems = allFiltered.filter(d => d.date !== todayStr);
    const filtered = [...todayItems, ...restItems];
    const total = filtered.length;
    const totalPages = Math.ceil(total / PLANNING_PER_PAGE);
    const start = (planningPage - 1) * PLANNING_PER_PAGE;
    const pageData = filtered.slice(start, start + PLANNING_PER_PAGE);

    if (total === 0) {
        container.innerHTML = `<div style="text-align:center;padding:2rem;color:#6b7280;">Aucun planning trouvé.</div>`;
        if (paginationEl) paginationEl.style.display = 'none';
        return;
    }


    const formatH = h => {
        if (!h) return '0h';
        const hh = Math.floor(h); const mm = Math.round((h - hh) * 60);
        return mm === 0 ? `${hh}h` : `${hh}h${String(mm).padStart(2, '0')}`;
    };

    const highlight = text => {
        if (!planningSearchTerm || !text) return text;
        const re = new RegExp(`(${planningSearchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        return text.replace(re, '<mark style="background:#fef08a;border-radius:2px;padding:0 2px;">$1</mark>');
    };

    const absLabels = { CONGES_PAYES: 'Congés payés', ABSENCE_MALADIE: 'Absence maladie', ABSENT: 'Absent' };
    const autoOpen = !!planningSearchTerm;

    let html = '';
    pageData.forEach(data => {
        const date = data.date;
        const moisNum = parseInt(date.split('-')[1]);
        const emojiSaison = moisNum >= 3 && moisNum <= 5 ? '🌸' :
            moisNum >= 6 && moisNum <= 8 ? '☀️' :
                moisNum >= 9 && moisNum <= 11 ? '🍂' : '❄️';
        const nbEmployes = Object.keys(data.employes || {}).length;
        const importedAt = data.importedAt?.toDate?.() || null;
        const importLabel = importedAt
            ? `importé ${importedAt.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })} à ${importedAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
            : 'importé';

        const [y, m, d] = date.split('-').map(Number);
        const dateLabel = new Date(y, m - 1, d).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
        const isToday = date === new Date().toISOString().split('T')[0];
        const pillBg = isToday ? '#10b981' : '#6b7280';

        const empEntries = Object.entries(data.employes || {}).filter(([prenom, emp]) => {
            if (!planningSearchTerm) return true;
            const displayNorm = normalizeNom(emp.display || prenom);
            return displayNorm.includes(planningSearchTerm) ||
                prenom.includes(planningSearchTerm) ||
                (emp.chantiers || []).some(c =>
                    c.nom.toLowerCase().includes(planningSearchTerm) ||
                    (c.annotations || []).some(a => a.toLowerCase().includes(planningSearchTerm))
                );
        }).sort(([aPrenom, aEmp], [bPrenom, bEmp]) => {
            const aNom = (aEmp.display || PRENOM_DISPLAY[aPrenom] || aPrenom).toLowerCase();
            const bNom = (bEmp.display || PRENOM_DISPLAY[bPrenom] || bPrenom).toLowerCase();
            return aNom.localeCompare(bNom, 'fr');
        });

        const empCards = empEntries.map(([prenom, emp]) => {
            const nom = emp.display || PRENOM_DISPLAY[prenom] || prenom.charAt(0).toUpperCase() + prenom.slice(1);
            let borderColor = '#10b981', totalColor = '#10b981';
            if (emp.absence === 'CONGES_PAYES') { borderColor = '#3b82f6'; totalColor = '#3b82f6'; }
            else if (emp.absence === 'ABSENCE_MALADIE') { borderColor = '#ef4444'; totalColor = '#ef4444'; }
            else if (emp.absence === 'ABSENT') { borderColor = '#9ca3af'; totalColor = '#9ca3af'; }

            let chantiersHTML = '';
            if (emp.absence) {
                chantiersHTML = `<div style="font-size:0.75rem;color:${borderColor};font-style:italic;margin-top:0.25rem;">${absLabels[emp.absence] || emp.absence}</div>`;
            } else {
                const chantiers = planningSearchTerm
                    ? (emp.chantiers || []).filter(c =>
                        c.nom.toLowerCase().includes(planningSearchTerm) ||
                        (c.annotations || []).some(a => a.toLowerCase().includes(planningSearchTerm)) ||
                        prenom.includes(planningSearchTerm) ||
                        normalizeNom(emp.display || prenom).includes(planningSearchTerm)
                    )
                    : (emp.chantiers || []);

                chantiersHTML = chantiers.map(c => {
                    const annotations = (c.annotations || []).filter(a => a && a.trim());
                    const binomeLabel = c.binomeDisplay || (c.binome ? (PRENOM_DISPLAY[c.binome] || c.binome.charAt(0).toUpperCase() + c.binome.slice(1)) : null); return `
                        <div style="padding:3px 0;border-bottom:1px solid #f3f4f6;">
                            <div style="display:flex;justify-content:space-between;gap:4px;">
                                <span style="font-size:0.73rem;color:#374151;flex:1;line-height:1.3;">${highlight(c.nom)}</span>
                                <span style="font-size:0.72rem;font-weight:600;color:#6b7280;white-space:nowrap;">${formatHeuresFactu(c.heures)}</span>
                            </div>
                            ${binomeLabel ? `<div style="font-size:0.68rem;color:#9ca3af;margin-top:1px;"><i class="fas fa-user-friends"></i> avec ${highlight(binomeLabel)}</div>` : ''}
                            ${annotations.map(a => `<div style="color:#ef4444;font-style:italic;font-size:0.68rem;margin-top:1px;">• ${highlight(a)}</div>`).join('')}
                            ${c.controle ? `<span style="display:inline-flex;align-items:center;gap:2px;background:#fef9c3;color:#a16207;border-radius:4px;padding:1px 5px;font-size:0.65rem;font-weight:700;margin-top:2px;"><i class="fas fa-clipboard-check" style="font-size:0.6rem;"></i> contrôle</span>` : ''}
                        </div>`;
                }).join('');

                if (!chantiersHTML) chantiersHTML = '<div style="color:#9ca3af;font-size:0.73rem;padding:2px 0;">Aucun chantier</div>';
            }

            return `
                <div style="background:white;border:1.5px solid #e5e7eb;border-radius:10px;padding:0.7rem;border-left:3px solid ${borderColor};">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.35rem;">
                        <span style="font-size:0.82rem;font-weight:700;color:#111827;">${highlight(nom)}</span>
                        <span style="font-size:0.78rem;font-weight:700;color:${totalColor};">${formatHeuresFactu(emp.total || 0)}</span>
                    </div>
                    ${chantiersHTML}
                </div>`;
        }).join('');

        html += `
            <div style="background:white;border:1.5px solid #e5e7eb;border-radius:14px;overflow:hidden;margin-bottom:0.75rem;box-shadow:0 1px 4px rgba(0,0,0,0.05);">
                <div style="padding:0.85rem 1.1rem;display:flex;align-items:center;justify-content:space-between;cursor:pointer;"
                     onclick="togglePlanningCard('${date}')">
                    <div style="display:flex;align-items:center;gap:0.6rem;">
                        <div style="background:${pillBg};color:white;padding:3px 10px;border-radius:20px;font-size:0.78rem;font-weight:700;white-space:nowrap;">
                            ${date.split('-').reverse().slice(0, 2).join(' ')}
                        </div>
                        <div>
                            <div style="font-size:0.88rem;font-weight:600;color:#111827;text-transform:capitalize;">${dateLabel}</div>
                            <div style="font-size:0.72rem;color:#9ca3af;">${nbEmployes} employés · ${importLabel}</div>
                        </div>
                    </div>
                    <div style="display:flex;align-items:center;gap:0.5rem;">
                        <button onclick="event.stopPropagation();supprimerPlanning('${date}')"
                            style="background:#fef2f2;color:#ef4444;border:1px solid #fecaca;border-radius:6px;padding:4px 8px;font-size:0.72rem;cursor:pointer;">
                            <i class="fas fa-trash"></i>
                        </button>
                        <i class="fas fa-chevron-down" id="chevron-${date}" style="color:#9ca3af;font-size:0.75rem;transition:transform 0.2s;${autoOpen ? 'transform:rotate(180deg);' : ''}"></i>
                    </div>
                </div>
                <div id="planning-body-${date}" style="display:${autoOpen ? 'block' : 'none'};padding:0.75rem 1rem;border-top:1px solid #f3f4f6;background:#fafafa;">
                    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:0.6rem;">
                        ${empCards}
                    </div>
                </div>
            </div>`;
    });

    container.innerHTML = html;

    if (!paginationEl) return;
    if (totalPages <= 1) {
        paginationEl.style.display = 'none';
    } else {
        paginationEl.style.display = 'flex';
        const startIdx = start + 1;
        const endIdx = Math.min(start + PLANNING_PER_PAGE, total);
        paginationEl.innerHTML = `
            <div class="pagination-info">Affichage de ${startIdx} à ${endIdx} sur ${total} planning${total > 1 ? 's' : ''}</div>
            <div class="pagination-controls">
                <button class="btn-pagination" ${planningPage === 1 ? 'disabled' : ''} onclick="changerPagePlanning(-1)">
                    <i class="fas fa-chevron-left"></i> Précédent
                </button>
                <div class="page-numbers">
                    ${Array.from({ length: totalPages }, (_, i) => i + 1).map(i =>
            `<button class="page-number ${i === planningPage ? 'active' : ''}" onclick="allerPagePlanning(${i})">${i}</button>`
        ).join('')}
                </div>
                <button class="btn-pagination" ${planningPage === totalPages ? 'disabled' : ''} onclick="changerPagePlanning(1)">
                    Suivant <i class="fas fa-chevron-right"></i>
                </button>
            </div>`;
    }
}

window.changerPagePlanning = function (delta) {
    const totalPages = Math.ceil(getPlanningFiltered().length / PLANNING_PER_PAGE);
    const newPage = planningPage + delta;
    if (newPage >= 1 && newPage <= totalPages) {
        planningPage = newPage;
        renderPlanningList();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
};

window.allerPagePlanning = function (page) {
    planningPage = page;
    renderPlanningList();
    window.scrollTo({ top: 0, behavior: 'smooth' });
};
function remplirSelectMois() {
    const select = document.getElementById('planning-filter-mois');
    if (!select) return;

    const moisSet = new Set();
    allPlanningDocs.forEach(d => {
        const [y, m] = d.date.split('-');
        moisSet.add(`${y}-${m}`);
    });

    const moisTries = [...moisSet].sort((a, b) => b.localeCompare(a));
    const currentVal = select.value;

    select.innerHTML = '<option value="">Tous les mois</option>';
    moisTries.forEach(ym => {
        const [y, m] = ym.split('-').map(Number);
        const label = new Date(y, m - 1, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
        const opt = document.createElement('option');
        opt.value = ym;
        opt.textContent = label.charAt(0).toUpperCase() + label.slice(1);
        if (ym === currentVal) opt.selected = true;
        select.appendChild(opt);
    });
}

window.filtrerPlanningParMois = function (mois) {
    const btn = document.getElementById('btn-supprimer-mois');
    if (btn) btn.style.display = mois ? 'inline-flex' : 'none';
    planningSearchTerm = '';
    const searchInput = document.getElementById('planning-search');
    if (searchInput) searchInput.value = '';

    if (!mois) {
        // Réinitialiser le filtre
        planningPage = 1;
        renderPlanningList();
        return;
    }

    // Filtrer par mois sélectionné
    const filtered = allPlanningDocs.filter(d => d.date.startsWith(mois));
    const total = filtered.length;
    const totalPages = Math.ceil(total / PLANNING_PER_PAGE);
    planningPage = 1;

    // Override temporaire du filtre
    window._planningMoisFilter = mois;
    renderPlanningList();
};

window.supprimerPlanningsMois = async function () {
    const mois = document.getElementById('planning-filter-mois')?.value;
    if (!mois) return;

    const [y, m] = mois.split('-').map(Number);
    const label = new Date(y, m - 1, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    const planningsASupprimer = allPlanningDocs.filter(d => d.date.startsWith(mois));

    if (planningsASupprimer.length === 0) {
        showNotification('Aucun planning pour ce mois', 'error');
        return;
    }

    showConfirmModal({
        title: `Supprimer ${planningsASupprimer.length} planning${planningsASupprimer.length > 1 ? 's' : ''} ?`,
        message: `Tous les plannings de ${label} seront définitivement supprimés. Cette action est irréversible.`,
        confirmText: 'Supprimer',
        cancelText: 'Annuler',
        onConfirm: async () => {
            try {
                await Promise.all(planningsASupprimer.map(p => deleteDoc(doc(db, 'plannings', p.date))));
                showNotification(`${planningsASupprimer.length} planning${planningsASupprimer.length > 1 ? 's' : ''} supprimé${planningsASupprimer.length > 1 ? 's' : ''}`, 'success');
                document.getElementById('planning-filter-mois').value = '';
                document.getElementById('btn-supprimer-mois').style.display = 'none';
                window._planningMoisFilter = null;
                loadPlanning();
            } catch (e) {
                showNotification('Erreur lors de la suppression', 'error');
            }
        }
    });
};

window.supprimerPlanning = async function (date) {
    showConfirmModal({
        title: `Supprimer le planning du ${date} ?`,
        message: 'Cette action est irréversible.',
        confirmText: 'Supprimer',
        cancelText: 'Annuler',
        onConfirm: async () => {
            try {
                await deleteDoc(doc(db, 'plannings', date));
                showNotification('Planning supprimé', 'success');
                loadPlanning();
            } catch (e) {
                showNotification('Erreur lors de la suppression', 'error');
            }
        }
    });
};

function initPlanningTab() {
    planningEnCours = null;
    loadPlanning();
    chargerBandeauIndispos();
}
window.hideFacturationView = hideFacturationView;
window.loadFacturationData = loadFacturationData;
window.openChiffrageModal = openChiffrageModal;
window.calculerTotalDevis = calculerTotalDevis;
window.saveChiffrage = saveChiffrage;
window.openPhotoModal = openPhotoModal;
window.closePhotoModal = closePhotoModal;
window.photoModalPrev = photoModalPrev;
window.photoModalNext = photoModalNext;