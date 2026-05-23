# 🌾 शेतजमीन ट्रॅकर — Farmland Decision Tracker

A personal PWA to track, compare, score, and decide on farmland plots near Pune.

---

## 🚀 How to Deploy (Step by Step)

### What you need
- A **GitHub** account (free) → [github.com](https://github.com)
- A **Vercel** account (free) → [vercel.com](https://vercel.com) — sign in with your GitHub account

### Step 1: Create a GitHub Repository

1. Go to [github.com/new](https://github.com/new)
2. Repository name: `shetkjamin-tracker`
3. Keep it **Private** (your personal data will be on-device, but code stays private)
4. Click **Create repository**
5. You'll see an empty repo page — keep this tab open

### Step 2: Upload the Code to GitHub

**Option A — Upload via browser (easiest, no terminal needed):**

1. On your new empty repo page, click **"uploading an existing file"** link
2. Drag and drop ALL the files from the `shetkjamin-pwa` folder
3. Make sure the folder structure is preserved:
   ```
   shetkjamin-tracker/
   ├── index.html
   ├── package.json
   ├── vite.config.js
   ├── tailwind.config.js
   ├── postcss.config.js
   ├── .gitignore
   ├── public/
   │   ├── icon.svg
   │   ├── icon-192.png
   │   └── icon-512.png
   └── src/
       ├── main.jsx
       ├── App.jsx
       └── index.css
   ```
4. Click **Commit changes**

**Option B — Using terminal (if comfortable):**

```bash
cd shetkjamin-pwa
git init
git add .
git commit -m "Initial commit - Shetkjamin Tracker PWA"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/shetkjamin-tracker.git
git push -u origin main
```

### Step 3: Deploy on Vercel (One Click)

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **"Add New Project"**
3. Find your `shetkjamin-tracker` repo in the list → click **Import**
4. Vercel auto-detects it's a Vite project. Settings should show:
   - Framework Preset: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. Click **Deploy**
6. Wait 1-2 minutes ☕
7. You'll get a live URL like: `https://shetkjamin-tracker.vercel.app`

### Step 4: Install on Android Phone

1. Open the Vercel URL in **Chrome** on your Android phone
2. Wait for the page to fully load
3. You'll see a **"Add to Home Screen"** banner at the bottom — tap it
4. If you don't see the banner:
   - Tap the **⋮ three-dot menu** (top right in Chrome)
   - Tap **"Add to Home screen"**
   - Tap **"Install"**
5. The app icon (🌾) will appear on your home screen
6. Open it — it now runs like a native app (full screen, no browser bar)

### Step 5: Share with Madhura (Optional)

Just send her the Vercel URL. She can install the same way on her phone. Each device stores its own data independently.

---

## 📱 How It Works

- **All data stays on your phone** — nothing is sent to any server
- **Works offline** — once installed, the app works without internet
- **Backup/Restore** — use the Export menu to download a JSON backup; import on any device

---

## 🔄 How to Update the App

If I make changes to the code:

1. Download the updated `App.jsx` file
2. Replace it in your GitHub repo (`src/App.jsx`)
3. Commit the change
4. Vercel **auto-deploys** within 1-2 minutes
5. The app updates itself on your phone next time you open it

---

## 📋 Icon Setup (Optional Polish)

The placeholder icons work but look generic. To create proper icons:

1. Go to [favicon.io/emoji-favicon](https://favicon.io/emoji-favicon/) 
2. Select the 🌾 wheat emoji
3. Download the icon pack
4. Replace `public/icon-192.png` and `public/icon-512.png` with the downloaded files
5. Push to GitHub → Vercel auto-deploys

---

## 💾 Backup Your Data

Your data is stored in your phone's browser storage (IndexedDB). To avoid data loss:

1. Open the app → **अधिक** (More) tab → **Export / Backup**
2. Tap **JSON बॅकअप** → saves a backup file
3. Keep this file in Google Drive or WhatsApp "Saved Messages"
4. To restore: tap **JSON इम्पोर्ट** → select the backup file

**Do this before clearing browser data or resetting your phone!**

---

## 🛠 Local Development (Optional)

If you want to run it on your laptop for testing:

```bash
cd shetkjamin-pwa
npm install
npm run dev
```

Opens at `http://localhost:5173`. Changes auto-refresh.

To build for production:
```bash
npm run build
```

Output goes to `dist/` folder.
