# 🔥 Firebase Setup Guide — शेतजमीन ट्रॅकर

Follow these steps to create a FREE Firebase project and enable real-time sync.

**Time needed:** 10 minutes  
**Cost:** ₹0 (Firebase free tier is more than enough)

---

## Step 1: Create a Firebase Project

1. Go to **[console.firebase.google.com](https://console.firebase.google.com)**
2. Sign in with your Google account
3. Click **"Create a project"** (or "Add project")
4. Project name: `shetkjamin-tracker` (or anything you like)
5. **Disable** Google Analytics (you don't need it) → click Continue
6. Wait 30 seconds for the project to be created
7. Click **Continue** when done

---

## Step 2: Create a Web App

1. On the project overview page, click the **Web icon** (`</>`) to add a web app
2. App nickname: `shetkjamin-web`
3. ✅ Check **"Also set up Firebase Hosting"** (optional but useful)
4. Click **Register app**
5. You'll see a code block with your Firebase config — it looks like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...............",
  authDomain: "shetkjamin-tracker.firebaseapp.com",
  projectId: "shetkjamin-tracker",
  storageBucket: "shetkjamin-tracker.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123def456"
};
```

6. **Copy these values** — you'll need them in Step 4
7. Click **Continue to console**

---

## Step 3: Enable Cloud Firestore

1. In the left sidebar, click **"Build" → "Firestore Database"**
2. Click **"Create database"**
3. Choose **"Start in test mode"** (we'll secure it later)
4. Select a location: **asia-south1 (Mumbai)** — closest to Pune
5. Click **Enable**
6. Wait 30 seconds for the database to be created

### Set Security Rules

1. In Firestore, click the **"Rules"** tab
2. Replace the existing rules with:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /rooms/{roomId}/{document=**} {
      allow read, write: if true;
    }
  }
}
```

3. Click **"Publish"**

> **Note:** These rules allow anyone with the room code to read/write data. This is fine for a personal/family app. The room code acts as a shared password.

---

## Step 3b: Enable Firebase Storage (for Photos)

1. In the left sidebar, click **"Build" → "Storage"**
2. Click **"Get started"**
3. Choose **"Start in test mode"** → click Next
4. Select location: **asia-south1 (Mumbai)** → click Done
5. Click the **"Rules"** tab and replace with:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /rooms/{roomId}/{allPaths=**} {
      allow read, write: if true;
    }
  }
}
```

6. Click **"Publish"**

> **Storage free tier:** 5 GB storage, 1 GB/day downloads. More than enough for property photos.

---

## Step 4: Add Your Config to the App

1. Open the file `src/firebase.js` in a text editor
2. Replace the placeholder values with YOUR values from Step 2:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_ACTUAL_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id",
};
```

3. Save the file
4. Commit and push to GitHub → Vercel auto-deploys

---

## Step 5: Test the Sync

1. Open the app on your phone
2. Create a new room code (e.g., `A3K7BN`)
3. Add a test plot
4. Open the app on another device (laptop browser, Madhura's phone, etc.)
5. Enter the SAME room code
6. You should see the test plot appear within 1-2 seconds! 🎉

---

## How Sync Works

```
Your Phone                    Firebase (Cloud)                Madhura's Phone
    |                              |                              |
    |--- Add Plot "भोर प्लॉट" --->|                              |
    |                              |--- Sync instantly ---------->|
    |                              |                              |
    |                              |<--- Add Score 4/5 ----------|
    |<--- Sync instantly ----------|                              |
    |                              |                              |
```

- **Real-time:** Changes appear on all devices within 1-2 seconds
- **Offline:** App works without internet. Changes sync when you're back online
- **Family Code:** Everyone with the same code sees the same data
- **Free:** Firebase free tier allows 50,000 reads/day and 20,000 writes/day — your family won't come close to this

---

## Firebase Free Tier Limits (Spark Plan)

| Resource | Free Limit | Your Usage (estimated) |
|----------|-----------|----------------------|
| Firestore reads | 50,000/day | ~100-500/day |
| Firestore writes | 20,000/day | ~20-50/day |
| **Storage** | **5 GB** | **~50-200 MB** |
| **Storage downloads** | **1 GB/day** | **~10-50 MB/day** |
| Bandwidth | 10 GB/month | < 100 MB/month |

You're well within the free tier. Even with heavy use, you won't hit these limits.

---

## Troubleshooting

**"Permission denied" error:**
→ Check that your Firestore security rules are set to the ones in Step 3

**Data not syncing:**
→ Check your internet connection
→ Verify the Firebase config values in `src/firebase.js` match your project
→ Open browser console (F12) and check for errors

**App shows blank after entering room code:**
→ The room is new and empty — start adding plots!
→ If joining an existing room, verify the code is exactly right (case-sensitive)

**Want to start fresh:**
→ Go to Firebase Console → Firestore → delete the room document
→ Or use the "Delete All" option in the app's Export page

---

## Optional: Secure Your Rules Later

When you're confident the app works, you can tighten the rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /rooms/{roomId}/{document=**} {
      // Only allow reads/writes if the request has valid data
      allow read: if true;
      allow write: if request.resource.data != null;
    }
  }
}
```

For a personal family app, the simple rules from Step 3 are perfectly adequate.
