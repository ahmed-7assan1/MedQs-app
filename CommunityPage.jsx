import { useState, useRef, useEffect } from "react";

// ─── ICONS ───────────────────────────────────────────────────────────────────
const IC = {
  heart: (f) => f
    ? <svg width="15" height="15" viewBox="0 0 24 24" fill="#e84040" stroke="#e84040" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
    : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  comment: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  share: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>,
  bookmark: (s) => s
    ? <svg width="15" height="15" viewBox="0 0 24 24" fill="#5b5ef7" stroke="#5b5ef7" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
    : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>,
  trash: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>,
  close: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  send: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
  more: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="5" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="12" cy="19" r="1" fill="currentColor"/></svg>,
  search: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  plus: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  arrow: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="4" y1="12" x2="20" y2="12"/><polyline points="14 6 20 12 14 18"/></svg>,
  link: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
  twitter: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>,
  whatsapp: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>,
  facebook: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>,
  photo: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
  video: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>,
  poll: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  mic: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/></svg>,
  emoji: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>,
  ai: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
};

// ─── DESIGN TOKENS ───────────────────────────────────────────────────────────
const T = {
  bg:      "#0d0e17",
  surface: "#12131f",
  hover:   "#1a1b2e",
  border:  "#1e2038",
  border2: "#2a2d4a",
  accent:  "#5b5ef7",
  accentL: "#a5a8ff",
  text1:   "#c9cce0",
  text2:   "#8b8fac",
  text3:   "#4b4f72",
  text4:   "#3a3d5c",
  red:     "#e84040",
  green:   "#10a37f",
};

const css = (obj) => Object.entries(obj).reduce((a,[k,v])=>a+k.replace(/([A-Z])/g,'-$1').toLowerCase()+':'+v+';','');

// ─── SHARED COMPONENTS ───────────────────────────────────────────────────────
function Avatar({ initials, color = T.accent, size = 40, style = {} }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: color, display: "flex", alignItems: "center",
      justifyContent: "center", color: "#fff",
      fontSize: size * 0.3, fontWeight: 700, flexShrink: 0, ...style,
    }}>{initials}</div>
  );
}

function ActionBtn({ icon, label, active, activeColor = T.accentL, activeBg, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
        gap: 6, padding: "9px 6px", border: "none", borderRadius: 12,
        background: active ? (activeBg || "rgba(91,94,247,.1)") : hov ? T.hover : "none",
        color: active ? activeColor : hov ? T.accentL : T.text3,
        fontSize: 12, fontWeight: 600, cursor: "pointer",
        fontFamily: "'Inter', sans-serif", transition: "all .15s",
      }}>{icon}{label}</button>
  );
}

// ─── DEMO DATA ────────────────────────────────────────────────────────────────
const POSTS = [
  {
    id: 1, initials: "AH", color: "#5b5ef7", name: "Ahmed Hassan",
    badge: "CONTRIBUTOR", badgeColor: "rgba(91,94,247,.15)", badgeText: T.accentL,
    time: "20h ago", isOwner: true,
    text: "Check out this incredible anatomy resource — everything you need for the practical session is in here. Highly recommended before your next exam! 🫁",
    link: "https://t.me/MedOnexstorage/1/2103",
    image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&q=80",
    hashtags: ["#anatomy", "#medonex", "#resources"],
    reactions: { "❤️": 820, "😂": 120, "😮": 300, "🔥": 242 },
    likes: 1482, comments: 97, shares: 243,
  },
  {
    id: 2, initials: "SK", color: "#10a37f", name: "Sara Khalil",
    badge: "TOP", badgeColor: "rgba(245,200,50,.12)", badgeText: "#f5c842",
    time: "5h ago", isOwner: false,
    text: "Just finished the cardiovascular module — the 3D atlas linked below is genuinely incredible for understanding heart chambers. Highly recommend before your next practical session 🫀",
    image: null,
    hashtags: ["#cardiology", "#studytips"],
    reactions: { "❤️": 341, "🔥": 198 },
    likes: 539, comments: 42, shares: 88,
  },
];

