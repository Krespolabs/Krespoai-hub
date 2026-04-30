import { useState, useEffect, useCallback, useRef } from "react";
import {
  BookOpen, Zap, Film, Briefcase, Heart, LayoutDashboard,
  Sparkles, Download, FileText, Check, X, ChevronLeft,
  MoreHorizontal, Eye, EyeOff, LogOut, Clock, Trash2,
  Search, AlertCircle, Star, CreditCard, CheckCircle,
  ArrowRight, Lock, Receipt, TrendingUp, Crown,
  ShoppingBag, Upload, Flame, BarChart2, Package,
  PlusCircle, RefreshCw, Copy, User, Globe
} from "lucide-react";

// ── SUPABASE CONFIG ───────────────────────────────────────────────
const SB_URL = "https://hpwlxdtqxtzbbhyjkwzi.supabase.co";
const SB_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhwd2x4ZHRxeHR6YmJoeWprd3ppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyNTk5NDIsImV4cCI6MjA5MjgzNTk0Mn0.jPaeb4Ld4nCSdcG_IkDD4l8uGi_1recOpeeFcJJHEWM";

// In-memory token (persisted via window.storage)
let _token = null;
let _userId = null;

const sbH = (extra = {}) => ({
  "apikey": SB_ANON,
  "Authorization": `Bearer ${_token || SB_ANON}`,
  "Content-Type": "application/json",
  "Prefer": "return=representation",
  ...extra
});

// ── SUPABASE AUTH ─────────────────────────────────────────────────
const sbSignUp = async (email, password, name) => {
  const r = await fetch(`${SB_URL}/auth/v1/signup`, {
    method: "POST",
    headers: { "apikey": SB_ANON, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, data: { name } })
  });
  return r.json();
};

