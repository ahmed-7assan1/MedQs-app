import { useState, useRef, useEffect } from "react";

// ─── Google Font ─────────────────────────────────────────────────────────────
const fontLink = document.createElement("link");
fontLink.rel = "stylesheet";
fontLink.href = "https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap";
document.head.appendChild(fontLink);

// ─── Theme ────────────────────────────────────────────────────────────────────
const LIGHT = {
  bg: "#f4f5fb",
  card: "#ffffff",
  cardBorder: "#ececf5",
  sidebar: "#ffffff",
  primary: "#5b5ef7",
  primaryLight: "#eef0ff",
  text: "#111827",
  textSec: "#6b7280",
  textMuted: "#9ca3af",
  inputBg: "#f8f9fa",
  inputBorder: "#e5e7eb",
  divider: "#f1f3f5",
  tagBg: "#eef0ff",
  tagText: "#5b5ef7",
  roomOnline: "#10a37f",
  navActive: "#eef0ff",
  shadow: "0 2px 12px rgba(91,94,247,0.07)",
  avatarBorder: "#fff",
};
const DARK = {
  bg: "#0f0f17",
  card: "#16161f",
  cardBorder: "#2a2a3a",
  sidebar: "#13131c",
  primary: "#7577f9",
  primaryLight: "#1e1e2e",
  text: "#f1f0ff",
  textSec: "#9ca3af",
  textMuted: "#6b7280",
  inputBg: "#1e1e2e",
  inputBorder: "#2a2a3a",
  divider: "#1e1e2e",
  tagBg: "#1e1e2e",
  tagText: "#a5a8ff",
  roomOnline: "#34d399",
  navActive: "#1e1e2e",
  shadow: "0 2px 12px rgba(0,0,0,0.3)",
  avatarBorder: "#16161f",
};

// ─── Icons ────────────────────────────────────────────────────────────────────
const IC = {
  moon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>,
  sun: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>,
  home: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  explore: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  rooms: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  bookmark: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>,
  bell: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  plus: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  heart: (f) => f
    ? <svg width="18" height="18" viewBox="0 0 24 24" fill="#e84040" stroke="#e84040" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
    : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  comment: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  share: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>,
  mic: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>,
  image: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
  video: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>,
  trending: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  lock: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  globe: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
  settings: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  fire: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3z"/></svg>,
  star: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
};

// ─── Data ─────────────────────────────────────────────────────────────────────
const POSTS = [
  {
    id: 1, user: "أحمد محمد", handle: "@ahmed_m", avatar: "أم", color: "#5b5ef7",
    time: "منذ ٣ ساعات", text: "شاهدوا هذه اللحظة الرائعة من رحلتي الأخيرة! 🌅✨\nكانت تجربة لا تُنسى في قلب الطبيعة البكر.",
    hashtags: ["#سفر", "#طبيعة", "#مغامرة"],
    media: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
    likes: 1482, comments: 97, shares: 243, liked: false,
    room: "رحّالون العرب",
  },
  {
    id: 2, user: "سارة علي", handle: "@sara_ali", avatar: "سع", color: "#e84040",
    time: "منذ ٥ ساعات", text: "حلّ مشكلة التعقيد الزمني في خوارزمية البحث الثنائي المحسّنة 🧠⚡ — أشارك الكود الكامل في التعليقات.",
    hashtags: ["#برمجة", "#خوارزميات", "#لغة_C"],
    media: null,
    likes: 634, comments: 41, shares: 88, liked: true,
    room: "code.study",
  },
  {
    id: 3, user: "لينا حسن", handle: "@lina_h", avatar: "له", color: "#f5a623",
    time: "منذ ٨ ساعات", text: "جلسة مذاكرة مثمرة اليوم 📚 — انتهيت من فصلين كاملين في الكيمياء العضوية. مين معي نكمل بكرا؟",
    hashtags: ["#مذاكرة", "#كيمياء", "#جامعة"],
    media: "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=800&q=80",
    likes: 290, comments: 55, shares: 30, liked: false,
    room: "مذاكرة مع بعض",
  },
];

