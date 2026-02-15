// Variables globales
const FAVORITE_KEY = "favoriteEmployee";
const SAVED_SESSION_KEY = "savedEmployeeSession";
let currentEmployee = null;
let currentAction = null;
let pinCode = '';
const maxPinLength = 4;

const employees = [
    { name: "Dylan", sheet: "https://docs.google.com/spreadsheets/d/19b3P7ZG2ZsCREH2r2x-sAFRjCcwHW553_aCVzxFcDIY/edit?gid=0#gid=0", code: "1412", id: "dylan" },
    { name: "Oceane", sheet: "https://docs.google.com/spreadsheets/d/1sHQFYH586g2PPFY8cTANA6kqSP_vyfBREMk5lGfDbeA/edit?usp=sharing", code: "2103", id: "oceane" },
    { name: "Samuel", sheet: "https://docs.google.com/spreadsheets/d/1ZrJ3V-m8WIOZFgZ0Cta8PPYWjRNUKW1oY1zCZ_GLDxg/edit?usp=sharing", code: "1202", id: "samuel" },
    { name: "Jeremie", sheet: "https://docs.google.com/spreadsheets/d/1x-8swb0QjQ2pbZUlzm5YGErUl951-35zgCsT46D0jTA/edit?usp=sharing", code: "1810", id: "jeremie" },
    { name: "Carlos", sheet: "https://docs.google.com/spreadsheets/d/1m8jp4xT1N5Bg-PmnyXGNSNtbMoo5FByK3p3fua6loSA/edit?usp=sharing", code: "1234", id: "carlos" },
    { name: "Sandra", sheet: "https://docs.google.com/spreadsheets/d/1_Scic1PPbfk7MEbcSiJvLKzEuJA0iMUTl6763SBh3lA/edit?usp=sharing", code: "sp12", id: "sandra" },
    { name: "Manon", sheet: "https://docs.google.com/spreadsheets/d/1_bYkzAZXtjDl9r7I7zdNr0kqYcdlQ9HZP9dl5AHLZSI/edit?usp=sharing", code: "1306", id: "manon" },
    { name: "Stephane", sheet: "https://docs.google.com/spreadsheets/d/1TEOI2z5j4dqBrC9aEkNoLvJzUs3ssgZJaX-a0t8wW6c/edit?usp=sharing", code: "1272", id: "stephane" },
    { name: "Isabelle", sheet: "https://docs.google.com/spreadsheets/d/1bL8XVwxaTP0GU7GAXJV5n0ooTiL2AcEUNdE2i4H6uFI/edit?usp=sharing", code: "3636", id: "isabelle" },
    { name: "Caroline", sheet: "https://docs.google.com/spreadsheets/d/1TfmZmRjhqZ09d8aiIjFtudszg2kyQnIktvTWIr-KpZc/edit?usp=sharing", code: "2604", id: "caroline" },
    { name: "Nadjet", sheet: "https://docs.google.com/spreadsheets/d/1EzjtqScNUVD-dpbgm3XCiJdhQloOgTlM1Q1f1wV6-sA/edit?usp=sharing", code: "1234", id: "nadjet" },
    { name: "Remy", sheet: "", code: "0582", id: "remy" },
    { name: "Maxime", sheet: "", code: "0808", id: "maxime" },
    { name: "Shana", sheet: "", code: "0308", id: "shana" }
];

// Elements DOM
let container, modal, modalTitle, modalContentEl, pinDots, errorMessage;

// Initialisation au chargement du DOM
document.addEventListener('DOMContentLoaded', function () {
    initDOMElements();
    initNavigation();
    initNumericKeyboard();
    initModalEvents();
    checkSavedSession();
    loadEmployees();
    registerServiceWorker();
});

// Initialiser les elements DOM
function initDOMElements() {
    container = document.getElementById('employeeList');
    modal = document.getElementById('codeModal');
    modalTitle = document.getElementById('modalTitle');
    modalContentEl = document.querySelector('.modal-content');
    pinDots = document.querySelectorAll('.pin-dot');
    errorMessage = document.getElementById('errorMessage');
}

