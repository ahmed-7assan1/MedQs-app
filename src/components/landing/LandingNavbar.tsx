"use client";

import Link from "next/link";
import { ArrowRight, Sun, Moon, LogIn, Menu, X } from "lucide-react";
import { MedOneXLogoMark } from "@/components/branding/MedQsLogo";
import { useThemeStore } from "@/lib/store";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function LandingNavbar() {
  const { theme, setTheme } = useThemeStore();
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isDark =
    theme === "dark" ||
    (theme === "system" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  function toggleTheme() {
    setTheme(isDark ? "light" : "dark");
  }

  const navLinks = [
    { name: "Features", href: "#features" },
    { name: "How it Works", href: "#how-it-works" },
    { name: "Stats", href: "#stats" },
    { name: "Community", href: "/social" },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ${
      scrolled 
        ? "py-3 bg-[#05070f]/70 backdrop-blur-xl border-b border-white/5" 
        : "py-6 bg-transparent"
    }`}>
      <div className="mx-auto max-w-7xl px-6 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group decoration-transparent">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 border border-primary/30 group-hover:scale-110 transition-transform">
            <MedOneXLogoMark className="h-6 w-6 text-primary" title="MedOneX" />
          </div>
          <span className="text-xl font-black tracking-tighter text-white">
            MedOneX
          </span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link 
              key={link.name} 
              href={link.href} 
              className="text-sm font-medium text-white/60 hover:text-white transition-colors"
            >
              {link.name}
            </Link>
          ))}
        </div>

        {/* Right side Actions */}
        <div className="flex items-center gap-4">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white transition-all"
          >
            {mounted && (isDark ? <Sun size={18} /> : <Moon size={18} />)}
          </button>

          <Link
            href="/login"
            className="hidden sm:flex items-center gap-2 text-sm font-bold text-white/80 hover:text-white transition-colors"
          >
            Sign In
          </Link>

          <Link
            href="/register"
            className="h-11 flex items-center px-6 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-sm font-bold text-white shadow-lg shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all"
          >
            Start Free
          </Link>

          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden p-2 text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-full left-0 right-0 bg-[#05070f] border-b border-white/5 p-6 flex flex-col gap-4 md:hidden"
          >
            {navLinks.map((link) => (
              <Link 
                key={link.name} 
                href={link.href} 
                onClick={() => setMobileMenuOpen(false)}
                className="text-lg font-bold text-white/80"
              >
                {link.name}
              </Link>
            ))}
            <hr className="border-white/5 my-2" />
            <Link href="/login" className="text-lg font-bold text-primary">Sign In</Link>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
