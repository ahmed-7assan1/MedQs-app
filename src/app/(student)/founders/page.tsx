"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, Users, Star, Award, Heart, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function PublicFoundersPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/v1/founders")
      .then(res => res.json())
      .then(data => {
        setMembers(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07080f] flex items-center justify-center">
         <Loader2 className="h-10 w-10 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07080f] pb-32 pt-24">
      {/* Hero Section */}
      <div className="relative h-[400px] w-full overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/20 via-transparent to-[#07080f] z-10" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
        
        <div className="relative z-20 text-center px-6">
           <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-6">
              <ShieldCheck className="h-3.5 w-3.5" />
              The Visionaries Behind MedOneX
           </div>
           <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-white mb-6">
              Founders of <span className="text-primary">MedOneX.</span>
           </h1>
           <p className="text-white/40 font-bold uppercase tracking-widest text-sm max-w-2xl mx-auto leading-relaxed">
              Meet the dedicated team of medical professionals and innovators working to redefine medical education for the next generation.
           </p>
        </div>
      </div>

      <div className="container mx-auto px-6">
        {members.length === 0 ? (
          <div className="py-32 text-center">
            <Users className="h-16 w-16 text-white/10 mx-auto mb-6" />
            <p className="text-white/30 font-black uppercase tracking-widest">The team is currently preparing for launch.</p>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {members.map((member) => (
              <div 
                key={member.id}
                className="group relative bg-[#131220] border border-white/5 rounded-[40px] p-8 transition-all hover:-translate-y-2 hover:shadow-2xl hover:shadow-primary/10 hover:border-primary/20 overflow-hidden"
              >
                {/* Decorative Elements */}
                <div className="absolute -top-12 -right-12 h-32 w-32 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all" />
                
                <div className="relative z-10 flex flex-col items-center text-center">
                  {/* Avatar */}
                  <div className="h-32 w-32 rounded-[32px] overflow-hidden border-4 border-white/5 bg-black mb-6 group-hover:scale-105 transition-transform duration-500 shadow-2xl">
                    <img 
                      src={member.imageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.name}&backgroundColor=6c5ff0`} 
                      alt={member.name}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <h2 className="text-2xl font-black text-white mb-2 group-hover:text-primary transition-colors">{member.name}</h2>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-white/40 mb-6">
                    <Star className="h-3 w-3 text-primary" />
                    {member.role}
                  </div>

                  <p className="text-white/40 text-sm font-medium leading-relaxed mb-8 line-clamp-4 italic">
                    "{member.description || "Dedicated to medical excellence and student success."}"
                  </p>

                  {/* Badge row */}
                  <div className="flex items-center gap-4 pt-6 border-t border-white/5 w-full justify-center">
                    <div className="flex flex-col items-center gap-1">
                      <Award className="h-5 w-5 text-primary/40" />
                      <span className="text-[8px] font-black uppercase tracking-widest text-white/20">Expert</span>
                    </div>
                    <div className="h-8 w-[1px] bg-white/5" />
                    <div className="flex flex-col items-center gap-1">
                      <Heart className="h-5 w-5 text-primary/40" />
                      <span className="text-[8px] font-black uppercase tracking-widest text-white/20">Leader</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Commitment section */}
        <div className="mt-32 p-12 rounded-[50px] bg-gradient-to-br from-primary/10 to-transparent border border-white/5 text-center relative overflow-hidden">
           <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
           <div className="relative z-10">
              <h3 className="text-3xl font-black text-white mb-4">Our Commitment</h3>
              <p className="text-white/40 font-medium max-w-3xl mx-auto leading-relaxed">
                 We believe that every medical student deserves access to the best resources and mentorship. MedOneX is not just a platform; it's a community built by medics, for medics, driven by a passion for excellence in healthcare education.
              </p>
           </div>
        </div>
      </div>
    </div>
  );
}