const STUDY_ROOMS = [
  { id: 1, name: "code.study", topic: "خوارزميات وبنى البيانات", members: 34, online: 12, color: "#5b5ef7", type: "public", joined: true, tags: ["#برمجة", "#CS"] },
  { id: 2, name: "مذاكرة مع بعض", topic: "مراجعة الثانوية والجامعة", members: 128, online: 47, color: "#10a37f", type: "public", joined: true, tags: ["#مذاكرة", "#ثانوي"] },
  { id: 3, name: "رحّالون العرب", topic: "شاركنا مغامراتك حول العالم", members: 81, online: 23, color: "#f5a623", type: "public", joined: false, tags: ["#سفر", "#ترحال"] },
  { id: 4, name: "Physics Gang", topic: "فيزياء تطبيقية — كل المستويات", members: 56, online: 9, color: "#e84040", type: "private", joined: false, tags: ["#فيزياء", "#علوم"] },
  { id: 5, name: "Design Vault", topic: "تصميم UI/UX ونقاشات إبداعية", members: 44, online: 18, color: "#7c3aed", type: "public", joined: true, tags: ["#تصميم", "#UI"] },
];

const TRENDING = [
  { id: 1, tag: "#خوارزميات", posts: "٢.٤ ألف منشور", hot: true },
  { id: 2, tag: "#مذاكرة", posts: "١.٨ ألف منشور", hot: true },
  { id: 3, tag: "#سفر", posts: "٩.٢ ألف منشور", hot: false },
  { id: 4, tag: "#تصميم_UI", posts: "٦٠٠ منشور", hot: false },
  { id: 5, tag: "#كيمياء", posts: "٤٣٠ منشور", hot: false },
  { id: 6, tag: "#امتحانات", posts: "٣.١ ألف منشور", hot: true },
];

const SUGGESTED = [
  { name: "خالد يوسف", handle: "@khalid_y", avatar: "خي", color: "#7c3aed", mutual: 5 },
  { name: "منى طاهر", handle: "@mona_t", avatar: "مط", color: "#10a37f", mutual: 3 },
  { name: "عمر فاروق", handle: "@omar_f", avatar: "عف", color: "#e84040", mutual: 8 },
];

// ─── Sub-Components ───────────────────────────────────────────────────────────
function Avatar({ initials, color, size = 40, border }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: color, display: "flex", alignItems: "center",
      justifyContent: "center", color: "#fff",
      fontSize: size * 0.33, fontWeight: "700",
      flexShrink: 0, fontFamily: "'Cairo', sans-serif",
      border: border ? `2px solid ${border}` : "none",
    }}>{initials}</div>
  );
}