// Initialiser la navigation mobile
function initNavigation() {
    const hamburgerBtn = document.querySelector('.hamburger-btn');
    const sidebar = document.querySelector('.sidebar-menu');
    const overlay = document.querySelector('.sidebar-overlay');
    const closeBtn = document.querySelector('.sidebar-close');
    const sidebarLinks = document.querySelectorAll('.sidebar-nav a');

    function openSidebar() {
        hamburgerBtn.classList.add('active');
        sidebar.classList.add('active');
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeSidebar() {
        hamburgerBtn.classList.remove('active');
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    hamburgerBtn.addEventListener('click', () => {
        if (sidebar.classList.contains('active')) {
            closeSidebar();
        } else {
            openSidebar();
        }
    });

    closeBtn.addEventListener('click', closeSidebar);
    overlay.addEventListener('click', closeSidebar);

    sidebarLinks.forEach(link => {
        link.addEventListener('click', () => {
            closeSidebar();
        });
    });

    // Fermer avec Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && sidebar.classList.contains('active')) {
            closeSidebar();
        }
    });
}
// Initialiser le clavier numerique
function initNumericKeyboard() {
    document.querySelectorAll('.num-key[data-num]').forEach(btn => {
        btn.addEventListener('click', function () {
            const num = this.dataset.num;
            addDigit(num);
        });
    });

    document.getElementById('backspaceKey').addEventListener('click', removeDigit);
    document.getElementById('cancelKeyboard').addEventListener('click', closeModal);
}

// Initialiser les evenements de la modale
function initModalEvents() {
    modal.addEventListener('click', function (e) {
        if (e.target === modal) {
            closeModal();
        }
    });
}

// Verifier et rediriger automatiquement si session sauvegardee
function checkSavedSession() {
    const savedSession = localStorage.getItem(SAVED_SESSION_KEY);

    if (savedSession) {
        try {
            const sessionData = JSON.parse(savedSession);
            const { employeeId, employeeName, timestamp } = sessionData;

            const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
            const isSessionValid = (Date.now() - timestamp) < thirtyDaysInMs;

            if (isSessionValid && employeeId) {
                console.log('Session valide trouvee pour:', employeeName);
                showNotification(`Connexion automatique en cours pour ${employeeName}...`, 'info');
                
                setTimeout(() => {
                    window.location.href = `heures.html?employee=${employeeId}`;
                }, 800);
                return true;
            } else {
                console.log('Session expiree, suppression');
                localStorage.removeItem(SAVED_SESSION_KEY);
            }
        } catch (error) {
            console.error('Erreur lors de la lecture de la session:', error);
            localStorage.removeItem(SAVED_SESSION_KEY);
        }
    }
    return false;
}

// Generation des initiales
function getInitials(name) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
}

// Chargement des employes
function loadEmployees() {
    const favoriteName = localStorage.getItem(FAVORITE_KEY);

    if (favoriteName) {
        employees.sort((a, b) => a.name === favoriteName ? -1 : b.name === favoriteName ? 1 : 0);
    }

    employees.forEach((emp, index) => {
        const card = document.createElement('div');
        card.className = `employee-card ${emp.name === favoriteName ? 'favorite' : ''}`;
        card.style.animationDelay = `${(index % 6) * 0.1}s`;

        let ribbonHTML = '';
        if (emp.name === favoriteName) {
            ribbonHTML = '<div class="ribbon"><i class="fas fa-star"></i> Favori</div>';
        }

        card.innerHTML = `
            ${ribbonHTML}
            <div class="employee-avatar">
                ${getInitials(emp.name)}
            </div>
            <div class="employee-name">${emp.name}</div>
            <div class="btn-group">
                <button class="access-btn secondary" onclick="window.openAccessModal('${emp.name}', 'hours')">
                    <i class="fas fa-clock"></i>
                    Mes heures
                </button>
                <button class="fav-btn ${emp.name === favoriteName ? 'active' : ''}" 
                        onclick="window.toggleFavorite('${emp.name}')">
                    ${emp.name === favoriteName ? '<i class="fas fa-star"></i>' : '<i class="far fa-star"></i>'}
                </button>
            </div>
        `;

        container.appendChild(card);
    });
}
// Debug localStorage
window.debugSession = function() {
    console.log('=== DEBUG SESSION ===');
    console.log('Favori actuel:', localStorage.getItem(FAVORITE_KEY));
    console.log('Session sauvegardee:', localStorage.getItem(SAVED_SESSION_KEY));
    
    const session = localStorage.getItem(SAVED_SESSION_KEY);
    if (session) {
        const data = JSON.parse(session);
        console.log('Donnees session:', data);
        console.log('Age session (jours):', (Date.now() - data.timestamp) / (24 * 60 * 60 * 1000));
    }
};

