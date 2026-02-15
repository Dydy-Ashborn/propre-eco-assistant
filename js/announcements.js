// Système d'annonces - Lit depuis Firestore, affiche en popup côté employé
import { db } from '../js/config.js';
import { collection, getDocs, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const AnnouncementSystem = {
    DISMISSED_KEY: 'dismissed_announcements_v2',
    currentSlide: 0,
    totalSlides: 0,
    annonces: [],

    // Récupérer les annonces depuis Firestore
    async fetchAnnonces() {
        try {
            const q = query(collection(db, 'annonces'), orderBy('createdAt', 'desc'), limit(10));
            const snapshot = await getDocs(q);
            this.annonces = [];
            snapshot.forEach(doc => {
                this.annonces.push({ id: doc.id, ...doc.data() });
            });
            return this.annonces;
        } catch (error) {
            console.error('Erreur chargement annonces:', error);
            return [];
        }
    },

    // Récupérer les IDs déjà vus
    getDismissedIds() {
        try {
            return JSON.parse(localStorage.getItem(this.DISMISSED_KEY) || '{}');
        } catch {
            return {};
        }
    },

    // Marquer une annonce comme vue
    dismissAnnouncement(announcementId) {
        const dismissed = this.getDismissedIds();
        dismissed[announcementId] = Date.now();
        localStorage.setItem(this.DISMISSED_KEY, JSON.stringify(dismissed));
    },

    // Afficher la popup si annonces non vues
    async showPopupIfNeeded() {
        await this.fetchAnnonces();
        const dismissed = this.getDismissedIds();
        const unseen = this.annonces.filter(a => !dismissed[a.id]);
        
        if (unseen.length > 0) {
            this.displayPopup(unseen[0]);
        }
    },

    // Créer et afficher la popup
    displayPopup(annonce) {
        if (document.getElementById('announcement-popup')) return;

        const photos = annonce.photos || [];
        this.currentSlide = 0;
        this.totalSlides = photos.length;

        const carouselHtml = photos.length > 0 
            ? `<div class="announcement-carousel">
                <div class="carousel-container">
                    <div class="carousel-track" id="carousel-track">
                        ${photos.map(photo => `
                            <div class="carousel-slide">
                                <img src="${photo}" alt="Photo" onclick="window._announcementSystem.showPhotoModal('${photo}')">
                            </div>
                        `).join('')}
                    </div>
                    ${this.totalSlides > 1 ? `
                        <button class="carousel-button prev" onclick="window._announcementSystem.prevSlide(event)">
                            <i class="fas fa-chevron-left"></i>
                        </button>
                        <button class="carousel-button next" onclick="window._announcementSystem.nextSlide(event)">
                            <i class="fas fa-chevron-right"></i>
                        </button>
                        <div class="carousel-counter">
                            <span id="carousel-counter">1 / ${this.totalSlides}</span>
                        </div>
                    ` : ''}
                </div>
                ${this.totalSlides > 1 ? `
                    <div class="carousel-indicators">
                        ${photos.map((_, idx) => `
                            <button class="carousel-dot ${idx === 0 ? 'active' : ''}" onclick="window._announcementSystem.goToSlide(${idx}, event)"></button>
                        `).join('')}
                    </div>
                ` : ''}
               </div>`
            : '';

        const date = annonce.createdAt?.toDate ? 
            annonce.createdAt.toDate().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) 
            : '';

        const popup = document.createElement('div');
        popup.id = 'announcement-popup';
        popup.className = 'announcement-overlay';
        popup.innerHTML = `
            <div class="announcement-modal">
                <div class="announcement-header">
                    <div>
                        <h2>${this.escapeHtml(annonce.title || annonce.titre || 'Annonce')}</h2>
                        ${date ? `<span class="announcement-date">${date}</span>` : ''}
                    </div>
                    <button class="announcement-close" onclick="window._announcementSystem.closePopup('${annonce.id}')">&times;</button>
                </div>
                <div class="announcement-body">
                    <p>${this.escapeHtml(annonce.message || '').replace(/\n/g, '<br>')}</p>
                    ${carouselHtml}
                </div>
                <div class="announcement-footer">
                    <button class="announcement-btn" onclick="window._announcementSystem.closePopup('${annonce.id}')">J'ai compris</button>
                </div>
            </div>
        `;
        document.body.appendChild(popup);
        
        setTimeout(() => popup.classList.add('show'), 10);
        this.updateCarousel();
    },

    // Navigation carousel
    nextSlide(event) {
        if (event) event.stopPropagation();
        if (this.currentSlide < this.totalSlides - 1) {
            this.currentSlide++;
            this.updateCarousel();
        }
    },

    prevSlide(event) {
        if (event) event.stopPropagation();
        if (this.currentSlide > 0) {
            this.currentSlide--;
            this.updateCarousel();
        }
    },

    goToSlide(index, event) {
        if (event) event.stopPropagation();
        this.currentSlide = index;
        this.updateCarousel();
    },

    updateCarousel() {
        const track = document.getElementById('carousel-track');
        const counter = document.getElementById('carousel-counter');
        const dots = document.querySelectorAll('.carousel-dot');

        if (track) {
            track.style.transform = `translateX(-${this.currentSlide * 100}%)`;
        }
        if (counter) {
            counter.textContent = `${this.currentSlide + 1} / ${this.totalSlides}`;
        }
        dots.forEach((dot, idx) => {
            dot.classList.toggle('active', idx === this.currentSlide);
        });
    },

    // Photo en plein écran
    showPhotoModal(photoSrc) {
        const modal = document.createElement('div');
        modal.className = 'photo-modal';
        modal.onclick = function() { this.remove(); };
        modal.innerHTML = `<img src="${photoSrc}" alt="Photo">`;
        document.body.appendChild(modal);
    },

    // Fermer la popup
    closePopup(announcementId) {
        const popup = document.getElementById('announcement-popup');
        if (popup) {
            popup.classList.remove('show');
            setTimeout(() => {
                popup.remove();
                this.dismissAnnouncement(announcementId);
                // Afficher la suivante s'il y en a
                setTimeout(() => this.showPopupIfNeeded(), 300);
            }, 300);
        }
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// Exposer pour les onclick dans le HTML généré
window._announcementSystem = AnnouncementSystem;

// Support du swipe sur mobile
let touchStartX = 0;
document.addEventListener('touchstart', (e) => {
    if (document.getElementById('announcement-popup')) {
        touchStartX = e.changedTouches[0].screenX;
    }
});
document.addEventListener('touchend', (e) => {
    if (document.getElementById('announcement-popup')) {
        const diff = e.changedTouches[0].screenX - touchStartX;
        if (diff < -50) AnnouncementSystem.nextSlide();
        if (diff > 50) AnnouncementSystem.prevSlide();
    }
});

// Flèches clavier
document.addEventListener('keydown', (e) => {
    if (document.getElementById('announcement-popup')) {
        if (e.key === 'ArrowLeft') AnnouncementSystem.prevSlide();
        if (e.key === 'ArrowRight') AnnouncementSystem.nextSlide();
        if (e.key === 'Escape') {
            const popup = document.getElementById('announcement-popup');
            const closeBtn = popup?.querySelector('.announcement-close');
            if (closeBtn) closeBtn.click();
        }
    }
});

// Lancer automatiquement après chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    // Petit délai pour laisser la page se charger
    setTimeout(() => {
        AnnouncementSystem.showPopupIfNeeded();
    }, 1500);
});

export { AnnouncementSystem };