const sbSignIn = async (email, password) => {
  const r = await fetch(`${SB_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { "apikey": SB_ANON, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  return r.json();
};

const sbSignOut = async () => {
  await fetch(`${SB_URL}/auth/v1/logout`, {
    method: "POST", headers: sbH()
  });
  _token = null; _userId = null;
};

const sbGetUser = async () => {
  if (!_token) return null;
  const r = await fetch(`${SB_URL}/auth/v1/user`, { headers: sbH() });
  if (!r.ok) return null;
  return r.json();
};

// ── SUPABASE DB ───────────────────────────────────────────────────
const db = {
  get: async (table, query = "") => {
    const r = await fetch(`${SB_URL}/rest/v1/${table}${query}`, { headers: sbH() });
    if (!r.ok) return [];
    const d = await r.json();
    return Array.isArray(d) ? d : [d];
  },
  post: async (table, body) => {
    const r = await fetch(`${SB_URL}/rest/v1/${table}`, {
      method: "POST", headers: sbH(), body: JSON.stringify(body)
    });
    if (!r.ok) { const e = await r.text(); throw new Error(e); }
    const d = await r.json();
    return Array.isArray(d) ? d[0] : d;
  },
  patch: async (table, query, body) => {
    const r = await fetch(`${SB_URL}/rest/v1/${table}${query}`, {
      method: "PATCH", headers: sbH(), body: JSON.stringify(body)
    });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },
  del: async (table, query) => {
    await fetch(`${SB_URL}/rest/v1/${table}${query}`, {
      method: "DELETE", headers: sbH()
    });
  }
};

// ── DESIGN TOKENS ─────────────────────────────────────────────────
const C = {
  bg: "#07070E", card: "#0D0D1A", card2: "#111122",
  border: "rgba(255,255,255,.07)", borderGold: "rgba(240,165,0,.2)",
  text: "#F2F2FF", sub: "#9898B8", muted: "#525270",
  gold: "#F0A500", goldText: "#FFB800", goldDim: "rgba(240,165,0,.08)",
  cyan: "#00C8F0", cyanDim: "rgba(0,200,240,.08)",
  purple: "#9B72FF", purpleDim: "rgba(155,114,255,.1)",
  green: "#0DDB72", greenDim: "rgba(13,219,114,.08)",
  red: "#FF4444", redDim: "rgba(255,68,68,.08)",
};

// ── TYPE SCALE ────────────────────────────────────────────────────
const T = {
  display:  { fontSize: 28, fontWeight: 800, lineHeight: 1.15, letterSpacing: "-0.5px" },
  h1:       { fontSize: 22, fontWeight: 800, lineHeight: 1.2 },
  h2:       { fontSize: 18, fontWeight: 700, lineHeight: 1.25 },
  h3:       { fontSize: 15, fontWeight: 700, lineHeight: 1.3 },
  bodyLg:   { fontSize: 14, fontWeight: 400, lineHeight: 1.75 },
  body:     { fontSize: 13, fontWeight: 400, lineHeight: 1.7 },
  sm:       { fontSize: 12, fontWeight: 400, lineHeight: 1.6 },
  caption:  { fontSize: 11, fontWeight: 500, lineHeight: 1.55 },
  label:    { fontSize: 10, fontWeight: 700, letterSpacing: "0.6px", textTransform: "uppercase" },
};

// ── CONSTANTS ─────────────────────────────────────────────────────
const PLANS = {
  free:       { name: "Free",       credits: 5,     price: 0,     priceNGN: 0 },
  pro:        { name: "Pro",        credits: 200,   price: 12,    priceNGN: 5000 },
  enterprise: { name: "Enterprise", credits: 99999, price: 49,    priceNGN: 20000 },
};

const MOD_COLORS = {
  "Ebook Generator": C.gold, "Prompt Arena": C.cyan,
  "Content Hub": C.purple, "Business Builder": C.green,
  "Health & Education": "#FF6B9D",
};
const MOD_ICONS = {
  "Ebook Generator": "📘", "Prompt Arena": "⚡",
  "Content Hub": "🎬", "Business Builder": "💼",
  "Health & Education": "🩺",
};
const MKT_CATS = [
  {id:"all",l:"All",e:"🌟"},{id:"image-gen",l:"Image Gen",e:"🖼️"},
  {id:"video",l:"Video",e:"🎬"},{id:"copy",l:"Copy",e:"✍️"},
  {id:"business",l:"Business",e:"💼"},{id:"social",l:"Social",e:"📱"},
  {id:"health",l:"Health",e:"❤️"},
];
const SEED_PACKS = [
  { id:"seed1", title:"Ultimate MidJourney Cinematic Pack", seller:"KrespoLabs", sellerAvatar:"K", category:"image-gen", price:1500, currency:"NGN", downloads:847, rating:4.9, reviews:134, description:"50 production-ready cinematic MidJourney prompts for luxury brands, film-style portraits, and editorial photography.", preview:["Ultra-cinematic portrait of an African queen wearing a golden crown, volumetric light, Lagos skyline, 8k --ar 2:3 --v 6","Luxury Lagos penthouse interior, golden hour, architectural photography --ar 16:9 --v 6","Fashion editorial in Abuja market, street photography meets high fashion --v 6"], totalPrompts:50, featured:true, createdAt:new Date(Date.now()-86400000*7).toISOString() },
  { id:"seed2", title:"TikTok Viral Hook Pack — 30 Hooks", seller:"ContentPro_NG", sellerAvatar:"C", category:"social", price:800, currency:"NGN", downloads:1203, rating:4.8, reviews:201, description:"30 battle-tested TikTok opening hooks that stop the scroll. Tested across fashion, food, and business niches in Nigeria.", preview:["You will lose money in 2025 if you don't know this one thing...","I tried this for 30 days. Here's what actually happened (be honest)","POV: You finally figured out how to get clients without begging"], totalPrompts:30, featured:true, createdAt:new Date(Date.now()-86400000*14).toISOString() },
  { id:"seed3", title:"AI Business Strategy Prompts", seller:"BizBuilder_Africa", sellerAvatar:"B", category:"business", price:2000, currency:"NGN", downloads:412, rating:4.7, reviews:67, description:"20 deep business strategy prompts for Nigerian entrepreneurs. Market analysis, pricing strategy, and growth frameworks.", preview:["Analyze the competitive landscape for [business type] in Lagos, identify top 5 gaps and monetization opportunities"], totalPrompts:20, featured:false, createdAt:new Date(Date.now()-86400000*3).toISOString() },
  { id:"seed4", title:"Runway Gen-3 Product Ad Prompts", seller:"VideoMaster_NG", sellerAvatar:"V", category:"video", price:3500, currency:"NGN", downloads:289, rating:4.6, reviews:44, description:"25 premium Runway Gen-3 prompts for product ads, music videos, and cinematic brand films.", preview:["Slow-motion product reveal, luxury Nigerian perfume bottle, golden particles, black background, cinematic 4K"], totalPrompts:25, featured:false, createdAt:new Date(Date.now()-86400000*5).toISOString() },
  { id:"seed5", title:"Health Education Prompts — 15 Topics", seller:"MedWriter_Pro", sellerAvatar:"M", category:"health", price:1200, currency:"NGN", downloads:156, rating:4.8, reviews:28, description:"15 evidence-based health education prompts for Nigerian doctors and health educators.", preview:["Create a simple patient education leaflet for Type 2 Diabetes for Nigerian patients, use plain English and include local food examples"], totalPrompts:15, featured:false, createdAt:new Date(Date.now()-86400000*10).toISOString() },
];

// ── GOOGLE FONTS ──────────────────────────────────────────────────
const FontStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600;700&display=swap');
    *{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent;}
    body{background:${C.bg};color:${C.text};font-family:'DM Sans',sans-serif;}
    .syne{font-family:'Syne',sans-serif;}
    .fu{display:flex;flex-direction:column;gap:0;}
    input,textarea,select{outline:none;font-family:'DM Sans',sans-serif;}
    input::placeholder,textarea::placeholder{color:${C.muted};}
    ::-webkit-scrollbar{width:3px;}
    ::-webkit-scrollbar-track{background:transparent;}
    ::-webkit-scrollbar-thumb{background:${C.border};border-radius:3px;}
    @keyframes slideUp{from{transform:translateY(100%);opacity:0}to{transform:translateY(0);opacity:1}}
    @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
    @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
    @keyframes confetti{0%{transform:translateY(0) rotate(0deg);opacity:1}100%{transform:translateY(-60px) rotate(720deg);opacity:0}}
  `}</style>
);

