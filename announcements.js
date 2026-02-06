// Système de gestion des annonces
const AnnouncementSystem = {
    STORAGE_KEY: 'app_announcements',
    DISMISSED_KEY: 'dismissed_announcements',
    currentSlide: 0,
    totalSlides: 0,

    // Récupérer toutes les annonces actives
    getActiveAnnouncements() {
        const announcements = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '[]');
        return announcements;
    },

    // Récupérer les annonces non vues
    getAnnouncementsForCurrentUser() {
        const announcements = this.getActiveAnnouncements();
        const dismissed = JSON.parse(localStorage.getItem(this.DISMISSED_KEY) || '{}');
        
        return announcements.filter(a => !dismissed[a.id]);
    },

    // Marquer une annonce comme vue
    dismissAnnouncement(announcementId) {
        const dismissed = JSON.parse(localStorage.getItem(this.DISMISSED_KEY) || '{}');
        dismissed[announcementId] = new Date().toISOString();
        localStorage.setItem(this.DISMISSED_KEY, JSON.stringify(dismissed));
    },

    // Créer une nouvelle annonce (admin)
    createAnnouncement(title, message, photos = []) {
        const announcements = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '[]');
        const newAnnouncement = {
            id: Date.now().toString(),
            title,
            message,
            photos,
            createdAt: new Date().toISOString()
        };
        announcements.push(newAnnouncement);
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(announcements));
        return newAnnouncement;
    },

    // Supprimer une annonce (admin)
    deleteAnnouncement(id) {
        const announcements = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '[]');
        const filtered = announcements.filter(a => a.id !== id);
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
    },

    // Afficher la popup si nécessaire
    showPopupIfNeeded() {
        const announcements = this.getAnnouncementsForCurrentUser();
        if (announcements.length > 0) {
            this.displayPopup(announcements[0]);
        }
    },

    // Créer et afficher la popup avec carousel
    displayPopup(announcement) {
        if (document.getElementById('announcement-popup')) return;

        this.currentSlide = 0;
        this.totalSlides = announcement.photos ? announcement.photos.length : 0;

        const carouselHtml = announcement.photos && announcement.photos.length > 0 
            ? `<div class="announcement-carousel">
                <div class="carousel-container">
                    <div class="carousel-track" id="carousel-track">
                        ${announcement.photos.map(photo => `
                            <div class="carousel-slide">
                                <img src="${photo}" alt="Photo" onclick="AnnouncementSystem.showPhotoModal('${photo}')">
                            </div>
                        `).join('')}
                    </div>
                    ${this.totalSlides > 1 ? `
                        <button class="carousel-button prev" onclick="AnnouncementSystem.prevSlide(event)">
                            <i class="fas fa-chevron-left"></i>
                        </button>
                        <button class="carousel-button next" onclick="AnnouncementSystem.nextSlide(event)">
                            <i class="fas fa-chevron-right"></i>
                        </button>
                        <div class="carousel-counter">
                            <span id="carousel-counter">1 / ${this.totalSlides}</span>
                        </div>
                    ` : ''}
                </div>
                ${this.totalSlides > 1 ? `
                    <div class="carousel-indicators">
                        ${announcement.photos.map((_, idx) => `
                            <button class="carousel-dot ${idx === 0 ? 'active' : ''}" onclick="AnnouncementSystem.goToSlide(${idx}, event)"></button>
                        `).join('')}
                    </div>
                ` : ''}
               </div>`
            : '';

        const popup = document.createElement('div');
        popup.id = 'announcement-popup';
        popup.className = 'announcement-overlay';
        popup.innerHTML = `
            <div class="announcement-modal">
                <div class="announcement-header">
                    <h2>${this.escapeHtml(announcement.title)}</h2>
                    <button class="announcement-close" onclick="AnnouncementSystem.closePopup('${announcement.id}')">&times;</button>
                </div>
                <div class="announcement-body">
                    <p>${this.escapeHtml(announcement.message).replace(/\n/g, '<br>')}</p>
                    ${carouselHtml}
                </div>
                <div class="announcement-footer">
                    <button class="announcement-btn" onclick="AnnouncementSystem.closePopup('${announcement.id}')">J'ai compris</button>
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
        const prevBtn = document.querySelector('.carousel-button.prev');
        const nextBtn = document.querySelector('.carousel-button.next');

        if (track) {
            track.style.transform = `translateX(-${this.currentSlide * 100}%)`;
        }

        if (counter) {
            counter.textContent = `${this.currentSlide + 1} / ${this.totalSlides}`;
        }

        dots.forEach((dot, idx) => {
            dot.classList.toggle('active', idx === this.currentSlide);
        });

        if (prevBtn) {
            prevBtn.disabled = this.currentSlide === 0;
        }

        if (nextBtn) {
            nextBtn.disabled = this.currentSlide === this.totalSlides - 1;
        }
    },

    // Afficher une photo en grand
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
                setTimeout(() => this.showPopupIfNeeded(), 300);
            }, 300);
        }
    },

    // Échapper le HTML pour la sécurité
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// Support du swipe sur mobile
let touchStartX = 0;
let touchEndX = 0;

document.addEventListener('touchstart', (e) => {
    if (document.getElementById('announcement-popup')) {
        touchStartX = e.changedTouches[0].screenX;
    }
});

document.addEventListener('touchend', (e) => {
    if (document.getElementById('announcement-popup')) {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }
});

function handleSwipe() {
    const swipeThreshold = 50;
    if (touchEndX < touchStartX - swipeThreshold) {
        AnnouncementSystem.nextSlide();
    }
    if (touchEndX > touchStartX + swipeThreshold) {
        AnnouncementSystem.prevSlide();
    }
}

// Support des flèches clavier
document.addEventListener('keydown', (e) => {
    if (document.getElementById('announcement-popup')) {
        if (e.key === 'ArrowLeft') {
            AnnouncementSystem.prevSlide();
        }
        if (e.key === 'ArrowRight') {
            AnnouncementSystem.nextSlide();
        }
    }
});