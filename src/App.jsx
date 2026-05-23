import { db, storage } from "./firebase";
import { collection, doc, onSnapshot, setDoc, deleteDoc, writeBatch } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
// Shetkjamin Tracker PWA
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Home, MapPin, Plus, Users, MoreHorizontal, ChevronLeft, ChevronDown, ChevronUp, Star, Share2, Download, Upload, Trash2, Edit3, Eye, Search, Phone, X, Check, TrendingUp, Droplets, FileText, Calculator, ClipboardList, Settings, Copy, Filter, MessageCircle, Navigation, Layers, CheckCircle, Circle, AlertCircle, Award, BarChart3, Wifi, WifiOff, Link2, LogOut, Camera, Image, Video, File, ExternalLink, Loader2 } from "lucide-react";

// ═══ CONSTANTS ═══
const STATUS_OPTS = [
  { v: "new", l: "नवीन (New)", c: "bg-blue-100 text-blue-700" },
  { v: "called", l: "फोन केला (Called)", c: "bg-purple-100 text-purple-700" },
  { v: "visit_planned", l: "भेट नियोजित (Visit Planned)", c: "bg-amber-100 text-amber-700" },
  { v: "visited", l: "भेट झाली (Visited)", c: "bg-cyan-100 text-cyan-700" },
  { v: "shortlisted", l: "आवडला ⭐ (Shortlisted)", c: "bg-green-100 text-green-700" },
  { v: "rejected", l: "नापसंत (Rejected)", c: "bg-red-100 text-red-700" },
  { v: "on_hold", l: "थांबा (On Hold)", c: "bg-gray-100 text-gray-600" },
  { v: "negotiation", l: "वाटाघाटी (Negotiating)", c: "bg-orange-100 text-orange-700" },
  { v: "closed", l: "अंतिम (Closed)", c: "bg-emerald-100 text-emerald-700" },
];
const DROP = {
  road: ["पक्का रस्ता (Paved)", "कच्चा रस्ता (Unpaved)", "मिश्र (Mixed)", "पावसाळ्यात अडचण (Monsoon Issue)"],
  soil: ["काळी माती (Black Cotton)", "लाल माती (Laterite)", "गाळाची माती (Loamy)", "मिश्र (Mixed)", "खडकाळ (Rocky)"],
  waterSrc: ["विहीर (Well)", "बोअरवेल (Borewell)", "नदी/ओढा (River/Stream)", "कालवा (Canal)", "धरण (Dam)", "पावसाचे पाणी (Rainfed)", "एकापेक्षा जास्त (Multiple)"],
  waterAvail: ["बारमाही (Year-round)", "९ महिने (9 months)", "फक्त पावसाळा (Monsoon only)", "अनिश्चित (Uncertain)"],
  elec: ["हो - जमिनीवर (Yes-On plot)", "हो - जवळ (Yes-Nearby)", "नाही - दूर (No-Far)", "नाही (No)"],
  network: ["चांगले (Good)", "मध्यम (Average)", "कमकुवत (Weak)", "नाही (None)"],
  terrain: ["सपाट (Flat)", "सौम्य उतार (Gentle slope)", "डोंगराळ (Hilly)", "मिश्र (Mixed)"],
  yesNo: ["हो (Yes)", "नाही (No)", "तपासणे बाकी (To Verify)"],
  owner: ["थेट मालक (Direct Owner)", "एजंटमार्फत (Via Agent)", "वारसा (Inherited)", "सरकारी (Govt)"],
  culture: ["कोकणासारखे मैत्रीपूर्ण (Konkan-like)", "चांगले (Good)", "सामान्य (Average)", "सावध राहावे (Cautious)", "माहीत नाही (Unknown)"],
};
const CRITERIA = [
  { k: "distance", l: "अंतर व सुलभता", e: "Distance & Access", w: 20 },
  { k: "water", l: "पाण्याची उपलब्धता", e: "Water Availability", w: 20 },
  { k: "soil", l: "मातीची सुपीकता", e: "Soil & Farmability", w: 15 },
  { k: "culture", l: "गावाचे वातावरण", e: "Village Culture", w: 15 },
  { k: "price", l: "किंमत / बजेट", e: "Price / Budget Fit", w: 10 },
  { k: "scenic", l: "निसर्गरम्यता", e: "Scenic & Peace", w: 5 },
  { k: "infra", l: "रस्ता व पायाभूत", e: "Road & Infra", w: 5 },
  { k: "legal", l: "कायदेशीर स्वच्छता", e: "Legal Clarity", w: 5 },
  { k: "appreciation", l: "भविष्यातील वाढ", e: "Future Value", w: 3 },
  { k: "farmhouse", l: "फार्महाऊस शक्यता", e: "Farmhouse", w: 2 },
];
const CHECKLIST = [
  { t: "📄 कागदपत्रे", items: ["७/१२ उतारा तपासला", "फेरफार नोंदी", "मालकी एकत्रित/विभागली", "वाद/दावा", "NA/वापर प्रतिबंध", "रस्ता कायदेशीर", "सीमा स्पष्ट"] },
  { t: "💧 पाणी", items: ["विहीर/बोअरवेल आहे?", "शेजारी बोअरवेल खोली", "नदी/ओढा/कालवा जवळ", "बारमाही/हंगामी पाणी", "सरासरी पाऊस", "पाणी साठवण शक्य", "शेततळे शक्य"] },
  { t: "🌍 जमीन", items: ["मातीचा प्रकार/रंग", "सपाट/उतार/डोंगर", "सध्याची पिके", "दगड/खडक", "पूर/पाणी साचणे", "झाडांचे आवरण", "शेती सक्रिय"] },
  { t: "🏠 सुविधा", items: ["शेवटचा 1km रस्ता", "वीज खांब अंतर", "मोबाईल नेटवर्क", "जवळचे गाव/बाजार", "शाळा/दवाखाना", "मजूर उपलब्धता", "केअरटेकर मिळेल?"] },
  { t: "👥 गाव", items: ["लोक कसे?", "शेजारी कोण?", "इतर शहरी खरेदीदार?", "सुरक्षितता", "कोकणासारखी उबदारता", "स्थानिक वाद?", "पिण्याचे पाणी?"] },
];
const BUDGET_EXTRA = [
  { k: "legal", l: "वकील/कागदपत्रे", d: 1.0 }, { k: "fencing", l: "कुंपण", d: 2.0 },
  { k: "borewell", l: "बोअरवेल+पंप", d: 2.5 }, { k: "drip", l: "ठिबक सिंचन", d: 1.0 },
  { k: "plantation", l: "फळझाड लागवड", d: 2.0 }, { k: "solar", l: "सोलर पॅनेल", d: 2.0 },
  { k: "waterTank", l: "पाणी साठवण", d: 1.0 }, { k: "misc", l: "शेड/अवजारे/रस्ता", d: 1.5 },
];
const ANNUAL = [
  { l: "केअरटेकर पगार", d: 120000 }, { l: "खत/कीटकनाशक", d: 40000 },
  { l: "वीज/पाणी", d: 20000 }, { l: "देखभाल/दुरुस्ती", d: 30000 },
  { l: "जमीन कर", d: 3000 }, { l: "प्रवास खर्च", d: 40000 },
];

const DEFAULT_WEIGHTS = CRITERIA.reduce((a, c) => ({ ...a, [c.k]: c.w }), {});

// ═══ HELPERS ═══
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const fmtR = (v) => v != null ? `₹${Number(v).toLocaleString("en-IN")}` : "—";
const scorePlot = (p, w) => {
  if (!p.scores) return 0;
  let tot = 0, ws = 0;
  CRITERIA.forEach((c) => { const s = p.scores[c.k] || 0; if (s > 0) { tot += s * (w[c.k] || c.w); ws += (w[c.k] || c.w); } });
  return ws > 0 ? tot / ws : 0;
};
const mkPlot = () => ({ id: uid(), name: "", taluka: "", village: "", gutNo: "", areaGuntha: "", ratePerGuntha: "", distKm: "", travelHrs: "", road: "", soil: "", waterSrc: "", borewellDepth: "", waterAvail: "", elec: "", network: "", terrain: "", surrounding: "", culture: "", existingCrops: "", farmhouseFeasible: "", sevenTwelve: "", ownerType: "", agentName: "", agentPhone: "", visitDate: "", visitNotes: "", photoLink: "", mapsLink: "", status: "new", scores: {}, checklist: {}, media: [] });
const mkAgent = () => ({ id: uid(), name: "", phone: "", area: "", referral: "", firstContact: "", trust: 3, commission: "", directOwner: false, notes: "" });
const waMsg = (p, w) => {
  const cost = p.areaGuntha && p.ratePerGuntha ? (p.areaGuntha * p.ratePerGuntha).toFixed(2) : "—";
  const sc = scorePlot(p, w);
  const st = STATUS_OPTS.find((s) => s.v === p.status);
  return `🌾 *शेतजमीन माहिती*\n\n📍 *${p.name || "—"}*\nगाव: ${p.village || "—"}, ता. ${p.taluka || "—"}\nगट नं.: ${p.gutNo || "—"}\n\n📐 क्षेत्रफळ: ${p.areaGuntha || "—"} गुंठे\n💰 दर: ₹${p.ratePerGuntha || "—"} लाख/गुंठा\n💰 एकूण: ₹${cost} लाख\n\n🚗 अंतर: ${p.distKm || "—"} km (${p.travelHrs || "—"} तास)\n💧 पाणी: ${p.waterAvail || "—"} — ${p.waterSrc || "—"}\n🛣️ रस्ता: ${p.road || "—"}\n🌱 माती: ${p.soil || "—"}\n📋 ७/१२: ${p.sevenTwelve || "—"}\n🏠 फार्महाऊस: ${p.farmhouseFeasible || "—"}\n\n⭐ गुण: ${sc > 0 ? sc.toFixed(1) + " / 5" : "—"}\n📌 स्थिती: ${st?.l || "—"}\n\n👤 एजंट: ${p.agentName || "—"} ${p.agentPhone ? "(📞 " + p.agentPhone + ")" : ""}\n${p.mapsLink ? "📍 नकाशा: " + p.mapsLink : ""}${p.visitNotes ? "\n\n📝 " + p.visitNotes : ""}`;
};

// ═══ STORAGE — Firebase Firestore ═══
const ROOM_KEY = "shetkjamin-room";
const getRoomCode = () => localStorage.getItem(ROOM_KEY) || "";
const setRoomCode = (code) => localStorage.setItem(ROOM_KEY, code);
const clearRoomCode = () => localStorage.removeItem(ROOM_KEY);
const genCode = () => { const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; let c = ""; for (let i = 0; i < 6; i++) c += chars[Math.floor(Math.random() * chars.length)]; return c; };

