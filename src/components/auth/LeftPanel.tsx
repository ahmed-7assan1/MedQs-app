"use client";

import { motion, type Variants } from "framer-motion";

const ease = [0.22, 1, 0.36, 1] as const;

const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease } },
};

const progressSteps = [
  { number: 1, title: "Create Account", active: true },
  { number: 2, title: "Complete Profile", active: false },
  { number: 3, title: "Start Learning", active: false },
];

export function LeftPanel({ showProgress = true }: { showProgress?: boolean }) {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-r-[32px]">
      {/* Top-left radial glow */}
      <div
        className="pointer-events-none absolute inset-0 opacity-30 dark:opacity-60"
        style={{
          background:
            "radial-gradient(ellipse 120% 80% at 0% 0%, #E7D6FF 0%, #B36BFF 25%, #7C3AED 45%, transparent 70%)",
        }}
      />

      {/* Secondary purple haze across upper third */}
      <div
        className="pointer-events-none absolute left-0 right-0 top-0 h-[40%] opacity-60 dark:opacity-100"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 20% 0%, rgba(124,58,237,0.12) 0%, transparent 70%)",
        }}
      />

      {/* Bottom deep gradient — only in dark mode */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-1/3 bg-none dark:bg-gradient-to-b dark:from-transparent dark:to-[#090909]/90" />

      {/* Bottom purple tint */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-1/4 bg-gradient-to-b from-transparent to-[#7C3AED]/5" />

      {/* Film grain noise overlay — visible only in dark mode */}
      <div
        className="pointer-events-none absolute inset-0 opacity-0 dark:opacity-[0.03]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.5'/%3E%3C/svg%3E\")",
          backgroundSize: "128px 128px",
        }}
      />

      {/* Animated content */}
      <div className="relative z-10 flex h-full w-full items-center justify-center px-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex w-full max-w-[380px] flex-col items-center text-center"
        >
          {/* Heading */}
          <motion.div variants={fadeUp}>
            <h1 className="text-5xl font-bold leading-[110%] tracking-tight text-foreground dark:text-white">
              Medical Education, Reimagined
            </h1>
          </motion.div>

          {/* Description */}
          <motion.p
            variants={fadeUp}
            className="mt-4 text-[17px] leading-relaxed text-muted-foreground dark:text-[#C9C9C9]"
          >
            The future of medical learning.
            <br />
            Smart tools for tomorrow&apos;s doctors.
          </motion.p>

          {/* Progress Cards */}
          {showProgress && (
            <motion.div
              variants={fadeUp}
              className="mt-11 flex w-full max-w-[370px] flex-col gap-4"
            >
              {progressSteps.map((step) => (
                <div
                  key={step.number}
                  className={`flex h-[62px] items-center gap-4 rounded-[15px] px-5 ${
                    step.active
                      ? "bg-white text-[#1a1a2e] shadow-[0_4px_20px_-8px_rgba(0,0,0,0.3)]"
                      : "bg-gray-100 text-gray-500 dark:bg-[#2A2A2A] dark:text-[#E0E0E0]"
                  }`}
                >
                  <span
                    className={`flex h-[23px] w-[23px] shrink-0 items-center justify-center rounded-full text-[13px] font-bold ${
                      step.active
                        ? "bg-[#1a1a2e] text-white"
                        : "bg-gray-200 text-gray-500 dark:bg-[#3A3A3A] dark:text-[#CCC]"
                    }`}
                  >
                    {step.number}
                  </span>
                  <span className="text-[15px] font-medium">
                    {step.title}
                  </span>
                </div>
              ))}
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Bottom-left site logo */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, ease, delay: 0.2 }}
        className="absolute bottom-8 left-10 z-10"
      >
        <img
          src="/medonex-logo.svg"
          alt="MedOneX"
          className="h-7 w-7 object-contain brightness-0 dark:invert"
        />
      </motion.div>
    </div>
  );
}
