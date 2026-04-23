// Scripts extraits de heures.html

// Section 1
// Menu toggle
        document.addEventListener('DOMContentLoaded', function () {
            const toggleButton = document.querySelector('.nav-toggle');
            const menu = document.querySelector('.nav-menu');

            if (toggleButton && menu) {
                toggleButton.addEventListener('click', () => {
                    menu.classList.toggle('open');
                });

                document.querySelectorAll('.nav-menu a').forEach(link => {
                    link.addEventListener('click', () => {
                        menu.classList.remove('open');
                    });
                });
            }
        });

        // Firebase et fonctionnalités existantes
        const firebaseConfig = { apiKey: "AIzaSyBzXEN0e-4dgh9NVVF7JGzpKtJrPnuzo0Y", authDomain: "copro-256d7.firebaseapp.com", projectId: "copro-256d7", storageBucket: "copro-256d7.appspot.com", messagingSenderId: "665588381388", appId: "1:665588381388:web:a0567533ff1a62407db469", measurementId: "G-Y7YNZDDCTD" }; 
        let db; 
        try { 
            firebase.initializeApp(firebaseConfig); 
            db = firebase.firestore(); 
            console.log('âœ… Firestore initialisé') 
        } catch (error) { 
            console.error('âŒ Erreur:', error); 
            showNotification('Erreur de connexion', 'error') 
        } 
        
        let currentEmployeeId = null, currentEmployeeName = null, currentWeek = null, projectRowCounter = 0; 
