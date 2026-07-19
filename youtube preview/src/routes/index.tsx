import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  Menu,
  Search,
  Mic,
  Bell,
  Plus,
  ThumbsUp,
  ThumbsDown,
  Share2,
  Sparkles,
  Download,
  MoreHorizontal,
  CheckCircle2,
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
});

type Rec = {
  title: string;
  channel: string;
  views: string;
  age: string;
  duration: string;
  thumb: string;
  badge?: string;
  verified?: boolean;
  live?: boolean;
};

const recs: Rec[] = [
  {
    title: "ليه بخاف أطلع لايف؟",
    channel: "دروس أونلاين",
    views: "57K views",
    age: "Streamed 2 months ago",
    duration: "1:59:09",
    thumb: "https://picsum.photos/seed/yt1/400/225",
    verified: true,
  },
  {
    title: "انا مش جعان بس ، انا جعان جدا || قصة مش مهم تسمعها",
    channel: "Yahya Azzam - يحيى عزام",
    views: "210K views",
    age: "6 days ago",
    duration: "1:15:25",
    thumb: "https://picsum.photos/seed/yt2/400/225",
    badge: "New",
  },
  {
    title: "أوقفوا ميسي والأرجنتين أرجوكم 🚫✋",
    channel: "Mohamad Adnan - محمد عدنان",
    views: "973K views",
    age: "10 hours ago",
    duration: "12:33",
    thumb: "https://picsum.photos/seed/yt3/400/225",
    verified: true,
    badge: "YouTube featured",
  },
  {
    title: "Nawah Pre-Accelerator Program First Showcase Day",
    channel: "Flat6Labs",
    views: "58 views",
    age: "3 days ago",
    duration: "1:10:02",
    thumb: "https://picsum.photos/seed/yt4/400/225",
    badge: "New",
  },
  {
    title: "سورة الكهف | تلاوة تحصنك من فتنة المسيح الدجال | قرآن يوم الجمعة",
    channel: "روائع تلاوات الشيخ محمد صديق المنشاوي",
    views: "266 watching",
    age: "",
    duration: "",
    thumb: "https://picsum.photos/seed/yt5/400/225",
    live: true,
  },
  {
    title: "How to build faster than everyone else",
    channel: "Devlog",
    views: "1.2M views",
    age: "1 month ago",
    duration: "18:42",
    thumb: "https://picsum.photos/seed/yt6/400/225",
  },
  {
    title: "The most beautiful office setup of 2026",
    channel: "Studio Ghost",
    views: "420K views",
    age: "2 weeks ago",
    duration: "9:11",
    thumb: "https://picsum.photos/seed/yt7/400/225",
    verified: true,
  },
];

const chips = [
  "All",
  "From دروس أونلاين",
  "Podcasts",
  "Courses",
  "Related",
  "For you",
  "Recently uploaded",
  "Watched",
];

