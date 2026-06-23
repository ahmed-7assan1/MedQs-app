"use client";

import { useEffect, useState, useCallback } from "react";
import { StoryPageShell } from "@/components/story/StoryPageShell";
import { SlideUpOverlay } from "@/components/story/SlideUpOverlay";
import { useCapsule } from "@/components/story/CapsuleWrapper";
import { HeartPulse, Loader2, Users } from "lucide-react";

interface TeamMember {
  id: string;
  userId: string;
  role: string;
  user: { id: string; name: string; image: string | null; email: string };
}

interface Team {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  faculty: { name: string } | null;
  _count: { followers: number; posts: number; lectures: number };
}

export default function TeamsPage() {
  const { setCapsuleOpen } = useCapsule();
  const [lightMode, setLightMode] = useState(false);
  const [lang, setLang] = useState<"ar" | "en">("ar");
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const isAr = lang === "ar";

  useEffect(() => {
    fetch("/api/v1/teams")
      .then((r) => r.json())
      .then((d) => {
        setTeams(Array.isArray(d) ? d : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const toggleLang = useCallback(() => setLang((l) => (l === "en" ? "ar" : "en")), []);

  const openTeam = async (team: Team) => {
    setSelectedTeam(team);
    setMembersLoading(true);
    try {
      const res = await fetch(`/api/v1/teams/${team.id}/members`);
      const d = await res.json();
      setMembers(Array.isArray(d) ? d : []);
    } catch {
      setMembers([]);
    }
    setMembersLoading(false);
  };

  return (
    <StoryPageShell
      pageTitle={{ ar: "الفرق الطبية", en: "Medical Teams" }}
      lightMode={lightMode}
      onToggleTheme={() => setLightMode((p) => !p)}
      lang={lang}
      onToggleLang={toggleLang}
      onCapsuleOpen={setCapsuleOpen}
      hideTopBar={!!selectedTeam}
    >
      <style>{`
        .teams-page { max-width: 640px; margin: 0 auto; padding: 0 1rem 2rem; }
        .teams-list { display: flex; flex-direction: column; gap: 8px; }
        .team-card {
          display: flex; align-items: center; gap: 12px;
          width: 100%; padding: 0.85rem 1rem;
          border-radius: 20px; border: 1px solid var(--c-border);
          background: var(--c-card-bg);
          cursor: pointer; text-align: right;
          backdrop-filter: blur(12px);
          transition: transform 0.25s, border-color 0.25s;
        }
        .team-card:hover { transform: translateX(-3px); border-color: rgba(0,212,255,0.2); }
        .team-card:active { transform: scale(0.98); }
        .team-avatar {
          width: 44px; height: 44px; border-radius: 14px;
          overflow: hidden; flex-shrink: 0;
          background: var(--c-card-bg);
          border: 1px solid var(--c-border);
        }
        .team-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .team-info { flex: 1; display: flex; flex-direction: column; gap: 3px; min-width: 0; }
        .team-name { font-size: 14px; font-weight: 700; color: var(--c-text); }
        .team-desc { font-size: 12px; color: var(--c-text-dim); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .team-faculty { font-size: 11px; font-weight: 600; color: #00D4FF; }
        .team-count {
          font-size: 12px; font-weight: 700; color: var(--c-text-dimmer);
          padding: 3px 10px; border-radius: 999px;
          background: var(--c-card-bg-soft);
          border: 1px solid var(--c-border);
        }

        /* overlay detail */
        .team-detail { padding-bottom: 1rem; }
        .team-detail-header { display: flex; flex-direction: column; align-items: center; text-align: center; margin-bottom: 1.25rem; }
        .team-detail-avatar {
          width: 80px; height: 80px; border-radius: 20px;
          overflow: hidden; margin-bottom: 0.75rem;
          border: 2px solid var(--c-border);
          background: var(--c-card-bg);
        }
        .team-detail-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .team-detail-name { font-size: 20px; font-weight: 900; color: var(--c-text); margin-bottom: 4px; }
        .team-detail-faculty { font-size: 13px; font-weight: 600; color: #00D4FF; margin-bottom: 0.75rem; }
        .team-detail-desc { font-size: 14px; line-height: 1.6; color: var(--c-text-dim); max-width: 360px; margin: 0 auto 0.75rem; }
        .team-detail-stats { display: flex; gap: 16px; font-size: 12px; font-weight: 600; color: var(--c-text-dimmer); }
        .team-members-section { border-top: 1px solid var(--c-border); padding-top: 1rem; }
        .team-members-title { font-size: 14px; font-weight: 700; color: var(--c-text); margin-bottom: 0.75rem; }
        .team-members { display: flex; flex-direction: column; gap: 8px; }
        .team-member {
          display: flex; align-items: center; gap: 10px;
          padding: 0.6rem 0.75rem; border-radius: 14px;
          background: var(--c-card-bg-soft);
          border: 1px solid var(--c-border);
        }
        .team-member-avatar {
          width: 36px; height: 36px; border-radius: 50%;
          overflow: hidden; flex-shrink: 0;
          background: var(--c-card-bg);
        }
        .team-member-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .team-member-info { flex: 1; display: flex; flex-direction: column; gap: 2px; min-width: 0; }
        .team-member-name { font-size: 13px; font-weight: 700; color: var(--c-text); }
        .team-member-email { font-size: 11px; color: var(--c-text-dimmer); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .team-member-role {
          font-size: 10px; font-weight: 700; padding: 3px 10px;
          border-radius: 999px; flex-shrink: 0;
        }
        .role-LEADER { background: rgba(0,212,255,0.15); color: #00D4FF; }
        .role-ADMIN { background: rgba(168,85,247,0.15); color: #a855f7; }
        .role-MEMBER { background: var(--c-card-bg); color: var(--c-text-dimmer); border: 1px solid var(--c-border); }
      `}</style>

      <div className="teams-page">
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}>
            <Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--c-text-dimmer)" }} />
          </div>
        ) : teams.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "var(--c-text-dimmer)" }}>
            <HeartPulse className="h-12 w-12 mx-auto mb-4" />
            <p>{isAr ? "لا توجد فرق طبية بعد" : "No medical teams yet"}</p>
          </div>
        ) : (
          <div className="teams-list">
            {teams.map((t) => (
              <button key={t.id} className="team-card" onClick={() => openTeam(t)}>
                <div className="team-avatar">
                  <img
                    src={t.imageUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${t.name}&backgroundColor=6c5ff0`}
                    alt={t.name}
                  />
                </div>
                <div className="team-info">
                  <span className="team-name">{t.name}</span>
                  {t.description && <span className="team-desc">{t.description}</span>}
                  {t.faculty && <span className="team-faculty">{t.faculty.name}</span>}
                </div>
                <span className="team-count">{t._count.followers}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <SlideUpOverlay
        isOpen={!!selectedTeam}
        onClose={() => setSelectedTeam(null)}
        title={isAr ? "الفرق الطبية" : "Medical Teams"}
        dir={isAr ? "rtl" : "ltr"}
      >
        {selectedTeam && (
          <div className="team-detail">
            <div className="team-detail-header">
              <div className="team-detail-avatar">
                <img
                  src={selectedTeam.imageUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${selectedTeam.name}&backgroundColor=6c5ff0`}
                  alt={selectedTeam.name}
                />
              </div>
              <h2 className="team-detail-name">{selectedTeam.name}</h2>
              {selectedTeam.faculty && (
                <span className="team-detail-faculty">{selectedTeam.faculty.name}</span>
              )}
              {selectedTeam.description && (
                <p className="team-detail-desc">{selectedTeam.description}</p>
              )}
              <div className="team-detail-stats">
                <span>{selectedTeam._count.followers} {isAr ? "متابع" : "followers"}</span>
                <span>{selectedTeam._count.posts} {isAr ? "منشور" : "posts"}</span>
                <span>{selectedTeam._count.lectures} {isAr ? "محاضرة" : "lectures"}</span>
              </div>
            </div>
            <div className="team-members-section">
              <h3 className="team-members-title">
                {isAr ? "الأعضاء" : "Members"} ({members.length})
              </h3>
              {membersLoading ? (
                <div style={{ display: "flex", justifyContent: "center", padding: "1rem" }}>
                  <Loader2 className="h-5 w-5 animate-spin" style={{ color: "var(--c-text-dimmer)" }} />
                </div>
              ) : members.length === 0 ? (
                <p style={{ textAlign: "center", color: "var(--c-text-dimmer)", fontSize: 13 }}>
                  {isAr ? "لا يوجد أعضاء" : "No members yet"}
                </p>
              ) : (
                <div className="team-members">
                  {members.map((m) => (
                    <div key={m.id} className="team-member">
                      <div className="team-member-avatar">
                        <img
                          src={m.user.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.user.name}&backgroundColor=6c5ff0`}
                          alt={m.user.name}
                        />
                      </div>
                      <div className="team-member-info">
                        <span className="team-member-name">{m.user.name}</span>
                        <span className="team-member-email">{m.user.email}</span>
                      </div>
                      <span className={`team-member-role role-${m.role}`}>
                        {m.role === "LEADER" ? (isAr ? "قائد" : "Leader") : m.role === "ADMIN" ? (isAr ? "مشرف" : "Admin") : isAr ? "عضو" : "Member"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </SlideUpOverlay>
    </StoryPageShell>
  );
}