// ── AI ENGINE ─────────────────────────────────────────────────────
const KAI = async (system, user, onChunk) => {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system,
      messages: [{ role: "user", content: user }]
    })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    if (res.status === 429) throw Object.assign(new Error("rate_limit"), { seconds: 60 });
    throw new Error(err?.error?.message || "Generation failed");
  }
  const data = await res.json();
  const text = data.content?.[0]?.text || "";
  if (onChunk) onChunk(text);
  return text;
};

const useGen = (module, user, onCredit, onSave, onToast) => {
  const [out, setOut] = useState("");
  const [ld, setLd] = useState(false);
  const [err, setErr] = useState("");
  const [rl, setRl] = useState(null);
  const timerRef = useRef(null);

  const run = useCallback(async (sys, usr, title) => {
    const plan = PLANS[user?.plan || "free"];
    if ((user?.credits_used || 0) >= plan.credits) {
      setErr("Credits exhausted. Upgrade your plan to continue."); return;
    }
    setLd(true); setErr(""); setOut("");
    try {
      const text = await KAI(sys, usr);
      setOut(text);
      if (onSave) await onSave({ title: title || module, module, content: text, created_at: new Date().toISOString() });
      if (onCredit) await onCredit();
      if (onToast) onToast({ msg: "Generated & saved!", type: "success" });
    } catch (e) {
      if (e.message === "rate_limit") {
        let s = e.seconds || 60;
        setRl({ seconds: s });
        timerRef.current = setInterval(() => {
          s--;
          setRl(r => r ? { seconds: r.seconds - 1 } : null);
          if (s <= 0) { clearInterval(timerRef.current); setRl(null); }
        }, 1000);
      } else {
        setErr(e.message || "Something went wrong. Please try again.");
      }
    } finally { setLd(false); }
  }, [user, module, onCredit, onSave, onToast]);

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);
  return { out, ld, err, rl, run, retry: () => setRl(null) };
};

