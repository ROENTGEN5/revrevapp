// ─── Unified Data Service (Firebase Firestore + IndexedDB Fallback) ───
//
// Automatically uses Firebase Firestore when VITE_FIREBASE_API_KEY is configured.
// Falls back to browser IndexedDB if Firebase credentials are missing or offline.

import { db, auth } from '../firebase';
import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';

// ─── Firebase Helper Check ───────────────────────────────────────────
function isFirebaseConfigured() {
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY || '';
  return Boolean(apiKey && apiKey !== 'YOUR_API_KEY' && !apiKey.includes('YOUR_'));
}

// ─── IndexedDB Fallback Setup ────────────────────────────────────────
const DB_NAME = 'quizforge';
const DB_VERSION = 1;

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const database = event.target.result;
      if (!database.objectStoreNames.contains('modules')) {
        const moduleStore = database.createObjectStore('modules', { keyPath: 'id' });
        moduleStore.createIndex('createdAt', 'createdAt', { unique: false });
      }
      if (!database.objectStoreNames.contains('questions')) {
        const questionStore = database.createObjectStore('questions', { keyPath: 'id' });
        questionStore.createIndex('moduleId', 'moduleId', { unique: false });
      }
      if (!database.objectStoreNames.contains('attempts')) {
        const attemptStore = database.createObjectStore('attempts', { keyPath: 'id' });
        attemptStore.createIndex('moduleId', 'moduleId', { unique: false });
        attemptStore.createIndex('completedAt', 'completedAt', { unique: false });
      }
    };
  });
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 10);
}

