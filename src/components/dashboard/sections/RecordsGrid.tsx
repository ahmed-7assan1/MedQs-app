"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Headphones, Music, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/dashboard/shared/SectionHeader";
import { useRecords } from "@/lib/dashboard-fetch";

function RecordCard({ record }: { record: import("@/lib/dashboard-fetch").SuggestedRecord }) {
  const [imgError, setImgError] = useState(false);

  return (
    <Link href={`/modules/${record.moduleId}/lectures/${record.lectureId}`}>
      <Card className="group overflow-hidden border-border/40 shadow-sm hover:shadow-md transition-[transform,opacity,box-shadow] duration-300 cursor-pointer hover:-translate-y-0.5">
        <div className="relative aspect-video bg-muted/20 overflow-hidden">
          {record.image && !imgError ? (
            <img
              src={record.image}
              alt={record.title}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Music className="h-8 w-8 text-muted-foreground/40" />
            </div>
          )}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-[transform,opacity,box-shadow] duration-300 flex items-center justify-center">
            <div className="h-10 w-10 rounded-full bg-background/90 shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-[transform,opacity,box-shadow] duration-300 scale-90 group-hover:scale-100">
              <Headphones className="h-5 w-5 text-foreground" />
            </div>
          </div>
        </div>

        <div className="p-4">
          <p className="text-xs font-bold text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
            {record.title}
          </p>
          <p className="text-[10px] text-muted-foreground/60 truncate mt-1">
            {record.lectureTitle} &middot; {record.subjectName}
          </p>
          <div className="flex items-center gap-1.5 mt-3">
            <Avatar className="h-5 w-5 shrink-0">
              <AvatarFallback className="text-[9px] font-black bg-primary/10 text-primary">
                {record.artist.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <span className="text-[9px] font-medium text-muted-foreground/70 truncate">
              {record.artist}
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}

function GridSkeleton() {
  return (
    <div className="w-full animate-pulse">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-4 w-4 rounded bg-muted/40" />
        <div className="h-3 w-20 rounded bg-muted/40" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="overflow-hidden border-border/40 shadow-sm">
            <div className="aspect-video bg-muted/20" />
            <div className="p-3 space-y-2">
              <div className="h-3 w-full rounded bg-muted/30" />
              <div className="h-3 w-4/5 rounded bg-muted/30" />
              <div className="h-2 w-3/5 rounded bg-muted/20" />
              <div className="flex items-center gap-1.5 pt-1">
                <div className="h-5 w-5 rounded-full bg-muted/30" />
                <div className="h-2 w-14 rounded bg-muted/20" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function RecordsGrid({ sidebarOpen }: { sidebarOpen?: boolean }) {
  const { data, error, isLoading } = useRecords();

  if (isLoading) return <div><GridSkeleton /></div>;
  if (error) throw new Error("Failed to load lecture recordings");
  if (!data?.items?.length) {
    return (
      <div>
        <SectionHeader icon={Headphones} title="Lecture Recordings" />
        <Button variant="outline" asChild className="w-full p-0 h-auto rounded-xl border-dashed bg-card/30 hover:bg-card/50">
          <Link href="/modules" className="flex items-center justify-between p-5">
            <div className="flex items-center gap-3">
              <Headphones className="h-7 w-7 text-muted-foreground/30" />
              <div>
                <p className="text-sm font-bold text-foreground">No records yet</p>
                <p className="text-xs text-muted-foreground">Browse modules to find lecture recordings</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground/50" />
          </Link>
        </Button>
      </div>
    );
  }

  const records = data.items.slice(0, 4);

  return (
    <div>
      <SectionHeader icon={Headphones} title="Lecture Recordings" />
      <div className="grid grid-cols-2 gap-3">
        {records.map((record: any) => (
          <RecordCard key={record.id} record={record} />
        ))}
      </div>
    </div>
  );
}
