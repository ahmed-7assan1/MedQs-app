"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Robot, Spinner, Star, X, ChatDots, Plus, Trash, Link as LinkIcon,
  UploadSimple, UserCircle, ArrowLeft, Clock, PencilSimple
} from "@phosphor-icons/react";
import toast from "react-hot-toast";

interface AgentItem { id: string; name: string; description: string | null; creatorId: string; avgRating: number; ratingCount: number; usageCount: number; createdAt: string; }
interface AgentDetail extends AgentItem { instructions: string; files: { name: string; type: string; data: string }[]; links: string[]; comments: { id: string; userId: string; text: string; createdAt: string }[]; }

interface CustomPageProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  onSelectAgent: (agent: any) => void;
}

export function CustomPage({ isOpen, onClose, isDark, onSelectAgent }: CustomPageProps) {
  const [tab, setTab] = useState<"explore" | "my-agents">("explore");
  const [userId, setUserId] = useState<string | null>(null);

  // Explore
  const [agents, setAgents] = useState<AgentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<AgentDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [commentText, setCommentText] = useState("");
  const [commenting, setCommenting] = useState(false);

  // My agents
  const [myAgents, setMyAgents] = useState<AgentItem[]>([]);
  const [myLoading, setMyLoading] = useState(false);

  // Create modal
  const [showCreate, setShowCreate] = useState(false);
  const [editAgent, setEditAgent] = useState<any>(null);
  const [cName, setCName] = useState("");
  const [cDesc, setCDesc] = useState("");
  const [cInstructions, setCInstructions] = useState("");
  const [cFiles, setCFiles] = useState<{ name: string; type: string; data: string }[]>([]);
  const [cLinks, setCLinks] = useState<string[]>([]);
  const [cNewLink, setCNewLink] = useState("");
  const [cSaving, setCSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/auth/session").then(r => r.json()).then(s => setUserId(s?.user?.id || null)).catch(() => {});
  }, []);

  const fetchExplore = async () => {
    setLoading(true); setSelected(null);
    try { const r = await fetch("/api/v1/ai/agents"); if (r.ok) { const d = await r.json(); setAgents(d.agents || []); } }
    catch {} finally { setLoading(false); }
  };

  const fetchMyAgents = async () => {
    setMyLoading(true);
    try { const r = await fetch("/api/v1/ai/my-agents"); if (r.ok) { const d = await r.json(); setMyAgents(d.agents || []); } }
    catch {} finally { setMyLoading(false); }
  };

  useEffect(() => {
    if (!isOpen) return;
    if (tab === "explore") fetchExplore();
    else fetchMyAgents();
  }, [isOpen, tab]);

  const openDetail = async (id: string) => {
    setDetailLoading(true); setSelected(null);
    try { const r = await fetch(`/api/v1/ai/agents/${id}`); if (r.ok) { const d = await r.json(); setSelected(d); setUserRating(d.userRatings?.find((x: any) => x.userId === userId)?.rating || 0); } }
    catch {} finally { setDetailLoading(false); }
  };

  const handleRate = async (id: string, rating: number) => {
    try { const r = await fetch(`/api/v1/ai/agents/${id}/rate`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rating }) }); if (r.ok) { setUserRating(rating); toast.success("Rated!"); } }
    catch { toast.error("Failed to rate"); }
  };

  const handleComment = async (id: string) => {
    if (!commentText.trim() || !userId) return;
    setCommenting(true);
    try { const r = await fetch(`/api/v1/ai/agents/${id}/comment`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: commentText.trim() }) }); if (r.ok) { setCommentText(""); toast.success("Comment added!"); openDetail(id); } }
    catch { toast.error("Failed to comment"); } finally { setCommenting(false); }
  };

  const deleteAgent = async (id: string) => {
    try { const r = await fetch(`/api/v1/ai/agents/${id}`, { method: "DELETE" }); if (r.ok) { setMyAgents(prev => prev.filter(a => a.id !== id)); toast.success("Deleted"); } }
    catch { toast.error("Failed to delete"); }
  };

  const startCreate = (agent?: any) => {
    if (agent) {
      setEditAgent(agent);
      setCName(agent.name);
      setCDesc(agent.description || "");
      setCInstructions(agent.instructions || "");
      setCFiles(agent.files || []);
      setCLinks(agent.links || []);
    } else {
      setEditAgent(null);
      setCName(""); setCDesc(""); setCInstructions(""); setCFiles([]); setCLinks([]);
    }
    setShowCreate(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error("Max 10MB"); return; }
    const reader = new FileReader();
    reader.onload = () => {
      setCFiles(prev => [...prev, { name: file.name, type: file.type, data: reader.result as string }]);
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const addLink = () => {
    const url = cNewLink.trim();
    if (!url) return;
    if (!url.startsWith("http://") && !url.startsWith("https://")) { toast.error("Link must start with http:// or https://"); return; }
    setCLinks(prev => [...prev, url]);
    setCNewLink("");
  };

  const saveAgent = async () => {
    if (!cName.trim() || !cInstructions.trim()) { toast.error("Name and instructions are required"); return; }
    setCSaving(true);
    try {
      const ep = editAgent ? `/api/v1/ai/agents/${editAgent.id}` : "/api/v1/ai/agents";
      const method = editAgent ? "PUT" : "POST";
      const r = await fetch(ep, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: cName.trim(), description: cDesc.trim() || null, instructions: cInstructions.trim(), files: cFiles, links: cLinks }) });
      if (r.ok) { toast.success(editAgent ? "Updated!" : "Created!"); setShowCreate(false); if (tab === "explore") fetchExplore(); else fetchMyAgents(); }
      else { const d = await r.json(); toast.error(d.error || "Failed"); }
    } catch { toast.error("Failed to save"); } finally { setCSaving(false); }
  };

  const renderAgentCard = (agent: AgentItem, showActions?: boolean) => (
    <button key={agent.id} onClick={() => openDetail(agent.id)}
      className={cn("w-full text-left p-4 rounded-2xl border transition-all", isDark ? "border-white/10 bg-black/5 backdrop-blur-xl hover:bg-white/[0.05]" : "border-gray-100 bg-white/50 backdrop-blur-xl hover:bg-white/80")}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className={cn("text-sm font-bold truncate", isDark ? "text-white" : "text-gray-900")}>{agent.name}</p>
          {agent.description && <p className={cn("text-xs mt-1 line-clamp-2", isDark ? "text-gray-400" : "text-gray-500")}>{agent.description}</p>}
          <div className="flex items-center gap-3 mt-2">
            <span className={cn("text-[11px]", isDark ? "text-gray-500" : "text-gray-400")}>
              <Star size={10} weight="fill" className="inline text-amber-400 mr-0.5" />{agent.avgRating} ({agent.ratingCount})
            </span>
            <span className={cn("text-[11px]", isDark ? "text-gray-500" : "text-gray-400")}>{agent.usageCount} uses</span>
          </div>
        </div>
        {showActions && agent.creatorId === userId && (
          <div className="flex gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
            <button onClick={() => startCreate(agent)} className={cn("p-1.5 rounded-lg transition-all", isDark ? "hover:bg-white/10 text-gray-400" : "hover:bg-white/80 text-gray-500")}>
              <PencilSimple size={14} />
            </button>
            <button onClick={() => deleteAgent(agent.id)} className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-all">
              <Trash size={14} />
            </button>
          </div>
        )}
      </div>
    </button>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className={cn("fixed inset-0 z-max overflow-y-auto", isDark ? "bg-[#050505]" : "bg-[#FCFCFC]")}>
          <div className="max-w-2xl mx-auto px-4 py-6 pb-20">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {selected ? (
                  <button onClick={() => setSelected(null)} className={cn("p-2 rounded-xl", isDark ? "hover:bg-white/10 text-gray-400" : "hover:bg-white/80 text-gray-500")}>
                    <ArrowLeft size={20} />
                  </button>
                ) : null}
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", isDark ? "bg-white/10" : "bg-indigo-50")}>
                  <Robot size={20} weight="bold" className={isDark ? "text-white" : "text-indigo-500"} />
                </div>
                <h1 className={cn("text-lg font-bold", isDark ? "text-white" : "text-gray-900")}>
                  {selected ? selected.name : "Custom MedOneX"}
                </h1>
              </div>
              <button onClick={() => { onClose(); setSelected(null); }} className={cn("p-2 rounded-xl", isDark ? "text-gray-400 hover:bg-white/10" : "text-gray-500 hover:bg-white/80")}>
                <X size={20} />
              </button>
            </div>

            {/* Tabs */}
            {!selected && (
              <div className={cn("flex gap-1 mb-4 p-1 rounded-xl", isDark ? "bg-black/20 backdrop-blur-xl" : "bg-white/50 backdrop-blur-xl")}>
                {(["explore", "my-agents"] as const).map(t => (
                  <button key={t} onClick={() => setTab(t)}
                    className={cn("flex items-center justify-center gap-1.5 flex-1 py-2.5 rounded-lg text-sm font-bold transition-all",
                      tab === t ? (isDark ? "bg-white/10 text-white" : "bg-white text-gray-900 shadow-sm") : (isDark ? "text-gray-500" : "text-gray-400"))}>
                    {t === "explore" ? <Robot size={14} /> : <UserCircle size={14} />}
                    {t === "explore" ? "Explore" : "My Agents"}
                  </button>
                ))}
              </div>
            )}

            {/* Content */}
            {selected ? (
              <div className="space-y-5">
                <div className={cn("p-4 rounded-2xl border", isDark ? "border-white/10 bg-black/5 backdrop-blur-xl" : "border-gray-100 bg-white/50 backdrop-blur-xl")}>
                  {selected.description && <p className={cn("text-sm mb-3", isDark ? "text-gray-400" : "text-gray-600")}>{selected.description}</p>}
                  <div className="flex items-center gap-1 mb-4">
                    {[1, 2, 3, 4, 5].map(s => (
                      <button key={s} onClick={() => handleRate(selected.id, s)} className="transition-all active:scale-90">
                        <Star size={18} weight={s <= userRating ? "fill" : "regular"} className={s <= userRating ? "text-amber-400" : isDark ? "text-gray-600" : "text-gray-300"} />
                      </button>
                    ))}
                    <span className={cn("text-xs ml-2", isDark ? "text-gray-500" : "text-gray-400")}>{selected.avgRating} ({selected.ratingCount})</span>
                  </div>
                  <button onClick={() => { onSelectAgent(selected); onClose(); }}
                    className="w-full py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 transition-all shadow-lg shadow-indigo-500/20">
                    Start Chat
                  </button>
                </div>

                {/* Files & Links */}
                {(selected.files?.length > 0 || selected.links?.length > 0) && (
                  <div className={cn("p-4 rounded-2xl border", isDark ? "border-white/10" : "border-gray-100")}>
                    {selected.files?.length > 0 && (
                      <>
                        <h3 className={cn("text-xs font-bold mb-2", isDark ? "text-gray-400" : "text-gray-500")}>Knowledge Files ({selected.files.length})</h3>
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {selected.files.map((f, i) => (
                            <span key={i} className={cn("text-[10px] px-2 py-1 rounded-lg", isDark ? "bg-white/5 text-gray-400" : "bg-gray-100 text-gray-500")}>{f.name}</span>
                          ))}
                        </div>
                      </>
                    )}
                    {selected.links?.length > 0 && (
                      <>
                        <h3 className={cn("text-xs font-bold mb-2", isDark ? "text-gray-400" : "text-gray-500")}>Reference Links ({selected.links.length})</h3>
                        <div className="flex flex-wrap gap-1.5">
                          {selected.links.map((link, i) => (
                            <a key={i} href={link} target="_blank" rel="noopener noreferrer"
                              className={cn("text-[10px] px-2 py-1 rounded-lg underline", isDark ? "text-indigo-400 bg-indigo-500/10" : "text-indigo-600 bg-indigo-50")}>{link}</a>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Comments */}
                <div className={cn("p-4 rounded-2xl border", isDark ? "border-white/10" : "border-gray-100")}>
                  <h3 className={cn("text-sm font-bold mb-3", isDark ? "text-white" : "text-gray-900")}>Comments</h3>
                  {userId && (
                    <div className="flex gap-2 mb-3">
                      <input value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="Add a comment..."
                        className={cn("flex-1 px-3 py-2 rounded-xl text-sm border outline-none transition-all",
                          isDark ? "bg-white/5 border-white/10 text-white placeholder-gray-500 focus:border-gray-500" : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-gray-300")} />
                      <button onClick={() => handleComment(selected.id)}
                        disabled={!commentText.trim() || commenting}
                        className={cn("px-3 py-2 rounded-xl text-sm font-bold transition-all", commentText.trim() ? "bg-indigo-500 text-white hover:bg-indigo-600" : isDark ? "bg-white/5 text-gray-600" : "bg-gray-100 text-gray-400")}>
                        {commenting ? <Spinner size={14} className="animate-spin" /> : "Post"}
                      </button>
                    </div>
                  )}
                  <div className="space-y-2">
                    {selected.comments?.length === 0 && <p className={cn("text-xs text-center py-4", isDark ? "text-gray-500" : "text-gray-400")}>No comments yet</p>}
                    {selected.comments?.map((c: any) => (
                      <div key={c.id} className={cn("p-3 rounded-xl", isDark ? "bg-black/10 backdrop-blur-lg" : "bg-white/40 backdrop-blur-lg")}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={cn("text-[10px] font-bold", isDark ? "text-gray-400" : "text-gray-500")}>{c.userId?.slice(0, 8)}...</span>
                          <span className={cn("text-[10px]", isDark ? "text-gray-600" : "text-gray-400")}>{new Date(c.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className={cn("text-xs", isDark ? "text-gray-300" : "text-gray-700")}>{c.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : tab === "explore" ? (
              loading ? (
                <div className="flex justify-center py-20"><Spinner size={24} className="animate-spin text-indigo-500" /></div>
              ) : agents.length === 0 ? (
                <div className="text-center py-20">
                  <Robot size={40} className={cn("mx-auto mb-3", isDark ? "text-gray-700" : "text-gray-300")} />
                  <p className={cn("text-sm font-medium", isDark ? "text-gray-400" : "text-gray-500")}>No agents yet</p>
                </div>
              ) : (
                <div className="space-y-2">{agents.map(a => renderAgentCard(a))}</div>
              )
            ) : (
              myLoading ? (
                <div className="flex justify-center py-20"><Spinner size={24} className="animate-spin text-indigo-500" /></div>
              ) : myAgents.length === 0 ? (
                <div className="text-center py-20">
                  <UserCircle size={40} className={cn("mx-auto mb-3", isDark ? "text-gray-700" : "text-gray-300")} />
                  <p className={cn("text-sm font-medium", isDark ? "text-gray-400" : "text-gray-500")}>You haven't created any agents yet</p>
                  <button onClick={() => startCreate()} className={cn("mt-4 px-6 py-3 rounded-xl text-sm font-bold transition-all", isDark ? "bg-white/10 text-white hover:bg-white/15" : "bg-gray-100 text-gray-900 hover:bg-gray-200")}>
                    + Create Your First Agent
                  </button>
                </div>
              ) : (
                <div className="space-y-2">{myAgents.map(a => renderAgentCard(a, true))}</div>
              )
            )}
          </div>

          {/* FAB Create button */}
          {!selected && (
            <button onClick={() => startCreate()}
              className={cn("fixed bottom-6 right-6 w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl transition-all active:scale-90 z-10",
                isDark ? "bg-white text-[#0a0a0a] hover:bg-gray-200" : "bg-[#0a0a0a] text-white hover:bg-gray-800")}>
              <Plus size={24} weight="bold" />
            </button>
          )}

          {/* Create/Edit Modal */}
          <AnimatePresence>
            {showCreate && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-max overflow-y-auto" style={{ backgroundColor: "rgba(0,0,0,0.6)" }}>
                <div className="min-h-screen flex items-end sm:items-center justify-center p-0 sm:p-4">
                  <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                    onClick={e => e.stopPropagation()}
                    className={cn("w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden", isDark ? "bg-[#121212]" : "bg-white")}>
                    <div className="flex justify-center pt-3 pb-1 sm:hidden"><div className={cn("w-10 h-1 rounded-full", isDark ? "bg-white/20" : "bg-gray-300")} /></div>
                    <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: isDark ? "#ffffff10" : "#e5e7eb" }}>
                      <h2 className={cn("text-base font-bold", isDark ? "text-white" : "text-gray-900")}>{editAgent ? "Edit Agent" : "Create Agent"}</h2>
                      <button onClick={() => setShowCreate(false)} className={cn("p-2 rounded-xl", isDark ? "text-gray-400 hover:bg-white/10" : "text-gray-500 hover:bg-white/80")}><X size={18} /></button>
                    </div>
                    <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto no-scrollbar">
                      <div>
                        <label className={cn("text-xs font-bold mb-1.5 block", isDark ? "text-gray-400" : "text-gray-500")}>Name *</label>
                        <input value={cName} onChange={e => setCName(e.target.value)} placeholder="e.g. Cardiology Tutor"
                          className={cn("w-full px-3 py-2.5 rounded-xl text-sm border outline-none transition-all", isDark ? "bg-white/5 border-white/10 text-white placeholder-gray-500" : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400")} />
                      </div>
                      <div>
                        <label className={cn("text-xs font-bold mb-1.5 block", isDark ? "text-gray-400" : "text-gray-500")}>Description</label>
                        <input value={cDesc} onChange={e => setCDesc(e.target.value)} placeholder="What does this agent do?"
                          className={cn("w-full px-3 py-2.5 rounded-xl text-sm border outline-none transition-all", isDark ? "bg-white/5 border-white/10 text-white placeholder-gray-500" : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400")} />
                      </div>
                      <div>
                        <label className={cn("text-xs font-bold mb-1.5 block", isDark ? "text-gray-400" : "text-gray-500")}>System Instructions *</label>
                        <textarea value={cInstructions} onChange={e => setCInstructions(e.target.value)} rows={4} placeholder="You are a helpful tutor specialized in..."
                          className={cn("w-full px-3 py-2.5 rounded-xl text-sm border outline-none transition-all resize-none", isDark ? "bg-white/5 border-white/10 text-white placeholder-gray-500" : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400")} />
                      </div>
                      <div>
                        <label className={cn("text-xs font-bold mb-1.5 block", isDark ? "text-gray-400" : "text-gray-500")}>Knowledge Files</label>
                        <button onClick={() => fileInputRef.current?.click()}
                          className={cn("w-full py-3 rounded-xl border-2 border-dashed text-sm font-bold transition-all flex items-center justify-center gap-2",
                            isDark ? "border-white/10 text-gray-400 hover:border-white/20" : "border-gray-200 text-gray-500 hover:border-gray-300")}>
                          <UploadSimple size={16} /> Upload PDF / TXT / MD / DOC
                        </button>
                        <input ref={fileInputRef} type="file" accept=".pdf,.txt,.md,.doc,.docx" onChange={handleFileUpload} className="hidden" />
                        {cFiles.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {cFiles.map((f, i) => (
                              <span key={i} className={cn("flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg", isDark ? "bg-white/5 text-gray-400" : "bg-gray-100 text-gray-500")}>
                                {f.name}
                                <button onClick={() => setCFiles(prev => prev.filter((_, j) => j !== i))} className="text-rose-500 hover:text-rose-400"><X size={10} weight="bold" /></button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div>
                        <label className={cn("text-xs font-bold mb-1.5 block", isDark ? "text-gray-400" : "text-gray-500")}>Reference Links</label>
                        <div className="flex gap-2">
                          <input value={cNewLink} onChange={e => setCNewLink(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addLink(); } }} placeholder="https://..."
                            className={cn("flex-1 px-3 py-2.5 rounded-xl text-sm border outline-none transition-all", isDark ? "bg-white/5 border-white/10 text-white placeholder-gray-500" : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400")} />
                          <button onClick={addLink} className={cn("px-3 py-2.5 rounded-xl text-sm font-bold transition-all", isDark ? "bg-white/10 text-white hover:bg-white/15" : "bg-gray-100 text-gray-900 hover:bg-gray-200")}>Add</button>
                        </div>
                        {cLinks.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {cLinks.map((link, i) => (
                              <span key={i} className={cn("flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg", isDark ? "bg-indigo-500/10 text-indigo-400" : "bg-indigo-50 text-indigo-600")}>
                                <LinkIcon size={10} />{link}
                                <button onClick={() => setCLinks(prev => prev.filter((_, j) => j !== i))} className="text-rose-500 hover:text-rose-400"><X size={10} weight="bold" /></button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className={cn("flex gap-2 px-5 py-4 border-t", isDark ? "border-white/10" : "border-gray-200")}>
                      <button onClick={() => setShowCreate(false)} className={cn("flex-1 py-2.5 rounded-xl text-sm font-bold transition-all", isDark ? "bg-white/10 text-white hover:bg-white/15" : "bg-gray-100 text-gray-900 hover:bg-gray-200")}>Cancel</button>
                      <button onClick={saveAgent} disabled={cSaving}
                        className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 transition-all disabled:opacity-50">
                        {cSaving ? <Spinner size={14} className="animate-spin inline" /> : editAgent ? "Update" : "Create"}
                      </button>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