function getAll(store) {
  return new Promise((resolve, reject) => {
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function getAllByIndex(store, indexName, value) {
  return new Promise((resolve, reject) => {
    const index = store.index(indexName);
    const req = index.getAll(value);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function getOne(store, id) {
  return new Promise((resolve, reject) => {
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// ─── Authentication ──────────────────────────────────────────────────

export async function signInAnonymous() {
  if (isFirebaseConfigured()) {
    try {
      const cred = await signInAnonymously(auth);
      return cred.user;
    } catch (err) {
      console.warn('Firebase auth failed, falling back to local user:', err);
    }
  }
  return { uid: 'local-user' };
}

export function getCurrentUser() {
  if (isFirebaseConfigured() && auth.currentUser) {
    return auth.currentUser;
  }
  return { uid: 'local-user' };
}

export function onAuthChange(callback) {
  if (isFirebaseConfigured()) {
    return onAuthStateChanged(auth, (user) => {
      callback(user || { uid: 'local-user' });
    });
  }
  setTimeout(() => callback({ uid: 'local-user' }), 0);
  return () => {};
}

// ─── Modules ─────────────────────────────────────────────────────────

export async function createModule({ title, description, questions }) {
  if (isFirebaseConfigured()) {
    try {
      const modRef = doc(collection(db, 'modules'));
      const moduleId = modRef.id;

      await setDoc(modRef, {
        title,
        description: description || '',
        questionCount: questions.length,
        status: 'published',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        userId: auth.currentUser?.uid || 'anonymous',
      });

      const batch = writeBatch(db);
      questions.forEach((q, index) => {
        const { _tempId, id, ...rest } = q;
        const qRef = doc(collection(db, 'modules', moduleId, 'questions'));
        batch.set(qRef, {
          ...rest,
          order: index,
        });
      });
      await batch.commit();

      return moduleId;
    } catch (err) {
      console.warn('Firebase error in createModule, using local fallback:', err);
    }
  }

  // IndexedDB Fallback
  const now = new Date();
  const moduleId = generateId();
  const moduleData = {
    id: moduleId,
    title,
    description: description || '',
    questionCount: questions.length,
    status: 'published',
    createdAt: now,
    updatedAt: now,
  };

  const database = await openDB();
  const tx = database.transaction(['modules', 'questions'], 'readwrite');
  tx.objectStore('modules').add(moduleData);

  const questionStore = tx.objectStore('questions');
  questions.forEach((q, index) => {
    const { _tempId, id, ...rest } = q;
    questionStore.add({
      ...rest,
      id: generateId(),
      moduleId,
      order: index,
    });
  });

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve(moduleId);
    tx.onerror = () => reject(tx.error);
  });
}

export async function getModules() {
  if (isFirebaseConfigured()) {
    try {
      const q = query(collection(db, 'modules'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      return snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt || new Date()),
        };
      });
    } catch (err) {
      console.warn('Firebase error in getModules, using local fallback:', err);
    }
  }

  // IndexedDB Fallback
  const database = await openDB();
  const tx = database.transaction('modules', 'readonly');
  const modules = await getAll(tx.objectStore('modules'));
  return modules.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export async function getModule(moduleId) {
  if (isFirebaseConfigured()) {
    try {
      const snap = await getDoc(doc(db, 'modules', moduleId));
      if (snap.exists()) {
        const data = snap.data();
        return {
          id: snap.id,
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
        };
      }
    } catch (err) {
      console.warn('Firebase error in getModule, trying local fallback:', err);
    }
  }

  // IndexedDB Fallback
  const database = await openDB();
  const tx = database.transaction('modules', 'readonly');
  const mod = await getOne(tx.objectStore('modules'), moduleId);
  if (!mod) throw new Error('Module not found');
  return mod;
}

export async function getModuleQuestions(moduleId) {
  if (isFirebaseConfigured()) {
    try {
      const qCol = collection(db, 'modules', moduleId, 'questions');
      const snap = await getDocs(qCol);
      if (!snap.empty) {
        const docs = snap.docs.map((d, index) => ({
          ...d.data(),
          id: index,
          firestoreId: d.id,
        }));
        return docs.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      }
    } catch (err) {
      console.warn('Firebase error in getModuleQuestions, trying local fallback:', err);
    }
  }

  // IndexedDB Fallback
  try {
    const database = await openDB();
    const tx = database.transaction('questions', 'readonly');
    const questions = await getAllByIndex(tx.objectStore('questions'), 'moduleId', moduleId);
    if (questions && questions.length > 0) {
      return questions
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .map((q, index) => ({
          ...q,
          id: index,
          firestoreId: q.id,
        }));
    }
  } catch (err) {
    console.warn('IndexedDB error in getModuleQuestions:', err);
  }

  return [];
}

// ─── Drafts ──────────────────────────────────────────────────────────

export async function createDraftModule({ title, description }) {
  if (isFirebaseConfigured()) {
    try {
      const modRef = doc(collection(db, 'modules'));
      await setDoc(modRef, {
        title: title || 'Untitled Module',
        description: description || '',
        questionCount: 0,
        status: 'draft',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        userId: auth.currentUser?.uid || 'anonymous',
      });
      return modRef.id;
    } catch (err) {
      console.warn('Firebase draft creation failed, fallback to local:', err);
    }
  }

  const now = new Date();
  const moduleId = generateId();
  const moduleData = {
    id: moduleId,
    title: title || 'Untitled Module',
    description: description || '',
    questionCount: 0,
    status: 'draft',
    createdAt: now,
    updatedAt: now,
  };

  const database = await openDB();
  const tx = database.transaction('modules', 'readwrite');
  tx.objectStore('modules').add(moduleData);
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve(moduleId);
    tx.onerror = () => reject(tx.error);
  });
}

export async function updateDraftModule(moduleId, { title, description }) {
  if (isFirebaseConfigured()) {
    try {
      const payload = { updatedAt: serverTimestamp() };
      if (title !== undefined) payload.title = title;
      if (description !== undefined) payload.description = description;
      await updateDoc(doc(db, 'modules', moduleId), payload);
      return;
    } catch (err) {
      console.warn('Firebase updateDraftModule error, fallback to local:', err);
    }
  }

  const database = await openDB();
  const tx = database.transaction('modules', 'readwrite');
  const store = tx.objectStore('modules');
  const mod = await getOne(store, moduleId);
  if (mod) {
    if (title !== undefined) mod.title = title;
    if (description !== undefined) mod.description = description;
    mod.updatedAt = new Date();
    store.put(mod);
  }
}

export async function saveDraftQuestions(moduleId, questions) {
  if (isFirebaseConfigured()) {
    try {
      const qSnap = await getDocs(collection(db, 'modules', moduleId, 'questions'));
      const batch = writeBatch(db);
      qSnap.docs.forEach((docSnap) => batch.delete(docSnap.ref));

      questions.forEach((q, index) => {
        const { _tempId, id, firestoreId, ...rest } = q;
        const qRef = doc(collection(db, 'modules', moduleId, 'questions'));
        batch.set(qRef, { ...rest, order: index });
      });

      await batch.commit();
      await updateDoc(doc(db, 'modules', moduleId), {
        questionCount: questions.length,
        updatedAt: serverTimestamp(),
      });
      return;
    } catch (err) {
      console.warn('Firebase saveDraftQuestions error, fallback to local:', err);
    }
  }

  const database = await openDB();
  const tx = database.transaction(['questions', 'modules'], 'readwrite');
  const questionStore = tx.objectStore('questions');
  const moduleStore = tx.objectStore('modules');

  const existingQuestions = await getAllByIndex(questionStore, 'moduleId', moduleId);
  existingQuestions.forEach((q) => questionStore.delete(q.id));

  questions.forEach((q, index) => {
    const { _tempId, id, firestoreId, ...rest } = q;
    questionStore.add({
      ...rest,
      id: generateId(),
      moduleId,
      order: index,
    });
  });

  const mod = await getOne(moduleStore, moduleId);
  if (mod) {
    mod.questionCount = questions.length;
    mod.updatedAt = new Date();
    moduleStore.put(mod);
  }
}

export async function publishModule(moduleId) {
  if (isFirebaseConfigured()) {
    try {
      await updateDoc(doc(db, 'modules', moduleId), {
        status: 'published',
        updatedAt: serverTimestamp(),
      });
      return;
    } catch (err) {
      console.warn('Firebase publish error, fallback to local:', err);
    }
  }

  const database = await openDB();
  const tx = database.transaction('modules', 'readwrite');
  const store = tx.objectStore('modules');
  const mod = await getOne(store, moduleId);
  if (mod) {
    mod.status = 'published';
    mod.updatedAt = new Date();
    store.put(mod);
  }
}

export async function deleteModule(moduleId) {
  if (isFirebaseConfigured()) {
    try {
      const qSnap = await getDocs(collection(db, 'modules', moduleId, 'questions'));
      const batch = writeBatch(db);
      qSnap.docs.forEach((d) => batch.delete(d.ref));
      batch.delete(doc(db, 'modules', moduleId));
      await batch.commit();
      return;
    } catch (err) {
      console.warn('Firebase deleteModule error, fallback to local:', err);
    }
  }

  const database = await openDB();
  const tx = database.transaction(['modules', 'questions', 'attempts'], 'readwrite');
  tx.objectStore('modules').delete(moduleId);

  const questions = await getAllByIndex(tx.objectStore('questions'), 'moduleId', moduleId);
  questions.forEach((q) => tx.objectStore('questions').delete(q.id));

  const attempts = await getAllByIndex(tx.objectStore('attempts'), 'moduleId', moduleId);
  attempts.forEach((a) => tx.objectStore('attempts').delete(a.id));
}

// ─── Attempts (Score Tracking) ──────────────────────────────────────

export async function saveAttempt({ moduleId, score, totalQuestions, answers }) {
  if (isFirebaseConfigured()) {
    try {
      const attRef = doc(collection(db, 'attempts'));
      await setDoc(attRef, {
        moduleId,
        score,
        totalQuestions,
        percentage: totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0,
        completedAt: serverTimestamp(),
        answers: answers.map((a) => ({
          questionId: a.id ?? a.questionId,
          userAnswer: a.userAnswer,
          isCorrect: a.isCorrect,
        })),
      });
      return attRef.id;
    } catch (err) {
      console.warn('Firebase saveAttempt error, fallback to local:', err);
    }
  }

  const now = new Date();
  const attemptId = generateId();
  const attemptData = {
    id: attemptId,
    moduleId,
    score,
    totalQuestions,
    percentage: totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0,
    completedAt: now,
    answers: answers.map((a) => ({
      questionId: a.id ?? a.questionId,
      userAnswer: a.userAnswer,
      isCorrect: a.isCorrect,
    })),
  };

  const database = await openDB();
  const tx = database.transaction('attempts', 'readwrite');
  tx.objectStore('attempts').add(attemptData);
  return attemptId;
}

export async function getAttemptHistory(moduleId) {
  if (isFirebaseConfigured()) {
    try {
      const q = query(
        collection(db, 'attempts'),
        where('moduleId', '==', moduleId),
        orderBy('completedAt', 'desc')
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          ...data,
          completedAt: data.completedAt?.toDate ? data.completedAt.toDate() : (data.completedAt || new Date()),
        };
      });
    } catch (err) {
      console.warn('Firebase getAttemptHistory error, fallback to local:', err);
    }
  }

  const database = await openDB();
  const tx = database.transaction('attempts', 'readonly');
  const attempts = await getAllByIndex(tx.objectStore('attempts'), 'moduleId', moduleId);
  return attempts.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
}

export async function getBestScore(moduleId) {
  const history = await getAttemptHistory(moduleId);
  if (history.length === 0) return null;
  return history.reduce((best, attempt) =>
    attempt.percentage > best.percentage ? attempt : best
  );
}

export async function getAllAttempts() {
  if (isFirebaseConfigured()) {
    try {
      const q = query(collection(db, 'attempts'), orderBy('completedAt', 'desc'));
      const snap = await getDocs(q);
      return snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          ...data,
          completedAt: data.completedAt?.toDate ? data.completedAt.toDate() : (data.completedAt || new Date()),
        };
      });
    } catch (err) {
      console.warn('Firebase getAllAttempts error, fallback to local:', err);
    }
  }

  const database = await openDB();
  const tx = database.transaction('attempts', 'readonly');
  const attempts = await getAll(tx.objectStore('attempts'));
  return attempts.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
}

