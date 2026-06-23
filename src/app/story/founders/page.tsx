"use client";

import { useEffect, useState, useCallback } from "react";
import { StoryPageShell } from "@/components/story/StoryPageShell";
import { SlideUpOverlay } from "@/components/story/SlideUpOverlay";
import { useCapsule } from "@/components/story/CapsuleWrapper";
import { Users, Star, ExternalLink, Loader2 } from "lucide-react";

interface Founder {
  id: string;
  name: string;
  role: string;
  description?: string;
  imageUrl?: string;
  socialUrl?: string;
}

export default function FoundersPage() {
  const { setCapsuleOpen } = useCapsule();
  const [lightMode, setLightMode] = useState(false);
  const [lang, setLang] = useState<"ar" | "en">("ar");
  const [founders, setFounders] = useState<Founder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Founder | null>(null);
  const isAr = lang === "ar";

  useEffect(() => {
    fetch("/api/v1/founders")
      .then((r) => r.json())
      .then((d) => {
        setFounders(Array.isArray(d) ? d : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const toggleLang = useCallback(() => setLang((l) => (l === "en" ? "ar" : "en")), []);

  return (
    <StoryPageShell
      pageTitle={{ ar: "المؤسسون", en: "Founders" }}
      lightMode={lightMode}
      onToggleTheme={() => setLightMode((p) => !p)}
      lang={lang}
      onToggleLang={toggleLang}
      onCapsuleOpen={setCapsuleOpen}
      hideTopBar={!!selected}
    >
      <style>{`
        .founders-page { max-width: 640px; margin: 0 auto; padding: 0 1rem 2rem; }
        .founders-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .founder-card {
          display: flex; flex-direction: column; align-items: center;
          gap: 10px; padding: 1.25rem 1rem; border-radius: 20px;
          border: 1px solid var(--c-border);
          background: var(--c-card-bg);
          cursor: pointer; text-align: center;
          transition: transform 0.25s, border-color 0.25s, background 0.25s;
          backdrop-filter: blur(12px);
        }
        .founder-card:hover { transform: translateY(-3px); border-color: rgba(0,212,255,0.2); background: var(--c-card-bg-soft); }
        .founder-card:active { transform: scale(0.97); }
        .founder-card-avatar {
          width: 72px; height: 72px; border-radius: 50%;
          overflow: hidden; border: 2px solid var(--c-border);
          background: var(--c-card-bg);
        }
        .founder-card-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .founder-card-name { font-size: 14px; font-weight: 700; color: var(--c-text); }
        .founder-card-role { font-size: 11px; font-weight: 600; color: var(--c-text-dim); }

        /* overlay detail */
        .founder-detail { display: flex; flex-direction: column; align-items: center; text-align: center; }
        .founder-detail-avatar {
          width: 120px; height: 120px; border-radius: 50%;
          overflow: hidden; margin-bottom: 1rem;
          border: 3px solid var(--c-border);
          background: var(--c-card-bg);
        }
        .founder-detail-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .founder-detail-name { font-size: 22px; font-weight: 900; color: var(--c-text); margin-bottom: 4px; }
        .founder-detail-role {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 13px; font-weight: 700; color: #00D4FF;
          padding: 6px 16px; border-radius: 999px;
          background: rgba(0,212,255,0.1);
          margin-bottom: 1rem;
        }
        .founder-detail-desc {
          font-size: 15px; line-height: 1.7;
          color: var(--c-text-dim); max-width: 360px;
          margin: 0 auto 1.25rem;
        }
        .founder-detail-social {
          display: inline-flex; align-items: center; gap: 8px;
          font-size: 14px; font-weight: 700;
          padding: 0.6rem 1.5rem; border-radius: 999px;
          border: 1px solid var(--c-border);
          color: var(--c-text); text-decoration: none;
          transition: background 0.2s, border-color 0.2s;
        }
        .founder-detail-social:hover { background: var(--c-card-bg-soft); border-color: var(--c-text-dim); }
      `}</style>

      <div className="founders-page">
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}>
            <Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--c-text-dimmer)" }} />
          </div>
        ) : founders.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "var(--c-text-dimmer)" }}>
            <Users className="h-12 w-12 mx-auto mb-4" />
            <p>{isAr ? "لا يوجد مؤسسون بعد" : "No founders yet"}</p>
          </div>
        ) : (
          <div className="founders-grid">
            {founders.map((f) => (
              <button key={f.id} className="founder-card" onClick={() => setSelected(f)}>
                <div className="founder-card-avatar">
                  <img
                    src={f.imageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${f.name}&backgroundColor=6c5ff0`}
                    alt={f.name}
                  />
                </div>
                <span className="founder-card-name">{f.name}</span>
                <span className="founder-card-role">{f.role}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <SlideUpOverlay
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={isAr ? "المؤسسون" : "Founders"}
        dir={isAr ? "rtl" : "ltr"}
      >
        {selected && (
          <div className="founder-detail">
            <div className="founder-detail-avatar">
              <img
                src={selected.imageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selected.name}&backgroundColor=6c5ff0`}
                alt={selected.name}
              />
            </div>
            <h2 className="founder-detail-name">{selected.name}</h2>
            <div className="founder-detail-role">
              <Star className="h-4 w-4" />
              {selected.role}
            </div>
            {selected.description && (
              <p className="founder-detail-desc">&ldquo;{selected.description}&rdquo;</p>
            )}
            {selected.socialUrl && (
              <a
                href={selected.socialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="founder-detail-social"
              >
                <ExternalLink className="h-4 w-4" />
                {isAr ? "حساب التواصل" : "Social Profile"}
              </a>
            )}
          </div>
        )}
      </SlideUpOverlay>
    </StoryPageShell>
  );
}
