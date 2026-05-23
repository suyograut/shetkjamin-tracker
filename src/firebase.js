// ═══════════════════════════════════════════════════════
// FIREBASE CONFIG — Replace with YOUR project credentials
// See FIREBASE_SETUP.md for step-by-step instructions
// ═══════════════════════════════════════════════════════

import { initializeApp } from "firebase/app";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "PASTE_YOUR_API_KEY_HERE",
  authDomain: "PASTE_YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "PASTE_YOUR_PROJECT_ID",
  storageBucket: "PASTE_YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "PASTE_YOUR_SENDER_ID",
  appId: "PASTE_YOUR_APP_ID",
};

const app = initializeApp(firebaseConfig);

// Firestore with offline persistence (works without internet)
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});

// Firebase Storage for photo/file uploads
const storage = getStorage(app);

export { db, storage };
