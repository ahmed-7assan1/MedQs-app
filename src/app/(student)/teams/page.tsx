"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Users, ShieldCheck, ArrowRight, Activity, BookOpen } from "lucide-react";
import Link from "next/link";

// Mock data (Normally fetched from Prisma via an API route)
const MOCK_TEAMS = [
  {
    id: "1",
    name: "Cardio Excellence",
    description: "Dedicated to the mastery of cardiology and ECG interpretations.",
    imageUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=Cardio&backgroundColor=ef4444",
    followersCount: 1240,
    faculty: { name: "Human Medicine" },
    lecturesCount: 45,
    postsCount: 120
  },
  {
    id: "2",
    name: "Neuro Ninjas",
    description: "Advanced neurology concepts broken down for undergraduates.",
    imageUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=Neuro&backgroundColor=8b5cf6",
    followersCount: 890,
    faculty: { name: "Human Medicine" },
    lecturesCount: 32,
    postsCount: 85
  },
  {
    id: "3",
    name: "Pharma Pioneers",
    description: "The ultimate resource for pharmacology and drug interactions.",
    imageUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=Pharma&backgroundColor=10b981",
    followersCount: 2100,
    faculty: { name: "Pharmacy" },
    lecturesCount: 60,
    postsCount: 300
  }
];

export default function TeamsDirectory() {
  const [searchQuery, setSearchQuery] = useState("");
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/v1/teams")
      .then(res => res.json())
      .then(data => {
        setTeams(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filteredTeams = teams.filter(team => 
    team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (team.faculty?.name || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-7xl px-4 pt-20 pb-32 md:px-8">
      {/* Header */}
      <div className="mb-12 relative">
        <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-[100px]" />
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-primary mb-2">Community</p>
        <h1 className="font-display text-4xl md:text-5xl font-black text-foreground tracking-tight mb-4">
          Medical <span className="text-primary">Teams</span>
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl font-medium leading-relaxed">
          Discover and follow specialized medical teams. Access exclusive lectures, summaries, and community discussions curated by top students and doctors.
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative mb-12">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground/30" />
        <input 
          type="text" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search teams by name or faculty..."
          className="w-full h-16 rounded-[24px] bg-card border border-border px-16 text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary/30 focus:ring-4 focus:ring-primary/10 transition-all shadow-sm text-lg font-medium"
        />
      </div>

      {/* Teams Grid */}
      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-[320px] rounded-[32px] bg-card border border-border animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTeams.map((team, i) => (
            <Link href={`/teams/${team.id}`} key={team.id}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="group flex flex-col h-full overflow-hidden rounded-[32px] border border-border bg-card hover:bg-card/80 transition-all hover:-translate-y-1 hover:shadow-xl hover:border-primary/20"
              >
                {/* Card Header (Banner) */}
                <div className="h-28 w-full bg-muted/30 relative overflow-hidden">
                  {team.coverUrl ? (
                    <img src={team.coverUrl} className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" alt="" />
                  ) : (
                    <div className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity bg-primary/20" />
                  )}
                  
                   {/* Floating Badge */}
                   <div className="absolute top-4 right-4 bg-background/60 backdrop-blur-md rounded-full px-3 py-1 flex items-center gap-1.5 border border-border shadow-sm">
                      <ShieldCheck className="h-3 w-3 text-primary" />
                      <span className="text-[9px] font-black text-foreground uppercase tracking-widest">{team.faculty?.name || "General"}</span>
                   </div>
                </div>

                {/* Card Body */}
                <div className="px-6 pb-6 pt-0 flex-1 flex flex-col relative">
                   {/* Avatar */}
                   <div className="h-20 w-20 rounded-2xl bg-background border-4 border-card group-hover:border-card/80 transition-colors -mt-10 mb-4 overflow-hidden shadow-lg relative z-10">
                      <img src={team.imageUrl || `https://api.dicebear.com/7.x/shapes/svg?seed=${team.id}&backgroundColor=6c5ff0`} alt={team.name} className="h-full w-full object-cover" />
                   </div>

                   <h2 className="text-xl font-black text-foreground mb-2 group-hover:text-primary transition-colors">{team.name}</h2>
                   <p className="text-sm font-medium text-muted-foreground mb-6 flex-1 line-clamp-2">
                      {team.description}
                   </p>

                   {/* Stats Row */}
                   <div className="flex items-center gap-4 pt-4 border-t border-border">
                      <div className="flex items-center gap-1.5">
                         <Users className="h-4 w-4 text-muted-foreground/40" />
                         <span className="text-xs font-bold text-muted-foreground">{team.followersCount || 0}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                         <BookOpen className="h-4 w-4 text-muted-foreground/40" />
                         <span className="text-xs font-bold text-muted-foreground">{team._count?.lectures || 0}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                         <Activity className="h-4 w-4 text-muted-foreground/40" />
                         <span className="text-xs font-bold text-muted-foreground">{team._count?.posts || 0}</span>
                      </div>

                      <div className="ml-auto h-9 w-9 rounded-full bg-primary/5 flex items-center justify-center group-hover:bg-primary group-hover:text-white text-primary transition-all shadow-sm">
                         <ArrowRight className="h-4 w-4" />
                      </div>
                   </div>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      )}

      {filteredTeams.length === 0 && !loading && (
        <div className="text-center py-20 bg-card border border-border border-dashed rounded-[32px]">
          <Users className="mx-auto h-12 w-12 text-muted-foreground/20 mb-4" />
          <h3 className="text-xl font-bold text-foreground mb-2">No teams found</h3>
          <p className="text-muted-foreground text-sm">Try adjusting your search criteria.</p>
        </div>
      )}
    </div>
  );
}
