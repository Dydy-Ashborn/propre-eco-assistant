// Service de notification pour le badge
import { db } from './config.js';
import { collection, query, orderBy, onSnapshot } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

class NotificationService {
    constructor() {
        this.badge = null;
        this.init();
    }

    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }

    setup() {
        this.badge = document.getElementById('notifBadge');
        if (!this.badge) {
            console.warn('Badge element not found');
            return;
        }
        
        this.setupRealTimeListener();
    }

    updateBadge(count) {
        if (!this.badge) return;
        
        this.badge.textContent = count;
        this.badge.classList.remove('loading');
        
        if (count > 0) {
            this.badge.style.animation = 'pulse 0.5s ease-out';
            setTimeout(() => {
                this.badge.style.animation = 'pulse 2s infinite';
            }, 500);
        }
    }

    setupRealTimeListener() {
        const q = query(collection(db, "signalements"), orderBy("createdAt", "desc"));
        
        onSnapshot(q, 
            (snapshot) => {
                this.updateBadge(snapshot.size);
            },
            (error) => {
                console.error("Erreur lors de l'écoute des signalements:", error);
                if (this.badge) {
                    this.badge.textContent = "!";
                    this.badge.classList.remove('loading');
                }
            }
        );
    }
}

// Initialiser le service
export const notificationService = new NotificationService();
