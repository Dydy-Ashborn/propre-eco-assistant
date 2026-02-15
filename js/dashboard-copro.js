import { getAllCoproprietes, addCopropriete, updateCopropriete, deleteCopropriete } from './firebase-copro.js';

const COPROS_PER_PAGE = 12;
let currentCoproPage = 1;
let currentCoproId = null;
let allCopros = [];
let currentFilter = 'all';


function getFilteredCopros() {
    const searchTerm = document.getElementById('searchCopro')?.value.toLowerCase() || '';
    
    let filtered = allCopros.filter(c => 
        c.nom?.toLowerCase().includes(searchTerm) ||
        c.adresse?.toLowerCase().includes(searchTerm) ||
        c.code?.toLowerCase().includes(searchTerm)
    );
    
    
    if (currentFilter === 'no-procedures') {
        filtered = filtered.filter(c => !c.procedures || c.procedures.trim().length === 0);
    } else if (currentFilter === 'no-code') {
        filtered = filtered.filter(c => !c.code || c.code.trim().length === 0);
    } else if (currentFilter === 'incomplete') {
        filtered = filtered.filter(c => 
            (!c.procedures || c.procedures.trim().length === 0) ||
            (!c.code || c.code.trim().length === 0)
        );
    }
    
    return filtered;
}

export async function initCoproManagement() {
    const addBtn = document.getElementById('addCoproBtn');
    const modal = document.getElementById('coproModal');
    const closeBtn = modal?.querySelector('.close');
    const cancelBtn = document.getElementById('cancelBtn');
    const form = document.getElementById('coproForm');
    const searchInput = document.getElementById('searchCopro');

    if (!addBtn || !modal) {
        console.error('Elements manquants pour la gestion copro');
        return;
    }

    addBtn.removeEventListener('click', openModal);
    addBtn.addEventListener('click', () => openModal());
    
    if (closeBtn) {
        closeBtn.removeEventListener('click', closeModal);
        closeBtn.addEventListener('click', closeModal);
    }
    
    if (cancelBtn) {
        cancelBtn.removeEventListener('click', closeModal);
        cancelBtn.addEventListener('click', closeModal);
    }
    
    if (form) {
        form.removeEventListener('submit', handleSubmit);
        form.addEventListener('submit', handleSubmit);
    }
    
    if (searchInput) {
        searchInput.removeEventListener('input', applyFilters);
        searchInput.addEventListener('input', applyFilters);
    }
    
    document.querySelectorAll('.filter-pill').forEach(pill => {
        pill.removeEventListener('click', handleFilterClick);
        pill.addEventListener('click', handleFilterClick);
    });

    await loadCopros();
}
async function loadCopros() {
    const loadingEl = document.getElementById('loading-copro');
    const contentEl = document.getElementById('content-copro');
    
    if (loadingEl) loadingEl.style.display = 'flex';
    if (contentEl) contentEl.style.display = 'none';
    
    try {
        allCopros = await getAllCoproprietes();
        currentCoproPage = 1;
        const filtered = getFilteredCopros();
        renderCopros(filtered);
        if (loadingEl) loadingEl.style.display = 'none';
        if (contentEl) contentEl.style.display = 'grid';
    } catch (error) {
        console.error('Erreur chargement copros:', error);
        if (loadingEl) {
            loadingEl.innerHTML = `
                <i class="fas fa-exclamation-circle"></i>
                <p>Erreur de chargement</p>
            `;
        }
    }
}
function handleSearch(e) {
    applyFilters();
}

