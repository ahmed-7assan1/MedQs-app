"use client";
import { useState, useEffect } from "react";
import { 
  Plus, Search, Youtube, Trash2, Users, Loader2, 
  ExternalLink, CheckCircle2, LayoutGrid, List
} from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface Channel {
  id: string;
  youtubeId: string;
  name: string;
  handle?: string;
  thumbnail?: string;
  description?: string;
  subscribers?: string;
  _count: { follows: number };
}

export default function AdminChannelsPage() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [urlOrId, setUrlOrId] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetch("/api/v1/admin/channels")
      .then(r => r.json())
      .then(data => {
        setChannels(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function addChannel() {
    if (!urlOrId) return;
    setAdding(true);
    try {
      const res = await fetch("/api/v1/admin/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urlOrId })
      });
      if (res.ok) {
        const newChan = await res.json();
        setChannels([newChan, ...channels]);
        setUrlOrId("");
        setShowAdd(false);
        toast.success("Channel added successfully!");
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to add channel");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold font-display">Video Channels</h1>
          <p className="text-muted-foreground text-sm">Curate approved YouTube channels for the Discovery Hub search.</p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold shadow-lg shadow-primary/20 hover:opacity-90 transition-all"
        >
          <Plus className="h-5 w-5" />
          Add Channel
        </button>
      </div>

      {/* Add Form */}
      {showAdd && (
        <div className="bg-card border border-white/[0.02] rounded-2xl p-6 shadow-sm animate-in fade-in slide-in-from-top-4">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="flex-1 relative">
              <Youtube className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Paste Channel URL or @Handle..."
                value={urlOrId}
                onChange={(e) => setUrlOrId(e.target.value)}
                className="w-full pl-12 pr-4 h-12 rounded-xl border-white/[0.02] bg-muted/50 focus:ring-primary/40 focus:outline-none text-sm"
              />
            </div>
            <button
              onClick={addChannel}
              disabled={adding || !urlOrId}
              className="px-8 h-12 bg-primary text-primary-foreground rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {adding ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
              Fetch & Add
            </button>
          </div>
          <p className="mt-3 text-[10px] text-muted-foreground uppercase font-bold tracking-widest text-center">
            Example: https://youtube.com/@DoctorZahid or UC-f6-XXXX
          </p>
        </div>
      )}

      {/* Stats Quick View */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl border border-white/[0.02] bg-card overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Youtube className="h-12 w-12" />
          </div>
          <p className="text-3xl font-bold">{channels.length}</p>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Curated Channels</p>
        </div>
        <div className="p-5 rounded-2xl border border-white/[0.02] bg-card overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Users className="h-12 w-12" />
          </div>
          <p className="text-3xl font-bold">{channels.reduce((acc, c) => acc + c._count.follows, 0)}</p>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Total Platform Follows</p>
        </div>
      </div>

      {/* Channels Table/Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {channels.map((channel) => (
            <div key={channel.id} className="group p-5 rounded-2xl border border-white/[0.02] bg-card hover:border-primary/30 transition-all relative overflow-hidden">
               <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-full border-2 border-white/[0.03] overflow-hidden shrink-0">
                    <img src={channel.thumbnail} alt={channel.name} className="h-full w-full object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <h3 className="font-bold text-[15px] truncate">{channel.name}</h3>
                      <CheckCircle2 className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{channel.handle || "youtube.com"}</p>
                  </div>
               </div>
               
               <div className="mt-5 grid grid-cols-2 gap-2">
                  <div className="p-2 rounded-xl bg-muted/30 text-center">
                    <p className="text-xs font-bold">{channel.subscribers || "0"}</p>
                    <p className="text-[9px] uppercase font-bold text-muted-foreground tracking-tighter">YT Subs</p>
                  </div>
                  <div className="p-2 rounded-xl bg-primary/10 text-center border border-primary/5">
                    <p className="text-xs font-bold text-primary">{channel._count.follows}</p>
                    <p className="text-[9px] uppercase font-bold text-primary/60 tracking-tighter">Platform Follows</p>
                  </div>
               </div>

               <div className="mt-4 flex items-center gap-2">
                  <a 
                    href={`https://youtube.com/${channel.handle || "channel/" + channel.youtubeId}`}
                    target="_blank"
                    className="flex-1 h-9 flex items-center justify-center gap-2 rounded-lg border border-white/[0.02] text-[10px] font-bold uppercase tracking-widest hover:bg-muted transition-all"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    YouTube
                  </a>
                  <button className="h-9 w-9 flex items-center justify-center rounded-lg border border-white/[0.02] text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100">
                    <Trash2 className="h-4 w-4" />
                  </button>
               </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

