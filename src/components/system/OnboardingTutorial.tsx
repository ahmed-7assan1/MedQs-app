"use client";

import { useState, useEffect } from "react";
import { X, ChevronRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const TUTORIAL_STEPS = [
  {
    title: "Welcome to MedOneX! 🎉",
    desc: "Your new command center for medical studies. Let's take a quick tour so you can master your modules faster.",
  },
  {
    title: "The Curriculum Hub",
    desc: "Navigate effortlessly through your University → Year → Semester → Module. Everything is organized exactly how your faculty teaches it.",
  },
  {
    title: "Study Space & AI Coaching",
    desc: "Use the Study Space to plan your week. Upload your schedule, and our AI coach 'Q' will generate daily tasks and learning objectives. Click the Board to sketch out complex pathways.",
  },
  {
    title: "Past Papers & Simulations",
    desc: "Solve timed past-papers that simulate actual exam environments. Review AI rationales for every single option to understand the 'why'.",
  },
  {
    title: "Discussions & Community",
    desc: "Join your semester's private forum to ask questions and share clinical cases with your peers without the noise of public social media.",
  },
];

export function OnboardingTutorial() {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    setMounted(true);
    const seen = localStorage.getItem("medqs_onboarding_seen");
    if (!seen) {
      // Small delay so they see the dashboard first
      const t = setTimeout(() => setOpen(true), 1500);
      return () => clearTimeout(t);
    }
  }, []);

  const handleSkip = () => {
    localStorage.setItem("medqs_onboarding_seen", "true");
    setOpen(false);
  };

  const handleNext = () => {
    if (step < TUTORIAL_STEPS.length - 1) {
      setStep(step + 1);
    } else {
      handleSkip();
    }
  };

  if (!mounted || !open) return null;

  return (
    <div className="fixed inset-0 z-max flex items-center justify-center bg-background/80 p-6 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/[0.02] bg-card shadow-2xl animate-slide-up">
        
        {/* Top Progress bar */}
        <div className="flex h-1.5 w-full bg-muted">
          <div 
            className="bg-primary transition-all duration-300 ease-out"
            style={{ width: `${((step + 1) / TUTORIAL_STEPS.length) * 100}%` }}
          />
        </div>

        <button 
          onClick={handleSkip}
          className="absolute right-4 top-4 rounded-full bg-muted/50 p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="p-8">
          <div className="mb-2 inline-flex rounded-xl bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            Step {step + 1} of {TUTORIAL_STEPS.length}
          </div>
          <h2 className="mb-3 mt-4 font-display text-2xl font-bold tracking-tight text-foreground">
            {TUTORIAL_STEPS[step].title}
          </h2>
          <p className="min-h-[80px] text-sm leading-relaxed text-muted-foreground">
            {TUTORIAL_STEPS[step].desc}
          </p>

          <div className="mt-8 flex items-center justify-between">
            <button
              onClick={handleSkip}
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Skip Tour
            </button>
            <button
              onClick={handleNext}
              className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 outline-none transition-transform hover:scale-105 active:scale-95"
            >
              {step === TUTORIAL_STEPS.length - 1 ? (
                <>Get Started <Check className="h-4 w-4" /></>
              ) : (
                <>Next <ChevronRight className="h-4 w-4" /></>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

