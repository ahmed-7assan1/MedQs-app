"use client";

import Link from "next/link";
import { Flame, Trophy, GraduationCap, Target, Bell, Search, Sparkles, BrainCircuit, BookOpen, Zap, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { getDailyQuote } from "@/components/dashboard/shared/quotes";
import type { DashboardData } from "@/types/dashboard";

const QUICK_LINKS = [
 { icon: BrainCircuit, label: "Dr. Q", href: "/ai-chat", color: "text-primary" },
 { icon: Zap, label: "Quiz", href: "/quiz", color: "text-sky-500" },
 { icon: BookOpen, label: "Library", href: "/medical-books", color: "text-violet-500" },
 { icon: Users, label: "Community", href: "/social", color: "text-rose-500" },
];

function getInitials(name: string): string {
 return name
  .split(" ")
  .map((w) => w[0])
  .join("")
  .toUpperCase()
  .slice(0, 2);
}

export function ProfileSidebar({ data }: { data: DashboardData }) {
 const quote = getDailyQuote();
 const initials = getInitials(data.firstName);

 return (
   <div className="space-y-5">
    {/* Profile Card */}
     <Card className="relative overflow-hidden">
      <CardContent className="p-4">
      <div className="absolute -right-12 -top-12 h-28 w-28 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute -left-6 -bottom-6 h-16 w-16 rounded-full bg-accent/10 blur-3xl" />

     <div className="relative flex flex-col items-center text-center">
     {/* Avatar */}
    <div className="relative mb-4">
     <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-glow-pulse" />
     <Avatar className="relative h-20 w-20 shadow-lg">
      <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground text-2xl font-black">
       {initials}
      </AvatarFallback>
     </Avatar>
    </div>

     {/* Name + Greeting */}
     <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-1">{data.greeting}</p>
     <h2 className="text-xl font-black tracking-tighter text-foreground mb-1">
      Dr. {data.firstName}
     </h2>

      {/* Rank Badge */}
      <Badge variant="secondary" className="flex items-center gap-1.5 px-3 py-1 rounded-full mb-4 text-[10px] font-black">
       <Trophy className="h-3 w-3" />
       {data.rankLabel}
      </Badge>

      {/* Action Buttons */}
      <div className="flex gap-2">
       <Button variant="ghost" size="sm" className="h-8 w-8 rounded-full" title="Search">
        <Search className="h-3.5 w-3.5" />
       </Button>
       <Button variant="ghost" size="sm" className="relative h-8 w-8 rounded-full" title="Notifications">
        <Bell className="h-3.5 w-3.5" />
        <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-red-500 border border-background" />
       </Button>
      </div>
      </div>
      </CardContent>
     </Card>

    {/* Key Stats */}
    <div
     className="grid grid-cols-2 gap-2"
   >
    {[
     { label: "Streak", value: `${data.currentStreak}d`, icon: Flame, color: "text-orange-500", bg: "bg-orange-500/10" },
     { label: "XP", value: (data.rankPoints || 0).toLocaleString(), icon: Trophy, color: "text-amber-500", bg: "bg-amber-500/10" },
     { label: "Mastery", value: `${data.overallPct}%`, icon: Target, color: "text-sky-500", bg: "bg-sky-500/10" },
     { label: "Solved", value: (data.totalQuestions || 0).toLocaleString(), icon: GraduationCap, color: "text-violet-500", bg: "bg-violet-500/10" },
    ].map((stat, i) => {
     const Icon = stat.icon;
     return (
      <Card
         key={stat.label}
         className="shadow-sm"
       >
        <CardContent className="p-3">
        <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center mb-2", stat.bg)}>
         <Icon className={cn("h-3.5 w-3.5", stat.color)} />
        </div>
        <p className="text-base font-black tabular-nums text-foreground">{stat.value}</p>
        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mt-0.5">{stat.label}</p>
        </CardContent>
       </Card>
      );
     })}
    </div>

    {/* Daily Quote */}
     <Card className="bg-muted/30 border-border/40 shadow-none">
      <CardContent className="p-4">
     <div className="flex items-start gap-2">
      <Sparkles size={14} className="text-primary shrink-0 mt-0.5" />
      <div>
       <p className="text-[10px] leading-relaxed text-foreground italic">
        &ldquo;{quote.text}&rdquo;
       </p>
       <p className="mt-1 text-[8px] font-bold text-foreground/60 tracking-wider">
        &mdash; {quote.author}
       </p>
      </div>
     </div>
      </CardContent>
     </Card>

   {/* Quick Links */}
    <div
     className="flex flex-wrap gap-1.5"
   >
    {QUICK_LINKS.map((link) => {
     const Icon = link.icon;
     return (
      <Link
       key={link.label}
       href={link.href}
       className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-muted/30 border border-border/40 hover:bg-muted/60 transition-colors text-[10px] font-bold text-foreground/70 hover:text-foreground"
      >
       <Icon className={cn("h-3 w-3", link.color)} />
       {link.label}
      </Link>
     );
    })}
    </div>
   </div>
  );
}
