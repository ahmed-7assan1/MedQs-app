"use client";

import { motion } from "framer-motion";
import { Sparkles, ArrowLeft, Heart, Code, Stethoscope } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Mock data (Normally fetched from PlatformMember)
const TEAM_MEMBERS = [
  {
    id: "1",
    name: "Ahmed Hassan",
    role: "Founder & Lead Developer",
    description: "Medical student with a passion for software engineering. Built MedOneX to revolutionize medical education.",
    imageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmed&backgroundColor=c0aede",
    icon: Code,
    color: "text-purple-500",
    bg: "bg-purple-500/10"
  },
  {
    id: "2",
    name: "Dr. Q AI",
    role: "Chief Medical Intelligence",
    description: "An advanced AI system fine-tuned to answer medical queries, generate quizzes, and assist students 24/7.",
    imageUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=DrQ&backgroundColor=ffdfbf",
    icon: Sparkles,
    color: "text-amber-500",
    bg: "bg-amber-500/10"
  }
];

export default function AboutPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#07080f] px-4 py-8 md:px-8 pb-32">
      {/* Header */}
      <div className="mx-auto max-w-4xl pt-8 pb-16">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-white/50 hover:text-white transition-colors mb-12 group"
        >
          <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 group-hover:bg-white/10 transition-all">
            <ArrowLeft className="h-5 w-5" />
          </div>
          <span className="font-bold">Back</span>
        </button>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="inline-flex items-center justify-center rounded-full bg-primary/10 px-4 py-2 mb-6 border border-primary/20">
            <Sparkles className="mr-2 h-4 w-4 text-primary" />
            <span className="text-xs font-bold uppercase tracking-widest text-primary">The Visionaries</span>
          </div>
          <h1 className="font-display text-5xl md:text-7xl font-black text-white mb-6 tracking-tight">
            Meet the <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4f46e5] to-[#818cf8]">MedOneX</span> Team
          </h1>
          <p className="text-white/40 text-lg md:text-xl max-w-2xl mx-auto font-medium">
            We are bridging the gap between cutting-edge technology and medical education to build the ultimate study ecosystem.
          </p>
        </motion.div>
      </div>

      {/* Team Grid */}
      <div className="mx-auto max-w-5xl">
        <div className="grid gap-8 md:grid-cols-2">
          {TEAM_MEMBERS.map((member, i) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.15 }}
              className="group relative overflow-hidden rounded-[32px] border border-white/[0.03] bg-[#131220] p-8 shadow-2xl transition-all hover:-translate-y-2 hover:shadow-[0_20px_60px_rgba(79,70,229,0.15)] hover:border-white/10"
            >
               {/* Background Glow */}
               <div className="absolute -top-32 -right-32 h-64 w-64 rounded-full bg-gradient-to-br from-[#4f46e5]/20 to-[#818cf8]/0 blur-3xl transition-opacity opacity-0 group-hover:opacity-100" />
               
               <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center md:items-start text-center md:text-left">
                  {/* Avatar */}
                  <div className="relative shrink-0">
                     <div className="h-32 w-32 overflow-hidden rounded-[28px] border border-white/10 bg-black/50 shadow-inner group-hover:scale-105 transition-transform duration-500">
                        <img src={member.imageUrl} alt={member.name} className="h-full w-full object-cover" />
                     </div>
                     <div className={`absolute -bottom-4 -right-4 flex h-12 w-12 items-center justify-center rounded-2xl border-4 border-[#131220] ${member.bg}`}>
                        <member.icon className={`h-5 w-5 ${member.color}`} />
                     </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1">
                     <h2 className="text-2xl font-black text-white mb-2">{member.name}</h2>
                     <p className="text-sm font-bold uppercase tracking-widest text-primary mb-4">{member.role}</p>
                     <p className="text-white/50 leading-relaxed font-medium text-sm">
                        {member.description}
                     </p>
                  </div>
               </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Footer Note */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-32 text-center flex flex-col items-center justify-center gap-4"
      >
        <Heart className="h-8 w-8 text-red-500 animate-pulse" />
        <p className="text-white/30 text-sm font-bold uppercase tracking-[0.2em]">Built with passion for medical students worldwide</p>
      </motion.div>
    </div>
  );
}