// ─── Spaced Repetition (SM-2 / Leitner System) ─────────────────────

/**
 * Calculates next review interval & ease factor using the SM-2 Spaced Repetition algorithm.
 * rating: 1 (Again), 2 (Hard), 3 (Good), 4 (Easy)
 */
export function calculateSM2(rating, prevInterval = 0, prevRepetition = 0, prevEaseFactor = 2.5) {
  let interval = 1;
  let repetition = prevRepetition;
  let easeFactor = prevEaseFactor;
  let boxLevel = 1;

  if (rating === 1) {
    // Again (Reset)
    repetition = 0;
    interval = 1;
    boxLevel = 1;
  } else if (rating === 2) {
    // Hard
    repetition = Math.max(1, repetition + 1);
    interval = Math.max(2, Math.round((prevInterval || 1) * 1.2));
    easeFactor = Math.max(1.3, easeFactor - 0.15);
    boxLevel = 2;
  } else if (rating === 3) {
    // Good
    if (repetition === 0) interval = 1;
    else if (repetition === 1) interval = 6;
    else interval = Math.round((prevInterval || 6) * easeFactor);
    repetition += 1;
    boxLevel = Math.min(5, Math.max(2, repetition + 1));
  } else if (rating === 4) {
    // Easy
    if (repetition === 0) interval = 4;
    else if (repetition === 1) interval = 10;
    else interval = Math.round((prevInterval || 10) * easeFactor * 1.3);
    repetition += 1;
    easeFactor += 0.15;
    boxLevel = Math.min(5, Math.max(3, repetition + 2));
  }

  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + interval);

  return {
    interval,
    repetition,
    easeFactor,
    nextReviewDate,
    boxLevel,
  };
}