// ── OUTPUT RENDERER ───────────────────────────────────────────────
function renderInline(text) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return parts.map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**"))
      return <strong key={i} style={{ color: C.text, fontWeight: 700 }}>{p.slice(2, -2)}</strong>;
    if (p.startsWith("*") && p.endsWith("*") && p.length > 2)
      return <em key={i} style={{ color: C.sub }}>{p.slice(1, -1)}</em>;
    if (p.startsWith("`") && p.endsWith("`"))
      return <code key={i} style={{ background: "rgba(255,255,255,.06)", padding: "1px 5px", borderRadius: 4, fontSize: 12, fontFamily: "monospace", color: C.cyan }}>{p.slice(1, -1)}</code>;
    return p;
  });
}

function OutputRenderer({ content }) {
  if (!content) return null;
  const blocks = content.split(/\n{2,}/g).filter(Boolean);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {blocks.map((block, bi) => {
        const lines = block.split("\n").filter(Boolean);
        if (!lines.length) return null;
        const first = lines[0];

        // Heading detection
        if (first.startsWith("### ")) return (
          <div key={bi}>
            <div className="syne" style={{ ...T.h3, color: C.sub, marginBottom: 6 }}>{first.slice(4)}</div>
            {lines.slice(1).map((l, i) => <p key={i} style={{ ...T.body, color: C.sub }}>{renderInline(l)}</p>)}
          </div>
        );
        if (first.startsWith("## ")) return (
          <div key={bi}>
            <div className="syne" style={{ ...T.h2, color: C.text, marginBottom: 8 }}>{first.slice(3)}</div>
            {lines.slice(1).map((l, i) => <p key={i} style={{ ...T.body, color: C.sub }}>{renderInline(l)}</p>)}
          </div>
        );
        if (first.startsWith("# ")) return (
          <div key={bi} style={{ paddingBottom: 12, borderBottom: "1px solid " + C.border }}>
            <div className="syne" style={{ ...T.h1, color: C.text, marginBottom: 10 }}>{first.slice(2)}</div>
            {lines.slice(1).map((l, i) => <p key={i} style={{ ...T.body, color: C.sub }}>{renderInline(l)}</p>)}
          </div>
        );

        // Bullet / numbered list
        const isBullet = lines.every(l => /^[-•*]\s/.test(l));
        const isNumbered = lines.every(l => /^\d+[.)]\s/.test(l));
        if (isBullet || isNumbered) return (
          <div key={bi} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {lines.map((l, i) => {
              const txt = l.replace(/^[-•*\d+.)\s]+/, "");
              return (
                <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <div style={{ width: 18, height: 18, borderRadius: 5, background: C.goldDim, border: "1px solid " + C.borderGold, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                    <span style={{ ...T.label, color: C.gold, fontSize: 9 }}>{isNumbered ? i + 1 : "•"}</span>
                  </div>
                  <p style={{ ...T.body, color: C.sub, flex: 1 }}>{renderInline(txt)}</p>
                </div>
              );
            })}
          </div>
        );

        // ALL CAPS section header
        if (first === first.toUpperCase() && first.length > 3 && !/^\d/.test(first)) return (
          <div key={bi} style={{ paddingTop: 4 }}>
            <div style={{ ...T.label, color: C.gold, marginBottom: 10, paddingBottom: 6, borderBottom: "1px solid rgba(240,165,0,.15)" }}>{first}</div>
            {lines.slice(1).map((l, i) => <p key={i} style={{ ...T.body, color: C.sub }}>{renderInline(l)}</p>)}
          </div>
        );

        // Default paragraph
        return (
          <div key={bi} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {lines.map((l, i) => <p key={i} style={{ ...T.body, color: C.sub }}>{renderInline(l)}</p>)}
          </div>
        );
      })}
    </div>
  );
}

// ── UI ATOMS ──────────────────────────────────────────────────────
function Toast({ msg, type, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 3200); return () => clearTimeout(t); }, [onDone]);
  const colors = { success: C.green, error: C.red, info: C.cyan };
  return (
    <div style={{ position: "fixed", bottom: 90, left: "50%", transform: "translateX(-50%)", zIndex: 999, background: C.card2, border: "1px solid " + (colors[type] || C.border), borderRadius: 12, padding: "12px 18px", display: "flex", alignItems: "center", gap: 10, boxShadow: "0 8px 32px rgba(0,0,0,.5)", minWidth: 220, maxWidth: 340, animation: "fadeIn .25s ease" }}>
      <div style={{ width: 7, height: 7, borderRadius: "50%", background: colors[type] || C.sub, flexShrink: 0 }}/>
      <span style={{ ...T.body, color: C.text }}>{msg}</span>
    </div>
  );
}