const DEMO_COMMENTS = [
  { id: 1, initials: "SA", color: T.red,   name: "Sara Ali",       handle: "@sara_ali", text: "Amazing resource! Exactly what I needed before the practical session 😍", time: "2h ago",  likes: 24, liked: false },
  { id: 2, initials: "MK", color: T.green, name: "Mohammed Karim", handle: "@m_karim",  text: "MashaAllah! The 3D anatomy atlas is absolutely stunning 🌅",             time: "90m ago", likes: 18, liked: false },
  { id: 3, initials: "LH", color: "#f5a623", name: "Lina Hassan",  handle: "@lina_h",   text: "One of the best resources shared on this platform. Share more! 📸",        time: "1h ago",  likes: 31, liked: true },
  { id: 4, initials: "KY", color: "#7c3aed", name: "Khaled Youssef", handle: "@khalid_y", text: "Better than anything I've found so far. Is there more content coming? 🤩", time: "45m ago", likes: 9, liked: false },
];

// ─── POST CARD ────────────────────────────────────────────────────────────────
function PostCard({ post, onOpen }) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [hov, setHov] = useState(false);

  return (
    <div onClick={() => onOpen(post)}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        background: T.surface, border: `1px solid ${hov ? T.border2 : T.border}`,
        borderRadius: 20, overflow: "hidden", cursor: "pointer", transition: "border-color .2s",
      }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 18px 12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Avatar initials={post.initials} color={post.color} size={42} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.text1, lineHeight: 1.2 }}>
              {post.name}
              <span style={{ display: "inline-flex", padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 700, letterSpacing: ".05em", marginLeft: 7, background: post.badgeColor, color: post.badgeText }}>{post.badge}</span>
            </div>
            <div style={{ fontSize: 11, color: T.text3 }}>{post.time}</div>
          </div>
        </div>
        <button onClick={e => e.stopPropagation()} style={{ background: "none", border: "none", cursor: "pointer", color: T.text4, padding: 6, borderRadius: 8, display: "flex" }}>{IC.more}</button>
      </div>

      {/* Body */}
      <div style={{ padding: "0 18px 14px", display: "flex", flexDirection: "column", gap: 12 }}>
        <p style={{ margin: 0, fontSize: 14, color: T.text2, lineHeight: 1.75 }}>{post.text}</p>
        {post.link && <p style={{ margin: 0, fontSize: 13, color: T.accentL }}>{post.link}</p>}
        {post.image && (
          <div style={{ borderRadius: 14, overflow: "hidden", background: T.bg, maxHeight: 300 }}>
            <img src={post.image} alt="post" style={{ width: "100%", maxHeight: 300, objectFit: "cover", display: "block" }} />
          </div>
        )}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {post.hashtags.map(h => (
            <span key={h} style={{ fontSize: 11, color: "#7c7fff", background: "rgba(91,94,247,.1)", padding: "3px 10px", borderRadius: 20, fontWeight: 600 }}>{h}</span>
          ))}
        </div>
        {/* Reactions */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", paddingTop: 8, borderTop: `1px solid ${T.border}` }}>
          {Object.entries(post.reactions).map(([emoji, count]) => (
            <button key={emoji} onClick={e => e.stopPropagation()}
              style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 20, border: `1px solid ${T.border}`, background: "none", fontSize: 12, cursor: "pointer", color: T.text2 }}>
              {emoji} <span style={{ fontWeight: 600, fontSize: 11 }}>{count}</span>
            </button>
          ))}
          <span style={{ marginLeft: "auto", fontSize: 12, color: T.text3 }}>{post.likes.toLocaleString()} likes · {post.comments} comments</span>
        </div>
      </div>

      {/* Footer actions */}
      <div style={{ display: "flex", padding: "10px 18px 14px", borderTop: `1px solid ${T.border}`, gap: 4 }}>
        <ActionBtn icon={IC.heart(liked)} label={liked ? "Liked" : "Like"} active={liked} activeColor={T.red} activeBg="rgba(232,64,64,.08)"
          onClick={e => { e.stopPropagation(); setLiked(l => !l); }} />
        <ActionBtn icon={IC.comment} label="Comment" onClick={e => { e.stopPropagation(); onOpen(post); }} />
        <ActionBtn icon={IC.share} label="Share" onClick={e => e.stopPropagation()} />
        <ActionBtn icon={IC.bookmark(saved)} label={saved ? "Saved" : "Save"} active={saved}
          onClick={e => { e.stopPropagation(); setSaved(s => !s); }} />
      </div>
    </div>
  );
}

