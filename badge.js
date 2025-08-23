import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getFirestore, collection, getDocs, query, orderBy, onSnapshot } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBzXEN0e-4dgh9NVVF7JGzpKtJrPnuzo0Y",
    authDomain: "copro-256d7.firebaseapp.com",
    projectId: "copro-256d7",
    storageBucket: "copro-256d7.firebasestorage.app",
    messagingSenderId: "665588381388",
    appId: "1:665588381388:web:a0567533ff1a62407db469",
    measurementId: "G-Y7YNZDDCTD"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const notifBadge = document.getElementById('notifBadge');

// Service de notification
class NotificationService {
    constructor() {
        this.init();
    }

    async updateNotificationBadge() {
        try {
            const q = query(collection(db, "signalements"), orderBy("createdAt", "desc"));
            const querySnapshot = await getDocs(q);
            const count = querySnapshot.size;
            
            if (notifBadge) {
                notifBadge.textContent = count;
                notifBadge.classList.remove('loading');
                
                if (count > 0) {
                    notifBadge.style.animation = 'pulse 0.5s ease-out';
                    setTimeout(() => {
                        notifBadge.style.animation = 'gentlePulse 0.6s ease-out';
                    }, 500);
                }
            }
        } catch (error) {
            console.error("Erreur lors de la récupération du nombre de signalements:", error);
            if (notifBadge) {
                notifBadge.textContent = "!";
                notifBadge.classList.remove('loading');
            }
        }
    }

    setupRealTimeListener() {
        const q = query(collection(db, "signalements"), orderBy("createdAt", "desc"));
        onSnapshot(q, (snapshot) => {
            const count = snapshot.size;
            if (notifBadge) {
                notifBadge.textContent = count;
                notifBadge.classList.remove('loading');
                
                if (count > 0) {
                    notifBadge.style.animation = 'pulse 0.5s ease-out';
                    setTimeout(() => {
                        notifBadge.style.animation = 'pulse 2s infinite';
                    }, 500);
                }
            }
        }, (error) => {
            console.error("Erreur lors de l'écoute des signalements:", error);
            if (notifBadge) {
                notifBadge.textContent = "!";
                notifBadge.classList.remove('loading');
            }
        });
    }

    init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.updateNotificationBadge();
            this.setupRealTimeListener();
        });
    }
}

new NotificationService();