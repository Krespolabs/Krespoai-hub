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
      style={{ width: "100%", padding: "11px 14px", borderRadius: 10, background: "#090912", border: "1px solid " + C.border, color: C.text, ...T.body, marginTop: 4, appearance: "none" }}>
      {options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
    </select>
  );
}

const ErrBox = ({ msg }) => msg ? (
  <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "10px 13px", background: C.redDim, border: "1px solid rgba(255,68,68,.2)", borderRadius: 10, marginTop: 12 }}>
    <AlertCircle size={14} color={C.red} style={{ flexShrink: 0, marginTop: 1 }}/>
    <span style={{ ...T.sm, color: C.red }}>{msg}</span>
  </div>
) : null;

const Stars = ({ rating, size = 12 }) => (
  <div style={{ display: "flex", gap: 1 }}>
    {[1,2,3,4,5].map(i => <Star key={i} size={size} color={i<=Math.round(rating)?C.gold:C.muted} fill={i<=Math.round(rating)?C.gold:"none"}/>)}
  </div>
);

const MHead = ({ icon, title, badge, bc = "gold", desc }) => (
  <div style={{ marginBottom: 16 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
      <div style={{ fontSize: 22 }}>{icon}</div>
      <div className="syne" style={{ ...T.h2, color: C.text }}>{title}</div>
      {badge && <Badge color={bc}>{badge}</Badge>}
    </div>
    {desc && <p style={{ ...T.sm, color: C.muted }}>{desc}</p>}
  </div>
);

const CreditsBar = ({ used, total }) => {
  const pct = Math.min((used / total) * 100, 100);
  const rem = total - used;
  const isUnlimited = total >= 99999;
  return (
    <div style={{ marginBottom: 14, padding: "10px 14px", background: C.card, border: "1px solid " + C.border, borderRadius: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <span style={{ ...T.caption, color: C.sub }}>Credits used this month</span>
        <span style={{ ...T.caption, color: isUnlimited ? C.green : pct > 80 ? C.red : C.goldText, fontWeight: 700 }}>
          {isUnlimited ? "∞ Unlimited" : `${rem} remaining`}
        </span>
      </div>
      {!isUnlimited && (
        <div style={{ height: 4, background: C.border, borderRadius: 2, overflow: "hidden" }}>
          <div style={{ height: "100%", width: pct + "%", background: pct > 80 ? C.red : C.gold, borderRadius: 2, transition: "width .3s" }}/>
        </div>
      )}
    </div>
  );
};

const RateLimitBox = ({ seconds, onRetry }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: "rgba(240,165,0,.06)", border: "1px solid " + C.borderGold, borderRadius: 10, marginTop: 12 }}>
    <Clock size={14} color={C.gold}/>
    <span style={{ ...T.sm, color: C.goldText, flex: 1 }}>Rate limit hit. Retry in <strong>{seconds}s</strong></span>
    {seconds <= 0 && <Btn onClick={onRetry} variant="gold" size="sm"><RefreshCw size={12}/>Retry</Btn>}
  </div>
);

function OutPanel({ output, loading, title, mod, placeholder, onToast }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(output).catch(() => {});
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };
  const mc = MOD_COLORS[mod] || C.sub;

  if (loading) return (
    <Card style={{ padding: "24px 20px", marginTop: 14 }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, textAlign: "center" }}>
        <Spinner/>
        <div>
          <div className="syne" style={{ ...T.h3, color: C.text, marginBottom: 4 }}>Generating…</div>
          <p style={{ ...T.sm, color: C.muted }}>AI is crafting your content</p>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {[0,1,2].map(i => <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: C.gold, animation: `pulse 1.2s ease ${i * 0.2}s infinite` }}/>)}
        </div>
      </div>
    </Card>
  );

  if (!output) return (
    <Card style={{ padding: "28px 20px", marginTop: 14 }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 36, marginBottom: 12, opacity: .15 }}>{MOD_ICONS[mod] || "✨"}</div>
        <p style={{ ...T.body, color: C.muted }}>{placeholder}</p>
      </div>
    </Card>
  );

  return (
    <Card style={{ marginTop: 14, overflow: "hidden" }}>
      <div style={{ height: 3, background: `linear-gradient(90deg,${mc},${mc}44)` }}/>
      <div style={{ padding: "14px 16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div>
            <div style={{ ...T.label, color: mc, marginBottom: 3 }}>{mod}</div>
            <div className="syne" style={{ ...T.h3, color: C.text }}>{title}</div>
          </div>
          <button onClick={copy} style={{ width: 32, height: 32, borderRadius: 8, background: copied ? C.greenDim : "rgba(255,255,255,.04)", border: "1px solid " + (copied ? "rgba(13,219,114,.3)" : C.border), display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            {copied ? <Check size={13} color={C.green}/> : <Copy size={13} color={C.sub}/>}
          </button>
        </div>
        <div style={{ padding: "16px", background: "#090912", borderRadius: 12, border: "1px solid " + C.border, maxHeight: 420, overflowY: "auto" }}>
          <OutputRenderer content={output}/>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
          <Btn onClick={copy} variant="ghost" size="sm"><Copy size={12}/>{copied ? "Copied!" : "Copy"}</Btn>
          <Btn onClick={() => { const el = document.createElement("a"); el.href = "data:text/plain;charset=utf-8," + encodeURIComponent(output); el.download = (title || "output") + ".txt"; el.click(); }} variant="ghost" size="sm"><Download size={12}/>Save .txt</Btn>
        </div>
      </div>
    </Card>
  );
}

// ── SPLASH ────────────────────────────────────────────────────────
function Splash() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", background: C.bg, padding: 24 }}>
      <FontStyle/>
      <div style={{ position: "relative", marginBottom: 32 }}>
        <div style={{ position: "absolute", inset: -20, borderRadius: "50%", background: "radial-gradient(circle,rgba(240,165,0,.15),transparent 70%)", animation: "pulse 2s ease infinite" }}/>
        <div style={{ width: 72, height: 72, borderRadius: 20, background: "linear-gradient(135deg,#F0A500,#E07800)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
          <span className="syne" style={{ fontSize: 28, fontWeight: 800, color: "#000" }}>K</span>
        </div>
      </div>
      <div className="syne" style={{ ...T.display, color: C.text, textAlign: "center", marginBottom: 8 }}>KrespoAi</div>
      <p style={{ ...T.body, color: C.muted, textAlign: "center", marginBottom: 32 }}>Production Hub · Nigeria First</p>
      <Spinner/>
    </div>
  );
}

// ── AUTH SCREEN ───────────────────────────────────────────────────
function AuthScreen({ onAuth }) {
  const [tab, setTab] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [ld, setLd] = useState(false);
  const [err, setErr] = useState("");

  const submit = async () => {
    if (!email.trim() || !pass.trim()) { setErr("Enter email and password."); return; }
    if (tab === "signup" && !name.trim()) { setErr("Enter your name."); return; }
    if (pass.length < 6) { setErr("Password must be at least 6 characters."); return; }
    setLd(true); setErr("");
    try {
      let res;
      if (tab === "signup") {
        res = await sbSignUp(email.trim(), pass, name.trim());
        if (res.error) { setErr(res.error.message || res.msg || "Signup failed"); setLd(false); return; }
        // Auto sign in after signup
        res = await sbSignIn(email.trim(), pass);
      } else {
        res = await sbSignIn(email.trim(), pass);
      }
      if (res.error || res.error_description) {
        setErr(res.error_description || res.error?.message || "Invalid email or password");
        setLd(false); return;
      }
      _token = res.access_token;
      _userId = res.user?.id;
      localStorage.setItem("krespo:token", _token);
      localStorage.setItem("krespo:uid", _userId);
      // Load or create profile
      const profiles = await db.get("profiles", `?id=eq.${_userId}`);
      const profile = profiles[0] || {};
      onAuth({ id: _userId, email: res.user?.email, name: profile.name || name || email.split("@")[0], avatar: profile.avatar || (name || email)[0].toUpperCase(), plan: profile.plan || "free", credits_used: profile.credits_used || 0, joined_at: profile.joined_at });
    } catch (e) {
      setErr(e.message || "Something went wrong.");
    }
    setLd(false);
  };

  const demo = async () => {
    setLd(true);
    // Demo mode — no auth needed, uses local state
    onAuth({ id: "demo", email: "demo@krespoai.com", name: "Demo User", avatar: "D", plan: "pro", credits_used: 3, joined_at: new Date().toISOString(), demo: true });
    setLd(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column", justifyContent: "center", padding: "24px 20px" }}>
      <FontStyle/>
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div style={{ width: 52, height: 52, borderRadius: 14, background: "linear-gradient(135deg,#F0A500,#E07800)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
          <span className="syne" style={{ fontSize: 20, fontWeight: 800, color: "#000" }}>K</span>
        </div>
        <div className="syne" style={{ ...T.h1, color: C.text, marginBottom: 4 }}>KrespoAi Hub</div>
        <p style={{ ...T.sm, color: C.muted }}>Nigeria's #1 AI Production Platform</p>
      </div>
      <div style={{ background: C.card, border: "1px solid " + C.border, borderRadius: 20, padding: "24px 20px", maxWidth: 400, margin: "0 auto", width: "100%" }}>
        <div style={{ display: "flex", background: "rgba(255,255,255,.04)", borderRadius: 10, padding: 3, marginBottom: 22 }}>
          {["login","signup"].map(t => (
            <button key={t} onClick={() => { setTab(t); setErr(""); }} style={{ flex: 1, padding: "9px", borderRadius: 7, border: "none", background: tab === t ? C.card2 : "transparent", color: tab === t ? C.text : C.sub, ...T.body, fontWeight: tab === t ? 700 : 400, cursor: "pointer", fontFamily: "DM Sans,sans-serif" }}>
              {t === "login" ? "Sign In" : "Sign Up"}
            </button>
          ))}
        </div>
        {tab === "signup" && (<><Lbl mt={false}>Full Name</Lbl><FIn value={name} onChange={setName} placeholder="e.g. Krespo Labs"/></>)}
        <Lbl mt={tab !== "signup"}>Email Address</Lbl>
        <FIn value={email} onChange={setEmail} placeholder="you@example.com" type="email"/>
        <Lbl>Password</Lbl>
        <div style={{ position: "relative" }}>
          <FIn value={pass} onChange={setPass} placeholder="Min 6 characters" type={showPass ? "text" : "password"}/>
          <button onClick={() => setShowPass(s => !s)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer" }}>
            {showPass ? <EyeOff size={15} color={C.muted}/> : <Eye size={15} color={C.muted}/>}
          </button>
        </div>
        <ErrBox msg={err}/>
        <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 10 }}>
          <Btn onClick={submit} loading={ld} disabled={ld} variant="gold" full size="lg">
            {tab === "login" ? "Sign In" : "Create Account"}
          </Btn>
          <div style={{ textAlign: "center" }}>
            <span style={{ ...T.sm, color: C.muted }}>or </span>
            <button onClick={demo} style={{ background: "none", border: "none", ...T.sm, color: C.cyan, cursor: "pointer", fontFamily: "DM Sans,sans-serif" }}>Continue as Demo</button>
          </div>
        </div>
      </div>
      {tab === "signup" && <p style={{ ...T.caption, color: C.muted, textAlign: "center", marginTop: 16, padding: "0 24px" }}>By signing up you agree to our terms. Your API usage is secured server-side.</p>}
    </div>
  );
}

// ── DASHBOARD ─────────────────────────────────────────────────────
function Dashboard({ user, outputs, transactions, packs, go }) {
  const used = user.credits_used || 0;
  const total = PLANS[user.plan]?.credits || 5;
  const stats = [
    { e: "📄", v: outputs.length, l: "Saved Outputs", id: "library" },
    { e: "⚡", v: SEED_PACKS.length + packs.length, l: "Packs in Market", id: "market" },
    { e: "💳", v: transactions.length, l: "Transactions", id: "profile" },
    { e: "🎯", v: Math.max(0, total - used), l: "Credits Left", id: "pricing" },
  ];
  return (
    <div className="fu" style={{ padding: "4px 0 80px", gap: 16, animation: "fadeIn .3s ease" }}>
      <div style={{ background: `linear-gradient(135deg,rgba(240,165,0,.1),rgba(155,114,255,.06))`, border: "1px solid " + C.border, borderRadius: 20, padding: "20px 18px" }}>
        <div style={{ ...T.label, color: C.muted, marginBottom: 6 }}>Good to see you</div>
        <div className="syne" style={{ ...T.h1, color: C.text, marginBottom: 4 }}>Hey, {user.name.split(" ")[0]} 👋</div>
        <p style={{ ...T.sm, color: C.sub, marginBottom: 14 }}>Ready to create something great today?</p>
        <div style={{ display: "flex", gap: 8 }}>
          <Badge color="gold">{PLANS[user.plan]?.name} Plan</Badge>
          {user.demo && <Badge color="cyan">Demo Mode</Badge>}
        </div>
      </div>
      <CreditsBar used={used} total={total}/>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {stats.map(s => (
          <button key={s.id} onClick={() => go(s.id)} style={{ background: C.card, border: "1px solid " + C.border, borderRadius: 14, padding: "14px", textAlign: "left", cursor: "pointer" }}>
            <div style={{ fontSize: 22, marginBottom: 8 }}>{s.e}</div>
            <div className="syne" style={{ ...T.h2, color: C.text, marginBottom: 2 }}>{s.v}</div>
            <div style={{ ...T.caption, color: C.muted }}>{s.l}</div>
          </button>
        ))}
      </div>
      <Card style={{ padding: "14px", border: "1px solid rgba(155,114,255,.2)", background: "rgba(155,114,255,.04)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <ShoppingBag size={18} color={C.purple} style={{ flexShrink: 0 }}/>
          <div style={{ flex: 1 }}>
            <div className="syne" style={{ ...T.h3, color: C.text, marginBottom: 2 }}>Prompt Marketplace</div>
            <div style={{ ...T.sm, color: C.sub }}>{SEED_PACKS.length + packs.length} packs live · Earn 80% per sale</div>
          </div>
          <Btn onClick={() => go("market")} variant="purple" size="sm">Browse</Btn>
        </div>
      </Card>
      {user.plan === "free" && (
        <Card style={{ padding: "14px", border: "1px solid " + C.borderGold, background: C.goldDim }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Crown size={18} color={C.gold} style={{ flexShrink: 0 }}/>
            <div style={{ flex: 1 }}>
              <div className="syne" style={{ ...T.h3, color: C.text, marginBottom: 2 }}>Upgrade to Pro</div>
              <div style={{ ...T.sm, color: C.sub }}>200 generations/month · PDF exports · ₦5,000/mo</div>
            </div>
            <Btn onClick={() => go("pricing")} variant="gold" size="sm">Upgrade</Btn>
          </div>
        </Card>
      )}
      {outputs.length > 0 && (
        <Card style={{ padding: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div className="syne" style={{ ...T.h3, color: C.text }}>Recent Outputs</div>
            <button onClick={() => go("library")} style={{ background: "none", border: "none", ...T.sm, color: C.gold, cursor: "pointer", fontFamily: "DM Sans,sans-serif" }}>View all</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {outputs.slice(0, 3).map(o => {
              const mc = MOD_COLORS[o.module] || C.sub;
              return (
                <div key={o.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 11px", borderRadius: 10, background: "rgba(255,255,255,.02)", border: "1px solid " + C.border }}>
                  <span style={{ fontSize: 16, flexShrink: 0 }}>{MOD_ICONS[o.module] || "📄"}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ ...T.sm, fontWeight: 600, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.title}</div>
                    <div style={{ ...T.caption, color: mc, fontWeight: 700 }}>{o.module}</div>
                  </div>
                  <Badge color="green">Saved</Badge>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}

// ── EBOOK GENERATOR ───────────────────────────────────────────────
function EbookGen({ user, onCredit, onSave, onToast }) {
  const [title, setTitle] = useState(""); const [niche, setNiche] = useState("make-money"); const [audience, setAudience] = useState(""); const [pages, setPages] = useState("30"); const [platform, setPlatform] = useState("kdp"); const [style, setStyle] = useState("practical");
  const { out, ld, err, rl, run, retry } = useGen("Ebook Generator", user, onCredit, onSave, onToast);
  const go = () => run(
    "You are KrespoAI Ebook Architect — elite digital publishing strategist specializing in the Nigerian and African market. Create production-ready ebook blueprints with strong commercial hooks. Structure your output with clear section headers in ALL CAPS, use ## for chapter titles, and bullet points for chapter content.",
    `Create a complete ebook blueprint:\n\nTITLE: "${title || "Make Money Online in Nigeria"}"\nNICHE: ${niche}\nTARGET AUDIENCE: ${audience || "Nigerian youths 18-35"}\nPAGES: ${pages}\nPLATFORM: ${platform}\nSTYLE: ${style}\n\nInclude:\nCOVER CONCEPT\nBACK COVER BLURB\nTABLE OF CONTENTS (10 chapters)\nCHAPTER SUMMARIES (2 sentences + takeaway each)\nTARGET KEYWORDS (10 SEO keywords)\nPRICING STRATEGY`,
    title || "Ebook Blueprint"
  );
  return (
    <div className="fu" style={{ padding: "4px 0 80px", gap: 0, animation: "fadeIn .3s ease" }}>
      <MHead icon="📘" title="Ebook Generator" badge="KDP · Gumroad · Selar" bc="gold" desc="Generate complete ebook blueprints ready for publishing. Auto-saved to your library."/>
      <CreditsBar used={user.credits_used || 0} total={PLANS[user.plan]?.credits || 5}/>
      <Card style={{ padding: 18, marginBottom: 14 }}>
        <Lbl mt={false}>Ebook Title</Lbl><FIn value={title} onChange={setTitle} placeholder="e.g. Make Money Online in Nigeria"/>
        <Lbl>Niche</Lbl><FSel value={niche} onChange={setNiche} options={[{v:"make-money",l:"Make Money Online"},{v:"self-help",l:"Self Help"},{v:"health",l:"Health & Wellness"},{v:"relationships",l:"Relationships"},{v:"business",l:"Business"},{v:"tech",l:"Tech & AI"},{v:"fashion",l:"Fashion"}]}/>
        <Lbl>Target Audience</Lbl><FIn value={audience} onChange={setAudience} placeholder="e.g. Nigerian youths aged 18-35"/>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div><Lbl>Pages</Lbl><FSel value={pages} onChange={setPages} options={[{v:"20",l:"20 pages"},{v:"30",l:"30 pages"},{v:"50",l:"50 pages"},{v:"100",l:"100 pages"}]}/></div>
          <div><Lbl>Platform</Lbl><FSel value={platform} onChange={setPlatform} options={[{v:"kdp",l:"Amazon KDP"},{v:"gumroad",l:"Gumroad"},{v:"selar",l:"Selar"},{v:"payhip",l:"Payhip"}]}/></div>
        </div>
        <Lbl>Writing Style</Lbl><FSel value={style} onChange={setStyle} options={[{v:"practical",l:"Practical & Actionable"},{v:"storytelling",l:"Storytelling"},{v:"academic",l:"Academic"},{v:"conversational",l:"Conversational"}]}/>
        <ErrBox msg={err}/>
        {rl && <RateLimitBox seconds={rl.seconds} onRetry={retry}/>}
        <div style={{ marginTop: 16 }}><Btn onClick={go} loading={ld} disabled={ld || !!rl} variant="gold" full size="lg"><Sparkles size={15}/>{ld ? "Writing..." : rl ? "Please wait..." : "Generate Ebook Blueprint"}</Btn></div>
      </Card>
      <OutPanel output={out} loading={ld} title={title || "Ebook Blueprint"} mod="Ebook Generator" placeholder="Your complete ebook blueprint will appear here and auto-save to your library." onToast={onToast}/>
    </div>
  );
}

// ── PROMPT ARENA ──────────────────────────────────────────────────
function PromptArena({ user, onCredit, onSave, onToast, onGoMarket }) {
  const [cat, setCat] = useState("image-gen"); const [tool, setTool] = useState("midjourney"); const [count, setCount] = useState("10"); const [style, setStyle] = useState("premium"); const [theme, setTheme] = useState("");
  const { out, ld, err, rl, run, retry } = useGen("Prompt Arena", user, onCredit, onSave, onToast);
  const go = () => run(
    "You are KrespoAI Prompt Lab — world-class AI prompt architect. Create marketplace-ready premium prompts that users will actually pay for. Format each prompt with a name, the full prompt text, use case, and a pro tip. Use ## for prompt names and bullet points for details.",
    `Generate ${count} premium ${cat} prompts for ${tool}.\nStyle: ${style}\nTheme: ${theme || "high-value cinematic and commercial use cases"}\n\nFor EACH prompt:\n## [PROMPT NAME]\n- **PROMPT:** [complete prompt text]\n- **USE CASE:** [specific application]\n- **WHY IT WORKS:** [key strength]\n- **PRO TIP:** [advanced technique]`,
    `${tool} ${cat} Pack`
  );
  return (
    <div className="fu" style={{ padding: "4px 0 80px", gap: 0, animation: "fadeIn .3s ease" }}>
      <MHead icon="⚡" title="Prompt Arena" badge="AI Prompt Lab" bc="cyan" desc="Generate premium prompt packs. Save them, then sell in the Marketplace to earn real money."/>
      <CreditsBar used={user.credits_used || 0} total={PLANS[user.plan]?.credits || 5}/>
      <Card style={{ padding: 18, marginBottom: 14 }}>
        <Lbl mt={false}>Category</Lbl><FSel value={cat} onChange={setCat} options={[{v:"image-gen",l:"Image Generation"},{v:"video-gen",l:"Video Generation"},{v:"copywriting",l:"Copywriting"},{v:"business",l:"Business Strategy"},{v:"social-media",l:"Social Media"},{v:"coding",l:"Coding & Dev"}]}/>
        <Lbl>AI Tool</Lbl><FSel value={tool} onChange={setTool} options={[{v:"midjourney",l:"Midjourney"},{v:"dalle",l:"DALL-E 3"},{v:"runway",l:"Runway Gen-3"},{v:"sora",l:"Sora / Veo"},{v:"claude",l:"Claude / ChatGPT"},{v:"gemini",l:"Gemini"}]}/>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div><Lbl>Count</Lbl><FSel value={count} onChange={setCount} options={[{v:"5",l:"5 Prompts"},{v:"10",l:"10 Prompts"},{v:"20",l:"20 Prompts"}]}/></div>
          <div><Lbl>Style</Lbl><FSel value={style} onChange={setStyle} options={[{v:"premium",l:"Premium"},{v:"cinematic",l:"Cinematic"},{v:"artistic",l:"Artistic"},{v:"commercial",l:"Commercial"}]}/></div>
        </div>
        <Lbl>Theme (optional)</Lbl><FIn value={theme} onChange={setTheme} placeholder="e.g. African luxury fashion, Lagos street life"/>
        <ErrBox msg={err}/>
        {rl && <RateLimitBox seconds={rl.seconds} onRetry={retry}/>}
        <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
          <Btn onClick={go} loading={ld} disabled={ld || !!rl} variant="cyan" full size="lg"><Zap size={15}/>{ld ? "Crafting prompts..." : rl ? "Please wait..." : "Generate Prompt Pack"}</Btn>
          {out && <Btn onClick={onGoMarket} variant="purple" full size="md"><ShoppingBag size={13}/>Sell This Pack — Earn 80% Per Sale</Btn>}
        </div>
      </Card>
      <OutPanel output={out} loading={ld} title={`${tool} ${cat} Pack`} mod="Prompt Arena" placeholder="Your premium prompt pack will appear here and auto-save. Then list it in the Marketplace." onToast={onToast}/>
    </div>
  );
}

// ── CONTENT HUB ───────────────────────────────────────────────────
function ContentHub({ user, onCredit, onSave, onToast }) {
  const [plat, setPlat] = useState("tiktok"); const [niche, setNiche] = useState("fashion"); const [count, setCount] = useState("7"); const [format, setFormat] = useState("script"); const [tone, setTone] = useState("energetic"); const [angle, setAngle] = useState("");
  const { out, ld, err, rl, run, retry } = useGen("Content Hub", user, onCredit, onSave, onToast);
  const go = () => run(
    "You are KrespoAI Content Director — world-class social media strategist for African creators. Create viral, platform-native content that drives real engagement. Use ## for post titles, bullet points for details.",
    `Create a ${count}-piece ${plat.toUpperCase()} content kit.\nNiche: ${niche} | Format: ${format} | Tone: ${tone}${angle ? " | Angle: " + angle : ""}\n\nFor EACH piece:\n## POST [N] — [CATCHY TITLE]\n- **HOOK:** [opening line that stops scroll]\n- **${format === "script" ? "SCRIPT" : "CAPTION"}:** [full content]\n- **HASHTAGS:** [12 targeted hashtags]\n- **BEST TIME:** [day + time to post]`,
    `${plat} ${niche} Content Kit`
  );
  const PLATS = [{id:"tiktok",l:"TikTok"},{id:"youtube",l:"YouTube"},{id:"instagram",l:"Instagram"},{id:"twitter",l:"X / Twitter"}];
  return (
    <div className="fu" style={{ padding: "4px 0 80px", gap: 0, animation: "fadeIn .3s ease" }}>
      <MHead icon="🎬" title="Content Hub" badge="TikTok · YouTube · IG" bc="purple" desc="Generate complete content kits for any platform. Auto-saved to your library."/>
      <CreditsBar used={user.credits_used || 0} total={PLANS[user.plan]?.credits || 5}/>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6, marginBottom: 14 }}>
        {PLATS.map(p => <button key={p.id} onClick={() => setPlat(p.id)} style={{ padding: "9px 4px", borderRadius: 9, cursor: "pointer", border: "1px solid " + (plat === p.id ? C.purple : C.border), background: plat === p.id ? C.purpleDim : "transparent", color: plat === p.id ? C.purple : C.sub, ...T.caption, fontWeight: plat === p.id ? 700 : 400, textAlign: "center", fontFamily: "DM Sans,sans-serif" }}>{p.l}</button>)}
      </div>
      <Card style={{ padding: 18, marginBottom: 14 }}>
        <Lbl mt={false}>Niche</Lbl><FSel value={niche} onChange={setNiche} options={[{v:"fashion",l:"Fashion"},{v:"beauty",l:"Beauty"},{v:"food",l:"Food & Cooking"},{v:"tech",l:"Tech & AI"},{v:"fitness",l:"Fitness"},{v:"business",l:"Business"},{v:"education",l:"Education"}]}/>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div><Lbl>Format</Lbl><FSel value={format} onChange={setFormat} options={[{v:"script",l:"Video Script"},{v:"caption",l:"Post Caption"},{v:"hooks",l:"Hook Collection"},{v:"carousel",l:"Carousel"}]}/></div>
          <div><Lbl>Tone</Lbl><FSel value={tone} onChange={setTone} options={[{v:"energetic",l:"Energetic"},{v:"educational",l:"Educational"},{v:"funny",l:"Funny"},{v:"inspirational",l:"Inspirational"}]}/></div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div><Lbl>Count</Lbl><FSel value={count} onChange={setCount} options={[{v:"5",l:"5 Pieces"},{v:"7",l:"7 Pieces"},{v:"10",l:"10 Pieces"}]}/></div>
          <div><Lbl>Custom Angle</Lbl><FIn value={angle} onChange={setAngle} placeholder="Optional..."/></div>
        </div>
        <ErrBox msg={err}/>
        {rl && <RateLimitBox seconds={rl.seconds} onRetry={retry}/>}
        <div style={{ marginTop: 16 }}><Btn onClick={go} loading={ld} disabled={ld || !!rl} variant="purple" full size="lg"><Film size={15}/>{ld ? "Creating kit..." : rl ? "Please wait..." : "Generate Content Kit"}</Btn></div>
      </Card>
      <OutPanel output={out} loading={ld} title={`${plat} ${niche} Content Kit`} mod="Content Hub" placeholder="Your full content kit will appear here — scripts, captions, hashtags, and posting times." onToast={onToast}/>
    </div>
  );
}

// ── BUSINESS BUILDER ──────────────────────────────────────────────
function BizBuilder({ user, onCredit, onSave, onToast }) {
  const [name, setName] = useState(""); const [type, setType] = useState("ecommerce"); const [stage, setStage] = useState("idea"); const [market, setMarket] = useState("nigeria"); const [capital, setCapital] = useState(""); const [goal, setGoal] = useState("");
  const { out, ld, err, rl, run, retry } = useGen("Business Builder", user, onCredit, onSave, onToast);
  const go = () => run(
    "You are KrespoAI Business Strategist — Africa's top consulting AI. You understand the Nigerian market deeply: informal economy, payment infrastructure, logistics, regulation, consumer behaviour, and growth hacking. Create actionable, realistic business strategies. Use ## for section headers and bullet points throughout.",
    `Build a complete business strategy:\n\nBUSINESS: ${name || "E-commerce Store"}\nTYPE: ${type}\nSTAGE: ${stage}\nPRIMARY MARKET: ${market}\nCAPITAL: ${capital || "Not specified"}\nGOAL: ${goal || "Build a profitable business"}\n\nCover:\n## EXECUTIVE SUMMARY\n## MARKET ANALYSIS (Nigeria-specific)\n## COMPETITIVE LANDSCAPE\n## REVENUE MODEL\n## PRICING STRATEGY\n## MARKETING CHANNELS\n## OPERATIONAL PLAN\n## FINANCIAL PROJECTIONS (12 months)\n## RISK MITIGATION\n## 90-DAY ACTION PLAN`,
    name || "Business Strategy"
  );
  return (
    <div className="fu" style={{ padding: "4px 0 80px", gap: 0, animation: "fadeIn .3s ease" }}>
      <MHead icon="💼" title="Business Builder" badge="Africa First" bc="green" desc="Generate professional business strategies built for the Nigerian and African market reality."/>
      <CreditsBar used={user.credits_used || 0} total={PLANS[user.plan]?.credits || 5}/>
      <Card style={{ padding: 18, marginBottom: 14 }}>
        <Lbl mt={false}>Business Name / Idea</Lbl><FIn value={name} onChange={setName} placeholder="e.g. Krespo Fast Delivery"/>
        <Lbl>Business Type</Lbl><FSel value={type} onChange={setType} options={[{v:"ecommerce",l:"E-commerce"},{v:"saas",l:"SaaS / Tech"},{v:"service",l:"Service Business"},{v:"food",l:"Food & Restaurant"},{v:"fintech",l:"Fintech"},{v:"logistics",l:"Logistics"},{v:"content",l:"Content / Media"},{v:"fashion",l:"Fashion & Retail"}]}/>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div><Lbl>Stage</Lbl><FSel value={stage} onChange={setStage} options={[{v:"idea",l:"Idea Stage"},{v:"validation",l:"Validation"},{v:"launched",l:"Just Launched"},{v:"scaling",l:"Scaling"}]}/></div>
          <div><Lbl>Primary Market</Lbl><FSel value={market} onChange={setMarket} options={[{v:"nigeria",l:"Nigeria"},{v:"lagos",l:"Lagos Only"},{v:"west-africa",l:"West Africa"},{v:"pan-africa",l:"Pan-Africa"},{v:"global",l:"Global"}]}/></div>
        </div>
        <Lbl>Starting Capital</Lbl><FIn value={capital} onChange={setCapital} placeholder="e.g. ₦500,000 or $500"/>
        <Lbl>Primary Goal</Lbl><FIn value={goal} onChange={setGoal} placeholder="e.g. Hit ₦1M revenue in 6 months"/>
        <ErrBox msg={err}/>
        {rl && <RateLimitBox seconds={rl.seconds} onRetry={retry}/>}
        <div style={{ marginTop: 16 }}><Btn onClick={go} loading={ld} disabled={ld || !!rl} variant="green" full size="lg"><Briefcase size={15}/>{ld ? "Strategizing..." : rl ? "Please wait..." : "Generate Business Strategy"}</Btn></div>
      </Card>
      <OutPanel output={out} loading={ld} title={name || "Business Strategy"} mod="Business Builder" placeholder="Your complete business strategy — market analysis, revenue model, 90-day action plan — will appear here." onToast={onToast}/>
    </div>
  );
}

// ── HEALTH & EDUCATION ────────────────────────────────────────────
function HealthEdu({ user, onCredit, onSave, onToast }) {
  const [topic, setTopic] = useState(""); const [audience, setAudience] = useState("patient"); const [type, setType] = useState("explainer"); const [lang, setLang] = useState("simple"); const [depth, setDepth] = useState("standard");
  const { out, ld, err, rl, run, retry } = useGen("Health & Education", user, onCredit, onSave, onToast);
  const go = () => run(
    "You are KrespoAI MedEdu Engine — specialist in accurate, accessible health education for African patients and healthcare workers. Use evidence-based information, appropriate disclaimers, and culturally relevant examples. Use ## for section headers, bullet points for symptoms and action items.",
    `Create ${type} content on: "${topic || "Hypertension"}"\nAUDIENCE: ${audience} | LANGUAGE LEVEL: ${lang} | DEPTH: ${depth}\n\nStructure:\n## OVERVIEW\n## UNDERSTANDING THE CONDITION\n## SIGNS AND SYMPTOMS\n## TREATMENT AND MANAGEMENT\n## LIFESTYLE CHANGES\n## RED FLAGS — When to See a Doctor\n## ACTION PLAN\n## MEDICAL DISCLAIMER`,
    topic || "Health Content"
  );
  return (
    <div className="fu" style={{ padding: "4px 0 80px", gap: 0, animation: "fadeIn .3s ease" }}>
      <MHead icon="🩺" title="Health & Education" badge="Evidence-Based" bc="cyan" desc="Generate accurate health education content for Nigerian patients, students, and healthcare workers."/>
      <CreditsBar used={user.credits_used || 0} total={PLANS[user.plan]?.credits || 5}/>
      <Card style={{ padding: 18, marginBottom: 14 }}>
        <Lbl mt={false}>Health Topic</Lbl><FIn value={topic} onChange={setTopic} placeholder="e.g. Hypertension, Malaria, Sickle Cell, Diabetes"/>
        <Lbl>Audience</Lbl><FSel value={audience} onChange={setAudience} options={[{v:"patient",l:"Patient / Public"},{v:"med-student",l:"Medical Student"},{v:"doctor",l:"Doctor / Clinician"},{v:"nurse",l:"Nurse"},{v:"pharmacist",l:"Pharmacist"}]}/>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div><Lbl>Content Type</Lbl><FSel value={type} onChange={setType} options={[{v:"explainer",l:"Explainer"},{v:"ebook-chapter",l:"Ebook Chapter"},{v:"patient-leaflet",l:"Patient Leaflet"},{v:"clinical-notes",l:"Clinical Notes"}]}/></div>
          <div><Lbl>Language Level</Lbl><FSel value={lang} onChange={setLang} options={[{v:"simple",l:"Simple English"},{v:"moderate",l:"Moderate"},{v:"technical",l:"Clinical / Technical"}]}/></div>
        </div>
        <Lbl>Depth</Lbl><FSel value={depth} onChange={setDepth} options={[{v:"overview",l:"Quick Overview"},{v:"standard",l:"Standard Guide"},{v:"deep",l:"Deep Dive"}]}/>
        <ErrBox msg={err}/>
        {rl && <RateLimitBox seconds={rl.seconds} onRetry={retry}/>}
        <div style={{ marginTop: 16 }}><Btn onClick={go} loading={ld} disabled={ld || !!rl} variant="cyan" full size="lg"><Heart size={15}/>{ld ? "Generating..." : rl ? "Please wait..." : "Generate Health Content"}</Btn></div>
      </Card>
      <OutPanel output={out} loading={ld} title={topic || "Health Content"} mod="Health & Education" placeholder="Your evidence-based health content will appear here and auto-save to your library." onToast={onToast}/>
    </div>
  );
}

// ── MARKETPLACE ───────────────────────────────────────────────────
function PackCard({ pack, purchased, onView }) {
  const catColor = {"image-gen":C.cyan,"video":C.purple,"copy":C.gold,"business":C.green,"social":"#FF6B9D","health":"#FF6B9D"};
  const c = catColor[pack.category] || C.sub;
  return (
    <button onClick={() => onView(pack)} style={{ width: "100%", background: C.card, border: "1px solid " + C.border, borderRadius: 14, overflow: "hidden", textAlign: "left", cursor: "pointer", display: "block" }}>
      <div style={{ height: 3, background: `linear-gradient(90deg,${c},${c}44)` }}/>
      <div style={{ padding: "13px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 5 }}>
              {pack.featured && <Badge color="gold">Featured</Badge>}
              <span style={{ ...T.label, color: c }}>{pack.category}</span>
            </div>
            <div className="syne" style={{ ...T.h3, color: C.text, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{pack.title}</div>
          </div>
          <div style={{ flexShrink: 0, marginLeft: 10, textAlign: "right" }}>
            {purchased ? <Badge color="green">Owned</Badge> : <div className="syne" style={{ ...T.h3, color: C.goldText, fontWeight: 800 }}>{pack.currency === "NGN" ? "₦" : "$"}{pack.price.toLocaleString()}</div>}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <div style={{ width: 22, height: 22, borderRadius: "50%", background: `linear-gradient(135deg,${c},${c}88)`, display: "flex", alignItems: "center", justifyContent: "center", ...T.caption, fontWeight: 700, color: "#000", flexShrink: 0 }}>{pack.sellerAvatar}</div>
          <span style={{ ...T.caption, color: C.sub, flex: 1 }}>{pack.seller}</span>
          <Stars rating={pack.rating || 0} size={10}/>
          <span style={{ ...T.caption, color: C.muted }}>({pack.reviews || pack.review_count || 0})</span>
        </div>
        <p style={{ ...T.sm, color: C.sub, marginBottom: 10, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{pack.description}</p>
        <div style={{ display: "flex", alignItems: "center", gap: 10, paddingTop: 8, borderTop: "1px solid " + C.border }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}><Download size={11} color={C.muted}/><span style={{ ...T.caption, color: C.sub }}>{(pack.downloads || 0).toLocaleString()}</span></div>
          <span style={{ marginLeft: "auto", ...T.caption, color: c, fontWeight: 600 }}>View Pack →</span>
        </div>
      </div>
    </button>
  );
}

function PackDetail({ pack, user, purchased, onBuy, onClose, onToast }) {
  const [buying, setBuying] = useState(false);
  const [rating, setRating] = useState(0);
  const [reviewed, setReviewed] = useState(false);
  const catColor = {"image-gen":C.cyan,"video":C.purple,"copy":C.gold,"business":C.green,"social":"#FF6B9D","health":"#FF6B9D"};
  const c = catColor[pack.category] || C.sub;

  const handleBuy = async () => {
    setBuying(true);
    await new Promise(r => setTimeout(r, 1500));
    await onBuy(pack);
    setBuying(false);
  };

  const submitReview = async () => {
    if (!rating) return;
    if (!user.demo && _token) {
      await db.post("reviews", { pack_id: pack.id, user_id: _userId, rating }).catch(() => {});
    }
    setReviewed(true);
    onToast({ msg: "Review submitted!", type: "success" });
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 250, background: "rgba(0,0,0,.8)" }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: C.card2, borderRadius: "20px 20px 0 0", borderTop: "1px solid " + C.border, maxHeight: "92vh", display: "flex", flexDirection: "column", animation: "slideUp .35s cubic-bezier(.22,1,.36,1)" }}>
        <div style={{ height: 3, background: `linear-gradient(90deg,${c},${c}44)`, borderRadius: "20px 20px 0 0" }}/>
        <div style={{ padding: "18px 18px 0", flexShrink: 0 }}>
          <div style={{ width: 36, height: 4, background: C.muted, borderRadius: 2, margin: "0 auto 14px" }}/>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 4 }}>
            <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,.06)", border: "1px solid " + C.border, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}><X size={14} color={C.sub}/></button>
            <div style={{ flex: 1 }}>
              <div style={{ ...T.label, color: c, marginBottom: 3 }}>{pack.category}</div>
              <div className="syne" style={{ ...T.h2, color: C.text }}>{pack.title}</div>
            </div>
          </div>
        </div>
        <div style={{ overflowY: "auto", padding: "14px 18px 32px", flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, padding: "12px", background: "rgba(255,255,255,.02)", border: "1px solid " + C.border, borderRadius: 11 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: `linear-gradient(135deg,${c},${c}88)`, display: "flex", alignItems: "center", justifyContent: "center", ...T.h3, fontWeight: 700, color: "#000", flexShrink: 0 }}>{pack.sellerAvatar}</div>
            <div style={{ flex: 1 }}>
              <div style={{ ...T.body, fontWeight: 600, color: C.text }}>{pack.seller}</div>
              <div style={{ ...T.caption, color: C.sub }}>Verified Creator</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4, justifyContent: "flex-end" }}><Stars rating={pack.rating || 0} size={11}/><span style={{ ...T.sm, color: C.goldText, fontWeight: 700 }}>{pack.rating || "0.0"}</span></div>
              <div style={{ ...T.caption, color: C.sub }}>{pack.reviews || 0} reviews</div>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 14 }}>
            {[{v:(pack.downloads||0).toLocaleString(),l:"Downloads",c:C.cyan},{v:pack.rating||"0.0",l:"Rating",c:C.gold},{v:pack.totalPrompts||pack.total_prompts||20,l:"Prompts",c:C.purple}].map((s,i) => (
              <div key={i} style={{ padding: "10px", background: "rgba(255,255,255,.025)", border: "1px solid " + C.border, borderRadius: 10, textAlign: "center" }}>
                <div className="syne" style={{ ...T.h3, color: s.c, marginBottom: 2 }}>{s.v}</div>
                <div style={{ ...T.caption, color: C.sub }}>{s.l}</div>
              </div>
            ))}
          </div>
          <p style={{ ...T.body, color: C.sub, marginBottom: 14 }}>{pack.description}</p>
          <div style={{ marginBottom: 16 }}>
            <div style={{ ...T.label, color: C.sub, marginBottom: 8 }}>{purchased ? "Full Pack Access" : `Free Preview (3 of ${pack.totalPrompts || pack.total_prompts || 20})`}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {(pack.preview || []).map((p, i) => (
                <div key={i} style={{ padding: "12px", background: "#090912", border: "1px solid " + C.border, borderRadius: 10 }}>
                  <div style={{ ...T.label, color: c, marginBottom: 5 }}>PROMPT #{i + 1}</div>
                  <p style={{ ...T.body, color: C.text }}>{p}</p>
                </div>
              ))}
              {!purchased && (
                <div style={{ padding: "14px", background: "rgba(255,255,255,.02)", border: "1px dashed " + C.border, borderRadius: 10, textAlign: "center" }}>
                  <Lock size={16} color={C.muted} style={{ marginBottom: 6 }}/>
                  <div style={{ ...T.sm, color: C.sub }}>+{Math.max(0, (pack.totalPrompts || pack.total_prompts || 20) - (pack.preview || []).length)} more prompts unlocked after purchase</div>
                </div>
              )}
            </div>
          </div>
          {purchased && !reviewed && (
            <Card style={{ padding: "14px", marginBottom: 14, border: "1px solid rgba(155,114,255,.2)", background: "rgba(155,114,255,.04)" }}>
              <div style={{ ...T.body, fontWeight: 700, color: C.text, marginBottom: 10 }}>Rate this pack</div>
              <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                {[1,2,3,4,5].map(i => <button key={i} onClick={() => setRating(i)} style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}><Star size={24} color={i <= rating ? C.gold : C.muted} fill={i <= rating ? C.gold : "none"}/></button>)}
              </div>
              <Btn onClick={submitReview} variant="purple" size="sm" disabled={!rating}>Submit Review</Btn>
            </Card>
          )}
          {reviewed && <div style={{ padding: "10px 14px", background: C.greenDim, border: "1px solid rgba(13,219,114,.25)", borderRadius: 10, marginBottom: 14, ...T.sm, color: C.green }}>✓ Review submitted — thank you!</div>}
          {purchased ? (
            <div style={{ padding: "14px", background: C.greenDim, border: "1px solid rgba(13,219,114,.25)", borderRadius: 12, textAlign: "center" }}>
              <CheckCircle size={20} color={C.green} style={{ marginBottom: 8 }}/>
              <div className="syne" style={{ ...T.h3, color: C.green, marginBottom: 4 }}>You own this pack</div>
              <div style={{ ...T.sm, color: C.sub }}>Full content unlocked</div>
            </div>
          ) : (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div><div style={{ ...T.caption, color: C.sub }}>Price</div><div className="syne" style={{ fontSize: 24, fontWeight: 800, color: C.goldText }}>{pack.currency === "NGN" ? "₦" : "$"}{pack.price.toLocaleString()}</div></div>
                <div style={{ textAlign: "right" }}><div style={{ ...T.caption, color: C.sub }}>Creator earns</div><div style={{ ...T.body, color: C.green, fontWeight: 600 }}>80% per sale</div></div>
              </div>
              <Btn onClick={handleBuy} loading={buying} disabled={buying} variant="gold" full size="lg">
                <ShoppingBag size={15}/>{buying ? "Processing..." : `Buy Pack — ${pack.currency === "NGN" ? "₦" : "$"}${pack.price.toLocaleString()}`}
              </Btn>
              <p style={{ textAlign: "center", ...T.caption, color: C.muted, marginTop: 8 }}>Secure checkout · Instant access</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ListPackModal({ outputs, user, onList, onClose, onToast }) {
  const [step, setStep] = useState("select"); const [selOut, setSelOut] = useState(null); const [title, setTitle] = useState(""); const [desc, setDesc] = useState(""); const [cat, setCat] = useState("image-gen"); const [price, setPrice] = useState("1500"); const [currency, setCurrency] = useState("NGN"); const [err, setErr] = useState(""); const [submitting, setSubmitting] = useState(false);
  const promptOuts = outputs.filter(o => o.module === "Prompt Arena");

  const submit = async () => {
    if (!title.trim()) { setErr("Enter a pack title."); return; }
    if (!desc.trim()) { setErr("Write a description."); return; }
    if (!price || isNaN(price) || parseInt(price) < 100) { setErr("Enter a valid price (min 100)."); return; }
    setSubmitting(true); setErr("");
    const lines = (selOut?.content || "").split("\n").filter(l => l.trim().length > 25 && !l.startsWith("#")).slice(0, 3);
    const preview = lines.length >= 2 ? lines : ["Premium AI prompt from this collection", "Another carefully crafted prompt in this pack", "Third example showcasing the quality of this pack"];
    const pack = { title: title.trim(), seller_name: user.name, seller_avatar: user.avatar, seller: user.name, sellerAvatar: user.avatar, category: cat, price: parseInt(price), currency, description: desc.trim(), preview, full_content: selOut?.content || "", total_prompts: 20, downloads: 0, rating: 0, featured: false };
    await onList(pack);
    await new Promise(r => setTimeout(r, 1200));
    setSubmitting(false); setStep("success");
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 250, background: "rgba(0,0,0,.8)" }} onClick={e => { if (e.target === e.currentTarget && !submitting) onClose(); }}>
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: C.card2, borderRadius: "20px 20px 0 0", borderTop: "1px solid " + C.border, maxHeight: "90vh", display: "flex", flexDirection: "column", animation: "slideUp .35s cubic-bezier(.22,1,.36,1)" }}>
        <div style={{ padding: "18px 18px 0", flexShrink: 0 }}>
          <div style={{ width: 36, height: 4, background: C.muted, borderRadius: 2, margin: "0 auto 14px" }}/>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div>
              <div style={{ ...T.label, color: C.muted }}>{step === "select" ? "Step 1 of 2" : step === "details" ? "Step 2 of 2" : "Complete"}</div>
              <div className="syne" style={{ ...T.h2, color: C.text }}>{step === "select" ? "Choose Output" : step === "details" ? "Set Pack Details" : "Pack is Live! 🎉"}</div>
            </div>
            {!submitting && <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(255,255,255,.06)", border: "1px solid " + C.border, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><X size={14} color={C.sub}/></button>}
          </div>
        </div>
        <div style={{ overflowY: "auto", padding: "0 18px 32px", flex: 1 }}>
          {step === "select" && (
            <>
              <p style={{ ...T.body, color: C.sub, marginBottom: 14 }}>Select a Prompt Arena output to list in the marketplace.</p>
              {promptOuts.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 0" }}>
                  <div style={{ fontSize: 32, marginBottom: 12, opacity: .2 }}>⚡</div>
                  <p style={{ ...T.body, color: C.muted }}>Generate prompt packs in Prompt Arena first, then come back to list them.</p>
                </div>
              ) : promptOuts.map(o => (
                <button key={o.id} onClick={() => { setSelOut(o); setTitle(o.title); setStep("details"); }} style={{ width: "100%", padding: "13px", background: C.card, border: "1px solid " + C.border, borderRadius: 12, textAlign: "left", cursor: "pointer", display: "flex", alignItems: "center", gap: 11, marginBottom: 9 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 9, background: C.cyanDim, border: "1px solid rgba(0,200,240,.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flexShrink: 0 }}>⚡</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ ...T.body, fontWeight: 600, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.title}</div>
                    <div style={{ ...T.caption, color: C.sub, marginTop: 2 }}>{new Date(o.created_at).toLocaleDateString("en-GB")}</div>
                  </div>
                  <ArrowRight size={14} color={C.gold}/>
                </button>
              ))}
            </>
          )}
          {step === "details" && (
            <>
              <div style={{ padding: "9px 12px", background: C.cyanDim, border: "1px solid rgba(0,200,240,.2)", borderRadius: 10, marginBottom: 16, ...T.sm, color: C.cyan }}>Selected: <strong>{selOut?.title}</strong></div>
              <Lbl mt={false}>Pack Title</Lbl><FIn value={title} onChange={setTitle} placeholder="e.g. Ultimate MidJourney Portrait Pack"/>
              <Lbl>Description</Lbl>
              <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="What makes this pack special?" style={{ width: "100%", padding: "12px 14px", marginTop: 6, borderRadius: 10, background: "#090912", border: "1px solid " + C.border, color: C.text, ...T.body, resize: "none", height: 80 }}/>
              <Lbl>Category</Lbl><FSel value={cat} onChange={setCat} options={[{v:"image-gen",l:"Image Generation"},{v:"video",l:"Video Generation"},{v:"copy",l:"Copywriting"},{v:"business",l:"Business Strategy"},{v:"social",l:"Social Media"},{v:"health",l:"Health & Wellness"}]}/>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div><Lbl>Price</Lbl><FIn value={price} onChange={setPrice} placeholder="1500"/></div>
                <div><Lbl>Currency</Lbl><FSel value={currency} onChange={setCurrency} options={[{v:"NGN",l:"Naira (₦)"},{v:"USD",l:"USD ($)"}]}/></div>
              </div>
              <div style={{ marginTop: 12, padding: "10px 13px", background: C.greenDim, border: "1px solid rgba(13,219,114,.2)", borderRadius: 9 }}>
                <div style={{ ...T.sm, color: C.green, fontWeight: 600, marginBottom: 2 }}>Revenue Split</div>
                <div style={{ ...T.sm, color: C.sub }}>You earn <strong style={{ color: C.green }}>80%</strong> — KrespoAi keeps 20%</div>
                <div style={{ ...T.sm, color: C.sub, marginTop: 2 }}>Est. per sale: <strong style={{ color: C.goldText }}>{currency === "NGN" ? "₦" : "$"}{Math.round(parseInt(price || 0) * 0.8).toLocaleString()}</strong></div>
              </div>
              <ErrBox msg={err}/>
              <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
                <Btn onClick={submit} loading={submitting} disabled={submitting} variant="gold" full size="lg"><Upload size={15}/>{submitting ? "Publishing..." : "List in Marketplace"}</Btn>
                <Btn onClick={() => setStep("select")} variant="ghost" full size="md">Back</Btn>
              </div>
            </>
          )}
          {step === "success" && (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{ width: 60, height: 60, borderRadius: "50%", background: C.greenDim, border: "1px solid rgba(13,219,114,.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}><CheckCircle size={26} color={C.green}/></div>
              <div className="syne" style={{ ...T.h1, color: C.text, marginBottom: 8 }}>Pack is Live!</div>
              <p style={{ ...T.body, color: C.sub, marginBottom: 20 }}><strong style={{ color: C.goldText }}>{title}</strong> is now in the marketplace. Buyers worldwide can find and purchase it.</p>
              <Btn onClick={onClose} variant="gold" full size="lg"><ShoppingBag size={14}/>View in Marketplace</Btn>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Marketplace({ user, outputs, purchases, listings, onBuy, onList, onToast, loadingPacks }) {
  const [cat, setCat] = useState("all"); const [search, setSearch] = useState(""); const [sort, setSort] = useState("popular"); const [viewing, setViewing] = useState(null); const [listModal, setListModal] = useState(false); const [tab, setTab] = useState("browse");
  const allPacks = [...SEED_PACKS, ...listings];
  const filtered = allPacks.filter(p => {
    const ms = !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.seller.toLowerCase().includes(search.toLowerCase());
    const mc = cat === "all" || p.category === cat;
    return ms && mc;
  }).sort((a, b) => sort === "popular" ? b.downloads - a.downloads : sort === "rating" ? (b.rating || 0) - (a.rating || 0) : sort === "newest" ? new Date(b.createdAt || b.created_at) - new Date(a.createdAt || a.created_at) : sort === "price-low" ? a.price - b.price : b.price - a.price);
  const myListings = listings.filter(p => p.seller_id === _userId || p.sellerId === _userId);

  return (
    <div className="fu" style={{ padding: "4px 0 80px", gap: 0, animation: "fadeIn .3s ease" }}>
      <div style={{ background: "linear-gradient(135deg,rgba(155,114,255,.08),rgba(0,200,240,.04))", border: "1px solid " + C.border, borderRadius: 20, padding: "18px", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}><ShoppingBag size={18} color={C.purple}/><Badge color="purple">Live Marketplace</Badge></div>
        <div className="syne" style={{ ...T.h1, color: C.text, marginBottom: 6 }}>Prompt Marketplace</div>
        <p style={{ ...T.sm, color: C.sub, marginBottom: 12 }}>Buy premium AI prompts. Generate yours in Prompt Arena, then sell for 80% profit.</p>
        <Btn onClick={() => setListModal(true)} variant="purple" size="sm"><PlusCircle size={13}/>List Your Pack</Btn>
      </div>
      <div style={{ display: "flex", background: "rgba(255,255,255,.04)", borderRadius: 10, padding: 3, marginBottom: 14, border: "1px solid " + C.border }}>
        {[{id:"browse",l:"Browse"},{id:"my-listings",l:"My Listings"}].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, padding: "9px", borderRadius: 7, border: "none", background: tab === t.id ? C.card : "transparent", color: tab === t.id ? C.text : C.sub, ...T.body, fontWeight: tab === t.id ? 700 : 400, fontFamily: "DM Sans,sans-serif", cursor: "pointer" }}>{t.l}</button>
        ))}
      </div>
      {tab === "browse" && (
        <>
          <div style={{ position: "relative", marginBottom: 10 }}>
            <Search size={14} color={C.muted} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)" }}/>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search packs or creators..." style={{ width: "100%", padding: "11px 14px 11px 36px", borderRadius: 10, background: "#090912", border: "1px solid " + C.border, color: C.text, ...T.body }}/>
          </div>
          <div style={{ marginBottom: 12 }}><FSel value={sort} onChange={setSort} options={[{v:"popular",l:"Most Popular"},{v:"rating",l:"Highest Rated"},{v:"newest",l:"Newest First"},{v:"price-low",l:"Price: Low→High"},{v:"price-high",l:"Price: High→Low"}]}/></div>
          <div style={{ display: "flex", gap: 6, marginBottom: 14, overflowX: "auto", paddingBottom: 4 }}>
            {MKT_CATS.map(m => <button key={m.id} onClick={() => setCat(m.id)} style={{ padding: "6px 12px", borderRadius: 20, border: "1px solid " + (cat === m.id ? C.purple : C.border), background: cat === m.id ? C.purpleDim : "transparent", color: cat === m.id ? C.purple : C.sub, ...T.caption, fontWeight: cat === m.id ? 700 : 400, whiteSpace: "nowrap", cursor: "pointer", flexShrink: 0, fontFamily: "DM Sans,sans-serif" }}>{m.e} {m.l}</button>)}
          </div>
          {cat === "all" && !search && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}><Flame size={14} color={C.gold}/><div className="syne" style={{ ...T.h3, color: C.text }}>Featured Packs</div></div>
              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>{allPacks.filter(p => p.featured).map(p => <PackCard key={p.id} pack={p} purchased={purchases.includes(p.id)} onView={setViewing}/>)}</div>
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
            <Package size={14} color={C.sub}/>
            <div className="syne" style={{ ...T.h3, color: C.text }}>{cat === "all" ? "All Packs" : MKT_CATS.find(c => c.id === cat)?.l}</div>
            <span style={{ ...T.caption, color: C.muted }}>({filtered.length})</span>
          </div>
          {filtered.length === 0 ? <div style={{ textAlign: "center", padding: "40px 0" }}><div style={{ fontSize: 32, marginBottom: 12, opacity: .2 }}>🔍</div><p style={{ ...T.body, color: C.muted }}>No packs match your search.</p></div>
            : <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>{filtered.map(p => <PackCard key={p.id} pack={p} purchased={purchases.includes(p.id)} onView={setViewing}/>)}</div>}
        </>
      )}
      {tab === "my-listings" && (
        <>
          <Card style={{ padding: "16px", marginBottom: 14, border: "1px solid rgba(13,219,114,.2)", background: "rgba(13,219,114,.03)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}><BarChart2 size={15} color={C.green}/><div className="syne" style={{ ...T.h3, color: C.text }}>Creator Dashboard</div></div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
              {[{l:"Listings",v:myListings.length,c:C.cyan},{l:"Total Sales",v:myListings.reduce((a,p)=>a+(p.downloads||0),0),c:C.gold},{l:"Est. Earned",v:"₦"+Math.round(myListings.reduce((a,p)=>a+(p.downloads||0)*p.price*0.8,0)).toLocaleString(),c:C.green}].map((s,i) => (
                <div key={i} style={{ textAlign: "center", padding: "10px", background: "rgba(255,255,255,.02)", border: "1px solid " + C.border, borderRadius: 9 }}>
                  <div className="syne" style={{ ...T.h3, color: s.c }}>{s.v}</div>
                  <div style={{ ...T.caption, color: C.sub, marginTop: 2 }}>{s.l}</div>
                </div>
              ))}
            </div>
          </Card>
          {myListings.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <div style={{ fontSize: 32, marginBottom: 12, opacity: .2 }}>🚀</div>
              <p style={{ ...T.body, color: C.muted, marginBottom: 16 }}>No listings yet. Generate prompts in Prompt Arena then list them here.</p>
              <Btn onClick={() => setListModal(true)} variant="gold" size="lg"><PlusCircle size={14}/>List Your First Pack</Btn>
            </div>
          ) : myListings.map(p => (
            <Card key={p.id} style={{ padding: "14px", marginBottom: 10 }}>
              <div className="syne" style={{ ...T.h3, color: C.text, marginBottom: 4 }}>{p.title}</div>
              <div style={{ ...T.caption, color: C.sub, marginBottom: 8 }}>{p.category} · {new Date(p.created_at || p.createdAt).toLocaleDateString("en-GB")}</div>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <span style={{ ...T.sm, color: C.cyan }}>{p.downloads || 0} sales</span>
                <span style={{ ...T.sm, color: C.goldText }}>{p.currency === "NGN" ? "₦" : "$"}{p.price}/sale</span>
                <span style={{ ...T.sm, color: C.green }}>₦{Math.round((p.downloads||0)*p.price*0.8).toLocaleString()} earned</span>
              </div>
            </Card>
          ))}
        </>
      )}
      {viewing && <PackDetail pack={viewing} user={user} purchased={purchases.includes(viewing.id)} onBuy={async p => { await onBuy(p); setViewing(null); }} onClose={() => setViewing(null)} onToast={onToast}/>}
      {listModal && <ListPackModal outputs={outputs} user={user} onList={async p => { await onList(p); setListModal(false); }} onClose={() => setListModal(false)} onToast={onToast}/>}
    </div>
  );
}

// ── SAVED LIBRARY ─────────────────────────────────────────────────
function SavedLibrary({ outputs, onDelete, onToast }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const modules = ["all", ...new Set(outputs.map(o => o.module))];
  const filtered = outputs.filter(o => {
    const ms = !search || o.title.toLowerCase().includes(search.toLowerCase());
    const mf = filter === "all" || o.module === filter;
    return ms && mf;
  });
  return (
    <div className="fu" style={{ padding: "4px 0 80px", gap: 0, animation: "fadeIn .3s ease" }}>
      <MHead icon="💾" title="Saved Library" badge={`${outputs.length} outputs`} bc="green" desc="All your AI-generated content, saved and organized."/>
      {outputs.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <div style={{ fontSize: 48, marginBottom: 16, opacity: .1 }}>📄</div>
          <div className="syne" style={{ ...T.h2, color: C.sub, marginBottom: 8 }}>Nothing saved yet</div>
          <p style={{ ...T.body, color: C.muted }}>Generate content in any module — it auto-saves here.</p>
        </div>
      ) : (
        <>
          <div style={{ position: "relative", marginBottom: 10 }}>
            <Search size={14} color={C.muted} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)" }}/>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search outputs..." style={{ width: "100%", padding: "11px 14px 11px 36px", borderRadius: 10, background: "#090912", border: "1px solid " + C.border, color: C.text, ...T.body }}/>
          </div>
          <div style={{ display: "flex", gap: 6, marginBottom: 14, overflowX: "auto", paddingBottom: 4 }}>
            {modules.map(m => <button key={m} onClick={() => setFilter(m)} style={{ padding: "6px 12px", borderRadius: 20, border: "1px solid " + (filter === m ? C.gold : C.border), background: filter === m ? C.goldDim : "transparent", color: filter === m ? C.goldText : C.sub, ...T.caption, fontWeight: filter === m ? 700 : 400, whiteSpace: "nowrap", cursor: "pointer", flexShrink: 0, fontFamily: "DM Sans,sans-serif" }}>{m === "all" ? "All" : m}</button>)}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filtered.map(o => {
              const mc = MOD_COLORS[o.module] || C.sub;
              return (
                <Card key={o.id} style={{ overflow: "hidden" }}>
                  <div style={{ height: 2, background: mc }}/>
                  <div style={{ padding: "13px 14px" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                      <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>{MOD_ICONS[o.module] || "📄"}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ ...T.body, fontWeight: 700, color: C.text, marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.title}</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ ...T.caption, color: mc, fontWeight: 700 }}>{o.module}</span>
                          <span style={{ ...T.caption, color: C.muted }}>{new Date(o.created_at).toLocaleDateString("en-GB")}</span>
                        </div>
                      </div>
                      <button onClick={() => { onDelete(o.id); onToast({ msg: "Deleted", type: "success" }); }} style={{ width: 30, height: 30, borderRadius: 8, background: "transparent", border: "1px solid " + C.border, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
                        <Trash2 size={13} color={C.muted}/>
                      </button>
                    </div>
                    <div style={{ marginTop: 10, padding: "10px 12px", background: "#090912", borderRadius: 9, maxHeight: 100, overflow: "hidden" }}>
                      <p style={{ ...T.sm, color: C.sub, lineHeight: 1.65 }}>{o.content.slice(0, 200)}{o.content.length > 200 ? "…" : ""}</p>
                    </div>
                    <div style={{ marginTop: 8 }}>
                      <Btn onClick={() => { navigator.clipboard.writeText(o.content); onToast({ msg: "Copied!", type: "success" }); }} variant="ghost" size="sm"><Copy size={12}/>Copy</Btn>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ── PROFILE ───────────────────────────────────────────────────────
function ProfilePage({ user, outputs, transactions, onLogout, onToast }) {
  const plan = PLANS[user.plan] || PLANS.free;
  return (
    <div className="fu" style={{ padding: "4px 0 80px", gap: 16, animation: "fadeIn .3s ease" }}>
      <div style={{ background: "linear-gradient(135deg,rgba(240,165,0,.08),rgba(155,114,255,.06))", border: "1px solid " + C.border, borderRadius: 20, padding: "20px 18px", textAlign: "center" }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "linear-gradient(135deg,#F0A500,#E07800)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", ...T.display, color: "#000" }}>{user.avatar}</div>
        <div className="syne" style={{ ...T.h1, color: C.text, marginBottom: 4 }}>{user.name}</div>
        <div style={{ ...T.body, color: C.sub, marginBottom: 12 }}>{user.email}</div>
        <div style={{ display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap" }}>
          <Badge color="gold">{plan.name} Plan</Badge>
          <Badge color="cyan">Nigeria</Badge>
          {user.demo && <Badge color="purple">Demo Mode</Badge>}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
        {[{v:outputs.length,l:"Outputs",c:C.cyan},{v:Math.max(0,plan.credits-(user.credits_used||0)),l:"Credits",c:C.gold},{v:transactions.length,l:"Transactions",c:C.green}].map((s,i) => (
          <Card key={i} style={{ padding: "14px", textAlign: "center" }}>
            <div className="syne" style={{ ...T.h2, color: s.c, marginBottom: 3 }}>{s.v >= 99999 ? "∞" : s.v}</div>
            <div style={{ ...T.caption, color: C.muted }}>{s.l}</div>
          </Card>
        ))}
      </div>
      <Card style={{ padding: "16px" }}>
        <div className="syne" style={{ ...T.h3, color: C.text, marginBottom: 12 }}>Current Plan</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", background: C.goldDim, border: "1px solid " + C.borderGold, borderRadius: 12 }}>
          <div>
            <div className="syne" style={{ ...T.h3, color: C.goldText }}>{plan.name}</div>
            <div style={{ ...T.sm, color: C.sub }}>{plan.credits >= 99999 ? "Unlimited" : plan.credits} generations/month</div>
          </div>
          <Badge color="gold">{user.plan === "free" ? "Free" : "Active"}</Badge>
        </div>
        {user.plan === "free" && <div style={{ marginTop: 10 }}><Btn variant="gold" full size="md"><Crown size={14}/>Upgrade to Pro — ₦5,000/mo</Btn></div>}
      </Card>
      {transactions.length > 0 && (
        <Card style={{ padding: "16px" }}>
          <div className="syne" style={{ ...T.h3, color: C.text, marginBottom: 12 }}>Transaction History</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {transactions.slice(0, 5).map((tx, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px", background: "rgba(255,255,255,.02)", border: "1px solid " + C.border, borderRadius: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: C.greenDim, border: "1px solid rgba(13,219,114,.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><CreditCard size={14} color={C.green}/></div>
                <div style={{ flex: 1 }}>
                  <div style={{ ...T.sm, fontWeight: 600, color: C.text }}>{PLANS[tx.plan || tx.planKey]?.name || "Pro"} Plan</div>
                  <div style={{ ...T.caption, color: C.sub }}>{new Date(tx.created_at || tx.date).toLocaleDateString("en-GB")}</div>
                </div>
                <div className="syne" style={{ ...T.body, color: C.goldText, fontWeight: 700 }}>{tx.currency === "NGN" ? "₦" : "$"}{tx.amount?.toLocaleString()}</div>
              </div>
            ))}
          </div>
        </Card>
      )}
      <Card style={{ padding: "16px" }}>
        <div className="syne" style={{ ...T.h3, color: C.text, marginBottom: 12 }}>Account</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", borderRadius: 10, background: "rgba(255,255,255,.02)", border: "1px solid " + C.border }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}><Globe size={14} color={C.sub}/><span style={{ ...T.body, color: C.text }}>Region</span></div>
            <span style={{ ...T.sm, color: C.sub }}>Nigeria</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", borderRadius: 10, background: "rgba(255,255,255,.02)", border: "1px solid " + C.border }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}><Clock size={14} color={C.sub}/><span style={{ ...T.body, color: C.text }}>Joined</span></div>
            <span style={{ ...T.sm, color: C.sub }}>{new Date(user.joined_at || Date.now()).toLocaleDateString("en-GB")}</span>
          </div>
          <button onClick={onLogout} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, background: "rgba(255,68,68,.04)", border: "1px solid rgba(255,68,68,.15)", cursor: "pointer", width: "100%" }}>
            <LogOut size={14} color={C.red}/><span style={{ ...T.body, color: C.red }}>Sign Out</span>
          </button>
        </div>
      </Card>
    </div>
  );
}

// ── PRICING PAGE ──────────────────────────────────────────────────
function PricingPage({ user, onToast }) {
  const plans = [
    { key: "free", name: "Free", price: "₦0", period: "/forever", features: ["5 AI generations/month","All 5 modules","Marketplace browsing","Export to TXT"], cta: user.plan === "free" ? "Current Plan" : "Downgrade", variant: "ghost" },
    { key: "pro", name: "Pro", price: "₦5,000", period: "/month", features: ["200 AI generations/month","All 5 modules","PDF export","Marketplace selling","Priority generation","Credits rollover"], cta: user.plan === "pro" ? "Current Plan" : "Upgrade to Pro", variant: "gold", popular: true },
    { key: "enterprise", name: "Enterprise", price: "₦20,000", period: "/month", features: ["Unlimited generations","Everything in Pro","Custom AI models","API access","Dedicated support","Team workspace"], cta: user.plan === "enterprise" ? "Current Plan" : "Contact Sales", variant: "purple" },
  ];
  return (
    <div className="fu" style={{ padding: "4px 0 80px", gap: 16, animation: "fadeIn .3s ease" }}>
      <div style={{ textAlign: "center", marginBottom: 4 }}>
        <div className="syne" style={{ ...T.h1, color: C.text, marginBottom: 6 }}>Plans & Billing</div>
        <p style={{ ...T.body, color: C.sub }}>PayPal payments coming soon. Upgrade when ready.</p>
      </div>
      {plans.map(p => (
        <Card key={p.key} style={{ padding: "20px", border: "1px solid " + (p.popular ? C.borderGold : C.border), background: p.popular ? C.goldDim : C.card, position: "relative", overflow: "hidden" }}>
          {p.popular && <div style={{ position: "absolute", top: 12, right: 12 }}><Badge color="gold">Most Popular</Badge></div>}
          <div className="syne" style={{ ...T.h2, color: p.popular ? C.goldText : C.text, marginBottom: 4 }}>{p.name}</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 16 }}>
            <span className="syne" style={{ fontSize: 28, fontWeight: 800, color: p.popular ? C.goldText : C.text }}>{p.price}</span>
            <span style={{ ...T.sm, color: C.muted }}>{p.period}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 }}>
            {p.features.map((f, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <CheckCircle size={14} color={p.popular ? C.gold : C.green} style={{ flexShrink: 0 }}/>
                <span style={{ ...T.body, color: C.sub }}>{f}</span>
              </div>
            ))}
          </div>
          <Btn onClick={() => onToast({ msg: user.plan === p.key ? "Already on this plan!" : "PayPal payments coming soon!", type: user.plan === p.key ? "info" : "info" })} variant={user.plan === p.key ? "ghost" : p.variant} full size="lg" disabled={user.plan === p.key}>{p.cta}</Btn>
        </Card>
      ))}
      <div style={{ padding: "14px", background: "rgba(0,200,240,.04)", border: "1px solid rgba(0,200,240,.15)", borderRadius: 12, textAlign: "center" }}>
        <p style={{ ...T.sm, color: C.sub }}>💡 PayPal Business integration coming in Phase 8. All payments will be processed securely with instant plan activation.</p>
      </div>
    </div>
  );
}

// ── MORE DRAWER ───────────────────────────────────────────────────
function MoreDrawer({ go, onClose }) {
  const items = [
    {id:"ebook",e:"📘",l:"Ebook Generator"},{id:"content",e:"🎬",l:"Content Hub"},
    {id:"business",e:"💼",l:"Business Builder"},{id:"health",e:"🩺",l:"Health & Edu"},
    {id:"pricing",e:"💳",l:"Plans & Billing"},{id:"profile",e:"👤",l:"My Profile"},
  ];
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,.65)" }} onClick={onClose}>
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: C.card2, borderTop: "1px solid " + C.border, borderRadius: "20px 20px 0 0", padding: "12px 18px 36px", animation: "slideUp .3s cubic-bezier(.22,1,.36,1)" }} onClick={e => e.stopPropagation()}>
        <div style={{ width: 36, height: 4, background: C.muted, borderRadius: 2, margin: "0 auto 16px" }}/>
        <div className="syne" style={{ ...T.h3, color: C.text, marginBottom: 14 }}>More</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {items.map(m => (
            <button key={m.id} onClick={() => { go(m.id); onClose(); }} style={{ padding: "14px", borderRadius: 12, border: "1px solid " + C.border, background: "rgba(255,255,255,.02)", cursor: "pointer", textAlign: "left" }}>
              <div style={{ fontSize: 22, marginBottom: 7 }}>{m.e}</div>
              <div style={{ ...T.body, fontWeight: 600, color: C.text }}>{m.l}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── APP ROOT ──────────────────────────────────────────────────────
const BNAV = [
  { id: "dashboard", l: "Home",    icon: LayoutDashboard },
  { id: "prompt",    l: "Prompts", icon: Zap             },
  { id: "market",    l: "Market",  icon: ShoppingBag     },
  { id: "library",   l: "Library", icon: BookOpen        },
  { id: "more",      l: "More",    icon: MoreHorizontal  },
];
const LABELS = { dashboard:"Dashboard", ebook:"Ebook Generator", prompt:"Prompt Arena", content:"Content Hub", business:"Business Builder", health:"Health & Edu", library:"Saved Library", market:"Marketplace", pricing:"Plans & Billing", profile:"My Profile" };
const MORE_IDS = ["ebook","content","business","health","pricing","profile"];

export default function App() {
  const [phase, setPhase]         = useState("splash");
  const [user, setUser]           = useState(null);
  const [outputs, setOutputs]     = useState([]);
  const [transactions, setTx]     = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [listings, setListings]   = useState([]);
  const [active, setActive]       = useState("dashboard");
  const [toast, setToast]         = useState(null);
  const [drawer, setDrawer]       = useState(false);

  // Init — check for persisted session
  useEffect(() => {
    const init = async () => {
      await new Promise(r => setTimeout(r, 1800));
      try {
        const tk = localStorage.getItem("krespo:token");
        const uid = localStorage.getItem("krespo:uid");
        if (tk && uid) {
          _token = tk; _userId = uid;
          const u = await sbGetUser();
          if (u && !u.error) {
            await loadUserData(u.id, u.email);
            return;
          }
        }
      } catch {}
      setPhase("auth");
    };
    init();
  }, []);

  const loadUserData = async (userId, email) => {
    try {
      const [profiles, outs, txs, purcs] = await Promise.all([
        db.get("profiles", `?id=eq.${userId}`),
        db.get("outputs", `?user_id=eq.${userId}&order=created_at.desc`),
        db.get("transactions", `?user_id=eq.${userId}&order=created_at.desc`),
        db.get("purchases", `?buyer_id=eq.${userId}&select=pack_id`),
      ]);
      const p = profiles[0] || {};
      setUser({ id: userId, email, name: p.name || email?.split("@")[0] || "User", avatar: p.avatar || "U", plan: p.plan || "free", credits_used: p.credits_used || 0, joined_at: p.joined_at });
      setOutputs(outs);
      setTx(txs);
      setPurchases(purcs.map(p => p.pack_id));
      // Load marketplace listings
      const packs = await db.get("marketplace_packs", `?seller_id=eq.${userId}&order=created_at.desc`);
      setListings(packs);
    } catch (e) {
      console.error("loadUserData error", e);
    }
    setPhase("app");
  };

  const handleAuth = async (u) => {
    if (u.demo) { setUser(u); setOutputs([]); setTx([]); setPurchases([]); setListings([]); setPhase("app"); return; }
    await loadUserData(u.id, u.email);
  };

  const handleLogout = async () => {
    await sbSignOut();
    localStorage.removeItem("krespo:token");
    localStorage.removeItem("krespo:uid");
    setUser(null); setOutputs([]); setTx([]); setPurchases([]); setListings([]);
    setActive("dashboard"); setPhase("auth");
  };

  const handleCredit = useCallback(async () => {
    if (!user) return;
    const upd = { ...user, credits_used: (user.credits_used || 0) + 1 };
    setUser(upd);
    if (!user.demo && _userId) {
      await db.patch("profiles", `?id=eq.${_userId}`, { credits_used: upd.credits_used }).catch(() => {});
    }
  }, [user]);

  const handleSave = useCallback(async (output) => {
    const o = { ...output, id: output.id || "local-" + Date.now() };
    if (!user.demo && _userId) {
      try {
        const saved = await db.post("outputs", { user_id: _userId, title: o.title, module: o.module, content: o.content });
        o.id = saved.id || o.id;
        o.created_at = saved.created_at || o.created_at;
      } catch {}
    }
    setOutputs(prev => [o, ...prev]);
  }, [user]);

  const handleDelete = useCallback(async (id) => {
    setOutputs(prev => prev.filter(o => o.id !== id));
    if (!user?.demo && _userId && !id.startsWith("local-")) {
      await db.del("outputs", `?id=eq.${id}`).catch(() => {});
    }
  }, [user]);

  const handleBuyPack = useCallback(async (pack) => {
    setPurchases(prev => [...prev, pack.id]);
    if (!user?.demo && _userId) {
      await db.post("purchases", { buyer_id: _userId, pack_id: pack.id, amount: pack.price, currency: pack.currency || "NGN" }).catch(() => {});
    }
    setToast({ msg: "Pack purchased! Full access unlocked.", type: "success" });
  }, [user]);

  const handleListPack = useCallback(async (pack) => {
    let savedPack = { ...pack, id: "user-" + Date.now(), seller_id: _userId, createdAt: new Date().toISOString() };
    if (!user?.demo && _userId) {
      try {
        const sp = await db.post("marketplace_packs", { seller_id: _userId, seller_name: pack.seller_name || user.name, seller_avatar: pack.seller_avatar || user.avatar, title: pack.title, description: pack.description, category: pack.category, price: pack.price, currency: pack.currency, preview: pack.preview, full_content: pack.full_content || "", total_prompts: 20, downloads: 0, rating: 0, featured: false });
        savedPack = { ...savedPack, ...sp };
      } catch {}
    }
    setListings(prev => [savedPack, ...prev]);
    setToast({ msg: "Pack listed in marketplace!", type: "success" });
  }, [user]);

  const go = useCallback(id => { setActive(id); setDrawer(false); }, []);
  const mp = { user, onCredit: handleCredit, onSave: handleSave, onToast: setToast };

  // Load DB marketplace listings (all users) for browse tab
  const [dbPacks, setDbPacks] = useState([]);
  useEffect(() => {
    if (phase === "app") {
      db.get("marketplace_packs", "?order=downloads.desc").then(packs => setDbPacks(packs || [])).catch(() => {});
    }
  }, [phase]);

  const allListings = [...listings, ...dbPacks.filter(p => !listings.find(l => l.id === p.id))];

  const getPage = () => {
    if (!user) return null;
    switch (active) {
      case "dashboard": return <Dashboard user={user} outputs={outputs} transactions={transactions} packs={allListings} go={go}/>;
      case "ebook":    return <EbookGen {...mp}/>;
      case "prompt":   return <PromptArena {...mp} onGoMarket={() => go("market")}/>;
      case "content":  return <ContentHub {...mp}/>;
      case "business": return <BizBuilder {...mp}/>;
      case "health":   return <HealthEdu {...mp}/>;
      case "market":   return <Marketplace user={user} outputs={outputs} purchases={purchases} listings={allListings} onBuy={handleBuyPack} onList={handleListPack} onToast={setToast}/>;
      case "library":  return <SavedLibrary outputs={outputs} onDelete={handleDelete} onToast={setToast}/>;
      case "profile":  return <ProfilePage user={user} outputs={outputs} transactions={transactions} onLogout={handleLogout} onToast={setToast}/>;
      case "pricing":  return <PricingPage user={user} onToast={setToast}/>;
      default: return null;
    }
  };

  if (phase === "splash") return <Splash/>;
  if (phase === "auth")   return <><FontStyle/><AuthScreen onAuth={handleAuth}/></>;

  return (
    <>
      <FontStyle/>
      <div style={{ maxWidth: 480, margin: "0 auto", height: "100dvh", display: "flex", flexDirection: "column", background: C.bg, position: "relative", overflow: "hidden" }}>
        {/* TOP BAR */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid " + C.border, background: "rgba(7,7,14,.97)", backdropFilter: "blur(12px)", flexShrink: 0, zIndex: 50 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            {active !== "dashboard" && <button onClick={() => go("dashboard")} style={{ width: 32, height: 32, borderRadius: 9, background: "rgba(255,255,255,.05)", border: "1px solid " + C.border, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}><ChevronLeft size={16} color={C.sub}/></button>}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg,#F0A500,#E07800)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span className="syne" style={{ fontSize: 13, fontWeight: 800, color: "#000" }}>K</span>
              </div>
              <div>
                <div style={{ ...T.label, color: C.muted, lineHeight: 1 }}>KrespoAi</div>
                <div className="syne" style={{ ...T.h3, color: C.text, lineHeight: 1.25 }}>{LABELS[active] || active}</div>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <button onClick={() => go("pricing")} style={{ ...T.caption, padding: "4px 9px", background: C.goldDim, border: "1px solid rgba(240,165,0,.2)", borderRadius: 6, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ color: C.goldText, fontWeight: 700 }}>{(PLANS[user?.plan]?.credits || 5) - (user?.credits_used || 0) > 9999 ? "∞" : Math.max(0, (PLANS[user?.plan]?.credits || 5) - (user?.credits_used || 0))}</span>
              <span style={{ color: C.muted }}>cr</span>
            </button>
            <button onClick={() => go("profile")} style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg,#F0A500,#E07800)", display: "flex", alignItems: "center", justifyContent: "center", ...T.body, fontWeight: 800, color: "#000", cursor: "pointer", border: "none", flexShrink: 0, fontFamily: "Syne,sans-serif" }}>{user?.avatar || "K"}</button>
          </div>
        </div>

        {/* PAGE CONTENT */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 8px", WebkitOverflowScrolling: "touch" }} key={active}>
          {getPage()}
        </div>

        {/* BOTTOM NAV */}
        <div style={{ display: "flex", borderTop: "1px solid " + C.border, background: "rgba(11,11,22,.97)", backdropFilter: "blur(14px)", flexShrink: 0 }}>
          {BNAV.map(n => {
            const Icon = n.icon;
            const lit = n.id === "more" ? MORE_IDS.includes(active) : active === n.id;
            const isMarket = n.id === "market";
            const ac = isMarket ? C.purple : C.gold;
            const ab = isMarket ? C.purpleDim : C.goldDim;
            return (
              <button key={n.id} onClick={() => n.id === "more" ? setDrawer(true) : go(n.id)} style={{ flex: 1, padding: "10px 4px 8px", border: "none", background: "transparent", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, position: "relative" }}>
                {isMarket && <div style={{ position: "absolute", top: 7, right: "calc(50% - 14px)", width: 6, height: 6, borderRadius: "50%", background: C.purple, border: "2px solid " + C.bg }}/>}
                <div style={{ width: 32, height: 32, borderRadius: 9, background: lit ? ab : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .15s" }}>
                  <Icon size={16} color={lit ? ac : C.muted}/>
                </div>
                <span style={{ ...T.caption, color: lit ? ac : C.muted, fontWeight: lit ? 700 : 400, fontFamily: "DM Sans,sans-serif" }}>{n.l}</span>
              </button>
            );
          })}
        </div>
      </div>

      {drawer && <MoreDrawer go={go} onClose={() => setDrawer(false)}/>}
      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)}/>}
    </>
  );
}
