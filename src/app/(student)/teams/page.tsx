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

  const filteredTeams = MOCK_TEAMS.filter(team => 
    team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    team.faculty.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-8 pb-32">
      {/* Header */}
      <div className="mb-12">
        <h1 className="font-display text-4xl md:text-5xl font-black text-white tracking-tight mb-4">
          Medical <span className="text-primary">Teams</span>
        </h1>
        <p className="text-white/40 text-lg max-w-2xl font-medium">
          Discover and follow specialized medical teams. Access exclusive lectures, summaries, and community discussions curated by top students and doctors.
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative mb-12">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-white/30" />
        <input 
          type="text" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search teams by name or faculty..."
          className="w-full h-16 rounded-[24px] bg-[#131220] border border-white/5 px-16 text-white placeholder:text-white/20 focus:outline-none focus:border-primary/30 focus:ring-4 focus:ring-primary/10 transition-all shadow-inner text-lg"
        />
      </div>

      {/* Teams Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredTeams.map((team, i) => (
          <Link href={`/teams/${team.id}`} key={team.id}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="group flex flex-col h-full overflow-hidden rounded-[24px] border border-white/5 bg-[#131220] hover:bg-[#1a182b] transition-all hover:-translate-y-1 hover:shadow-xl hover:border-primary/20"
            >
              {/* Card Header (Banner) */}
              <div className="h-24 w-full bg-gradient-to-br from-white/5 to-white/0 relative overflow-hidden">
                 <div className="absolute inset-0 opacity-20 group-hover:opacity-40 transition-opacity bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
                 
                 {/* Floating Badge */}
                 <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-md rounded-full px-3 py-1 flex items-center gap-1.5 border border-white/10">
                    <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                    <span className="text-[10px] font-bold text-white uppercase tracking-widest">{team.faculty.name}</span>
                 </div>
              </div>

              {/* Card Body */}
              <div className="px-6 pb-6 pt-0 flex-1 flex flex-col relative">
                 {/* Avatar */}
                 <div className="h-20 w-20 rounded-2xl bg-black border-4 border-[#131220] group-hover:border-[#1a182b] transition-colors -mt-10 mb-4 overflow-hidden shadow-lg relative z-10">
                    <img src={team.imageUrl} alt={team.name} className="h-full w-full object-cover" />
                 </div>

                 <h2 className="text-xl font-black text-white mb-2 group-hover:text-primary transition-colors">{team.name}</h2>
                 <p className="text-sm font-medium text-white/40 mb-6 flex-1 line-clamp-2">
                    {team.description}
                 </p>

                 {/* Stats Row */}
                 <div className="flex items-center gap-4 pt-4 border-t border-white/5">
                    <div className="flex items-center gap-1.5">
                       <Users className="h-4 w-4 text-white/30" />
                       <span className="text-xs font-bold text-white/60">{team.followersCount}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                       <BookOpen className="h-4 w-4 text-white/30" />
                       <span className="text-xs font-bold text-white/60">{team.lecturesCount}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                       <Activity className="h-4 w-4 text-white/30" />
                       <span className="text-xs font-bold text-white/60">{team.postsCount}</span>
                    </div>

                    <div className="ml-auto h-8 w-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary group-hover:text-white text-white/20 transition-all">
                       <ArrowRight className="h-4 w-4" />
                    </div>
                 </div>
              </div>
            </motion.div>
          </Link>
        ))}
      </div>

      {filteredTeams.length === 0 && (
        <div className="text-center py-20">
          <Users className="mx-auto h-16 w-16 text-white/10 mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">No teams found</h3>
          <p className="text-white/40">Try adjusting your search criteria.</p>
        </div>
      )}
    </div>
  );
}