window.clearSession = function() {
    localStorage.removeItem(SAVED_SESSION_KEY);
    console.log('Session supprimee');
};

// Ouvrir la modale d'acces
window.openAccessModal = function (employeeName, action) {
    currentEmployee = employees.find(emp => emp.name === employeeName);
    currentAction = action;

    ;
    modalTitle.textContent = `Code d'acces - ${employeeName}`;

    modal.style.display = 'block';
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
};

// Basculer le favori
window.toggleFavorite = function (employeeName) {
    const currentFavorite = localStorage.getItem(FAVORITE_KEY);

    if (currentFavorite === employeeName) {
        localStorage.removeItem(FAVORITE_KEY);
        showNotification('Favori supprime', 'info');
    } else {
        localStorage.setItem(FAVORITE_KEY, employeeName);
        showNotification(`${employeeName} défini comme favori`, 'success');
    }

    setTimeout(() => location.reload(), 500);
};

// Ajouter un chiffre
function addDigit(digit) {
    if (pinCode.length < maxPinLength) {
        pinCode += digit;
        updatePinDisplay();

        if (navigator.vibrate) {
            navigator.vibrate(10);
        }

        if (pinCode.length === maxPinLength) {
            setTimeout(validateCode, 300);
        }
    }
}

// Retirer un chiffre
function removeDigit() {
    if (pinCode.length > 0) {
        pinCode = pinCode.slice(0, -1);
        updatePinDisplay();
        hideError();
    }
}

// Mettre a jour l'affichage des points
function updatePinDisplay() {
    pinDots.forEach((dot, index) => {
        if (index < pinCode.length) {
            dot.classList.add('filled');
        } else {
            dot.classList.remove('filled');
        }
    });
}

// Afficher l'erreur
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'flex';
    modalContentEl.classList.add('error');

    setTimeout(() => {
        modalContentEl.classList.remove('error');
    }, 500);
}

// Masquer l'erreur
function hideError() {
    errorMessage.style.display = 'none';
}

// Valider le code
function validateCode() {
    if (!currentEmployee || pinCode.length !== maxPinLength) return;

    modalContentEl.classList.add('verifying');
    hideError();

    setTimeout(() => {
        modalContentEl.classList.remove('verifying');

        if (pinCode === currentEmployee.code) {
            modalContentEl.classList.add('success');
            showNotification(`Accès autorisé pour ${currentEmployee.name}`, 'success');

            const favoriteName = localStorage.getItem(FAVORITE_KEY);
            const isFavorite = favoriteName === currentEmployee.name;

            console.log('Verification favori:', {
                employeeName: currentEmployee.name,
                favoriteName: favoriteName,
                isFavorite: isFavorite,
                action: currentAction
            });

            if (isFavorite && currentAction === 'hours') {
                const sessionData = {
                    employeeId: currentEmployee.id,
                    employeeName: currentEmployee.name,
                    timestamp: Date.now()
                };
                
                localStorage.setItem(SAVED_SESSION_KEY, JSON.stringify(sessionData));
                console.log('Session sauvegardee:', sessionData);
                
                showNotification('Session sauvegardee ! Prochaine connexion automatique', 'success');
            }

            setTimeout(() => {
                if (currentAction === 'sheet') {
                    window.open(currentEmployee.sheet, '_blank');
                    closeModal();
                } else if (currentAction === 'hours') {
                    window.location.href = `heures.html?employee=${currentEmployee.id}`;
                }
            }, 1200);
        } else {
            showError('Code incorrect');
            pinCode = '';
            updatePinDisplay();

            if (navigator.vibrate) {
                navigator.vibrate([100, 50, 100]);
            }
        }
    }, 1000);
}

// Fermer la modale
function closeModal() {
    modal.classList.remove('show');
    setTimeout(() => {
        modal.style.display = 'none';
        pinCode = '';
        updatePinDisplay();
        hideError();
        currentEmployee = null;
        currentAction = null;
        modalContentEl.classList.remove('success', 'verifying', 'error');
    }, 300);
}

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
        z-index: 10001;
        font-weight: 600;
        animation: slideInRight 0.3s ease-out;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.2);
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

// Service Worker
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('../service-worker.js')
            .then(reg => console.log('Service Worker enregistre', reg))
            .catch(err => console.error('Erreur Service Worker', err));
    }
}