// Firestore write helpers (scoped to room)
const fbSavePlot = async (roomCode, plot) => { try { await setDoc(doc(db, "rooms", roomCode, "plots", plot.id), plot); } catch (e) { console.error("Plot save error:", e); } };
const fbDeletePlot = async (roomCode, id) => { try { await deleteDoc(doc(db, "rooms", roomCode, "plots", id)); } catch (e) { console.error("Plot delete error:", e); } };
const fbSaveAgent = async (roomCode, agent) => { try { await setDoc(doc(db, "rooms", roomCode, "agents", agent.id), agent); } catch (e) { console.error("Agent save error:", e); } };
const fbDeleteAgent = async (roomCode, id) => { try { await deleteDoc(doc(db, "rooms", roomCode, "agents", id)); } catch (e) { console.error("Agent delete error:", e); } };
const fbSaveSettings = async (roomCode, settings) => { try { await setDoc(doc(db, "rooms", roomCode, "config", "settings"), settings, { merge: true }); } catch (e) { console.error("Settings save error:", e); } };

// Bulk import helper
const fbBulkImport = async (roomCode, plots, agents, settings) => {
  try {
    const batch = writeBatch(db);
    plots.forEach((p) => batch.set(doc(db, "rooms", roomCode, "plots", p.id), p));
    agents.forEach((a) => batch.set(doc(db, "rooms", roomCode, "agents", a.id), a));
    batch.set(doc(db, "rooms", roomCode, "config", "settings"), settings, { merge: true });
    await batch.commit();
  } catch (e) { console.error("Bulk import error:", e); }
};

// ═══ MEDIA HELPERS ═══
const MEDIA_TYPES = [
  { v: "photo", l: "📷 फोटो", icon: Image },
  { v: "video", l: "🎬 व्हिडिओ", icon: Video },
  { v: "pdf", l: "📄 PDF", icon: FileText },
  { v: "doc", l: "📋 कागदपत्र", icon: File },
  { v: "link", l: "🔗 लिंक", icon: ExternalLink },
];

// Compress image to max ~800px wide, JPEG 0.7 quality
const compressImage = (file) => new Promise((resolve) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new window.Image();
    img.onload = () => {
      const maxW = 1200, maxH = 1200;
      let w = img.width, h = img.height;
      if (w > maxW) { h = (h * maxW) / w; w = maxW; }
      if (h > maxH) { w = (w * maxH) / h; h = maxH; }
      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      canvas.getContext("2d").drawImage(img, 0, 0, w, h);
      canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.75);
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
});

// Upload file to Firebase Storage
const uploadMedia = async (roomCode, plotId, file, isImage = false) => {
  const blob = isImage ? await compressImage(file) : file;
  const ext = file.name.split(".").pop() || "jpg";
  const fname = `${uid()}.${ext}`;
  const storageRef = ref(storage, `rooms/${roomCode}/plots/${plotId}/${fname}`);
  await uploadBytes(storageRef, blob);
  return await getDownloadURL(storageRef);
};

// Delete file from Firebase Storage
const deleteMedia = async (url) => {
  try { const r = ref(storage, url); await deleteObject(r); } catch (e) { console.warn("Storage delete:", e); }
};

// Detect link type from URL
const detectLinkType = (url) => {
  const u = url.toLowerCase();
  if (u.includes("drive.google.com") || u.includes("docs.google.com")) return { type: "gdrive", label: "Google Drive", color: "text-blue-600 bg-blue-50" };
  if (u.includes("onedrive") || u.includes("sharepoint")) return { type: "onedrive", label: "OneDrive", color: "text-blue-700 bg-blue-50" };
  if (u.includes("youtube.com") || u.includes("youtu.be")) return { type: "youtube", label: "YouTube", color: "text-red-600 bg-red-50" };
  if (u.includes("photos.google.com")) return { type: "gphotos", label: "Google Photos", color: "text-green-600 bg-green-50" };
  if (u.match(/\.(jpg|jpeg|png|gif|webp)(\?|$)/)) return { type: "image", label: "फोटो", color: "text-purple-600 bg-purple-50" };
  if (u.match(/\.(mp4|mov|avi|webm)(\?|$)/)) return { type: "video", label: "व्हिडिओ", color: "text-orange-600 bg-orange-50" };
  if (u.match(/\.(pdf)(\?|$)/)) return { type: "pdf", label: "PDF", color: "text-red-600 bg-red-50" };
  return { type: "link", label: "लिंक", color: "text-gray-600 bg-gray-100" };
};

// ═══ ROOM SETUP SCREEN ═══
function RoomSetup({ onJoin }) {
  const [mode, setMode] = useState(null); // null | "create" | "join"
  const [code, setCode] = useState("");
  const [genned, setGenned] = useState("");
  const [err, setErr] = useState("");

  const handleCreate = () => { const c = genCode(); setGenned(c); setMode("create"); };
  const handleJoinNew = () => { onJoin(genned); };
  const handleJoinExisting = () => {
    const clean = code.trim().toUpperCase();
    if (clean.length < 4) { setErr("कमीत कमी ४ अक्षरे हवीत"); return; }
    onJoin(clean);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="text-5xl mb-3">🌾</div>
          <h1 className="text-2xl font-bold text-emerald-900">शेतजमीन ट्रॅकर</h1>
          <p className="text-sm text-gray-500 mt-1">Farmland Decision Tracker</p>
        </div>

        {!mode && <div className="space-y-3">
          <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3 shadow-sm">
            <p className="text-sm text-gray-600 text-center">सुरू करण्यासाठी एक "कुटुंब कोड" तयार करा किंवा विद्यमान कोड टाका. हा कोड तुमचा डेटा सर्व फोनवर सिंक करतो.</p>
            <button onClick={handleCreate} className="w-full py-3 bg-emerald-700 text-white rounded-xl font-medium text-sm active:scale-95 transition-all">🆕 नवीन कोड तयार करा (Create New)</button>
            <button onClick={() => setMode("join")} className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium text-sm border border-gray-300 active:scale-95 transition-all">🔗 विद्यमान कोड टाका (Join Existing)</button>
          </div>
          <p className="text-[10px] text-gray-400 text-center">हा कोड कुटुंबाशी / मित्रांशी शेअर करा — सर्वांना समान डेटा दिसेल.</p>
        </div>}

        {mode === "create" && <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4 shadow-sm">
          <p className="text-sm text-gray-600 text-center">तुमचा कुटुंब कोड तयार झाला!</p>
          <div className="bg-emerald-50 border-2 border-emerald-300 rounded-xl p-4 text-center">
            <div className="text-xs text-emerald-600 mb-1">कुटुंब कोड (Family Code)</div>
            <div className="text-3xl font-mono font-bold text-emerald-800 tracking-[0.3em]">{genned}</div>
          </div>
          <p className="text-xs text-gray-500 text-center">हा कोड लिहून ठेवा आणि कुटुंबाशी शेअर करा.<br/>सर्वांना समान प्लॉट्स, गुण, एजंट दिसतील.</p>
          <button onClick={handleJoinNew} className="w-full py-3 bg-emerald-700 text-white rounded-xl font-medium text-sm active:scale-95">✓ सुरू करा (Start)</button>
          <button onClick={() => setMode(null)} className="w-full py-2 text-sm text-gray-500">← मागे</button>
        </div>}

        {mode === "join" && <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4 shadow-sm">
          <p className="text-sm text-gray-600 text-center">तुमच्या कुटुंबाने दिलेला कोड टाका:</p>
          <input type="text" value={code} onChange={(e) => { setCode(e.target.value.toUpperCase()); setErr(""); }} placeholder="उदा: A3K7BN" maxLength={10} className="w-full text-center text-2xl font-mono font-bold tracking-[0.3em] px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white uppercase" autoFocus />
          {err && <p className="text-xs text-red-500 text-center">{err}</p>}
          <button onClick={handleJoinExisting} className="w-full py-3 bg-emerald-700 text-white rounded-xl font-medium text-sm active:scale-95">🔗 जोडा (Join)</button>
          <button onClick={() => setMode(null)} className="w-full py-2 text-sm text-gray-500">← मागे</button>
        </div>}
      </div>
    </div>
  );
}

