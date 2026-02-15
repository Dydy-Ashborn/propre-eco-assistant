// Configuration Firebase partagée
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyBzXEN0e-4dgh9NVVF7JGzpKtJrPnuzo0Y",
  authDomain: "copro-256d7.firebaseapp.com",
  projectId: "copro-256d7",
  storageBucket: "copro-256d7.firebasestorage.app",
  messagingSenderId: "665588381388",
  appId: "1:665588381388:web:a0567533ff1a62407db469",
  measurementId: "G-Y7YNZDDCTD"
};

// Initialisation Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, db, storage };