function Index() {
  const imgRef = useRef<HTMLImageElement>(null);
  const [glow, setGlow] = useState<[string, string]>(["#3ea6ff", "#ff5ea8"]);
  const [ambient, setAmbient] = useState(true);
  const [videoId, setVideoId] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState("");

  const parseYouTubeId = (input: string): string | null => {
    const s = input.trim();
    if (!s) return null;
    // Bare 11-char ID
    if (/^[a-zA-Z0-9_-]{11}$/.test(s)) return s;
    try {
      const u = new URL(s.startsWith("http") ? s : `https://${s}`);
      const host = u.hostname.replace(/^www\./, "");
      if (host === "youtu.be") return u.pathname.slice(1, 12) || null;
      if (host.endsWith("youtube.com")) {
        const v = u.searchParams.get("v");
        if (v) return v;
        const m = u.pathname.match(/\/(embed|shorts|live)\/([a-zA-Z0-9_-]{11})/);
        if (m) return m[2];
      }
    } catch {
      /* not a URL */
    }
    return null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = parseYouTubeId(urlInput);
    if (id) setVideoId(id);
  };

  const thumbSrc = videoId
    ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
    : "https://picsum.photos/seed/watch-main/1600/900";

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;
    const extract = () => {
      try {
        const c = document.createElement("canvas");
        const w = (c.width = 32);
        const h = (c.height = 18);
        const ctx = c.getContext("2d", { willReadFrequently: true });
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, w, h);
        const data = ctx.getImageData(0, 0, w, h).data;
        // Sample top-left and bottom-right regions for two-tone glow
        const avg = (x0: number, y0: number, x1: number, y1: number) => {
          let r = 0, g = 0, b = 0, n = 0;
          for (let y = y0; y < y1; y++) {
            for (let x = x0; x < x1; x++) {
              const i = (y * w + x) * 4;
              const R = data[i], G = data[i + 1], B = data[i + 2];
              // skip near-black/near-white for more vibrant picks
              const max = Math.max(R, G, B), min = Math.min(R, G, B);
              if (max < 30 || max - min < 15) continue;
              r += R; g += G; b += B; n++;
            }
          }
          if (!n) return "#3ea6ff";
          return `rgb(${(r / n) | 0}, ${(g / n) | 0}, ${(b / n) | 0})`;
        };
        const left = avg(0, 0, w / 2, h);
        const right = avg(w / 2, 0, w, h);
        setGlow([left, right]);
      } catch {
        /* CORS or other — keep default */
      }
    };
    if (img.complete && img.naturalWidth) extract();
    else img.addEventListener("load", extract, { once: true });
    return () => img.removeEventListener("load", extract);
  }, [thumbSrc]);

  return (
    <div className="min-h-screen bg-yt-bg font-yt text-yt-text">
      {/* Header */}
      <header className="sticky top-0 z-40 flex h-14 items-center gap-4 bg-yt-bg px-4">
        <div className="flex items-center gap-4">
          <button className="rounded-full p-2 hover:bg-yt-surface" aria-label="Menu">
            <Menu className="h-5 w-5" />
          </button>
          <a href="/" className="flex items-center gap-1">
            <span className="grid h-6 w-9 place-items-center rounded-md bg-yt-red">
              <span className="ml-0.5 h-0 w-0 border-y-[6px] border-l-[9px] border-y-transparent border-l-white" />
            </span>
            <span className="text-lg font-semibold tracking-tight">YouTube</span>
            <span className="ml-0.5 text-[10px] text-yt-muted">NG</span>
          </a>
        </div>

        <div className="mx-auto flex max-w-2xl flex-1 items-center gap-2">
          <form
            onSubmit={handleSubmit}
            className="flex flex-1 items-center rounded-full border border-white/15 bg-black/30 focus-within:border-yt-blue"
          >
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Paste a YouTube link or video ID"
              className="w-full bg-transparent px-4 py-2 text-sm outline-none placeholder:text-yt-muted"
            />
            <button
              type="submit"
              className="flex h-full items-center gap-2 rounded-r-full border-l border-white/15 bg-white/5 px-5 py-2 hover:bg-white/10"
              aria-label="Load video"
            >
              <Search className="h-4 w-4" />
            </button>
          </form>
          <button className="rounded-full bg-yt-surface p-2 hover:bg-yt-surface-hover" aria-label="Voice search">
            <Mic className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 rounded-full bg-yt-surface px-3 py-1.5 text-sm hover:bg-yt-surface-hover">
            <Plus className="h-4 w-4" />
            <span>Create</span>
          </button>
          <button className="relative rounded-full p-2 hover:bg-yt-surface" aria-label="Notifications">
            <Bell className="h-5 w-5" />
            <span className="absolute right-0 top-0 grid h-4 min-w-4 place-items-center rounded-full bg-yt-red px-1 text-[10px] font-medium">
              9+
            </span>
          </button>
          <div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-pink-500 to-orange-500 text-xs font-semibold">
            X
          </div>
        </div>
      </header>

      {/* Main grid */}
      <div className="mx-auto grid max-w-[1800px] gap-6 px-6 pb-10 lg:grid-cols-[minmax(0,1fr)_402px]">
        {/* Left: video + info */}
        <div className="min-w-0">
          <div className="relative">
            {/* Ambient glow */}
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-8 -z-0 rounded-[32px] blur-3xl transition-all duration-1000"
              style={{
                opacity: ambient ? 0.75 : 0,
                background: `radial-gradient(60% 80% at 20% 30%, ${glow[0]} 0%, transparent 60%), radial-gradient(60% 80% at 80% 70%, ${glow[1]} 0%, transparent 60%)`,
              }}
            />
            <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black">
              {videoId ? (
                <iframe
                  key={videoId}
                  src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
                  title="YouTube video player"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="h-full w-full"
                />
              ) : (
                <img
                  src="https://picsum.photos/seed/watch-main/1600/900"
                  alt="Paste a YouTube link above to play a video"
                  className="h-full w-full object-cover"
                />
              )}
              {/* Hidden image for ambient color extraction (CORS-enabled) */}
              <img
                ref={imgRef}
                src={thumbSrc}
                alt=""
                crossOrigin="anonymous"
                referrerPolicy="no-referrer"
                className="hidden"
              />
              {/* Ambient toggle */}
              <button
                onClick={() => setAmbient((v) => !v)}
                className="absolute bottom-3 right-3 z-10 flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-xs backdrop-blur hover:bg-black/80"
                title="Toggle ambient glow"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Ambient {ambient ? "on" : "off"}
              </button>
            </div>
          </div>

          <h1 className="mt-3 text-xl font-semibold leading-snug">ماذا تعلمت في السجن</h1>
          <div className="mt-1 inline-flex items-center gap-1 text-xs text-yt-muted">
            <Sparkles className="h-3 w-3" />
            <span>Auto-dubbed</span>
          </div>

          {/* Channel + actions */}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-emerald-500 to-cyan-600 text-sm font-semibold">
                د
              </div>
              <div className="leading-tight">
                <div className="flex items-center gap-1 text-sm font-medium">
                  دروس أونلاين
                  <CheckCircle2 className="h-3.5 w-3.5 text-yt-muted" />
                </div>
                <div className="text-xs text-yt-muted">9.66M subscribers</div>
              </div>
              <button className="ml-2 rounded-full bg-yt-text px-4 py-2 text-sm font-medium text-yt-bg hover:bg-white/90">
                Join
              </button>
              <button className="flex items-center gap-2 rounded-full bg-yt-surface px-4 py-2 text-sm hover:bg-yt-surface-hover">
                <Bell className="h-4 w-4" />
                <span>Subscribed</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center rounded-full bg-yt-surface">
                <button className="flex items-center gap-2 rounded-l-full px-4 py-2 text-sm hover:bg-yt-surface-hover">
                  <ThumbsUp className="h-4 w-4" />
                  <span>172K</span>
                </button>
                <span className="h-6 w-px bg-white/15" />
                <button className="rounded-r-full px-3 py-2 hover:bg-yt-surface-hover" aria-label="Dislike">
                  <ThumbsDown className="h-4 w-4" />
                </button>
              </div>
              <button className="flex items-center gap-2 rounded-full bg-yt-surface px-4 py-2 text-sm hover:bg-yt-surface-hover">
                <Share2 className="h-4 w-4" />
                <span>Share</span>
              </button>
              <button className="flex items-center gap-2 rounded-full bg-yt-surface px-4 py-2 text-sm hover:bg-yt-surface-hover">
                <Sparkles className="h-4 w-4" />
                <span>Ask</span>
              </button>
              <button className="flex items-center gap-2 rounded-full bg-yt-surface px-4 py-2 text-sm hover:bg-yt-surface-hover">
                <Download className="h-4 w-4" />
                <span>Download</span>
              </button>
              <button className="rounded-full bg-yt-surface p-2 hover:bg-yt-surface-hover" aria-label="More">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Description */}
          <div className="mt-4 rounded-xl bg-yt-surface p-3 text-sm">
            <div className="flex items-center gap-2 text-xs text-yt-muted">
              <span className="font-medium text-yt-text">1.2M views</span>
              <span>2 weeks ago</span>
              <span>#lessons #life</span>
            </div>
            <p className="mt-2 line-clamp-2 leading-relaxed">
              A candid reflection on what solitude, structure, and time behind bars taught me about
              patience, purpose, and the people who matter. Turn on captions for auto-dubbed audio.
            </p>
            <button className="mt-2 text-xs font-medium">...more</button>
          </div>

          {/* Comments teaser */}
          <div className="mt-6">
            <div className="mb-4 flex items-center gap-6">
              <h2 className="text-lg font-semibold">4,281 Comments</h2>
              <button className="text-sm text-yt-muted">Sort by</button>
            </div>
            <div className="flex gap-3">
              <div className="h-9 w-9 shrink-0 rounded-full bg-gradient-to-br from-pink-500 to-orange-500" />
              <input
                className="w-full border-b border-white/15 bg-transparent pb-2 text-sm outline-none placeholder:text-yt-muted focus:border-white/60"
                placeholder="Add a comment..."
              />
            </div>
          </div>
        </div>

        {/* Right: recommendations */}
        <aside className="min-w-0">
          {/* Chips */}
          <div className="mb-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {chips.map((c, i) => (
              <button
                key={c}
                className={`shrink-0 rounded-lg px-3 py-1.5 text-sm ${
                  i === 0
                    ? "bg-yt-text text-yt-bg"
                    : "bg-yt-surface text-yt-text hover:bg-yt-surface-hover"
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          <ul className="flex flex-col gap-2">
            {recs.map((r) => (
              <li key={r.title} className="flex gap-2">
                <div className="relative aspect-video w-[168px] shrink-0 overflow-hidden rounded-lg bg-yt-surface">
                  <img src={r.thumb} alt="" className="h-full w-full object-cover" />
                  {r.duration && (
                    <span className="absolute bottom-1 right-1 rounded bg-black/85 px-1 py-0.5 text-[11px] font-medium">
                      {r.duration}
                    </span>
                  )}
                  {r.live && (
                    <span className="absolute bottom-1 right-1 flex items-center gap-1 rounded bg-yt-red px-1.5 py-0.5 text-[11px] font-semibold uppercase">
                      <span className="h-1.5 w-1.5 rounded-full bg-white" /> Live
                    </span>
                  )}
                </div>
                <div className="flex-1 pr-2">
                  <h3 className="line-clamp-2 text-sm font-medium leading-snug">{r.title}</h3>
                  <div className="mt-1 flex items-center gap-1 text-xs text-yt-muted">
                    <span className="truncate">{r.channel}</span>
                    {r.verified && <CheckCircle2 className="h-3 w-3 shrink-0" />}
                  </div>
                  <div className="text-xs text-yt-muted">
                    {r.views}
                    {r.age && <> • {r.age}</>}
                  </div>
                  {r.badge && (
                    <span className="mt-1 inline-block rounded bg-yt-surface px-1.5 py-0.5 text-[11px] text-yt-muted">
                      {r.badge}
                    </span>
                  )}
                </div>
                <button className="h-6 w-6 shrink-0 rounded-full text-yt-muted hover:bg-yt-surface" aria-label="More">
                  <MoreHorizontal className="mx-auto h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}