// ─── MODAL ────────────────────────────────────────────────────────────────────
function Modal({ post, onClose }) {
  const [tab, setTab] = useState("post");
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [sheet, setSheet] = useState(null); // null | 'share' | 'delete'
  const [copied, setCopied] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [comments, setComments] = useState(DEMO_COMMENTS);
  const [commentLikes, setCommentLikes] = useState({});
  const [newComment, setNewComment] = useState("");
  const commentBodyRef = useRef(null);

  const handleReact = (emoji) => { /* local count bump handled inside */ };

  const submitComment = () => {
    if (!newComment.trim()) return;
    setComments(cs => [...cs, {
      id: Date.now(), initials: "ME", color: T.accent,
      name: "You", handle: "@me", text: newComment.trim(), time: "Just now", likes: 0, liked: false,
    }]);
    setNewComment("");
    setTab("comments");
    setTimeout(() => commentBodyRef.current?.scrollTo({ top: 9999, behavior: "smooth" }), 80);
  };

  const toggleCommentLike = (id) => {
    setCommentLikes(cl => ({ ...cl, [id]: !cl[id] }));
    setComments(cs => cs.map(c => c.id === id ? { ...c, likes: c.likes + (commentLikes[id] ? -1 : 1) } : c));
  };

  if (deleted) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 320, gap: 14 }}>
      <div style={{ fontSize: 48 }}>🗑️</div>
      <p style={{ fontSize: 16, fontWeight: 700, color: T.text1 }}>Post Deleted</p>
      <p style={{ fontSize: 13, color: T.text3 }}>This post has been successfully removed.</p>
      <button onClick={onClose} style={{ padding: "10px 24px", background: T.accent, color: "#fff", border: "none", borderRadius: 12, cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: "'Inter',sans-serif" }}>Close</button>
    </div>
  );

  const ReactionBubble = ({ emoji, base }) => {
    const [count, setCount] = useState(base);
    const [reacted, setReacted] = useState(false);
    return (
      <button onClick={() => { setCount(c => reacted ? c - 1 : c + 1); setReacted(r => !r); }}
        style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 20, border: `1px solid ${reacted ? T.accent : T.border}`, background: reacted ? "rgba(91,94,247,.1)" : "none", fontSize: 12, cursor: "pointer", color: T.text2, transition: "all .15s" }}>
        {emoji} <span style={{ fontWeight: 600, fontSize: 11 }}>{count}</span>
      </button>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 18px 14px", borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Avatar initials={post.initials} color={post.color} size={44} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.text1 }}>{post.name}</div>
            <div style={{ fontSize: 11, color: T.text3 }}>@{post.name.toLowerCase().replace(" ", "_")} · {post.time}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {post.isOwner && (
            <button onClick={() => setSheet(s => s === "delete" ? null : "delete")}
              style={{ background: sheet === "delete" ? "rgba(232,64,64,.1)" : "none", border: "none", borderRadius: 10, padding: 7, cursor: "pointer", color: T.red, display: "flex", transition: "background .15s" }}>
              {IC.trash}
            </button>
          )}
          <button onClick={onClose}
            style={{ background: "none", border: "none", borderRadius: 10, padding: 7, cursor: "pointer", color: T.text3, display: "flex", transition: "color .15s" }}>
            {IC.close}
          </button>
        </div>
      </div>

      {/* Delete panel */}
      {sheet === "delete" && (
        <div style={{ margin: "0 18px", marginTop: 12, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 14, padding: 16, animation: "fadeSlide .2s ease", flexShrink: 0 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(232,64,64,.12)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", color: T.red }}>{IC.trash}</div>
            <p style={{ fontWeight: 700, fontSize: 15, color: T.text1, margin: "0 0 6px" }}>Delete Post?</p>
            <p style={{ fontSize: 12, color: T.text3, margin: "0 0 18px" }}>This action cannot be undone.</p>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setSheet(null)} style={{ flex: 1, padding: "9px", border: `1px solid ${T.border}`, borderRadius: 10, background: "none", color: T.text2, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Inter',sans-serif" }}>Cancel</button>
              <button onClick={() => setDeleted(true)} style={{ flex: 1, padding: "9px", border: "none", borderRadius: 10, background: T.red, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Inter',sans-serif" }}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Share panel */}
      {sheet === "share" && (
        <div style={{ margin: "0 18px", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 14, padding: 16, animation: "fadeSlide .2s ease", flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: T.text2 }}>Share Post</span>
            <button onClick={() => setSheet(null)} style={{ background: "none", border: "none", cursor: "pointer", color: T.text3, display: "flex" }}>{IC.close}</button>
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            {[
              { label: "X / TWITTER", icon: IC.twitter, color: T.text1 },
              { label: "WHATSAPP",    icon: IC.whatsapp, color: "#25D366" },
              { label: "FACEBOOK",   icon: IC.facebook, color: "#1877F2" },
            ].map(p => (
              <button key={p.label} style={{ flex: 1, padding: "10px 8px", border: `1px solid ${T.border}`, borderRadius: 12, background: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, transition: "all .15s", color: p.color }}
                onMouseEnter={e => e.currentTarget.style.borderColor = p.color}
                onMouseLeave={e => e.currentTarget.style.borderColor = T.border}>
                {p.icon}
                <span style={{ fontSize: 10, fontWeight: 700, color: T.text2, letterSpacing: ".04em" }}>{p.label}</span>
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ flex: 1, background: T.hover, borderRadius: 8, padding: "8px 12px", fontSize: 11, color: T.text3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", direction: "ltr" }}>
              https://medonex.app/post/{post.id}
            </div>
            <button onClick={() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }}
              style={{ padding: "8px 14px", background: copied ? T.green : T.accent, color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 11, fontWeight: 700, fontFamily: "'Inter',sans-serif", letterSpacing: ".04em", transition: "background .2s" }}>
              {copied ? "✓ COPIED" : "COPY"}
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: `1px solid ${T.border}`, padding: "0 18px", flexShrink: 0 }}>
        {[["post", "Post"], ["comments", `Comments (${comments.length})`]].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            style={{ padding: "12px 18px", border: "none", background: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, color: tab === key ? T.accentL : T.text3, borderBottom: `2px solid ${tab === key ? T.accent : "transparent"}`, fontFamily: "'Inter',sans-serif", transition: "all .2s" }}>
            {label}
          </button>
        ))}
      </div>

      {/* Body */}
      <div ref={tab === "comments" ? commentBodyRef : null} style={{ flex: 1, overflowY: "auto", padding: "16px 18px", display: "flex", flexDirection: "column", gap: 14 }}>
        {tab === "post" && (
          <>
            <p style={{ margin: 0, fontSize: 14, color: T.text2, lineHeight: 1.8 }}>{post.text}</p>
            {post.link && <p style={{ margin: 0, fontSize: 13, color: T.accentL }}>{post.link}</p>}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {post.hashtags.map(h => <span key={h} style={{ fontSize: 11, color: "#7c7fff", background: "rgba(91,94,247,.1)", padding: "3px 10px", borderRadius: 20, fontWeight: 600 }}>{h}</span>)}
            </div>
            {post.image && (
              <div style={{ borderRadius: 14, overflow: "hidden", background: T.bg }}>
                <img src={post.image} alt="media" style={{ width: "100%", display: "block", maxHeight: 380, objectFit: "cover" }} />
              </div>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              {Object.entries(post.reactions).map(([emoji, count]) => (
                <ReactionBubble key={emoji} emoji={emoji} base={count} />
              ))}
            </div>
            <div style={{ display: "flex", gap: 16, paddingTop: 4, borderTop: `1px solid ${T.border}`, fontSize: 12, color: T.text3 }}>
              <span>{post.likes.toLocaleString()} likes</span>
              <span>{post.comments} comments</span>
              <span>{post.shares} shares</span>
            </div>
          </>
        )}

        {tab === "comments" && comments.map(c => (
          <div key={c.id} style={{ display: "flex", gap: 10 }}>
            <Avatar initials={c.initials} color={c.color} size={34} />
            <div style={{ flex: 1, background: T.hover, borderRadius: "0 14px 14px 14px", padding: "10px 14px" }}>
              <div style={{ display: "flex", alignItems: "center" }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: T.text1 }}>{c.name}</span>
                <span style={{ fontSize: 10, color: T.text4, marginLeft: 5 }}>{c.handle}</span>
                <span style={{ fontSize: 10, color: T.text4, marginLeft: "auto" }}>{c.time}</span>
              </div>
              <p style={{ margin: "4px 0 0", fontSize: 13, color: T.text2, lineHeight: 1.65 }}>{c.text}</p>
              <button onClick={() => toggleCommentLike(c.id)}
                style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: commentLikes[c.id] ? T.red : T.text3, background: "none", border: "none", cursor: "pointer", fontFamily: "'Inter',sans-serif", marginTop: 6, transition: "color .15s" }}>
                {IC.heart(!!commentLikes[c.id])} {c.likes}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Footer actions */}
      <div style={{ display: "flex", padding: "10px 18px", borderTop: `1px solid ${T.border}`, gap: 4, flexShrink: 0 }}>
        <ActionBtn icon={IC.heart(liked)} label={liked ? "Liked" : "Like"} active={liked} activeColor={T.red} activeBg="rgba(232,64,64,.1)"
          onClick={() => setLiked(l => !l)} />
        <ActionBtn icon={IC.comment} label="Comment" onClick={() => setTab("comments")} />
        <ActionBtn icon={IC.share} label="Share" active={sheet === "share"} onClick={() => setSheet(s => s === "share" ? null : "share")} />
        <ActionBtn icon={IC.bookmark(saved)} label={saved ? "Saved" : "Save"} active={saved}
          onClick={() => setSaved(s => !s)} />
      </div>

      {/* Comment input */}
      <div style={{ display: "flex", gap: 10, alignItems: "flex-end", padding: "10px 18px 16px", borderTop: `1px solid ${T.border}`, flexShrink: 0 }}>
        <Avatar initials="ME" color={T.accent} size={34} />
        <div style={{ flex: 1, background: T.hover, borderRadius: 14, border: `1px solid ${T.border2}`, padding: "10px 14px" }}>
          <textarea value={newComment} onChange={e => setNewComment(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitComment(); } }}
            placeholder="Add a comment..."
            rows={1}
            style={{ width: "100%", background: "none", border: "none", outline: "none", fontSize: 13, color: T.text1, fontFamily: "'Inter',sans-serif", resize: "none", lineHeight: 1.5 }} />
        </div>
        <button onClick={submitComment}
          style={{ width: 36, height: 36, borderRadius: "50%", border: "none", background: newComment.trim() ? T.accent : T.border, display: "flex", alignItems: "center", justifyContent: "center", cursor: newComment.trim() ? "pointer" : "default", flexShrink: 0, transition: "background .2s" }}>
          {IC.send}
        </button>
      </div>
    </div>
  );
}

// ─── COMMUNITY PAGE ───────────────────────────────────────────────────────────
export default function CommunityPage() {
  const [activeCircle, setActiveCircle] = useState("general");
  const [modalPost, setModalPost] = useState(null);
  const [feedTab, setFeedTab] = useState("recent");
  const [activeTag, setActiveTag] = useState("general");

  const circles = [
    { id: "general", emoji: "🌐", name: "General Discussion", meta: "36 POSTS · GLOBAL", color: "rgba(91,94,247,.2)" },
  ];
  const discover = [
    { id: "kela", emoji: "🟢", name: "كله على الله", meta: "1 STUDENT", color: "rgba(16,163,127,.2)" },
    { id: "s00",  emoji: "🟡", name: "Study Group 00",  meta: "1 STUDENT", color: "rgba(245,166,35,.2)" },
  ];

  return (
    <div style={{ background: T.bg, minHeight: "100vh", fontFamily: "'Inter', sans-serif", color: T.text1 }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />

      <div style={{ display: "grid", gridTemplateColumns: "260px 1fr 280px", gap: 20, padding: "24px 28px", maxWidth: 1280, margin: "0 auto" }}>

        {/* ── LEFT SIDEBAR ── */}
        <aside>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 20, padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Search */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 12, padding: "9px 14px" }}>
              <span style={{ color: T.text3, display: "flex" }}>{IC.search}</span>
              <input placeholder="Search rooms..." style={{ background: "none", border: "none", outline: "none", fontSize: 13, color: T.text2, width: "100%", fontFamily: "'Inter',sans-serif" }} />
            </div>

            {/* Social Circles */}
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: ".12em", color: T.text3, textTransform: "uppercase", paddingBottom: 4 }}>Social Circles</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 2, marginTop: 8 }}>
                {circles.map(c => (
                  <div key={c.id} onClick={() => setActiveCircle(c.id)}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 12, cursor: "pointer", background: activeCircle === c.id ? "#1e2245" : "none", transition: "background .15s" }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: c.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>{c.emoji}</div>
                    <div>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: activeCircle === c.id ? T.accentL : T.text1, lineHeight: 1.2 }}>{c.name}</p>
                      <span style={{ fontSize: 11, color: T.text3 }}>{c.meta}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ height: 1, background: T.border }} />

            {/* Discover */}
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: ".12em", color: T.text3, textTransform: "uppercase", paddingBottom: 4 }}>Discover Circles</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 2, marginTop: 8 }}>
                {discover.map(c => (
                  <div key={c.id} onClick={() => setActiveCircle(c.id)}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 12, cursor: "pointer", background: activeCircle === c.id ? "#1e2245" : "none", transition: "background .15s" }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: c.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>{c.emoji}</div>
                    <div>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: T.text1, lineHeight: 1.2 }}>{c.name}</p>
                      <span style={{ fontSize: 11, color: T.text3 }}>{c.meta}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ height: 1, background: T.border }} />

            {/* Buttons */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { label: "# JOIN ROOM",  primary: false, icon: IC.arrow },
                { label: "+ CREATE ROOM", primary: true,  icon: IC.plus },
              ].map(b => (
                <button key={b.label} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "10px", borderRadius: 12, border: b.primary ? "none" : `1px solid ${T.border}`, background: b.primary ? T.accent : "none", color: b.primary ? "#fff" : T.text2, fontSize: 12, fontWeight: 600, cursor: "pointer", letterSpacing: ".04em", fontFamily: "'Inter',sans-serif", transition: "all .15s" }}>
                  {b.icon} {b.label}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* ── CENTER FEED ── */}
        <main style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Compose */}
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 20, padding: "18px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Avatar initials="AH" color={T.accent} size={38} />
              <input placeholder="What's on your mind, Ahmed?"
                style={{ flex: 1, background: "none", border: "none", borderBottom: `1.5px solid ${T.accent}`, outline: "none", fontSize: 14, color: T.text2, paddingBottom: 8, fontFamily: "'Inter',sans-serif" }} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              {[["general", "General Discussion"], ["study", "صندوق بت الطّاري"]].map(([key, label]) => (
                <button key={key} onClick={() => setActiveTag(key)}
                  style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 20, border: `1px solid ${activeTag === key ? T.accent : T.border}`, background: activeTag === key ? T.accent : "none", fontSize: 11, fontWeight: 600, color: activeTag === key ? "#fff" : T.text2, cursor: "pointer", fontFamily: "'Inter',sans-serif", transition: "all .15s" }}>
                  {label}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4, paddingTop: 4, borderTop: `1px solid ${T.border}` }}>
              {[
                [IC.photo, "PHOTO"], [IC.video, "VIDEO"], [IC.poll, "POLL"], [IC.mic, "AUDIO"], [IC.emoji, "MOOD"],
              ].map(([icon, label]) => (
                <button key={label} style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 10px", borderRadius: 8, border: "none", background: "none", color: T.text3, fontSize: 11, fontWeight: 500, cursor: "pointer", fontFamily: "'Inter',sans-serif", transition: "color .15s" }}
                  onMouseEnter={e => e.currentTarget.style.color = T.accentL}
                  onMouseLeave={e => e.currentTarget.style.color = T.text3}>
                  {icon} {label}
                </button>
              ))}
              <button style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 10px", borderRadius: 8, border: "none", background: "none", color: T.accentL, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'Inter',sans-serif" }}>
                {IC.ai} AI
              </button>
              <button style={{ marginLeft: "auto", width: 34, height: 34, borderRadius: "50%", border: "none", background: T.accent, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "background .15s" }}>
                {IC.send}
              </button>
            </div>
          </div>

          {/* Feed header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 10, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: T.accent }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.accent} strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              General Discussion Activity
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              {["RECENT", "TOP"].map(t => (
                <button key={t} onClick={() => setFeedTab(t.toLowerCase())}
                  style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: feedTab === t.toLowerCase() ? T.hover : "none", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Inter',sans-serif", color: feedTab === t.toLowerCase() ? T.text1 : T.text3, transition: "all .15s" }}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Posts */}
          {POSTS.map(p => <PostCard key={p.id} post={p} onOpen={setModalPost} />)}
        </main>

        {/* ── RIGHT SIDEBAR ── */}
        <aside style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Trending */}
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 20, padding: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <div style={{ width: 24, height: 24, borderRadius: 8, background: "rgba(232,64,64,.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>🔥</div>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".12em", color: T.text3, textTransform: "uppercase" }}>Trending Now</span>
            </div>
            {["#medonex", "#ahme_hassan", "#anatomy"].map((tag, i) => (
              <div key={tag} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", borderRadius: 12, cursor: "pointer", transition: "background .15s", border: "1px solid transparent" }}
                onMouseEnter={e => { e.currentTarget.style.background = T.hover; e.currentTarget.style.borderColor = T.border; }}
                onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.borderColor = "transparent"; }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.text1 }}>{tag}</div>
                  <div style={{ fontSize: 10, color: T.text3, textTransform: "uppercase", letterSpacing: ".06em" }}>{i + 1} DISCUSSION{i > 0 ? "S" : ""}</div>
                </div>
                <span style={{ color: T.text4, fontSize: 16 }}>›</span>
              </div>
            ))}
          </div>

          {/* Study Rooms */}
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 20, padding: 18 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 24, height: 24, borderRadius: 8, background: "rgba(91,94,247,.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>📚</div>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".12em", color: T.text3, textTransform: "uppercase" }}>My Study Rooms</span>
              </div>
              <button style={{ width: 26, height: 26, borderRadius: 8, background: T.hover, border: "none", color: T.accent, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 16 }}>+</button>
            </div>
            <div style={{ fontSize: 10, color: T.text4, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 8 }}>1 ACTIVE ROOM</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", background: T.bg, borderRadius: 12, cursor: "pointer", border: `1px solid ${T.border}`, transition: "border-color .15s" }}
              onMouseEnter={e => e.currentTarget.style.borderColor = T.border2}
              onMouseLeave={e => e.currentTarget.style.borderColor = T.border}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: T.text1 }}>👑 صندوق بت الطّاري</div>
                <div style={{ fontSize: 10, color: T.text3, textTransform: "uppercase", letterSpacing: ".06em" }}>›› 2 MEMBERS</div>
              </div>
              <div style={{ width: 26, height: 26, borderRadius: 8, background: T.hover, display: "flex", alignItems: "center", justifyContent: "center", color: T.accent, fontSize: 14 }}>›</div>
            </div>
          </div>
        </aside>
      </div>

      {/* ── MODAL OVERLAY ── */}
      {modalPost && (
        <div onClick={() => setModalPost(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(5,5,12,.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20, backdropFilter: "blur(6px)" }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: T.surface, border: `1px solid ${T.border2}`, borderRadius: 24, width: "100%", maxWidth: 520, maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 32px 80px rgba(0,0,0,.6)", animation: "modalIn .2s ease" }}>
            <Modal post={modalPost} onClose={() => setModalPost(null)} />
          </div>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        input::placeholder { color: #3a3d5c; }
        textarea::placeholder { color: #3a3d5c; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #2a2d45; border-radius: 4px; }
        @keyframes modalIn { from { opacity: 0; transform: scale(.96) translateY(8px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        @keyframes fadeSlide { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