const employeeNames = { 'dylan': 'Dylan', 'oceane': 'Océane', 'samuel': 'Samuel', 'jeremie': 'Jérémie', 'carlos': 'Carlos', 'sandra': 'Sandra', 'manon': 'Manon', 'stephane': 'Stéphane', 'isabelle': 'Isabelle', 'caroline': 'Caroline', 'nadjet': 'Nadjet', 'remy': 'Rémy', 'maxime': 'Maxime', 'shana': 'Shana' };        
        document.addEventListener('DOMContentLoaded', function () { 
            const urlParams = new URLSearchParams(window.location.search); 
            currentEmployeeId = urlParams.get('employee'); 
            if (!currentEmployeeId) { 
                showNotification('Employé non identifié', 'error'); 
                setTimeout(() => window.location.href = 'pointeuse.html', 2000); 
                return 
            } 
            currentEmployeeName = employeeNames[currentEmployeeId] || 'Employé'; 
            document.getElementById('userName').textContent = currentEmployeeName; 
            document.getElementById('userAvatar').textContent = getInitials(currentEmployeeName); 
            
            // Vérifier si l'utilisateur a une session sauvegardée et afficher le bouton de déconnexion
            checkAndShowLogoutButton();
            
            const today = new Date(); 
            const weekInput = document.getElementById('weekInput'); 
            weekInput.value = getWeekString(today); 
            currentWeek = weekInput.value; 
            
            // Charger automatiquement les données de la semaine
            loadWeekDataAuto(); 
            loadProjectsData(); 
            
            // Ajouter un listener pour charger automatiquement quand on change la semaine
            weekInput.addEventListener('change', function() {
                currentWeek = this.value;
                loadWeekDataAuto();
            });
            
            // Validation et calcul pour les inputs d'heures
            document.querySelectorAll('#weeklyTable .hours').forEach(input => { 
                input.addEventListener('input', calculateWeeklyTotal);
                
                // Valider que c'est un multiple de 0.25
                input.addEventListener('blur', function() {
                    const value = parseFloat(this.value);
                    if (!isNaN(value)) {
                        // Arrondir au multiple de 0.25 le plus proche
                        const rounded = Math.round(value * 4) / 4;
                        if (rounded !== value) {
                            this.value = rounded;
                            calculateWeeklyTotal();
                            showNotification(`Valeur arrondie Ã  ${rounded}h (multiples de 0.25 uniquement)`, 'info');
                        }
                    }
                });
            }) 
        }); 
        
        // Vérifier si une session est sauvegardée pour cet employé
        function checkAndShowLogoutButton() {
            const SAVED_SESSION_KEY = "savedEmployeeSession";
            const savedSession = localStorage.getItem(SAVED_SESSION_KEY);
            
            if (savedSession) {
                try {
                    const sessionData = JSON.parse(savedSession);
                    // Si la session correspond Ã  l'employé actuel, afficher le bouton
                    if (sessionData.employeeId === currentEmployeeId) {
                        const logoutBtn = document.getElementById('logoutBtn');
                        if (logoutBtn) {
                            logoutBtn.style.display = 'flex';
                            logoutBtn.style.alignItems = 'center';
                            logoutBtn.style.gap = '0.5rem';
                        }
                    }
                } catch (error) {
                    console.error('Erreur lecture session:', error);
                }
            }
        }
        
        // Fonction de déconnexion
        function logoutSession() {
            const SAVED_SESSION_KEY = "savedEmployeeSession";
            
            if (confirm('ÃŠtes-vous sûr de vouloir désactiver la connexion automatique ?')) {
                localStorage.removeItem(SAVED_SESSION_KEY);
                showNotification('Connexion automatique désactivée', 'success');
                
                // Masquer le bouton
                const logoutBtn = document.getElementById('logoutBtn');
                if (logoutBtn) {
                    logoutBtn.style.display = 'none';
                }
                
                // Rediriger vers la pointeuse après 1.5 secondes
                setTimeout(() => {
                    window.location.href = 'pointeuse.html';
                }, 1500);
            }
        }
        
        function getInitials(name) { 
            return name.split(' ').map(n => n[0]).join('').toUpperCase() 
        } 
        
        function getWeekString(date) { 
            const year = date.getFullYear(); 
            const weekNum = getWeekNumber(date); 
            return `${year}-W${weekNum.toString().padStart(2, '0')}` 
        } 
        
        function getWeekNumber(date) { 
            const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())); 
            const dayNum = d.getUTCDay() || 7; 
            d.setUTCDate(d.getUTCDate() + 4 - dayNum); 
            const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1)); 
            return Math.ceil((((d - yearStart) / 86400000) + 1) / 7) 
        } 
        
        function showLoading(show = true) { 
            document.getElementById('loadingOverlay').style.display = show ? 'flex' : 'none' 
        } 
        
        function showNotification(message, type = 'info') { 
            const notification = document.createElement('div'); 
            notification.className = 'notification'; 
            const icons = { success: 'fas fa-check-circle', warning: 'fas fa-exclamation-triangle', error: 'fas fa-times-circle', info: 'fas fa-info-circle' }; 
            const colors = { success: 'linear-gradient(135deg, #10b981, #059669)', warning: 'linear-gradient(135deg, #f59e0b, #d97706)', error: 'linear-gradient(135deg, #ef4444, #dc2626)', info: 'linear-gradient(135deg, #3b82f6, #2563eb)' }; 
            notification.style.background = colors[type] || colors.info; 
            notification.innerHTML = `<i class="${icons[type] || icons.info}"></i><span>${message}</span>`; 
            document.body.appendChild(notification); 
            setTimeout(() => { 
                notification.style.animation = 'slideOutRight 0.3s ease-out forwards'; 
                setTimeout(() => notification.remove(), 300) 
            }, 3000) 
        } 
        
        function calculateWeeklyTotal() { 
            const hoursInputs = document.querySelectorAll('#weeklyTable .hours'); 
            let total = 0; 
            hoursInputs.forEach(input => { 
                const value = input.value.trim(); 
                if (value && value.toUpperCase() !== 'R') { 
                    const hours = parseFloat(value); 
                    if (!isNaN(hours)) { 
                        // Arrondir Ã  2 décimales pour éviter les erreurs de précision JavaScript
                        total += Math.round(hours * 100) / 100;
                    } 
                } 
            }); 
            // Arrondir le total final et formater proprement
            const roundedTotal = Math.round(total * 100) / 100;
            // Afficher avec 2 décimales si nécessaire, sinon avec 1
            const displayTotal = roundedTotal % 1 === 0 ? roundedTotal.toFixed(0) : 
                                 (roundedTotal * 4) % 1 === 0 ? roundedTotal.toFixed(2) : 
                                 roundedTotal.toFixed(1);
            document.getElementById('totalWeeklyHours').textContent = displayTotal + 'h'; 
            return roundedTotal;
        } 
        
    async function loadWeekData() {
    const selectedWeek = document.getElementById('weekInput').value;
    if (!selectedWeek) {
        showNotification('Sélectionnez une semaine', 'warning');
        return;
    }
    currentWeek = selectedWeek;
    showLoading(true);

    try {
        // Calcul des dates de la semaine à partir de YYYY-Www
        const [year, week] = selectedWeek.split('-W').map(Number);
        const jan4 = new Date(year, 0, 4);
        const startOfWeek = new Date(jan4);
        startOfWeek.setDate(jan4.getDate() - ((jan4.getDay() + 6) % 7) + (week - 1) * 7);
        startOfWeek.setHours(0, 0, 0, 0);

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const minAllowed = new Date(today);
        minAllowed.setDate(today.getDate() - 1);

        // Poser data-date sur chaque <tr>
        const rows = document.querySelectorAll('#weeklyTable tbody tr');
        rows.forEach((row, index) => {
            const d = new Date(startOfWeek);
            d.setDate(startOfWeek.getDate() + index);
            const dateStr = d.toISOString().split('T')[0];
            row.setAttribute('data-date', dateStr);
        });

        // Chargement Firestore
        const docRef = db.collection('employees').doc(currentEmployeeId).collection('weeks').doc(currentWeek);
        const doc = await docRef.get();

        if (doc.exists) {
            const data = doc.data();
            if (data.days) {
                data.days.forEach((dayData, index) => {
                    if (rows[index]) {
                        rows[index].querySelector('.hours').value = dayData.hours || '';
                        rows[index].querySelector('textarea').value = dayData.comments || '';
                    }
                });
            }
            document.getElementById('kilometrage').value = data.kilometrage || '';
            calculateWeeklyTotal();
            showNotification('Données chargées', 'success');
        } else {
            rows.forEach(row => {
                row.querySelector('.hours').value = '';
                row.querySelector('textarea').value = '';
            });
            document.getElementById('kilometrage').value = '';
            calculateWeeklyTotal();
            showNotification('Aucune donnée pour cette semaine', 'info');
        }

        // Verrouillage des inputs hors fenêtre
        rows.forEach(row => {
            const rowDate = new Date(row.getAttribute('data-date'));
            rowDate.setHours(0, 0, 0, 0);

            const hoursInput = row.querySelector('.hours');
            const textarea = row.querySelector('textarea');
            const isLocked = rowDate > today || rowDate < minAllowed;

            [hoursInput, textarea].forEach(el => {
                if (!el) return;
                el.disabled = isLocked;
                el.style.opacity = isLocked ? '0.4' : '';
                el.style.cursor = isLocked ? 'not-allowed' : '';
                el.title = isLocked
                    ? rowDate > today
                        ? 'Jour futur — saisie interdite'
                        : 'Trop ancien — non modifiable'
                    : '';
            });
        });

    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur lors du chargement', 'error');
    } finally {
        showLoading(false);
    }
}

        function lockOutOfRangeInputs() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const minAllowed = new Date(today);
  minAllowed.setDate(today.getDate() - 1);

  const allInputs = document.querySelectorAll('input[data-date]');
  allInputs.forEach(input => {
    const dateStr = input.getAttribute('data-date');
    const inputDate = new Date(dateStr);
    inputDate.setHours(0, 0, 0, 0);

    const outOfRange = inputDate > today || inputDate < minAllowed;
    input.disabled = outOfRange;
    input.style.opacity = outOfRange ? '0.35' : '';
    input.style.cursor = outOfRange ? 'not-allowed' : '';
    input.title = outOfRange
      ? inputDate > today
        ? 'Jour futur — saisie interdite'
        : 'Trop ancien — saisie interdite (max 1 jour)'
      : '';
  });
}
async function loadWeekDataAuto() {
    if (!currentWeek) return;
    showLoading(true);

    try {
        const [year, week] = currentWeek.split('-W').map(Number);
        const jan4 = new Date(year, 0, 4);
        const startOfWeek = new Date(jan4);
        startOfWeek.setDate(jan4.getDate() - ((jan4.getDay() + 6) % 7) + (week - 1) * 7);
        startOfWeek.setHours(0, 0, 0, 0);

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const minAllowed = new Date(today);
        minAllowed.setDate(today.getDate() - 2); // hier = dernier jour autorisé

        const rows = document.querySelectorAll('#weeklyTable tbody tr');

        rows.forEach((row, index) => {
            const d = new Date(startOfWeek);
            d.setDate(startOfWeek.getDate() + index);
            row.setAttribute('data-date', d.toISOString().split('T')[0]);
        });

        const docRef = db.collection('employees').doc(currentEmployeeId).collection('weeks').doc(currentWeek);
        const doc = await docRef.get();

        if (doc.exists) {
            const data = doc.data();
            if (data.days) {
                data.days.forEach((dayData, index) => {
                    if (rows[index]) {
                        rows[index].querySelector('.hours').value = dayData.hours || '';
                        rows[index].querySelector('textarea').value = dayData.comments || '';
                    }
                });
            }
            document.getElementById('kilometrage').value = data.kilometrage || '';
            if (data.projects && data.projects.length > 0) {
                displaySavedProjects(data.projects);
            } else {
                hideSavedProjectsDisplay();
            }
        } else {
            rows.forEach(row => {
                row.querySelector('.hours').value = '';
                row.querySelector('textarea').value = '';
            });
            document.getElementById('kilometrage').value = '';
            hideSavedProjectsDisplay();
        }

        calculateWeeklyTotal();

        // Verrouillage + message au clic
     // Verrouillage + message au clic
// Verrouillage + message au clic
rows.forEach(row => {
    const rowDate = new Date(row.getAttribute('data-date'));
    rowDate.setHours(0, 0, 0, 0);

    const hoursInput = row.querySelector('.hours');
    const textarea = row.querySelector('textarea');
    const isLocked = rowDate > today || rowDate < minAllowed;

    [hoursInput, textarea].forEach(el => {
        if (!el) return;
        el.disabled = isLocked;
        el.style.opacity = isLocked ? '0.4' : '';

        if (isLocked) {
            // Wrapper relatif pour poser l'overlay
            const parent = el.parentElement;
            parent.style.position = 'relative';

            const overlay = document.createElement('div');
            overlay.style.cssText = 'position:absolute;inset:0;cursor:not-allowed;z-index:10;';
            overlay.addEventListener('click', () => {
                if (rowDate > today) {
                    showNotification('Saisie interdite : vous ne pouvez pas remplir un jour futur.', 'error');
                } else {
                    showNotification('Saisie interdite : vous ne pouvez modifier que aujourd\'hui et hier.', 'error');
                }
            });
            parent.appendChild(overlay);
        }
    });
});

    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur lors du chargement', 'error');
    } finally {
        showLoading(false);
    }
}
        
        // âœ… CORRECTION 1 : Ajouter { merge: true } pour ne pas écraser les chantiers
       async function saveWeeklyData() {
    if (!currentWeek) {
        showNotification('Sélectionnez une semaine', 'warning');
        return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const minAllowed = new Date(today);
    minAllowed.setDate(today.getDate() - 1);

    // Vérification des jours saisis hors fenêtre autorisée
    const rows = document.querySelectorAll('#weeklyTable tbody tr');
    for (const row of rows) {
        const hoursInput = row.querySelector('.hours');
        if (!hoursInput || !hoursInput.value) continue;

        const dayLabel = row.querySelector('td strong').textContent.trim();
        const dateAttr = hoursInput.getAttribute('data-date');
        if (!dateAttr) continue;

        const inputDate = new Date(dateAttr);
        inputDate.setHours(0, 0, 0, 0);

        if (inputDate > today) {
            showNotification(`Saisie impossible : "${dayLabel}" est dans le futur.`, 'error');
            hoursInput.value = '';
            return;
        }

        if (inputDate < minAllowed) {
            showNotification(`Saisie impossible : "${dayLabel}" dépasse la limite (max : hier).`, 'error');
            hoursInput.value = '';
            return;
        }
    }

    const data = {
        days: [],
        kilometrage: document.getElementById('kilometrage').value,
        lastUpdate: firebase.firestore.FieldValue.serverTimestamp()
    };

    rows.forEach(row => {
        const day = row.querySelector('td strong').textContent;
        const hours = row.querySelector('.hours').value;
        const comments = row.querySelector('textarea').value;
        data.days.push({ day, hours, comments });
    });

    const saveBtn = document.getElementById('saveWeeklyBtn');
    showLoading(true);
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enregistrement...';

    try {
        await db.collection('employees').doc(currentEmployeeId)
            .collection('weeks').doc(currentWeek)
            .set(data, { merge: true });
        showNotification('Données enregistrées!', 'success');
    } catch (error) {
        console.error('Erreur:', error);
        showNotification("Erreur lors de l'enregistrement", 'error');
    } finally {
        showLoading(false);
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<i class="fas fa-save"></i> Enregistrer';
    }
}
        
        function resetWeeklyData() { 
            if (confirm('Effacer toutes les données?')) { 
                document.querySelectorAll('#weeklyTable .hours').forEach(input => input.value = ''); 
                document.querySelectorAll('#weeklyTable textarea').forEach(textarea => textarea.value = ''); 
                document.getElementById('kilometrage').value = ''; 
                calculateWeeklyTotal(); 
                showNotification('Données réinitialisées', 'info') 
            } 
        } 
        
        function addProjectRow() { 
            const tbody = document.getElementById('projectsTableBody'); 
            const row = document.createElement('tr'); 
            row.dataset.rowId = projectRowCounter++; 
            row.innerHTML = `<td data-label="Date"><input type="date" class="table-input" data-field="date"></td><td data-label="Chantier"><input type="text" class="table-input" data-field="name" placeholder="Nom"></td><td data-label="Nombre d'employés"><input type="number" class="table-input" data-field="employees" min="1" placeholder="1"></td><td data-label="Equipe"><input type="text" class="table-input" data-field="team" placeholder="Equipe"></td><td data-label="Total"><input type="text" class="table-input" data-field="totalHours" placeholder="Total" style="font-weight:700;text-align:center"></td><td style="text-align:center;padding:.2rem"><button class="btn btn-danger" onclick="removeProjectRow(this)" style="padding:.5rem 1rem;font-size:.85rem;min-height:44px"><i class="fas fa-trash"></i> Supprimer</button></td>`; 
            tbody.appendChild(row); 
            row.querySelector('[data-field="totalHours"]').addEventListener('input', calculateProjectsTotal);
        } 
        
        function calculateProjectsTotal() { 
            const rows = document.querySelectorAll('#projectsTableBody tr'); 
            let grandTotal = 0; 
            rows.forEach(row => { 
                const totalText = row.querySelector('[data-field="totalHours"]').value; 
                if (totalText) { 
                    const total = parseFloat(totalText.replace('h', '').replace(',', '.').trim()); 
                    if (!isNaN(total)) { 
                        // Arrondir chaque valeur Ã  2 décimales pour éviter les erreurs de précision
                        grandTotal += Math.round(total * 100) / 100;
                    } 
                } 
            }); 
            // Arrondir le total final
            const roundedTotal = Math.round(grandTotal * 100) / 100;
            // Affichage intelligent
            const displayTotal = roundedTotal % 1 === 0 ? roundedTotal.toFixed(0) : 
                                 (roundedTotal * 4) % 1 === 0 ? roundedTotal.toFixed(2) : 
                                 roundedTotal.toFixed(1);
            document.getElementById('totalProjectsHours').textContent = displayTotal + 'h';
        } 
        
        function removeProjectRow(button) { 
            if (confirm('Supprimer ce chantier?')) { 
                button.closest('tr').remove(); 
                calculateProjectsTotal(); 
                showNotification('Chantier supprimé', 'info') 
            } 
        } 
        
        // âœ… CORRECTION 2 : Améliorer la validation et utiliser merge: true
        async function saveProjectsData() { 
            const newData = []; 
            const rows = document.querySelectorAll('#projectsTableBody tr'); 
            rows.forEach(row => { 
                const projectData = { 
                    date: row.querySelector('[data-field="date"]').value, 
                    name: row.querySelector('[data-field="name"]').value.trim(), 
                    employees: row.querySelector('[data-field="employees"]').value.trim(), 
                    team: row.querySelector('[data-field="team"]').value.trim(), 
                    totalHours: row.querySelector('[data-field="totalHours"]').value.trim() 
                }; 
                // âœ… CORRECTION : Vérifier que le nom n'est pas vide
                if (projectData.name && projectData.name !== '') { 
                    newData.push(projectData) 
                } 
            }); 
            
            if (newData.length === 0) {
                showNotification('Aucun chantier Ã  enregistrer', 'warning');
                return;
            }
            
            // Vérifier qu'une semaine est sélectionnée
            const selectedWeek = document.getElementById('weekInput').value;
            if (!selectedWeek) {
                showNotification('Veuillez sélectionner une semaine', 'warning');
                return;
            }
            
            showLoading(true); 
            const saveBtn = document.getElementById('saveProjectsBtn'); 
            saveBtn.disabled = true; 
            saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enregistrement...'; 
            try { 
                // Sauvegarder les chantiers dans la semaine en cours
                const weekRef = db.collection('employees').doc(currentEmployeeId).collection('weeks').doc(selectedWeek);
                const weekDoc = await weekRef.get();
                
                let existingProjects = [];
                if (weekDoc.exists && weekDoc.data().projects) {
                    existingProjects = weekDoc.data().projects;
                }
                
                // Si on est en mode édition, remplacer le chantier Ã  l'index stocké
                let allProjects;
                if (typeof window.editingProjectIndex !== 'undefined') {
                    existingProjects[window.editingProjectIndex] = newData[0];
                    delete window.editingProjectIndex;
                    allProjects = existingProjects;
                } else {
                    // Sinon, ajouter les nouveaux chantiers aux existants
                    allProjects = [...existingProjects, ...newData];
                }
                
                // âœ… CORRECTION : Toujours utiliser merge: true
                await weekRef.set({ 
                    projects: allProjects,
                    lastUpdate: firebase.firestore.FieldValue.serverTimestamp() 
                }, { merge: true });
                
                showNotification('Chantiers enregistrés pour la semaine ' + selectedWeek + '!', 'success');
                displaySavedProjects(allProjects);
                // Vider le tableau de saisie
                document.getElementById('projectsTableBody').innerHTML = '';
                addProjectRow();
                calculateProjectsTotal();
                // Masquer le formulaire
                hideProjectForm();
            } catch (error) { 
                console.error('Erreur:', error); 
                showNotification('Erreur lors de l\'enregistrement', 'error') 
            } finally { 
                showLoading(false); 
                saveBtn.disabled = false; 
                saveBtn.innerHTML = '<i class="fas fa-save"></i> Enregistrer' 
            } 
        } 
        
        async function loadProjectsData() { 
            const selectedWeek = document.getElementById('weekInput').value;
            if (!selectedWeek) {
                hideSavedProjectsDisplay();
                return;
            }
            
            showLoading(true); 
            try { 
                const weekRef = db.collection('employees').doc(currentEmployeeId).collection('weeks').doc(selectedWeek); 
                const weekDoc = await weekRef.get(); 
                if (weekDoc.exists && weekDoc.data().projects) { 
                    const projects = weekDoc.data().projects;
                    if (projects.length > 0) { 
                        displaySavedProjects(projects);
                    } else { 
                        hideSavedProjectsDisplay();
                    } 
                } else { 
                    hideSavedProjectsDisplay();
                } 
                // Toujours avoir une ligne vide pour saisie
                document.getElementById('projectsTableBody').innerHTML = '';
                addProjectRow();
                calculateProjectsTotal();
            } catch (error) { 
                console.error('Erreur:', error); 
                hideSavedProjectsDisplay();
                document.getElementById('projectsTableBody').innerHTML = '';
                addProjectRow();
            } finally { 
                showLoading(false) 
            } 
        }

        function displaySavedProjects(projectsData) {
            const display = document.getElementById('savedProjectsDisplay');
            const tbody = document.getElementById('savedProjectsBody');
            const totalCell = document.getElementById('savedProjectsTotal');
            
            if (!projectsData || projectsData.length === 0) {
                display.style.display = 'none';
                return;
            }
            
            tbody.innerHTML = '';
            let total = 0;
            
            projectsData.forEach((project, index) => {
                const row = document.createElement('tr');
                row.style.borderBottom = '1px solid #e5e7eb';
                if (index % 2 === 0) row.style.background = '#f8fafc';
                
                const date = new Date(project.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
                const totalNum = parseFloat(project.totalHours?.replace('h', '').replace(',', '.')) || 0;
                total += totalNum;
                
                row.innerHTML = `
                    <td data-label="Date" style="padding: 0.75rem;">${date}</td>
                    <td data-label="Chantier" style="padding: 0.75rem;"><strong>${project.name || '-'}</strong></td>
                    <td data-label="Nb employés" style="padding: 0.75rem;">${project.employees || '-'}</td>
                    <td data-label="Équipe" style="padding: 0.75rem;">${project.team || '-'}</td>
                    <td data-label="Total" style="padding: 0.75rem;"><strong>${project.totalHours || '0h'}</strong></td>
                    <td data-label="Actions" style="padding: 0.75rem;">
                        <button onclick="editProject(${index})" style="background: #3b82f6; color: white; border: none; padding: 0.5rem 0.75rem; border-radius: 6px; cursor: pointer; margin-right: 0.5rem; font-size: 0.85rem;">
                            <i class="fas fa-edit"></i> Modifier
                        </button>
                        <button onclick="deleteProject(${index})" style="background: #ef4444; color: white; border: none; padding: 0.5rem 0.75rem; border-radius: 6px; cursor: pointer; font-size: 0.85rem;">
                            <i class="fas fa-trash"></i> Supprimer
                        </button>
                    </td>
                `;
                tbody.appendChild(row);
            });
            
            totalCell.textContent = total.toFixed(1) + 'h';
            display.style.display = 'block';
        }

        function hideSavedProjectsDisplay() {
            document.getElementById('savedProjectsDisplay').style.display = 'none';
        }

        function showProjectForm() {
            document.getElementById('projectFormContainer').style.display = 'block';
            document.getElementById('showFormBtn').style.display = 'none';
        }

        function hideProjectForm() {
            document.getElementById('projectFormContainer').style.display = 'none';
            document.getElementById('showFormBtn').style.display = 'block';
        }

        // âœ… CORRECTION 3 : Ne pas supprimer immédiatement le chantier lors de l'édition
        async function editProject(index) {
            const selectedWeek = document.getElementById('weekInput').value;
            if (!selectedWeek) {
                showNotification('Veuillez sélectionner une semaine', 'warning');
                return;
            }
            
            showLoading(true);
            try {
                const weekRef = db.collection('employees').doc(currentEmployeeId).collection('weeks').doc(selectedWeek);
                const weekDoc = await weekRef.get();
                
                if (weekDoc.exists && weekDoc.data().projects) {
                    const projects = weekDoc.data().projects;
                    const project = projects[index];
                    
                    // âœ… CORRECTION : Stocker l'index pour la sauvegarde ultérieure au lieu de supprimer
                    window.editingProjectIndex = index;
                    
                    // Afficher le formulaire
                    showProjectForm();
                    
                    // Remplir le formulaire avec les données du chantier
                    const tbody = document.getElementById('projectsTableBody');
                    tbody.innerHTML = '';
                    addProjectRow();
                    
                    const row = tbody.querySelector('tr');
                    row.querySelector('[data-field="date"]').value = project.date || '';
                    row.querySelector('[data-field="name"]').value = project.name || '';
                    row.querySelector('[data-field="employees"]').value = project.employees || '';
                    row.querySelector('[data-field="team"]').value = project.team || '';
                    row.querySelector('[data-field="totalHours"]').value = project.totalHours || '';
                    
                    calculateProjectsTotal();
                }
            } catch (error) {
                console.error('Erreur:', error);
                showNotification('Erreur lors du chargement', 'error');
            } finally {
                showLoading(false);
            }
        }

        async function deleteProject(index) {
            if (!confirm('ÃŠtes-vous sûr de vouloir supprimer ce chantier ?')) {
                return;
            }
            
            const selectedWeek = document.getElementById('weekInput').value;
            if (!selectedWeek) {
                showNotification('Veuillez sélectionner une semaine', 'warning');
                return;
            }
            
            showLoading(true);
            try {
                const weekRef = db.collection('employees').doc(currentEmployeeId).collection('weeks').doc(selectedWeek);
                const weekDoc = await weekRef.get();
                
                if (weekDoc.exists && weekDoc.data().projects) {
                    const projects = weekDoc.data().projects;
                    projects.splice(index, 1);
                    
                    // âœ… Utiliser merge: true également ici
                    await weekRef.set({ projects: projects }, { merge: true });
                    showNotification('Chantier supprimé !', 'success');
                    displaySavedProjects(projects);
                }
            } catch (error) {
                console.error('Erreur:', error);
                showNotification('Erreur lors de la suppression', 'error');
            } finally {
                showLoading(false);
            }
        }

// Section 2
if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('service-worker.js')
                .then(reg => console.log('âœ… Service Worker enregistré', reg))
                .catch(err => console.error('âŒ Erreur Service Worker', err));
        }

