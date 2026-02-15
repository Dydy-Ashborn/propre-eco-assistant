import { db } from './config.js';
import { collection, getDocs, doc, getDoc, setDoc, updateDoc, deleteDoc, query, orderBy } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

export async function getAllCoproprietes() {
    const q = query(collection(db, 'coproprietes'), orderBy('nom'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function getCoproById(id) {
    const docRef = doc(db, 'coproprietes', id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
}

export async function getCoproByCode(code) {
    const copros = await getAllCoproprietes();
    return copros.find(c => c.code === code);
}

export async function addCopropriete(data) {
    const docId = data.code || data.nom.replace(/\s+/g, '_').toLowerCase();
    const docData = {
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    await setDoc(doc(db, 'coproprietes', docId), docData);
    return { id: docId, ...docData };
}

export async function updateCopropriete(id, data) {
    const docRef = doc(db, 'coproprietes', id);
    const updateData = {
        ...data,
        updatedAt: new Date().toISOString()
    };
    await updateDoc(docRef, updateData);
    return { id, ...updateData };
}

export async function deleteCopropriete(id) {
    await deleteDoc(doc(db, 'coproprietes', id));
}

export async function searchCoproprietes(searchTerm) {
    const allCopros = await getAllCoproprietes();
    const term = searchTerm.toLowerCase();
    return allCopros.filter(c => 
        c.nom?.toLowerCase().includes(term) ||
        c.adresse?.toLowerCase().includes(term) ||
        c.code?.toLowerCase().includes(term)
    );
}