// ═══ UI PRIMITIVES ═══
const Badge = ({ status }) => { const s = STATUS_OPTS.find((o) => o.v === status); return s ? <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium ${s.c}`}>{s.l}</span> : null; };
const Btn = ({ children, onClick, v = "primary", className = "", disabled }) => {
  const cls = { primary: "bg-emerald-700 text-white active:bg-emerald-800", secondary: "bg-gray-100 text-gray-700 border border-gray-300 active:bg-gray-200", danger: "bg-red-50 text-red-600 border border-red-200" };
  return <button onClick={onClick} disabled={disabled} className={`inline-flex items-center justify-center gap-1.5 font-medium rounded-lg px-4 py-2.5 text-sm transition-all active:scale-95 disabled:opacity-40 ${cls[v] || cls.primary} ${className}`}>{children}</button>;
};
const Inp = ({ value, onChange, type = "text", placeholder, ...r }) => <input type={type} value={value ?? ""} onChange={(e) => onChange(type === "number" ? (e.target.value === "" ? "" : Number(e.target.value)) : e.target.value)} placeholder={placeholder} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white" {...r} />;
const Sel = ({ value, onChange, options, ph }) => <select value={value ?? ""} onChange={(e) => onChange(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"><option value="">{ph || "— निवडा —"}</option>{options.map((o) => <option key={o} value={o}>{o}</option>)}</select>;
const Txa = ({ value, onChange, rows = 3, placeholder }) => <textarea value={value ?? ""} onChange={(e) => onChange(e.target.value)} rows={rows} placeholder={placeholder} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white" />;
const Fld = ({ label, hint, children }) => <div className="space-y-1"><label className="block text-xs font-medium text-gray-600">{label}</label>{children}{hint && <p className="text-[10px] text-gray-400">{hint}</p>}</div>;
const Stars = ({ value, onChange, sz = 20 }) => <div className="flex gap-0.5">{[1,2,3,4,5].map((i) => <button key={i} type="button" onClick={() => onChange && onChange(i)} className="p-0.5"><Star size={sz} className={i <= (value||0) ? "fill-amber-400 text-amber-400" : "text-gray-300"} /></button>)}</div>;
const TopBar = ({ title, onBack, right }) => <div className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-gray-200 px-4 py-3 flex items-center gap-3">{onBack && <button onClick={onBack} className="p-1 -ml-1"><ChevronLeft size={22} className="text-gray-600" /></button>}<h1 className="text-lg font-bold text-gray-900 flex-1 truncate">{title}</h1>{right}</div>;
const StatCard = ({ label, value, icon: Icon }) => <div className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm"><div className="flex items-center gap-2 mb-1">{Icon && <Icon size={14} className="text-emerald-600" />}<span className="text-[10px] text-gray-500 uppercase tracking-wide">{label}</span></div><div className="text-xl font-bold text-gray-900">{value}</div></div>;
const Card = ({ children, className = "", onClick }) => <div onClick={onClick} className={`bg-white rounded-xl border border-gray-200 shadow-sm ${onClick ? "cursor-pointer active:scale-[0.99]" : ""} ${className}`}>{children}</div>;

// ═══ PLOT FORM (proper component) ═══
function PlotForm({ initial, onSave, onCancel, notify }) {
  const [p, setP] = useState(initial || mkPlot());
  const u = (k, v) => setP((prev) => ({ ...prev, [k]: v }));
  const [openSec, setOpen] = useState({ loc: true, price: true, dist: false, water: false, infra: false, village: false, agent: false });
  const toggle = (k) => setOpen((s) => ({ ...s, [k]: !s[k] }));
  const cost = p.areaGuntha && p.ratePerGuntha ? (p.areaGuntha * p.ratePerGuntha).toFixed(2) : null;

  const sec = (key, title, children) => (
    <div key={key} className="border border-gray-200 rounded-xl overflow-hidden bg-white">
      <button type="button" onClick={() => toggle(key)} className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 text-sm font-semibold text-gray-800">{title}{openSec[key] ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}</button>
      {openSec[key] && <div className="p-4 space-y-3 border-t border-gray-100">{children}</div>}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <TopBar title={initial ? "प्लॉट संपादन" : "नवीन प्लॉट"} onBack={onCancel} />
      <div className="p-4 space-y-3">
        {sec("loc", "📍 स्थान (Location)", <>
          <Fld label="प्लॉट नाव / ओळख *"><Inp value={p.name} onChange={(v) => u("name",v)} placeholder="उदा: भोर-पानशेत रोड प्लॉट" /></Fld>
          <Fld label="तालुका"><Inp value={p.taluka} onChange={(v) => u("taluka",v)} placeholder="उदा: भोर, मुळशी" /></Fld>
          <Fld label="गाव"><Inp value={p.village} onChange={(v) => u("village",v)} /></Fld>
          <Fld label="गट नंबर"><Inp value={p.gutNo} onChange={(v) => u("gutNo",v)} /></Fld>
          <Fld label="Google Maps लिंक"><Inp value={p.mapsLink} onChange={(v) => u("mapsLink",v)} placeholder="https://maps.google.com/..." /></Fld>
        </>)}
        {sec("price", "📐 क्षेत्रफळ व किंमत", <>
          <Fld label="एकूण क्षेत्रफळ (गुंठे)" hint="1 एकर = 40 गुंठे"><Inp value={p.areaGuntha} onChange={(v) => u("areaGuntha",v)} type="number" placeholder="120" /></Fld>
          <Fld label="दर प्रति गुंठा (₹ लाख)"><Inp value={p.ratePerGuntha} onChange={(v) => u("ratePerGuntha",v)} type="number" placeholder="0.5" /></Fld>
          {cost && <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-center"><span className="text-xs text-emerald-600">एकूण जमीन किंमत</span><div className="text-xl font-bold text-emerald-800">₹{cost} लाख</div></div>}
        </>)}
        {sec("dist", "🚗 अंतर व रस्ता", <>
          <Fld label="पुण्यापासून अंतर (km)"><Inp value={p.distKm} onChange={(v) => u("distKm",v)} type="number" /></Fld>
          <Fld label="प्रवास वेळ (तास)"><Inp value={p.travelHrs} onChange={(v) => u("travelHrs",v)} type="number" step="0.5" /></Fld>
          <Fld label="रस्त्याचा प्रकार"><Sel value={p.road} onChange={(v) => u("road",v)} options={DROP.road} /></Fld>
        </>)}
        {sec("water", "💧 पाणी व माती", <>
          <Fld label="पाण्याचा स्रोत"><Sel value={p.waterSrc} onChange={(v) => u("waterSrc",v)} options={DROP.waterSrc} /></Fld>
          <Fld label="पाण्याची उपलब्धता"><Sel value={p.waterAvail} onChange={(v) => u("waterAvail",v)} options={DROP.waterAvail} /></Fld>
          <Fld label="बोअरवेल खोली (ft)"><Inp value={p.borewellDepth} onChange={(v) => u("borewellDepth",v)} type="number" /></Fld>
          <Fld label="मातीचा प्रकार"><Sel value={p.soil} onChange={(v) => u("soil",v)} options={DROP.soil} /></Fld>
          <Fld label="उतार"><Sel value={p.terrain} onChange={(v) => u("terrain",v)} options={DROP.terrain} /></Fld>
        </>)}
        {sec("infra", "🏠 सुविधा व कायदेशीर", <>
          <Fld label="वीज"><Sel value={p.elec} onChange={(v) => u("elec",v)} options={DROP.elec} /></Fld>
          <Fld label="मोबाईल नेटवर्क"><Sel value={p.network} onChange={(v) => u("network",v)} options={DROP.network} /></Fld>
          <Fld label="फार्महाऊस बांधता येईल?"><Sel value={p.farmhouseFeasible} onChange={(v) => u("farmhouseFeasible",v)} options={DROP.yesNo} /></Fld>
          <Fld label="७/१२ स्वच्छ?"><Sel value={p.sevenTwelve} onChange={(v) => u("sevenTwelve",v)} options={DROP.yesNo} /></Fld>
          <Fld label="मालकाचा प्रकार"><Sel value={p.ownerType} onChange={(v) => u("ownerType",v)} options={DROP.owner} /></Fld>
        </>)}
        {sec("village", "👥 गाव व परिसर", <>
          <Fld label="गावातील वातावरण"><Sel value={p.culture} onChange={(v) => u("culture",v)} options={DROP.culture} /></Fld>
          <Fld label="शेजारील वापर"><Inp value={p.surrounding} onChange={(v) => u("surrounding",v)} placeholder="शेती, प्लॉटिंग, जंगल" /></Fld>
          <Fld label="सध्याची पिके / झाडे"><Inp value={p.existingCrops} onChange={(v) => u("existingCrops",v)} /></Fld>
        </>)}
        {sec("agent", "👤 एजंट व भेट", <>
          <Fld label="एजंट नाव"><Inp value={p.agentName} onChange={(v) => u("agentName",v)} /></Fld>
          <Fld label="एजंट फोन"><Inp value={p.agentPhone} onChange={(v) => u("agentPhone",v)} type="tel" /></Fld>
          <Fld label="भेट दिनांक"><Inp value={p.visitDate} onChange={(v) => u("visitDate",v)} type="date" /></Fld>
          <Fld label="स्थिती"><Sel value={p.status} onChange={(v) => u("status",v)} options={STATUS_OPTS.map((s) => s.v)} /></Fld>
          <Fld label="फोटो/व्हिडिओ लिंक"><Inp value={p.photoLink} onChange={(v) => u("photoLink",v)} /></Fld>
          <Fld label="टिपणे"><Txa value={p.visitNotes} onChange={(v) => u("visitNotes",v)} placeholder="जमिनीबद्दल तुमचे निरीक्षण..." /></Fld>
        </>)}
        <Btn onClick={() => { if (!p.name) { notify("प्लॉट नाव टाका"); return; } onSave(p); }} className="w-full"><Check size={18}/> सेव्ह करा</Btn>
      </div>
    </div>
  );
}

// ═══ PLOT DETAIL (proper component) ═══
function PlotDetail({ plot, weights, onBack, onEdit, onDelete, onUpdate, notify, roomCode }) {
  const [tab, setTab] = useState("info");
  const [uploading, setUploading] = useState(false);
  const [showAddLink, setShowAddLink] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkLabel, setLinkLabel] = useState("");
  const [viewImg, setViewImg] = useState(null);
  const p = plot;
  const cost = p.areaGuntha && p.ratePerGuntha ? (p.areaGuntha * p.ratePerGuntha).toFixed(2) : null;
  const sc = scorePlot(p, weights);
  const totalChecks = CHECKLIST.reduce((a, s) => a + s.items.length, 0);
  const doneChecks = Object.values(p.checklist || {}).filter(Boolean).length;
  const checkPct = totalChecks > 0 ? Math.round((doneChecks / totalChecks) * 100) : 0;

  const landCost = cost ? Number(cost) : 0;
  const fhCost = (1200 * 2200) / 100000;
  const budgetLines = [
    { l: "जमीन खरेदी", v: landCost }, { l: "मुद्रांक ~7%", v: landCost * 0.07 },
    ...BUDGET_EXTRA.map((b) => ({ l: b.l, v: b.d })), { l: "फार्महाऊस", v: fhCost },
  ];
  const totalBudget = budgetLines.reduce((a, b) => a + (Number(b.v) || 0), 0);

  const share = () => window.open(`https://wa.me/?text=${encodeURIComponent(waMsg(p, weights))}`, "_blank");
  const copyText = async () => { try { await navigator.clipboard.writeText(waMsg(p, weights)); notify("कॉपी झाले ✓"); } catch { notify("कॉपी करता आले नाही"); } };

  const info = [
    ["📍 गाव", `${p.village || "—"}, ता. ${p.taluka || "—"}`], ["🔢 गट नं.", p.gutNo],
    ["📐 क्षेत्रफळ", p.areaGuntha ? `${p.areaGuntha} गुंठे` : null], ["💰 दर/गुंठा", p.ratePerGuntha ? `₹${p.ratePerGuntha} लाख` : null],
    ["💰 एकूण", cost ? `₹${cost} लाख` : null], ["🚗 अंतर", p.distKm ? `${p.distKm} km` : null],
    ["⏱️ प्रवास", p.travelHrs ? `${p.travelHrs} तास` : null], ["🛣️ रस्ता", p.road], ["🌱 माती", p.soil],
    ["⛰️ उतार", p.terrain], ["💧 स्रोत", p.waterSrc], ["💧 उपलब्धता", p.waterAvail],
    ["🕳️ बोअरवेल", p.borewellDepth ? `${p.borewellDepth} ft` : null], ["⚡ वीज", p.elec], ["📶 नेटवर्क", p.network],
    ["🏠 फार्महाऊस", p.farmhouseFeasible], ["📋 ७/१२", p.sevenTwelve], ["👤 मालक", p.ownerType],
    ["👥 वातावरण", p.culture], ["🌿 पिके", p.existingCrops], ["🏘️ शेजार", p.surrounding],
    ["👤 एजंट", p.agentName ? `${p.agentName}${p.agentPhone ? ` (${p.agentPhone})` : ""}` : null], ["📅 भेट", p.visitDate],
  ].filter(([, v]) => v);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <TopBar title={p.name || "प्लॉट"} onBack={onBack} right={<div className="flex gap-1">
        <button onClick={onEdit} className="p-2 rounded-lg hover:bg-gray-100"><Edit3 size={18} className="text-gray-600"/></button>
        <button onClick={share} className="p-2 rounded-lg hover:bg-green-50"><MessageCircle size={18} className="text-green-600"/></button>
      </div>} />
      <div className="px-4 pt-3 flex gap-2 items-center flex-wrap">
        <Badge status={p.status} />
        {sc > 0 && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-700"><Star size={12} className="fill-amber-400"/> {sc.toFixed(1)}/5</span>}
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-xs text-gray-600"><ClipboardList size={12}/> {checkPct}%</span>
      </div>
      <div className="px-4 pt-3 flex gap-1 overflow-x-auto">
        {[["info","माहिती"],["media",`📷 मीडिया${(p.media||[]).length?` (${(p.media||[]).length})`:""}`],["score","⭐ गुण"],["check","✅ चेकलिस्ट"],["budget","💰 खर्च"]].map(([k,l]) =>
          <button key={k} onClick={() => setTab(k)} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${tab===k?"bg-emerald-700 text-white":"bg-gray-100 text-gray-600"}`}>{l}</button>
        )}
      </div>
      <div className="p-4">
        {tab === "info" && <div className="space-y-3">
          <Card className="divide-y divide-gray-100">{info.map(([l,v],i) => <div key={i} className="flex justify-between items-center px-4 py-2.5"><span className="text-xs text-gray-500">{l}</span><span className="text-sm font-medium text-gray-800 text-right max-w-[60%]">{v}</span></div>)}</Card>
          {p.visitNotes && <Card className="p-4"><div className="text-xs text-gray-500 mb-1">📝 टिपणे</div><div className="text-sm text-gray-700 whitespace-pre-wrap">{p.visitNotes}</div></Card>}
          {p.mapsLink && <a href={p.mapsLink} target="_blank" rel="noopener noreferrer"><Btn v="secondary" className="w-full"><Navigation size={16}/> Google Maps</Btn></a>}
          <div className="flex gap-2"><Btn v="secondary" onClick={copyText} className="flex-1"><Copy size={16}/> कॉपी</Btn><Btn onClick={share} className="flex-1"><MessageCircle size={16}/> WhatsApp</Btn></div>
          <div className="flex gap-2">
            <Btn v="secondary" onClick={() => onUpdate({ ...p, status: p.status === "shortlisted" ? "visited" : "shortlisted" })} className="flex-1">{p.status === "shortlisted" ? <><X size={16}/> Unshortlist</> : <><Star size={16}/> Shortlist</>}</Btn>
            <Btn v="danger" onClick={() => { if (confirm("हा प्लॉट डिलीट करायचा?")) onDelete(p.id); }} className="flex-1"><Trash2 size={16}/> डिलीट</Btn>
          </div>
        </div>}

        {/* ═══ MEDIA TAB ═══ */}
        {tab === "media" && <div className="space-y-3">
          {/* Action buttons */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Btn v="primary" className="w-full" disabled={uploading}>
                {uploading ? <><Loader2 size={16} className="animate-spin"/> अपलोड होत आहे...</> : <><Camera size={16}/> फोटो जोडा</>}
              </Btn>
              {!uploading && <input type="file" accept="image/*,video/*,.pdf" capture="environment" multiple onChange={async (e) => {
                const files = Array.from(e.target.files || []);
                if (!files.length) return;
                setUploading(true);
                try {
                  const newMedia = [...(p.media || [])];
                  for (const file of files) {
                    const isImg = file.type.startsWith("image/");
                    const isVid = file.type.startsWith("video/");
                    const url = await uploadMedia(roomCode, p.id, file, isImg);
                    newMedia.push({
                      id: uid(),
                      type: isImg ? "photo" : isVid ? "video" : "doc",
                      url,
                      name: file.name,
                      size: Math.round(file.size / 1024),
                      addedAt: new Date().toISOString(),
                    });
                  }
                  onUpdate({ ...p, media: newMedia });
                  notify(`${files.length} फाइल अपलोड ✓`);
                } catch (err) {
                  console.error(err);
                  notify("अपलोड error ✗");
                }
                setUploading(false);
                e.target.value = "";
              }} className="absolute inset-0 opacity-0 cursor-pointer" />}
            </div>
            <Btn v="secondary" onClick={() => setShowAddLink(!showAddLink)} className="flex-1"><Link2 size={16}/> लिंक जोडा</Btn>
          </div>

          {/* Add link form */}
          {showAddLink && <Card className="p-4 space-y-3">
            <div className="text-sm font-medium text-gray-700">🔗 लिंक जोडा (Google Drive, OneDrive, YouTube...)</div>
            <Fld label="URL *"><Inp value={linkUrl} onChange={setLinkUrl} placeholder="https://drive.google.com/..." /></Fld>
            <Fld label="नाव / लेबल"><Inp value={linkLabel} onChange={setLinkLabel} placeholder="उदा: ७/१२ उतारा, भेटीचा व्हिडिओ" /></Fld>
            <div className="flex gap-2">
              <Btn v="secondary" onClick={() => { setShowAddLink(false); setLinkUrl(""); setLinkLabel(""); }} className="flex-1">रद्द</Btn>
              <Btn onClick={() => {
                if (!linkUrl.trim()) { notify("URL टाका"); return; }
                const lt = detectLinkType(linkUrl);
                const newMedia = [...(p.media || []), {
                  id: uid(),
                  type: lt.type,
                  url: linkUrl.trim(),
                  name: linkLabel.trim() || lt.label,
                  addedAt: new Date().toISOString(),
                  isLink: true,
                }];
                onUpdate({ ...p, media: newMedia });
                setLinkUrl(""); setLinkLabel(""); setShowAddLink(false);
                notify("लिंक जोडली ✓");
              }} className="flex-1"><Check size={16}/> जोडा</Btn>
            </div>
          </Card>}

          {/* Photo gallery grid */}
          {(() => {
            const media = p.media || [];
            const photos = media.filter((m) => m.type === "photo" || (m.type === "image" && !m.isLink));
            const others = media.filter((m) => m.type !== "photo" && !(m.type === "image" && !m.isLink));

            return <>
              {photos.length > 0 && <div>
                <div className="text-xs text-gray-500 mb-2">📷 फोटो ({photos.length})</div>
                <div className="grid grid-cols-3 gap-1.5">
                  {photos.map((m) => (
                    <div key={m.id} className="relative group aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                      <img src={m.url} alt={m.name} className="w-full h-full object-cover cursor-pointer" onClick={() => setViewImg(m)} loading="lazy" />
                      <button onClick={(e) => { e.stopPropagation(); if (confirm("हा फोटो डिलीट?")) { if (!m.isLink) deleteMedia(m.url); onUpdate({ ...p, media: media.filter((x) => x.id !== m.id) }); notify("फोटो डिलीट ✓"); }}}
                        className="absolute top-1 right-1 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><X size={12} className="text-white"/></button>
                    </div>
                  ))}
                </div>
              </div>}

              {others.length > 0 && <div>
                <div className="text-xs text-gray-500 mb-2">📎 कागदपत्रे व लिंक्स ({others.length})</div>
                <div className="space-y-1.5">
                  {others.map((m) => {
                    const lt = detectLinkType(m.url);
                    const IconComp = m.type === "video" ? Video : m.type === "pdf" ? FileText : m.type === "doc" ? File : ExternalLink;
                    return (
                      <Card key={m.id} className="p-3 flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${lt.color}`}><IconComp size={20}/></div>
                        <div className="flex-1 min-w-0">
                          <a href={m.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-blue-700 hover:underline truncate block">{m.name || lt.label}</a>
                          <div className="text-[10px] text-gray-400 flex gap-2">
                            <span>{lt.label}</span>
                            {m.size && <span>{m.size}KB</span>}
                            {m.addedAt && <span>{new Date(m.addedAt).toLocaleDateString("mr-IN")}</span>}
                          </div>
                        </div>
                        <button onClick={() => { if (confirm("हे डिलीट?")) { if (!m.isLink) deleteMedia(m.url); onUpdate({...p, media: media.filter((x) => x.id !== m.id)}); notify("डिलीट ✓"); }}}
                          className="p-1.5 text-gray-400 hover:text-red-500 shrink-0"><Trash2 size={14}/></button>
                      </Card>
                    );
                  })}
                </div>
              </div>}

              {media.length === 0 && !showAddLink && <div className="text-center py-8">
                <div className="text-3xl mb-2">📁</div>
                <div className="text-gray-400 text-sm mb-1">अजून काही जोडलेले नाही</div>
                <div className="text-[10px] text-gray-300">फोटो काढा किंवा Google Drive / OneDrive लिंक जोडा</div>
              </div>}
            </>;
          })()}
        </div>}

        {/* Full-screen image viewer */}
        {viewImg && <div className="fixed inset-0 z-50 bg-black/95 flex flex-col" onClick={() => setViewImg(null)}>
          <div className="flex justify-between items-center p-4">
            <span className="text-white text-sm truncate flex-1">{viewImg.name}</span>
            <button className="text-white p-2"><X size={24}/></button>
          </div>
          <div className="flex-1 flex items-center justify-center p-4">
            <img src={viewImg.url} alt={viewImg.name} className="max-w-full max-h-full object-contain rounded-lg" />
          </div>
          <div className="p-4 flex gap-3 justify-center">
            <a href={viewImg.url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="px-4 py-2 bg-white/20 text-white rounded-lg text-sm">ओपन करा</a>
          </div>
        </div>}

        {tab === "score" && <div className="space-y-3">
          <Card className="p-4 space-y-4">{CRITERIA.map((c) => <div key={c.k}><div className="flex justify-between items-center mb-1"><span className="text-xs text-gray-600">{c.l} <span className="text-gray-400">({c.e})</span></span><span className="text-[10px] text-gray-400">{weights[c.k]}%</span></div><Stars value={p.scores?.[c.k]||0} onChange={(v) => onUpdate({...p, scores:{...p.scores,[c.k]:v}})}/></div>)}</Card>
          {sc > 0 && <Card className="p-4 text-center bg-amber-50 border-amber-200"><div className="text-xs text-amber-600 mb-1">भारित गुण</div><div className="text-3xl font-bold text-amber-700">{sc.toFixed(2)} <span className="text-lg">/ 5</span></div></Card>}
        </div>}

        {tab === "check" && <div className="space-y-3">
          <div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-emerald-600 h-2 rounded-full transition-all" style={{width:`${checkPct}%`}}/></div>
          <div className="text-xs text-gray-500 text-center">{doneChecks}/{totalChecks} ({checkPct}%)</div>
          {CHECKLIST.map((sec) => <Card key={sec.t} className="overflow-hidden">
            <div className="px-4 py-2.5 bg-gray-50 text-sm font-semibold text-gray-700 border-b">{sec.t}</div>
            <div className="divide-y divide-gray-50">{sec.items.map((item,i) => { const ck=`${sec.t}-${i}`; const done = p.checklist?.[ck]; return (
              <button key={ck} onClick={() => onUpdate({...p, checklist:{...p.checklist,[ck]:!done}})} className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50">
                {done ? <CheckCircle size={18} className="text-emerald-600 shrink-0"/> : <Circle size={18} className="text-gray-300 shrink-0"/>}
                <span className={`text-sm ${done ? "text-gray-400 line-through" : "text-gray-700"}`}>{item}</span>
              </button>
            );})}</div>
          </Card>)}
        </div>}

        {tab === "budget" && <div className="space-y-3">
          <Card className="divide-y divide-gray-100">
            {budgetLines.map((b,i) => <div key={i} className="flex justify-between px-4 py-2.5"><span className="text-xs text-gray-600">{b.l}</span><span className="text-sm font-medium">₹{Number(b.v).toFixed(2)} L</span></div>)}
            <div className="flex justify-between px-4 py-3 bg-emerald-50"><span className="text-sm font-bold text-emerald-800">एकूण अंदाजित खर्च</span><span className="text-lg font-bold text-emerald-800">₹{totalBudget.toFixed(2)} L</span></div>
          </Card>
          <Card className="p-4"><div className="text-xs text-gray-500 mb-2">वार्षिक खर्च</div>
            {ANNUAL.map((a,i) => <div key={i} className="flex justify-between py-1"><span className="text-xs text-gray-600">{a.l}</span><span className="text-xs">{fmtR(a.d)}</span></div>)}
            <div className="flex justify-between pt-2 mt-2 border-t"><span className="text-xs font-bold">एकूण वार्षिक</span><span className="text-xs font-bold text-emerald-700">{fmtR(ANNUAL.reduce((a,b)=>a+b.d,0))}</span></div>
          </Card>
        </div>}
      </div>
    </div>
  );
}

