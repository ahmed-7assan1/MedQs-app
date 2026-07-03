"use client";

import React from "react";
import Link from "next/link";
import { Sparkles, BookOpen, Users, PenTool, MessagesSquare, ArrowRight, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { SectionHeader } from "@/components/dashboard/shared/SectionHeader";
import { AskDrQFeatured } from "@/components/dashboard/RedesignedComponents";

const CARDS = [
 {
  id: "library",
  title: "Medical Library",
  desc: "Browse textbooks, references, and academic resources",
  icon: BookOpen,
  href: "/medical-books",
  gradient: "from-amber-500/20 to-yellow-500/10",
  border: "border-amber-500/20",
  iconBg: "bg-amber-500/20 text-amber-500",
 },
 {
  id: "community",
  title: "Community",
  desc: "Discuss cases, share notes, and learn together",
  icon: Users,
  href: "/social",
  gradient: "from-blue-500/20 to-sky-500/10",
  border: "border-blue-500/20",
  iconBg: "bg-blue-500/20 text-blue-500",
 },
 {
  id: "spaced-rep",
  title: "Spaced Repetition",
  desc: "Review flashcards optimized for long-term retention",
  icon: MessagesSquare,
  href: "/study-tools",
  gradient: "from-emerald-500/20 to-teal-500/10",
  border: "border-emerald-500/20",
  iconBg: "bg-emerald-500/20 text-emerald-500",
 },
 {
  id: "drawmed",
  title: "DrawMed",
  desc: "Visualize medical concepts with AI-powered sketching",
  icon: PenTool,
  href: "/drawmed",
  gradient: "from-cyan-500/20 to-violet-500/10",
  border: "border-cyan-500/20",
  iconBg: "bg-cyan-500/20 text-cyan-500",
 },
];

function EcosystemCard({ card }: { card: typeof CARDS[number] }) {
 const Icon = card.icon;
 const iconTextColor = cn(card.iconBg?.split(" ").find(c => c.startsWith("bg-"))?.replace("bg-", "text-"));
  return (
   <Card asChild className="group overflow-hidden rounded-2xl border-border/40 bg-gradient-to-br from-card/90 to-card/60 shadow-sm will-change-transform transition-transform transition-shadow duration-300 ease-out hover:-translate-y-1 hover:shadow-lg">
    <Link href={card.href}>
     <CardContent className="p-5 relative">
     <div className={cn("absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500", card.gradient)} />
     <div className={cn("absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 ring-1", card.border)} />
     <div className="relative">
      <div className="mb-3 inline-block transition-transform duration-300 group-hover:scale-110 group-hover:-translate-y-0.5">
       <Icon className={cn("h-6 w-6", iconTextColor)} />
      </div>
      <h3 className="text-sm font-black text-foreground group-hover:text-primary transition-colors duration-300">{card.title}</h3>
      <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{card.desc}</p>
      <div className="mt-3 flex items-center gap-1 text-[10px] font-bold text-primary uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity transition-transform duration-300 group-hover:translate-x-0.5">
       Open <ArrowRight className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-0.5" />
      </div>
     </div>
     </CardContent>
    </Link>
   </Card>
  );
}

export const EcosystemCards = React.memo(function EcosystemCards() {
  return (
  <div>
   <SectionHeader icon={Globe} title="MedOneX Ecosystem" />

   <div className="hidden sm:grid sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3">
    <AskDrQFeatured />
    {CARDS.map((card) => (
     <EcosystemCard key={card.id} card={card} />
    ))}
   </div>

   <div className="flex sm:hidden gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scroll-smooth [-webkit-scrollbar]:hidden">
    <div className="snap-start shrink-0 w-[260px]">
     <AskDrQFeatured />
    </div>
    {CARDS.map((card) => (
     <div key={card.id} className="snap-start shrink-0 w-[220px]">
      <EcosystemCard card={card} />
     </div>
     ))}
    </div>
   </div>
  );
});