function renderCopros(copros) {
    const grid = document.getElementById('content-copro');
    if (!grid) return;
    
    const counter = document.getElementById('coproCounter');
    if (counter) {
        counter.textContent = `${copros.length} copropriété${copros.length > 1 ? 's' : ''}`;
    }
    
    if (copros.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 3rem;">
                <i class="fas fa-inbox" style="font-size: 3rem; color: #ccc; margin-bottom: 1rem;"></i>
                <p style="color: #666;">Aucune copropriété trouvée</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = copros.map(copro => {
        const hasProcedures = copro.procedures && copro.procedures.trim().length > 0;
        const hasCode = copro.code && copro.code.trim().length > 0;
        
        return `
            <div class="copro-card ${!hasProcedures || !hasCode ? 'copro-card--incomplete' : ''}" data-id="${copro.id}">
                <div class="copro-header">
                    <h3>${copro.nom}</h3>
                    <div class="copro-actions">
                        <button class="btn-icon edit-copro" title="Modifier" data-id="${copro.id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon delete-copro" title="Supprimer" data-id="${copro.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                
                <p class="copro-adresse">
                    <i class="fas fa-map-marker-alt"></i> ${copro.adresse}
                </p>
                
                <div class="copro-badges">
                    <span class="copro-badge ${hasCode ? 'copro-badge--success' : 'copro-badge--warning'}">
                        <i class="fas fa-${hasCode ? 'check-circle' : 'exclamation-circle'}"></i>
                        Code : ${hasCode ? copro.code : 'Non défini'}
                    </span>
                    <span class="copro-badge ${hasProcedures ? 'copro-badge--success' : 'copro-badge--warning'}">
                        <i class="fas fa-${hasProcedures ? 'check-circle' : 'exclamation-circle'}"></i>
                        Procédures : ${hasProcedures ? 'Oui' : 'Non'}
                    </span>
                </div>
            </div>
        `;
    }).join('');

    grid.querySelectorAll('.edit-copro').forEach(btn => {
        btn.addEventListener('click', () => {
            const coproId = btn.dataset.id;
            const copro = copros.find(c => c.id === coproId);
            if (copro) openModal(copro);
        });
    });

    grid.querySelectorAll('.delete-copro').forEach(btn => {
        btn.addEventListener('click', () => {
            const coproId = btn.dataset.id;
            showDeleteModal(coproId);
        });
    });
}

function showDeleteModal(id) {
    const copro = allCopros.find(c => c.id === id);
    if (!copro) return;
    
    const modalHTML = `
        <div class="delete-confirm-modal show">
            <div class="delete-confirm-overlay"></div>
            <div class="delete-confirm-content">
                <div class="delete-confirm-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <h3>Supprimer la copropriété ?</h3>
                <p><strong>${copro.nom}</strong></p>
                <p class="delete-confirm-warning">Cette action est irréversible</p>
                <div class="delete-confirm-actions">
                    <button class="btn btn-secondary" onclick="this.closest('.delete-confirm-modal').remove()">
                        <i class="fas fa-times"></i> Annuler
                    </button>
                    <button class="btn btn-danger" onclick="confirmDeleteCopro('${id}')">
                        <i class="fas fa-trash"></i> Supprimer
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}


function applyFilters() {
    const filtered = getFilteredCopros();
    renderCopros(filtered);
}

function setFilter(filter) {
    currentFilter = filter;
    
    document.querySelectorAll('.filter-pill').forEach(pill => {
        pill.classList.toggle('active', pill.dataset.filter === filter);
    });
    
    applyFilters();
}

function handleFilterClick(e) {
    const filter = e.currentTarget.dataset.filter;
    setFilter(filter);
}

function openModal(copro = null) {
    const modal = document.getElementById('coproModal');
    const title = document.getElementById('modalTitle');
    
    if (!modal || !title) return;
    
    currentCoproId = copro?.id || null;
    title.textContent = copro ? 'Modifier la copropriété' : 'Ajouter une copropriété';

    document.getElementById('coproNom').value = copro?.nom || '';
    document.getElementById('coproAdresse').value = copro?.adresse || '';
    document.getElementById('coproCode').value = copro?.code || '';
    document.getElementById('coproProcedures').value = copro?.procedures || '';

    modal.style.display = 'block';
}

function closeModal() {
    const modal = document.getElementById('coproModal');
    const form = document.getElementById('coproForm');
    
    if (modal) modal.style.display = 'none';
    if (form) form.reset();
    currentCoproId = null;
}

async function handleSubmit(e) {
    e.preventDefault();

    const data = {
        nom: document.getElementById('coproNom').value.trim(),
        adresse: document.getElementById('coproAdresse').value.trim(),
        code: document.getElementById('coproCode').value.trim(),
        procedures: document.getElementById('coproProcedures').value.trim()
    };

    if (!data.nom || !data.adresse || !data.code) {
        alert('Veuillez remplir tous les champs obligatoires');
        return;
    }

    try {
        if (currentCoproId) {
            await updateCopropriete(currentCoproId, data);
            showNotification('Copropriété modifiée avec succès', 'success');
        } else {
            await addCopropriete(data);
            showNotification('Copropriété ajoutée avec succès', 'success');
        }
        closeModal();
        await loadCopros();
    } catch (error) {
        console.error('Erreur sauvegarde:', error);
        showNotification('Erreur: ' + error.message, 'error');
    }
}
window.confirmDeleteCopro = async function(id) {
    try {
        await deleteCopropriete(id);
        document.querySelector('.delete-confirm-modal').remove();
        
        const index = allCopros.findIndex(c => c.id === id);
        if (index > -1) {
            allCopros.splice(index, 1);
        }
        
        currentCoproPage = 1;
        const filtered = getFilteredCopros();
        renderCopros(filtered);
        
        showNotification('Copropriété supprimée', 'success');
    } catch (error) {
        console.error('Erreur suppression:', error);
        showNotification('Erreur lors de la suppression', 'error');
    }
};

async function confirmDeleteCopro(id) {
    try {
        await deleteCopropriete(id);
        document.querySelector('.delete-confirm-modal').remove();
        
        const index = allCopros.findIndex(c => c.id === id);
        if (index > -1) {
            allCopros.splice(index, 1);
        }
        
        applyFilters();
        
        showNotification('Copropriété supprimée', 'success');
    } catch (error) {
        console.error('Erreur suppression:', error);
        showNotification('Erreur lors de la suppression', 'error');
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
    
    setTimeout(() => notif.classList.add('show'), 10);
    setTimeout(() => {
        notif.classList.remove('show');
        setTimeout(() => notif.remove(), 300);
    }, 3000);
}