// ═══ AGENT FORM (proper component) ═══
function AgentForm({ initial, plots, onSave, onCancel, notify }) {
  const [a, setA] = useState(initial || mkAgent());
  const u = (k, v) => setA((prev) => ({ ...prev, [k]: v }));
  const linked = plots.filter((p) => p.agentName && a.name && p.agentName.toLowerCase().includes(a.name.toLowerCase()));
  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <TopBar title={a.name || "नवीन एजंट"} onBack={onCancel} />
      <div className="p-4 space-y-3">
        <Card className="p-4 space-y-3">
          <Fld label="नाव *"><Inp value={a.name} onChange={(v) => u("name",v)} /></Fld>
          <Fld label="फोन"><Inp value={a.phone} onChange={(v) => u("phone",v)} type="tel" /></Fld>
          <Fld label="कार्यक्षेत्र / तालुका"><Inp value={a.area} onChange={(v) => u("area",v)} placeholder="भोर, मुळशी, वेल्हे" /></Fld>
          <Fld label="कसा कळला?"><Inp value={a.referral} onChange={(v) => u("referral",v)} /></Fld>
          <Fld label="पहिला संपर्क"><Inp value={a.firstContact} onChange={(v) => u("firstContact",v)} type="date" /></Fld>
          <Fld label="कमिशन %"><Inp value={a.commission} onChange={(v) => u("commission",v)} /></Fld>
          <Fld label="विश्वासार्हता"><Stars value={a.trust} onChange={(v) => u("trust",v)} /></Fld>
          <Fld label="थेट मालकाशी भेट?"><button type="button" onClick={() => u("directOwner",!a.directOwner)} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${a.directOwner?"bg-green-100 text-green-700":"bg-gray-100 text-gray-500"}`}>{a.directOwner?"हो ✓":"नाही"}</button></Fld>
          <Fld label="टिपणे"><Txa value={a.notes} onChange={(v) => u("notes",v)} /></Fld>
        </Card>
        {linked.length > 0 && <Card className="p-4"><div className="text-xs text-gray-500 mb-2">🔗 या एजंटचे प्लॉट्स ({linked.length})</div>{linked.map((p) => <div key={p.id} className="text-sm py-1 flex items-center gap-2">• {p.name} <Badge status={p.status}/></div>)}</Card>}
        <Btn onClick={() => { if (!a.name) { notify("एजंट नाव टाका"); return; } onSave(a); }} className="w-full"><Check size={18}/> सेव्ह करा</Btn>
      </div>
    </div>
  );
}

// ═══ BUDGET CALCULATOR (proper component) ═══
function BudgetCalc({ onBack }) {
  const [inp, setInp] = useState({ g: 120, r: 0.5, fh: 1200, fr: 2200 });
  const land = inp.g * inp.r; const fhC = (inp.fh * inp.fr) / 100000;
  const lines = [{ l: "जमीन खरेदी", v: land }, { l: "मुद्रांक ~7%", v: land * 0.07 }, ...BUDGET_EXTRA.map((b) => ({ l: b.l, v: b.d })), { l: "फार्महाऊस", v: fhC }];
  const tot = lines.reduce((a, b) => a + b.v, 0);
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <TopBar title="💰 खर्च अंदाज" onBack={onBack} />
      <div className="p-4 space-y-3">
        <Card className="p-4 space-y-3"><div className="text-sm font-semibold text-gray-700">तुमचे इनपुट</div>
          <div className="grid grid-cols-2 gap-3">
            <Fld label="गुंठे"><Inp type="number" value={inp.g} onChange={(v) => setInp((p)=>({...p,g:v}))}/></Fld>
            <Fld label="दर/गुंठा (₹ लाख)"><Inp type="number" value={inp.r} onChange={(v) => setInp((p)=>({...p,r:v}))}/></Fld>
            <Fld label="फार्महाऊस (sq.ft.)"><Inp type="number" value={inp.fh} onChange={(v) => setInp((p)=>({...p,fh:v}))}/></Fld>
            <Fld label="बांधकाम दर (₹/sqft)"><Inp type="number" value={inp.fr} onChange={(v) => setInp((p)=>({...p,fr:v}))}/></Fld>
          </div>
        </Card>
        <Card className="divide-y divide-gray-100">
          {lines.map((b,i) => <div key={i} className="flex justify-between px-4 py-2.5"><span className="text-xs text-gray-600">{b.l}</span><span className="text-sm font-medium">₹{b.v.toFixed(2)} L</span></div>)}
          <div className="flex justify-between px-4 py-3 bg-emerald-50"><span className="text-sm font-bold text-emerald-800">एकूण प्रकल्प खर्च</span><span className="text-lg font-bold text-emerald-800">₹{tot.toFixed(2)} L</span></div>
        </Card>
        <Card className="p-4"><div className="text-xs text-gray-500 mb-2">वार्षिक खर्च</div>
          {ANNUAL.map((a,i) => <div key={i} className="flex justify-between py-1"><span className="text-xs text-gray-600">{a.l}</span><span className="text-xs">{fmtR(a.d)}</span></div>)}
          <div className="flex justify-between pt-2 mt-2 border-t"><span className="text-xs font-bold">एकूण वार्षिक</span><span className="text-xs font-bold text-emerald-700">{fmtR(ANNUAL.reduce((a,b)=>a+b.d,0))}</span></div>
        </Card>
      </div>
    </div>
  );
}

// ═══ MAIN APP ═══
export default function ShetkjaminApp() {
  const [roomCode, setRoomCodeState] = useState(getRoomCode);
  const [plots, setPlots] = useState([]);
  const [agents, setAgents] = useState([]);
  const [weights, setWeights] = useState(DEFAULT_WEIGHTS);
  const [presets, setPresets] = useState([]);
  const [activePreset, setActivePreset] = useState("default");
  const [decisions, setDecisions] = useState({});
  const [view, setView] = useState("dashboard");
  const [selId, setSelId] = useState(null);
  const [editPlot, setEditPlot] = useState(null);
  const [editAgent, setEditAgent] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setSF] = useState("all");
  const [showFilter, setShowF] = useState(false);
  const [sortBy, setSort] = useState("date");
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(true);
  const [showWeights, setShowWeights] = useState(false);
  const [presetNameInput, setPresetNameInput] = useState("");
  const [online, setOnline] = useState(navigator.onLine);

  const notify = (m) => { setToast(m); setTimeout(() => setToast(""), 2500); };

  // Online/offline tracking
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);

  // Room join handler
  const joinRoom = (code) => {
    setRoomCode(code);
    setRoomCodeState(code);
    setLoading(true);
  };
  const leaveRoom = () => {
    clearRoomCode();
    setRoomCodeState("");
    setPlots([]); setAgents([]); setWeights(DEFAULT_WEIGHTS); setPresets([]); setDecisions({});
    setView("dashboard");
  };

  // ═══ FIRESTORE REAL-TIME LISTENERS ═══
  useEffect(() => {
    if (!roomCode) { setLoading(false); return; }
    const unsubs = [];

    // Listen to plots collection
    unsubs.push(onSnapshot(collection(db, "rooms", roomCode, "plots"), (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setPlots(data);
    }, (err) => console.error("Plots listener error:", err)));

    // Listen to agents collection
    unsubs.push(onSnapshot(collection(db, "rooms", roomCode, "agents"), (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setAgents(data);
    }, (err) => console.error("Agents listener error:", err)));

    // Listen to settings document
    unsubs.push(onSnapshot(doc(db, "rooms", roomCode, "config", "settings"), (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        if (d.weights) setWeights(d.weights);
        if (d.presets) setPresets(d.presets || []);
        if (d.activePreset !== undefined) setActivePreset(d.activePreset);
        if (d.decisions) setDecisions(d.decisions);
      }
      setLoading(false);
    }, (err) => { console.error("Settings listener error:", err); setLoading(false); }));

    return () => unsubs.forEach((u) => u());
  }, [roomCode]);

  // ═══ CRUD — writes to Firestore (listeners update local state) ═══
  const savePlot = (p) => { fbSavePlot(roomCode, p); setEditPlot(null); setView("plots"); notify("✓ सेव्ह झाले"); };
  const updatePlot = (p) => { fbSavePlot(roomCode, p); };
  const deletePlot = (id) => { fbDeletePlot(roomCode, id); setSelId(null); setView("plots"); notify("डिलीट झाले"); };
  const saveAgent = (a) => { fbSaveAgent(roomCode, a); setEditAgent(null); notify("✓ एजंट सेव्ह"); };
  const deleteAgent = (id) => { fbDeleteAgent(roomCode, id); notify("एजंट डिलीट"); };

  // Settings writes (weights, presets, decisions)
  const saveSettings = useCallback((overrides = {}) => {
    const s = { weights, presets, activePreset, decisions, ...overrides };
    fbSaveSettings(roomCode, s);
  }, [roomCode, weights, presets, activePreset, decisions]);

  // Wrap weight/preset/decision changes to also persist
  const updateWeights = (w) => { setWeights(w); fbSaveSettings(roomCode, { weights: w }); };
  const updatePresets = (pr, ap) => { setPresets(pr); if (ap !== undefined) setActivePreset(ap); fbSaveSettings(roomCode, { presets: pr, ...(ap !== undefined ? { activePreset: ap } : {}) }); };
  const updateDecisions = (d) => { setDecisions(d); fbSaveSettings(roomCode, { decisions: d }); };

  const selPlot = plots.find((p) => p.id === selId);

  // filter/sort
  const filtered = useMemo(() => {
    let list = [...plots];
    if (statusFilter !== "all") list = list.filter((p) => p.status === statusFilter);
    if (search) { const q = search.toLowerCase(); list = list.filter((p) => [p.name,p.village,p.taluka,p.gutNo,p.agentName].some((f) => (f||"").toLowerCase().includes(q))); }
    if (sortBy === "score") list.sort((a,b) => scorePlot(b,weights) - scorePlot(a,weights));
    else if (sortBy === "price") list.sort((a,b) => (a.ratePerGuntha||999) - (b.ratePerGuntha||999));
    else if (sortBy === "distance") list.sort((a,b) => (a.distKm||999) - (b.distKm||999));
    else list.sort((a,b) => b.id > a.id ? 1 : -1);
    return list;
  }, [plots, statusFilter, search, sortBy, weights]);

  // stats
  const stats = useMemo(() => {
    const s = { total: plots.length, visited: 0, shortlisted: 0, rejected: 0, pending: 0 };
    const prices = [];
    plots.forEach((p) => { if(p.status==="visited")s.visited++; if(p.status==="shortlisted")s.shortlisted++; if(p.status==="rejected")s.rejected++; if(["new","called","visit_planned"].includes(p.status))s.pending++; if(p.ratePerGuntha)prices.push(Number(p.ratePerGuntha)); });
    s.avgPrice = prices.length ? (prices.reduce((a,b)=>a+b,0)/prices.length).toFixed(2) : "—";
    s.minPrice = prices.length ? Math.min(...prices).toFixed(2) : "—";
    s.maxPrice = prices.length ? Math.max(...prices).toFixed(2) : "—";
    const scored = plots.filter((p)=>scorePlot(p,weights)>0).sort((a,b)=>scorePlot(b,weights)-scorePlot(a,weights));
    s.top3 = scored.slice(0,3);
    s.within2hr = plots.filter((p)=>p.travelHrs && Number(p.travelHrs)<=2).length;
    s.goodWater = plots.filter((p)=>p.waterAvail && p.waterAvail.includes("बारमाही")).length;
    s.clearTitle = plots.filter((p)=>p.sevenTwelve && p.sevenTwelve.includes("स्वच्छ")).length;
    s.fhOk = plots.filter((p)=>p.farmhouseFeasible && p.farmhouseFeasible.includes("हो")).length;
    return s;
  }, [plots, weights]);

  // export
  const exportJson = () => { const d = JSON.stringify({plots,agents,weights,decisions,presets,activePreset,exportedAt:new Date().toISOString()},null,2); const b = new Blob([d],{type:"application/json"}); const u = URL.createObjectURL(b); const a = document.createElement("a"); a.href=u; a.download=`shetkjamin_backup_${new Date().toISOString().slice(0,10)}.json`; a.click(); URL.revokeObjectURL(u); notify("JSON बॅकअप ✓"); };
  const importJson = (e) => { const f=e.target.files?.[0]; if(!f)return; const r=new FileReader(); r.onload=(ev)=>{try{const d=JSON.parse(ev.target.result); fbBulkImport(roomCode, d.plots||[], d.agents||[], { weights:d.weights||DEFAULT_WEIGHTS, presets:d.presets||[], activePreset:d.activePreset||"default", decisions:d.decisions||{} }); notify(`${d.plots?.length||0} प्लॉट इम्पोर्ट ✓`);}catch{notify("फाइल error ✗");}}; r.readAsText(f); };
  const exportCsv = (shortOnly) => {
    const list = shortOnly ? plots.filter((p)=>p.status==="shortlisted") : plots;
    const hd = ["Name","Taluka","Village","Gut No","Area(Guntha)","Rate/Guntha(₹L)","Total(₹L)","Dist(km)","Travel(hrs)","Road","Soil","Water","Water Avail","7/12","Farmhouse","Score","Status","Agent","Phone","Maps","Notes"];
    const rows = list.map((p) => [p.name,p.taluka,p.village,p.gutNo,p.areaGuntha,p.ratePerGuntha,p.areaGuntha&&p.ratePerGuntha?(p.areaGuntha*p.ratePerGuntha).toFixed(2):"",p.distKm,p.travelHrs,p.road,p.soil,p.waterSrc,p.waterAvail,p.sevenTwelve,p.farmhouseFeasible,scorePlot(p,weights).toFixed(1),p.status,p.agentName,p.agentPhone,p.mapsLink,p.visitNotes].map((v)=>`"${String(v??"").replace(/"/g,'""')}"`).join(","));
    const csv = [hd.map((h)=>`"${h}"`).join(","),...rows].join("\n");
    const b = new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8"}); const u=URL.createObjectURL(b); const a=document.createElement("a"); a.href=u; a.download=`shetkjamin${shortOnly?"_shortlisted":""}.csv`; a.click(); URL.revokeObjectURL(u); notify("CSV ✓");
  };

  if (!roomCode) return <RoomSetup onJoin={joinRoom} />;
  if (loading) return <div className="flex items-center justify-center h-screen bg-gradient-to-b from-emerald-50 to-white"><div className="text-center"><div className="text-4xl mb-3">🌾</div><div className="text-emerald-800 font-semibold">शेतजमीन ट्रॅकर</div><div className="text-xs text-gray-400 mt-1">सिंक होत आहे...</div><div className="text-[10px] text-gray-300 mt-2">कोड: {roomCode}</div></div></div>;

  // ═══ ROUTING ═══
  if (view === "form") return <PlotForm initial={editPlot} onSave={savePlot} onCancel={() => { setEditPlot(null); setView(selId?"detail":"plots"); }} notify={notify} />;
  if (view === "detail" && selPlot) return <PlotDetail plot={selPlot} weights={weights} onBack={() => { setSelId(null); setView("plots"); }} onEdit={() => { setEditPlot(selPlot); setView("form"); }} onDelete={deletePlot} onUpdate={updatePlot} notify={notify} roomCode={roomCode} />;
  if (view === "agentForm") return <AgentForm initial={editAgent} plots={plots} onSave={(a) => { saveAgent(a); setView("agents"); }} onCancel={() => { setEditAgent(null); setView("agents"); }} notify={notify} />;
  if (view === "budgetCalc") return <BudgetCalc onBack={() => setView("more")} />;

  // decision notes
  if (view === "decisions") return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <TopBar title="📝 निर्णय नोट्स" onBack={() => setView("more")} />
      <div className="p-4 space-y-3">{[
        ["priority","🎯 सर्वात मोठे प्राधान्य?","पाणी > लोक > किंमत"],["budget","💰 एकूण बजेट?","₹50L / ₹1Cr"],
        ["retirement","🏡 निवृत्तीनंतर पूर्णवेळ?",""],["farmModel","🌱 कोणती शेती?","आंबा, पेरू, बांबू"],
        ["konkan","🌊 कोकण वातावरण महत्त्व?",""],["visitFreq","🚗 भेट वारंवारता?",""],
        ["shortlist1","⭐ Shortlist #1",""],["shortlist2","⭐ Shortlist #2",""],["shortlist3","⭐ Shortlist #3",""],
        ["finalDecision","✅ अंतिम निर्णय",""],["risks","⚠️ धोके",""],["nextAction","➡️ पुढील कृती",""],
      ].map(([k,label,hint]) => <Card key={k} className="p-4"><div className="text-xs font-medium text-gray-700 mb-1">{label}</div>{hint&&<div className="text-[10px] text-gray-400 mb-2">{hint}</div>}<Txa value={decisions[k]||""} onChange={(v) => { const nd = {...decisions,[k]:v}; setDecisions(nd); fbSaveSettings(roomCode, { decisions: nd }); }} rows={2}/></Card>)}</div>
    </div>
  );

  // export page
  if (view === "export") return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <TopBar title="📦 Export / Backup" onBack={() => setView("more")} />
      <div className="p-4 space-y-3">
        <Card className="p-4 space-y-3"><div className="text-sm font-semibold">💾 बॅकअप</div><Btn onClick={exportJson} className="w-full"><Download size={16}/> JSON बॅकअप</Btn><div className="relative"><Btn v="secondary" className="w-full"><Upload size={16}/> JSON इम्पोर्ट</Btn><input type="file" accept=".json" onChange={importJson} className="absolute inset-0 opacity-0 cursor-pointer"/></div></Card>
        <Card className="p-4 space-y-3"><div className="text-sm font-semibold">📊 CSV</div><Btn v="secondary" onClick={() => exportCsv(false)} className="w-full"><Download size={16}/> सर्व प्लॉट CSV</Btn><Btn v="secondary" onClick={() => exportCsv(true)} className="w-full"><Star size={16}/> Shortlisted CSV</Btn></Card>
        <Card className="p-4 space-y-3"><div className="text-sm font-semibold text-red-600">⚠️ रीसेट</div><Btn v="danger" onClick={async () => { if(confirm("सर्व डेटा डिलीट? हे सर्व डिव्हाइसवरून हटेल!")) { for(const p of plots) await fbDeletePlot(roomCode,p.id); for(const a of agents) await fbDeleteAgent(roomCode,a.id); await fbSaveSettings(roomCode,{weights:DEFAULT_WEIGHTS,presets:[],activePreset:"default",decisions:{}}); notify("सर्व डेटा डिलीट ✓"); }}} className="w-full"><Trash2 size={16}/> सर्व डेटा डिलीट</Btn></Card>
      </div>
    </div>
  );

  // scoring page
  if (view === "scoring") {
    const scored = plots.filter((p)=>scorePlot(p,weights)>0).sort((a,b)=>scorePlot(b,weights)-scorePlot(a,weights));
    const isDefault = JSON.stringify(weights) === JSON.stringify(DEFAULT_WEIGHTS);
    const loadPreset = (preset) => { updateWeights(preset.weights); setActivePreset(preset.id); fbSaveSettings(roomCode, { weights: preset.weights, activePreset: preset.id }); notify(`"${preset.name}" लोड ✓`); };
    const loadDefaults = () => { updateWeights({...DEFAULT_WEIGHTS}); setActivePreset("default"); fbSaveSettings(roomCode, { weights: {...DEFAULT_WEIGHTS}, activePreset: "default" }); notify("डिफॉल्ट वजन लोड ✓"); };
    const savePreset = () => {
      const name = presetNameInput.trim();
      if (!name) { notify("प्रीसेट नाव टाका"); return; }
      const id = uid();
      const newPresets = [...presets, { id, name, weights: {...weights}, createdAt: new Date().toISOString() }];
      updatePresets(newPresets, id);
      setPresetNameInput("");
      notify(`"${name}" सेव्ह ✓`);
    };
    const deletePreset = (id) => {
      const newPresets = presets.filter((p) => p.id !== id);
      if (activePreset === id) { updatePresets(newPresets, "default"); updateWeights({...DEFAULT_WEIGHTS}); }
      else { updatePresets(newPresets); }
      notify("प्रीसेट डिलीट ✓");
    };
    const activeLabel = activePreset === "default" ? "डिफॉल्ट (Default)" : (presets.find((p) => p.id === activePreset)?.name || "Custom");

    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <TopBar title="⭐ गुणांकन" onBack={() => setView("dashboard")} right={<button onClick={() => setShowWeights(!showWeights)} className="p-2 rounded-lg hover:bg-gray-100"><Settings size={18} className="text-gray-600"/></button>} />
        <div className="p-4 space-y-3">

          {/* Active preset indicator */}
          <div className="flex items-center gap-2 px-1">
            <span className="text-xs text-gray-500">सध्याचे वजन:</span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium border border-emerald-200">⚖️ {activeLabel}</span>
          </div>

          {showWeights && <Card className="p-4 space-y-4">

            {/* Weight sliders */}
            <div className="space-y-2">
              <div className="text-sm font-semibold text-gray-700">⚖️ वजन सेटिंग्ज (Weights)</div>
              {CRITERIA.map((c)=><div key={c.k} className="flex items-center gap-2">
                <span className="text-xs text-gray-600 flex-1">{c.l}</span>
                <input type="number" min={0} max={100} value={weights[c.k]} onChange={(e)=>{ const nw = {...weights,[c.k]:Number(e.target.value)}; updateWeights(nw); setActivePreset("custom"); fbSaveSettings(roomCode, { weights: nw, activePreset: "custom" }); }} className="w-16 px-2 py-1 text-sm border rounded text-center"/>
                <span className="text-[10px] text-gray-400">%</span>
              </div>)}
              <div className="flex justify-between pt-2 border-t border-gray-200">
                <span className="text-xs font-bold">एकूण</span>
                <span className={`text-xs font-bold ${Object.values(weights).reduce((a,b)=>a+b,0)===100?"text-green-600":"text-red-600"}`}>{Object.values(weights).reduce((a,b)=>a+b,0)}%</span>
              </div>
            </div>

            {/* Load default */}
            <div className="border-t border-gray-100 pt-3">
              <Btn v="secondary" onClick={loadDefaults} className={`w-full ${isDefault ? "opacity-50" : ""}`} disabled={isDefault}>
                <Download size={14}/> डिफॉल्ट वजन लोड करा (Load Defaults)
              </Btn>
            </div>

            {/* Save as preset */}
            <div className="border-t border-gray-100 pt-3 space-y-2">
              <div className="text-xs font-medium text-gray-600">💾 सध्याचे वजन सेव्ह करा (Save as Preset)</div>
              <div className="flex gap-2">
                <input type="text" value={presetNameInput} onChange={(e)=>setPresetNameInput(e.target.value)} placeholder="प्रीसेट नाव — उदा: Suyog, Madhura" className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"/>
                <Btn onClick={savePreset} className="shrink-0"><Check size={14}/> सेव्ह</Btn>
              </div>
            </div>

            {/* Saved presets list */}
            {presets.length > 0 && <div className="border-t border-gray-100 pt-3 space-y-2">
              <div className="text-xs font-medium text-gray-600">📋 सेव्ह केलेले प्रीसेट्स ({presets.length})</div>
              {presets.map((pr) => (
                <div key={pr.id} className={`flex items-center gap-2 p-2.5 rounded-lg border ${activePreset === pr.id ? "border-emerald-300 bg-emerald-50" : "border-gray-200 bg-white"}`}>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{pr.name}</div>
                    <div className="text-[10px] text-gray-400">{new Date(pr.createdAt).toLocaleDateString("mr-IN")}</div>
                  </div>
                  {activePreset === pr.id
                    ? <span className="text-[10px] text-emerald-600 font-medium px-2 py-1 bg-emerald-100 rounded-full">सक्रिय ✓</span>
                    : <button onClick={() => loadPreset(pr)} className="text-xs text-blue-600 font-medium px-2.5 py-1 bg-blue-50 rounded-full hover:bg-blue-100">लोड करा</button>
                  }
                  <button onClick={(e) => { e.stopPropagation(); if(confirm(`"${pr.name}" डिलीट करायचे?`)) deletePreset(pr.id); }} className="p-1 text-gray-400 hover:text-red-500"><Trash2 size={14}/></button>
                </div>
              ))}
            </div>}

          </Card>}

          {scored.length === 0 && <div className="text-center py-10 text-gray-400 text-sm">कोणत्याही प्लॉटला गुण नाहीत.<br/>प्लॉट → ⭐ गुण टॅब → रेटिंग द्या.</div>}
          {scored.map((p,i) => { const sc=scorePlot(p,weights); const str=CRITERIA.filter((c)=>(p.scores?.[c.k]||0)>=4).map((c)=>c.l); const wk=CRITERIA.filter((c)=>(p.scores?.[c.k]||0)>0&&(p.scores?.[c.k]||0)<=2).map((c)=>c.l); return (
            <Card key={p.id} onClick={() => { setSelId(p.id); setView("detail"); }} className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${i===0?"bg-amber-100 text-amber-700":i<3?"bg-gray-100 text-gray-700":"bg-gray-50 text-gray-500"}`}>#{i+1}</div>
                <div className="flex-1 min-w-0"><div className="text-sm font-semibold truncate">{p.name}</div><div className="text-[10px] text-gray-400">{p.village}, {p.taluka}</div></div>
                <div className="text-right"><div className="text-lg font-bold text-amber-600">{sc.toFixed(2)}</div><div className="text-[10px] text-gray-400">/ 5</div></div>
              </div>
              <div className="flex gap-4 mt-2">
                {str.length>0 && <div className="flex-1"><div className="text-[10px] text-green-600 font-medium mb-1">💪 सामर्थ्य</div>{str.map((s)=><div key={s} className="text-[10px] text-gray-600">• {s}</div>)}</div>}
                {wk.length>0 && <div className="flex-1"><div className="text-[10px] text-red-500 font-medium mb-1">⚠️ कमकुवत</div>{wk.map((w)=><div key={w} className="text-[10px] text-gray-600">• {w}</div>)}</div>}
              </div>
            </Card>
          );})}
        </div>
        <BottomNav view={view} setView={setView} setEditPlot={setEditPlot} />
      </div>
    );
  }

  // agents page
  if (view === "agents") return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <TopBar title={`👤 एजंट्स (${agents.length})`} onBack={() => setView("more")} right={<button onClick={() => { setEditAgent(mkAgent()); setView("agentForm"); }} className="p-2 rounded-lg bg-emerald-700"><Plus size={18} className="text-white"/></button>} />
      <div className="p-4 space-y-2.5">
        {agents.length === 0 && <div className="text-center py-10 text-gray-400 text-sm">एजंट नाही. + दाबा.</div>}
        {agents.map((a) => { const lc = plots.filter((p)=>p.agentName&&a.name&&p.agentName.toLowerCase().includes(a.name.toLowerCase())).length; return (
          <Card key={a.id} className="p-4" onClick={() => { setEditAgent(a); setView("agentForm"); }}>
            <div className="flex justify-between items-start"><div><div className="text-sm font-semibold">{a.name}</div><div className="text-xs text-gray-500 mt-0.5">{a.area||"—"}</div></div><Stars value={a.trust} sz={12}/></div>
            <div className="flex gap-3 mt-2 text-[11px] text-gray-500">{a.phone&&<span>📞 {a.phone}</span>}<span>📋 {lc} प्लॉट</span>{a.directOwner&&<span className="text-green-600">✓ मालक भेट</span>}</div>
          </Card>
        );})}
      </div>
    </div>
  );

  // more page
  if (view === "more") return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <TopBar title="अधिक" />
      <div className="p-4 space-y-2">
        {/* Sync status & room code */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {online ? <Wifi size={14} className="text-green-600"/> : <WifiOff size={14} className="text-red-500"/>}
              <span className={`text-xs font-medium ${online ? "text-green-600" : "text-red-500"}`}>{online ? "ऑनलाइन सिंक सुरू" : "ऑफलाइन — सिंक बंद"}</span>
            </div>
          </div>
          <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
            <div>
              <div className="text-[10px] text-gray-500">कुटुंब कोड (Family Code)</div>
              <div className="text-lg font-mono font-bold text-emerald-800 tracking-wider">{roomCode}</div>
            </div>
            <div className="flex gap-1">
              <button onClick={async () => { try { await navigator.clipboard.writeText(roomCode); notify("कोड कॉपी ✓"); } catch { notify("कॉपी error"); }}} className="p-2 rounded-lg bg-emerald-50 hover:bg-emerald-100"><Copy size={16} className="text-emerald-700"/></button>
              <button onClick={() => { const msg = `🌾 शेतजमीन ट्रॅकर\n\nहा अॅप इन्स्टॉल करा आणि खालील कोड टाका:\n\n📱 कोड: ${roomCode}\n🔗 अॅप: ${window.location.origin}\n\nसर्व प्लॉट, गुण, एजंट माहिती दिसेल.`; window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`,"_blank"); }} className="p-2 rounded-lg bg-green-50 hover:bg-green-100"><MessageCircle size={16} className="text-green-700"/></button>
            </div>
          </div>
          <p className="text-[10px] text-gray-400 mt-2">हा कोड कुटुंबाला / मित्रांना द्या — ते हाच कोड टाकून तुमचा डेटा पाहू शकतात.</p>
        </Card>

        {[
          {icon:Users,label:"👤 एजंट ट्रॅकर",to:"agents",desc:`${agents.length} एजंट`},
          {icon:Award,label:"⭐ गुणांकन",to:"scoring",desc:"तुलना व रँकिंग"},
          {icon:Calculator,label:"💰 खर्च अंदाज",to:"budgetCalc",desc:"प्रकल्प खर्च"},
          {icon:FileText,label:"📝 निर्णय नोट्स",to:"decisions",desc:"प्राधान्य व निर्णय"},
          {icon:Download,label:"📦 Export / Backup",to:"export",desc:"JSON, CSV, इम्पोर्ट"},
        ].map(({icon:Icon,label,to,desc}) => <Card key={to} onClick={() => setView(to)} className="p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center"><Icon size={20} className="text-emerald-700"/></div>
          <div className="flex-1"><div className="text-sm font-medium">{label}</div><div className="text-[10px] text-gray-400">{desc}</div></div>
          <ChevronDown size={16} className="text-gray-300 -rotate-90"/>
        </Card>)}

        {/* Disconnect */}
        <Card className="p-4" onClick={() => { if (confirm("या डिव्हाइसवरून डिस्कनेक्ट करायचे? (डेटा सर्व्हरवर सुरक्षित राहील)")) leaveRoom(); }}>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center"><LogOut size={20} className="text-red-500"/></div>
            <div className="flex-1"><div className="text-sm font-medium text-red-600">डिस्कनेक्ट (Switch Room)</div><div className="text-[10px] text-gray-400">वेगळा कोड टाकण्यासाठी</div></div>
          </div>
        </Card>
      </div>
      <BottomNav view={view} setView={setView} setEditPlot={setEditPlot} />
    </div>
  );

  // ═══ DASHBOARD ═══
  if (view === "dashboard") return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-gradient-to-br from-emerald-800 to-emerald-900 text-white px-5 pt-6 pb-8">
        <div className="flex items-center justify-between">
          <div className="text-2xl">🌾</div>
          <div className="flex items-center gap-1.5 bg-white/15 rounded-full px-2.5 py-1">
            {online ? <Wifi size={12}/> : <WifiOff size={12}/>}
            <span className="text-[10px] font-mono">{roomCode}</span>
          </div>
        </div>
        <h1 className="text-xl font-bold mt-1">शेतजमीन ट्रॅकर</h1><p className="text-emerald-200 text-xs mt-0.5">Farmland Decision Tracker</p>
      </div>
      <div className="px-4 -mt-4 space-y-4">
        <div className="grid grid-cols-2 gap-2.5">
          <StatCard label="एकूण प्लॉट" value={stats.total} icon={Layers}/>
          <StatCard label="Shortlisted" value={stats.shortlisted} icon={Star}/>
          <StatCard label="भेट झालेले" value={stats.visited} icon={Eye}/>
          <StatCard label="भेट बाकी" value={stats.pending} icon={AlertCircle}/>
        </div>
        {stats.total > 0 && <>
          <Card className="p-4"><div className="text-xs font-medium text-gray-500 mb-3">💰 दर प्रति गुंठा (₹ लाख)</div><div className="grid grid-cols-3 gap-3 text-center">
            <div><div className="text-lg font-bold text-green-700">{stats.minPrice}</div><div className="text-[10px] text-gray-400">कमीत कमी</div></div>
            <div><div className="text-lg font-bold text-blue-700">{stats.avgPrice}</div><div className="text-[10px] text-gray-400">सरासरी</div></div>
            <div><div className="text-lg font-bold text-red-600">{stats.maxPrice}</div><div className="text-[10px] text-gray-400">जास्तीत जास्त</div></div>
          </div></Card>
          <div className="grid grid-cols-2 gap-2.5">
            <StatCard label="≤2 तास" value={stats.within2hr} icon={Navigation}/>
            <StatCard label="बारमाही पाणी" value={stats.goodWater} icon={Droplets}/>
            <StatCard label="७/१२ स्वच्छ" value={stats.clearTitle} icon={FileText}/>
            <StatCard label="फार्महाऊस शक्य" value={stats.fhOk} icon={Home}/>
          </div>
          {stats.top3.length > 0 && <Card className="p-4"><div className="text-xs font-medium text-gray-500 mb-3">🏆 टॉप प्लॉट्स</div>
            {stats.top3.map((p,i) => <div key={p.id} onClick={() => { setSelId(p.id); setView("detail"); }} className="flex items-center gap-3 py-2 cursor-pointer hover:bg-gray-50 rounded-lg px-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${i===0?"bg-amber-100 text-amber-700":"bg-gray-100 text-gray-600"}`}>{i+1}</div>
              <div className="flex-1 min-w-0"><div className="text-sm font-medium truncate">{p.name}</div><div className="text-[10px] text-gray-400">{p.village}, {p.taluka}</div></div>
              <div className="text-sm font-bold text-amber-600">{scorePlot(p,weights).toFixed(1)}</div>
            </div>)}
          </Card>}
        </>}
        {stats.total === 0 && <Card className="p-8 text-center"><div className="text-3xl mb-2">📋</div><div className="text-gray-500 text-sm mb-3">अजून प्लॉट नाही</div><Btn onClick={() => { setEditPlot(null); setView("form"); }}><Plus size={16}/> पहिला प्लॉट जोडा</Btn></Card>}
      </div>
      <BottomNav view={view} setView={setView} setEditPlot={setEditPlot} />
    </div>
  );

  // ═══ PLOT LIST ═══
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <TopBar title={`प्लॉट्स (${filtered.length})`} right={<button onClick={() => setShowF(!showFilter)} className={`p-2 rounded-lg ${showFilter?"bg-emerald-100":"hover:bg-gray-100"}`}><Filter size={18} className={showFilter?"text-emerald-700":"text-gray-600"}/></button>} />
      <div className="px-4 pt-2 space-y-2">
        <div className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/><input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="शोधा... (नाव, गाव, तालुका)" className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"/></div>
        {showFilter && <Card className="p-3 space-y-2">
          <Fld label="स्थिती"><select value={statusFilter} onChange={(e)=>setSF(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white"><option value="all">सर्व</option>{STATUS_OPTS.map((s)=><option key={s.v} value={s.v}>{s.l}</option>)}</select></Fld>
          <Fld label="क्रमवारी"><select value={sortBy} onChange={(e)=>setSort(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white"><option value="date">नवीनतम</option><option value="score">गुणांक ↓</option><option value="price">किंमत ↑</option><option value="distance">अंतर ↑</option></select></Fld>
        </Card>}
      </div>
      <div className="px-4 pt-3 space-y-2.5">
        {filtered.length === 0 && <div className="text-center py-10 text-gray-400 text-sm">कोणताही प्लॉट नाही</div>}
        {filtered.map((p) => { const cost = p.areaGuntha && p.ratePerGuntha ? (p.areaGuntha*p.ratePerGuntha).toFixed(1) : null; const sc = scorePlot(p,weights); return (
          <Card key={p.id} onClick={() => { setSelId(p.id); setView("detail"); }} className="p-4">
            <div className="flex justify-between items-start mb-2"><div className="flex-1 min-w-0"><h3 className="text-sm font-semibold text-gray-900 truncate">{p.name||"—"}</h3><p className="text-xs text-gray-500 mt-0.5">{p.village?p.village+", ":""}{p.taluka||"—"}</p></div><Badge status={p.status}/></div>
            <div className="grid grid-cols-3 gap-2 text-center mt-2">
              <div className="bg-gray-50 rounded-lg p-2"><div className="text-xs text-gray-500">गुंठे</div><div className="text-sm font-bold">{p.areaGuntha||"—"}</div></div>
              <div className="bg-gray-50 rounded-lg p-2"><div className="text-xs text-gray-500">दर/गुंठा</div><div className="text-sm font-bold">{p.ratePerGuntha?`₹${p.ratePerGuntha}L`:"—"}</div></div>
              <div className="bg-emerald-50 rounded-lg p-2"><div className="text-xs text-emerald-600">एकूण</div><div className="text-sm font-bold text-emerald-700">{cost?`₹${cost}L`:"—"}</div></div>
            </div>
            <div className="flex items-center gap-3 mt-2 text-[11px] text-gray-500">
              {p.distKm&&<span>🚗 {p.distKm}km</span>}{p.travelHrs&&<span>⏱️ {p.travelHrs}hr</span>}{p.waterAvail&&<span>💧 {p.waterAvail.split(" ")[0]}</span>}
              {(p.media||[]).length>0&&<span>📷 {(p.media||[]).length}</span>}
              {sc>0&&<span className="ml-auto font-semibold text-amber-600">⭐ {sc.toFixed(1)}</span>}
            </div>
          </Card>
        );})}
      </div>
      <BottomNav view={view} setView={setView} setEditPlot={setEditPlot} />
    </div>
  );
}

// ═══ BOTTOM NAV ═══
function BottomNav({ view, setView, setEditPlot }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 shadow-lg">
      <div className="max-w-lg mx-auto flex">
        {[
          { v: "dashboard", icon: Home, label: "होम" },
          { v: "plots", icon: MapPin, label: "प्लॉट्स" },
          { v: "form", icon: Plus, label: "जोडा", special: true },
          { v: "scoring", icon: Award, label: "गुण" },
          { v: "more", icon: MoreHorizontal, label: "अधिक" },
        ].map(({ v, icon: Icon, label, special }) => (
          <button key={v} onClick={() => { if (v === "form") setEditPlot(null); setView(v); }}
            className={`flex-1 flex flex-col items-center py-2 ${special ? "" : view === v ? "text-emerald-700" : "text-gray-400"}`}>
            {special ? <div className="w-11 h-11 -mt-5 bg-emerald-700 rounded-full flex items-center justify-center shadow-lg"><Icon size={22} className="text-white" /></div> : <Icon size={20} />}
            <span className={`text-[10px] mt-0.5 ${special ? "text-emerald-700 font-medium" : ""}`}>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