/**
 * Saves a user's difficulty rating for a question and updates its review schedule.
 */
export async function saveQuestionMastery(moduleId, questionDocId, rating, currentSrs = {}) {
  const srsData = calculateSM2(
    rating,
    currentSrs.interval,
    currentSrs.repetition,
    currentSrs.easeFactor
  );

  if (isFirebaseConfigured() && questionDocId) {
    try {
      const qRef = doc(db, 'modules', moduleId, 'questions', questionDocId);
      await updateDoc(qRef, {
        srs: {
          interval: srsData.interval,
          repetition: srsData.repetition,
          easeFactor: srsData.easeFactor,
          nextReviewDate: srsData.nextReviewDate,
          boxLevel: srsData.boxLevel,
          lastReviewedAt: serverTimestamp(),
        },
      });
      return srsData;
    } catch (err) {
      console.warn('Firebase saveQuestionMastery error, fallback to local:', err);
    }
  }

  // IndexedDB Fallback
  const database = await openDB();
  const tx = database.transaction('questions', 'readwrite');
  const store = tx.objectStore('questions');
  const q = await getOne(store, questionDocId);
  if (q) {
    q.srs = {
      interval: srsData.interval,
      repetition: srsData.repetition,
      easeFactor: srsData.easeFactor,
      nextReviewDate: srsData.nextReviewDate,
      boxLevel: srsData.boxLevel,
      lastReviewedAt: new Date(),
    };
    store.put(q);
  }

  return srsData;
}

/**
 * Get all questions due for review today across all modules.
 */
export async function getAllDueQuestions() {
  const modules = await getModules();
  const now = new Date();
  const dueItems = [];

  for (const mod of modules) {
    if (mod.status === 'draft') continue;
    const questions = await getModuleQuestions(mod.id);
    for (const q of questions) {
      const nextReview = q.srs?.nextReviewDate
        ? (q.srs.nextReviewDate?.toDate ? q.srs.nextReviewDate.toDate() : new Date(q.srs.nextReviewDate))
        : null;

      // Question is due if unrated or nextReviewDate is today/past
      if (!nextReview || nextReview <= now) {
        dueItems.push({
          ...q,
          moduleTitle: mod.title,
          moduleId: mod.id,
        });
      }
    }
  }

  return dueItems;
}