function PostCard({ post, t, onOpen }) {
  const [liked, setLiked] = useState(post.liked);
  const [likes, setLikes] = useState(post.likes);

  return (
    <div style={{
      background: t.card, border: `1px solid ${t.cardBorder}`,
      borderRadius: 20, overflow: "hidden", transition: "box-shadow 0.2s",
      boxShadow: t.shadow,
    }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = `0 4px 24px rgba(91,94,247,0.12)`}
      onMouseLeave={e => e.currentTarget.style.boxShadow = t.shadow}
    >
      {/* Header */}
      <div style={{ padding: "14px 18px 10px", display: "flex", alignItems: "center", gap: 10 }}>
        <Avatar initials={post.avatar} color={post.color} size={42} />
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: t.text }}>{post.user}</span>
            <span style={{ fontSize: 12, color: t.textMuted }}>{post.handle}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
            <span style={{ fontSize: 11, color: t.textMuted }}>{post.time}</span>
            <span style={{ fontSize: 11, color: t.textMuted }}>·</span>
            <span style={{ fontSize: 11, background: t.tagBg, color: t.tagText, padding: "1px 8px", borderRadius: 20, fontWeight: 600 }}>{post.room}</span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "0 18px 12px" }}>
        <p style={{ margin: 0, fontSize: 14, color: t.text, lineHeight: 1.75, whiteSpace: "pre-line" }}>{post.text}</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
          {post.hashtags.map(h => (
            <span key={h} style={{ fontSize: 12, color: t.primary, fontWeight: 600, cursor: "pointer" }}>{h}</span>
          ))}
        </div>
      </div>

      {/* Media */}
      {post.media && (
        <div style={{ margin: "0 12px 12px", borderRadius: 14, overflow: "hidden", cursor: "pointer" }} onClick={() => onOpen(post)}>
          <img src={post.media} alt="post" style={{ width: "100%", height: 280, objectFit: "cover", display: "block" }} />
        </div>
      )}

      {/* Actions */}
      <div style={{ borderTop: `1px solid ${t.divider}`, padding: "8px 12px", display: "flex", gap: 4 }}>
        {[
          { icon: IC.heart(liked), label: liked ? likes + 1 : likes, action: () => { setLiked(!liked); setLikes(liked ? likes - 1 : likes + 1); }, active: liked, activeColor: "#fee2e2", activeTextColor: "#e84040" },
          { icon: IC.comment, label: post.comments, action: () => onOpen(post), active: false },
          { icon: IC.share, label: post.shares, action: () => {}, active: false },
        ].map((btn, i) => (
          <button key={i} onClick={btn.action} style={{
            flex: 1, padding: "8px 4px", border: "none", borderRadius: 12,
            cursor: "pointer", display: "flex", alignItems: "center",
            justifyContent: "center", gap: 5, fontSize: 13,
            fontFamily: "'Cairo', sans-serif", transition: "all 0.15s",
            background: btn.active ? btn.activeColor : "transparent",
            color: btn.active ? btn.activeTextColor : t.textSec,
            fontWeight: btn.active ? 700 : 400,
          }}>
            {btn.icon}
            <span>{btn.label.toLocaleString("ar-EG")}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function StudyRoomCard({ room, t }) {
  const [joined, setJoined] = useState(room.joined);
  return (
    <div style={{
      background: t.card, border: `1px solid ${t.cardBorder}`,
      borderRadius: 16, padding: "14px 16px",
      display: "flex", flexDirection: "column", gap: 8,
      transition: "box-shadow 0.2s", cursor: "pointer",
      boxShadow: t.shadow,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 42, height: 42, borderRadius: 12,
          background: room.color + "22", display: "flex",
          alignItems: "center", justifyContent: "center",
          fontSize: 20, flexShrink: 0,
        }}>
          <div style={{ width: 18, height: 18, borderRadius: 5, background: room.color }}></div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
            <span style={{ fontWeight: 700, fontSize: 13, color: t.text }}>{room.name}</span>
            <span style={{ color: t.textMuted, display: "flex" }}>
              {room.type === "private" ? IC.lock : IC.globe}
            </span>
          </div>
          <p style={{ margin: 0, fontSize: 12, color: t.textSec, marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{room.topic}</p>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 12, color: t.textSec }}>
            <span style={{ fontWeight: 600, color: t.text }}>{room.members}</span> عضو
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: t.roomOnline }}></div>
            <span style={{ fontSize: 12, color: t.roomOnline, fontWeight: 600 }}>{room.online} متصل</span>
          </div>
        </div>
        <button onClick={() => setJoined(!joined)} style={{
          fontSize: 12, fontFamily: "'Cairo', sans-serif",
          fontWeight: 700, padding: "4px 14px", borderRadius: 20,
          border: `1.5px solid ${joined ? t.cardBorder : t.primary}`,
          background: joined ? "transparent" : t.primary,
          color: joined ? t.textSec : "#fff",
          cursor: "pointer", transition: "all 0.15s",
        }}>{joined ? "متابَع" : "انضم"}</button>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
        {room.tags.map(tag => (
          <span key={tag} style={{ fontSize: 11, background: t.tagBg, color: t.tagText, padding: "2px 8px", borderRadius: 20, fontWeight: 600 }}>{tag}</span>
        ))}
      </div>
    </div>
  );
}

// ─── Compose Modal ────────────────────────────────────────────────────────────
function ComposeModal({ t, onClose }) {
  const [text, setText] = useState("");
  const [selectedRoom, setSelectedRoom] = useState("code.study");

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 1000, padding: 20,
    }} onClick={onClose}>
      <div style={{
        background: t.card, borderRadius: 24, width: "100%", maxWidth: 520,
        overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
      }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: "18px 20px 14px", borderBottom: `1px solid ${t.divider}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontWeight: 700, fontSize: 16, color: t.text }}>منشور جديد</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: t.textSec, fontSize: 22, lineHeight: 1 }}>✕</button>
        </div>
        <div style={{ padding: "14px 20px" }}>
          <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
            <Avatar initials="أن" color="#5b5ef7" size={40} />
            <div style={{ flex: 1 }}>
              <select value={selectedRoom} onChange={e => setSelectedRoom(e.target.value)} style={{
                background: t.tagBg, color: t.tagText, border: "none",
                borderRadius: 20, padding: "4px 12px", fontSize: 12,
                fontFamily: "'Cairo', sans-serif", fontWeight: 700, cursor: "pointer",
                marginBottom: 8,
              }}>
                {STUDY_ROOMS.filter(r => r.joined).map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
              </select>
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="ما الذي يدور في ذهنك؟"
                rows={4}
                style={{
                  width: "100%", border: "none", outline: "none", resize: "none",
                  background: "transparent", fontFamily: "'Cairo', sans-serif",
                  fontSize: 15, color: t.text, lineHeight: 1.75,
                }}
              />
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, borderTop: `1px solid ${t.divider}`, paddingTop: 12 }}>
            {[IC.image, IC.video, IC.mic].map((ic, i) => (
              <button key={i} style={{ background: "none", border: "none", cursor: "pointer", color: t.textSec, display: "flex", padding: 6, borderRadius: 8, transition: "background 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.background = t.tagBg}
                onMouseLeave={e => e.currentTarget.style.background = "none"}>
                {ic}
              </button>
            ))}
            <div style={{ flex: 1 }} />
            <button style={{
              padding: "8px 22px", borderRadius: 20, border: "none",
              background: text.trim() ? t.primary : t.inputBorder,
              color: text.trim() ? "#fff" : t.textMuted,
              fontFamily: "'Cairo', sans-serif", fontWeight: 700, fontSize: 14,
              cursor: text.trim() ? "pointer" : "default", transition: "all 0.15s",
            }}>نشر</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SocialPage() {
  const [dark, setDark] = useState(false);
  const [activeNav, setActiveNav] = useState("home");
  const [postLikes, setPostLikes] = useState({});
  const [compose, setCompose] = useState(false);
  const [activePost, setActivePost] = useState(null);
  const t = dark ? DARK : LIGHT;

  const navItems = [
    { id: "home", icon: IC.home, label: "الرئيسية" },
    { id: "explore", icon: IC.explore, label: "استكشاف" },
    { id: "rooms", icon: IC.rooms, label: "الغرف" },
    { id: "saved", icon: IC.bookmark, label: "المحفوظات" },
    { id: "notifs", icon: IC.bell, label: "الإشعارات" },
    { id: "settings", icon: IC.settings, label: "الإعدادات" },
  ];

  const myRooms = STUDY_ROOMS.filter(r => r.joined);

  return (
    <div style={{
      minHeight: "100vh", background: t.bg,
      fontFamily: "'Cairo', sans-serif",
      direction: "rtl", color: t.text,
      transition: "background 0.3s, color 0.3s",
    }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 4px; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideIn { from { opacity: 0; transform: translateX(-10px); } to { opacity: 1; transform: translateX(0); } }
        .post-card { animation: fadeUp 0.35s ease both; }
        .post-card:nth-child(1) { animation-delay: 0.05s; }
        .post-card:nth-child(2) { animation-delay: 0.12s; }
        .post-card:nth-child(3) { animation-delay: 0.19s; }
        @media (max-width: 900px) { .right-sidebar { display: none !important; } }
        @media (max-width: 640px) { .left-sidebar { display: none !important; } }
      `}</style>

      {/* Top Nav Bar */}
      <header style={{
        position: "sticky", top: 0, zIndex: 100,
        background: t.sidebar, borderBottom: `1px solid ${t.cardBorder}`,
        padding: "0 20px", height: 60,
        display: "flex", alignItems: "center", gap: 16,
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 140 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: t.primary, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
          <span style={{ fontWeight: 900, fontSize: 18, color: t.primary }}>StudyHub</span>
        </div>

        {/* Search */}
        <div style={{ flex: 1, maxWidth: 360, position: "relative" }}>
          <div style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: t.textMuted }}>
            {IC.explore}
          </div>
          <input placeholder="ابحث في المنشورات، الغرف، الأشخاص..." style={{
            width: "100%", height: 38, borderRadius: 20,
            border: `1px solid ${t.inputBorder}`, background: t.inputBg,
            paddingRight: 40, paddingLeft: 16, fontSize: 13,
            fontFamily: "'Cairo', sans-serif", color: t.text, outline: "none",
          }} />
        </div>

        <div style={{ flex: 1 }} />

        {/* Dark mode + avatar */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={() => setDark(!dark)} style={{
            width: 36, height: 36, borderRadius: "50%",
            background: t.inputBg, border: `1px solid ${t.inputBorder}`,
            cursor: "pointer", display: "flex", alignItems: "center",
            justifyContent: "center", color: t.text, transition: "all 0.2s",
          }}>{dark ? IC.sun : IC.moon}</button>
          <button onClick={() => setCompose(true)} style={{
            display: "flex", alignItems: "center", gap: 6, padding: "7px 16px",
            borderRadius: 20, border: "none", background: t.primary,
            color: "#fff", fontFamily: "'Cairo', sans-serif",
            fontWeight: 700, fontSize: 13, cursor: "pointer",
          }}>{IC.plus} منشور جديد</button>
          <Avatar initials="أن" color="#5b5ef7" size={36} border={t.bg} />
        </div>
      </header>

      {/* Layout */}
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "20px 16px", display: "flex", gap: 20, alignItems: "flex-start" }}>

        {/* Left Sidebar — Nav + My Rooms */}
        <aside className="left-sidebar" style={{
          width: 220, flexShrink: 0, position: "sticky", top: 80,
          display: "flex", flexDirection: "column", gap: 8,
        }}>
          {/* Nav */}
          <div style={{ background: t.card, border: `1px solid ${t.cardBorder}`, borderRadius: 20, padding: "8px 8px", boxShadow: t.shadow }}>
            {navItems.map(item => (
              <button key={item.id} onClick={() => setActiveNav(item.id)} style={{
                width: "100%", display: "flex", alignItems: "center", gap: 10,
                padding: "10px 12px", borderRadius: 14, border: "none", cursor: "pointer",
                background: activeNav === item.id ? t.navActive : "transparent",
                color: activeNav === item.id ? t.primary : t.textSec,
                fontFamily: "'Cairo', sans-serif", fontSize: 14, fontWeight: activeNav === item.id ? 700 : 500,
                transition: "all 0.15s", textAlign: "right",
              }}>
                <span style={{ color: activeNav === item.id ? t.primary : t.textSec }}>{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>

          {/* My Rooms Quick Links */}
          <div style={{ background: t.card, border: `1px solid ${t.cardBorder}`, borderRadius: 20, padding: "14px 14px", boxShadow: t.shadow }}>
            <p style={{ fontSize: 13, fontWeight: 800, color: t.text, marginBottom: 10 }}>غرفي</p>
            {myRooms.map(room => (
              <div key={room.id} style={{
                display: "flex", alignItems: "center", gap: 8, padding: "7px 4px",
                borderRadius: 10, cursor: "pointer", transition: "background 0.15s",
              }}
                onMouseEnter={e => e.currentTarget.style.background = t.navActive}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <div style={{ width: 10, height: 10, borderRadius: 3, background: room.color, flexShrink: 0 }}></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: t.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{room.name}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: t.roomOnline }}></div>
                  <span style={{ fontSize: 11, color: t.roomOnline, fontWeight: 700 }}>{room.online}</span>
                </div>
              </div>
            ))}
            <button onClick={() => setActiveNav("rooms")} style={{
              width: "100%", marginTop: 8, padding: "7px", borderRadius: 12,
              border: `1px dashed ${t.cardBorder}`, background: "none",
              color: t.primary, fontFamily: "'Cairo', sans-serif",
              fontSize: 12, fontWeight: 700, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
            }}>{IC.plus} استكشف غرفاً جديدة</button>
          </div>
        </aside>

        {/* Feed */}
        <main style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Rooms tab strip */}
          <div style={{
            background: t.card, border: `1px solid ${t.cardBorder}`,
            borderRadius: 20, padding: "10px 14px",
            display: "flex", gap: 8, overflowX: "auto",
            boxShadow: t.shadow,
          }}>
            <button style={{
              padding: "6px 16px", borderRadius: 20, border: "none",
              background: t.primary, color: "#fff",
              fontFamily: "'Cairo', sans-serif", fontSize: 13, fontWeight: 700, cursor: "pointer", flexShrink: 0,
            }}>الكل</button>
            {myRooms.map(room => (
              <button key={room.id} style={{
                padding: "6px 16px", borderRadius: 20,
                border: `1px solid ${t.cardBorder}`, background: t.inputBg,
                color: t.textSec, fontFamily: "'Cairo', sans-serif",
                fontSize: 13, fontWeight: 500, cursor: "pointer", flexShrink: 0, transition: "all 0.15s",
              }}
                onMouseEnter={e => { e.currentTarget.style.background = t.tagBg; e.currentTarget.style.color = t.tagText; }}
                onMouseLeave={e => { e.currentTarget.style.background = t.inputBg; e.currentTarget.style.color = t.textSec; }}
              >{room.name}</button>
            ))}
          </div>

          {/* Posts */}
          {POSTS.map((post, i) => (
            <div key={post.id} className="post-card">
              <PostCard post={post} t={t} onOpen={setActivePost} />
            </div>
          ))}
        </main>

        {/* Right Sidebar */}
        <aside className="right-sidebar" style={{
          width: 280, flexShrink: 0, position: "sticky", top: 80,
          display: "flex", flexDirection: "column", gap: 16,
        }}>
          {/* Trending Topics */}
          <div style={{ background: t.card, border: `1px solid ${t.cardBorder}`, borderRadius: 20, padding: "16px 16px", boxShadow: t.shadow }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
              <span style={{ color: t.primary }}>{IC.trending}</span>
              <span style={{ fontWeight: 800, fontSize: 14, color: t.text }}>التوبيك الرائجة</span>
            </div>
            {TRENDING.map((item, i) => (
              <div key={item.id} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "8px 4px", borderRadius: 10, cursor: "pointer", transition: "background 0.15s",
              }}
                onMouseEnter={e => e.currentTarget.style.background = t.navActive}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 12, color: t.textMuted, width: 20, textAlign: "center", fontWeight: 700 }}>{i + 1}</span>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: t.primary }}>{item.tag}</span>
                      {item.hot && <span style={{ color: "#e84040" }}>{IC.fire}</span>}
                    </div>
                    <span style={{ fontSize: 11, color: t.textMuted }}>{item.posts}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Study Rooms Discovery */}
          <div style={{ background: t.card, border: `1px solid ${t.cardBorder}`, borderRadius: 20, padding: "16px 16px", boxShadow: t.shadow }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ color: t.primary }}>{IC.rooms}</span>
                <span style={{ fontWeight: 800, fontSize: 14, color: t.text }}>غرف الدراسة</span>
              </div>
              <button style={{ fontSize: 12, color: t.primary, background: "none", border: "none", cursor: "pointer", fontFamily: "'Cairo', sans-serif", fontWeight: 700 }}>الكل</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {STUDY_ROOMS.slice(0, 3).map(room => (
                <StudyRoomCard key={room.id} room={room} t={t} />
              ))}
            </div>
          </div>

          {/* Suggested Users */}
          <div style={{ background: t.card, border: `1px solid ${t.cardBorder}`, borderRadius: 20, padding: "16px 16px", boxShadow: t.shadow }}>
            <p style={{ fontSize: 14, fontWeight: 800, color: t.text, marginBottom: 12 }}>أشخاص قد تعرفهم</p>
            {SUGGESTED.map(u => (
              <div key={u.handle} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: `1px solid ${t.divider}` }}>
                <Avatar initials={u.avatar} color={u.color} size={38} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: t.text }}>{u.name}</div>
                  <div style={{ fontSize: 11, color: t.textMuted }}>{u.mutual} معارف مشتركة</div>
                </div>
                <button style={{
                  padding: "4px 12px", borderRadius: 20,
                  border: `1.5px solid ${t.primary}`,
                  background: "none", color: t.primary,
                  fontFamily: "'Cairo', sans-serif", fontSize: 12, fontWeight: 700, cursor: "pointer",
                }}>تابع</button>
              </div>
            ))}
          </div>
        </aside>
      </div>

      {/* Compose Modal */}
      {compose && <ComposeModal t={t} onClose={() => setCompose(false)} />}

      {/* Post Detail Hint */}
      {activePost && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 1000, padding: 20,
        }} onClick={() => setActivePost(null)}>
          <div style={{
            background: t.card, borderRadius: 24, maxWidth: 480, width: "100%",
            padding: 24, boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
            animation: "fadeUp 0.2s ease",
          }} onClick={e => e.stopPropagation()}>
            <p style={{ color: t.textSec, fontSize: 14, textAlign: "center", lineHeight: 1.8 }}>
              لفتح المنشور الكامل مع التعليقات والتفاعلات،<br />
              <span style={{ fontWeight: 700, color: t.primary }}>استورد مكوّن SocialModal</span> وأمرّر له بيانات المنشور 🚀
            </p>
            <button onClick={() => setActivePost(null)} style={{
              display: "block", margin: "16px auto 0",
              padding: "8px 24px", borderRadius: 20, border: "none",
              background: t.primary, color: "#fff",
              fontFamily: "'Cairo', sans-serif", fontWeight: 700, cursor: "pointer",
            }}>حسناً</button>
          </div>
        </div>
      )}
    </div>
  );
}
