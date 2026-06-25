"use client";

import { useState, useEffect } from "react";
import { Star, MessageSquare } from "lucide-react";
import { useRouter } from "next/navigation";
import { SectionHeader } from "./SectionHeader";
import { ReviewModal } from "./ReviewModal";
import { ReviewPromptModal } from "./ReviewPromptModal";
import { createClient } from "@/lib/supabase/client";

interface TestimonialData {
  id: string;
  content: string;
  rating: number;
  authorName: string;
  createdAt: string;
}

const CARD_CLASS = "flex w-80 shrink-0 flex-col rounded-2xl border border-border bg-background p-6 shadow-sm dark:border-white/[0.06] dark:bg-white/[0.03] dark:shadow-[0_0_25px_rgba(255,255,255,0.02)] dark:backdrop-blur-sm";

function TestimonialCard({ content, rating, authorName }: TestimonialData) {
  return (
    <figure className={CARD_CLASS}>
      <div className="flex gap-0.5 text-yellow-500 dark:text-yellow-500">
        {Array.from({ length: 5 }).map((_, k) => (
          <Star key={k} className={`h-4 w-4 ${k < rating ? "fill-current" : "fill-none opacity-30"}`} />
        ))}
      </div>
      <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-foreground/90 dark:text-foreground/80">
        &ldquo;{content}&rdquo;
      </blockquote>
      <figcaption className="mt-5 border-t border-border pt-4 dark:border-white/[0.06]">
        <div className="text-sm font-semibold">{authorName}</div>
      </figcaption>
    </figure>
  );
}

export function Testimonials() {
  const [testimonials, setTestimonials] = useState<TestimonialData[]>([]);
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/v1/testimonials")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setTestimonials(data);
      })
      .catch(() => {});
  }, []);

  const handleRateClick = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/auth?mode=register");
      return;
    }
    setShowModal(true);
  };

  const doubled = [...testimonials, ...testimonials];

  return (
    <section id="testimonials" className="bg-card/40 py-24">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeader eyebrow="Loved by students" title="Words from future doctors" />
      </div>
      {testimonials.length > 0 && (
        <div className="relative mt-14 space-y-6 overflow-hidden px-6 md:px-0">
          <div className="flex w-max animate-marquee gap-6" style={{ animationDuration: "50s" }}>
            {doubled.map((t, i) => (
              <TestimonialCard key={`fwd-${i}`} {...t} />
            ))}
          </div>
          <div className="flex w-max animate-marquee-reverse gap-6" style={{ animationDuration: "50s" }}>
            {doubled.map((t, i) => (
              <TestimonialCard key={`rev-${i}`} {...t} />
            ))}
          </div>
        </div>
      )}
      <div className="mt-10 text-center">
        <button
          onClick={handleRateClick}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-medium shadow-sm transition-all hover:shadow-md"
        >
          <MessageSquare className="h-4 w-4" />
          Share Your Experience
        </button>
      </div>
      <ReviewModal open={showModal} onClose={() => setShowModal(false)} onSubmitted={() => setShowModal(false)} />
      <ReviewPromptModal />
    </section>
  );
}
