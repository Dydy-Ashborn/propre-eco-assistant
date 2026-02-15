// --- Import Firebase ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getFirestore, collection, query, onSnapshot } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

// --- Configuration Firebase ---
const firebaseConfig = {
  apiKey: "AIzaSyBzXEN0e-4dgh9NVVF7JGzpKtJrPnuzo0Y",
  authDomain: "copro-256d7.firebaseapp.com",
  projectId: "copro-256d7",
  storageBucket: "copro-256d7.firebasestorage.app",
  messagingSenderId: "665588381388",
  appId: "1:665588381388:web:a0567533ff1a62407db469",
  measurementId: "G-Y7YNZDDCTD"
};

// --- Initialisation ---
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- Pastille de notification ---
const badge = document.getElementById("notifBadge");
const q = query(collection(db, "signalements"));

onSnapshot(q, (snapshot) => {
  const total = snapshot.docs.length;

  if (total > 0) {
    badge.style.display = "inline-block";
    badge.textContent = total;
  } else {
    badge.style.display = "none";
  }
});
