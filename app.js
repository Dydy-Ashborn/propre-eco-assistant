
// --- Code patron ---
const PATRON_CODE = "1234";

// --- SDK Firebase ---
document.write('<script src="https://www.gstatic.com/firebasejs/10.12.3/firebase-app-compat.js"><\\/script>');
document.write('<script src="https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore-compat.js"><\\/script>');

window.addEventListener('DOMContentLoaded', () => {
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
});

window.ReportAPI = (function() {
  const db = () => firebase.firestore();
  let unlocked = false;

  function unlock(code) {
    if (code === PATRON_CODE) { unlocked = true; }
    return unlocked;
  }

  async function submit({ copro, description }) {
    if (!copro || !description) throw new Error('Champs requis');
    const payload = { copro, description, createdAt: Date.now() };
    const ref = await db().collection('signalements').add(payload);
    return ref.id;
  }

  async function list() {
    if (!unlocked) throw new Error('Non autorisé');
    const snap = await db().collection('signalements').orderBy('createdAt', 'desc').get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }

  async function remove(id) {
    if (!unlocked) throw new Error('Non autorisé');
    await db().collection('signalements').doc(id).delete();
    return true;
  }

  return { submit, list, remove, unlock };
})();
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-storage.js";

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
const storage = getStorage(app);

const form = document.getElementById('report-form');
const status = document.getElementById('status');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  status.textContent = "Envoi en cours…";

  const copro = document.getElementById('copro-input').value.trim();
  const employee = document.getElementById('employee-input').value.trim();
  const description = document.getElementById('desc-input').value.trim();
  const photos = document.getElementById('photo-input').files;

  if (!copro || !employee || !description) return;

  try {
    let photoURLs = [];

    // Upload des photos si présentes
    if (photos.length > 0) {
      for (let i = 0; i < photos.length; i++) {
        const file = photos[i];
        const storageRef = ref(storage, `signalements/${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        photoURLs.push(url);
      }
    }

    await addDoc(collection(db, "signalements"), {
      copro,
      employee,
      description,
      photos: photoURLs,
      createdAt: new Date()
    });

    status.textContent = "Signalement envoyé ✅";
    form.reset();
  } catch (err) {
    console.error(err);
    status.textContent = "Erreur lors de l’envoi ❌";
  }
});