const Badge = ({ children, color = "gold" }) => {
  const map = { gold: [C.goldText, C.goldDim, C.borderGold], cyan: [C.cyan, C.cyanDim, "rgba(0,200,240,.2)"], purple: [C.purple, C.purpleDim, "rgba(155,114,255,.2)"], green: [C.green, C.greenDim, "rgba(13,219,114,.2)"], red: [C.red, C.redDim, "rgba(255,68,68,.2)"] };
  const [tc, bg, bc] = map[color] || map.gold;
  return <span style={{ ...T.caption, color: tc, background: bg, border: "1px solid " + bc, borderRadius: 6, padding: "2px 7px", whiteSpace: "nowrap", display: "inline-flex", alignItems: "center", gap: 3 }}>{children}</span>;
};

const Spinner = () => <div style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,.15)", borderTop: "2px solid " + C.gold, borderRadius: "50%", animation: "spin .7s linear infinite", flexShrink: 0 }}/>;

function Btn({ children, onClick, variant = "gold", size = "md", full, disabled, loading, style: sx = {} }) {
  const variants = {
    gold:    { bg: "linear-gradient(135deg,#F0A500,#E07800)", color: "#000", border: "none" },
    outline: { bg: "transparent", color: C.sub, border: "1px solid " + C.border },
    ghost:   { bg: "rgba(255,255,255,.04)", color: C.sub, border: "1px solid " + C.border },
    purple:  { bg: "linear-gradient(135deg,#9B72FF,#7B52DF)", color: "#fff", border: "none" },
    cyan:    { bg: "linear-gradient(135deg,#00C8F0,#0098C0)", color: "#000", border: "none" },
    green:   { bg: "linear-gradient(135deg,#0DDB72,#0ABB5C)", color: "#000", border: "none" },
    red:     { bg: "linear-gradient(135deg,#FF4444,#CC2222)", color: "#fff", border: "none" },
    dark:    { bg: C.card2, color: C.sub, border: "1px solid " + C.border },
  };
  const sizes = { sm: { padding: "7px 12px", fontSize: 12, borderRadius: 9 }, md: { padding: "10px 16px", fontSize: 13, borderRadius: 10 }, lg: { padding: "13px 20px", fontSize: 14, borderRadius: 12 } };
  const v = variants[variant] || variants.gold;
  const s = sizes[size] || sizes.md;
  return (
    <button onClick={disabled || loading ? undefined : onClick} style={{ ...s, ...v, width: full ? "100%" : "auto", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7, fontFamily: "DM Sans,sans-serif", fontWeight: 600, cursor: disabled || loading ? "not-allowed" : "pointer", opacity: disabled || loading ? 0.55 : 1, transition: "all .15s", ...sx }}>
      {loading ? <Spinner/> : children}
    </button>
  );
}

const Card = ({ children, style: sx = {} }) => (
  <div style={{ background: C.card, border: "1px solid " + C.border, borderRadius: 16, ...sx }}>{children}</div>
);

const Lbl = ({ children, mt = true }) => (
  <div style={{ ...T.label, color: C.muted, marginTop: mt ? 14 : 0, marginBottom: 6 }}>{children}</div>
);

function FIn({ value, onChange, placeholder, type = "text", disabled }) {
  return (
    <input value={value} onChange={e => onChange(e.target.value)} type={type} placeholder={placeholder} disabled={disabled}
      style={{ width: "100%", padding: "11px 14px", borderRadius: 10, background: "#090912", border: "1px solid " + C.border, color: C.text, ...T.body, marginTop: 4 }}/>
  );
}

function FSel({ value, onChange, options }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      style={{ width: "100%", padding: "11px 14px", borderRadius: 10, background: "#090912", border: "1px 
