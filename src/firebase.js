// ═══════════════════════════════════════════════════════
// FIREBASE CONFIG — Replace with YOUR project credentials
// See FIREBASE_SETUP.md for step-by-step instructions
// ═══════════════════════════════════════════════════════

import { initializeApp } from "firebase/app";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
 apiKey: "AIzaSyBMeJxYje1_I_jWligvsdVGfc2lgV63Duc",
  authDomain: "shetkjamin-tracker.firebaseapp.com",
  projectId: "shetkjamin-tracker",
  storageBucket: "shetkjamin-tracker.firebasestorage.app",
  messagingSenderId: "1072599352301",
  appId: "1:1072599352301:web:b12953437c501bd7031de4"
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
