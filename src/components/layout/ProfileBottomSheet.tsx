"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { 
  X, Moon, Sun, Monitor, LogOut, Settings, 
  Bell, BookOpen, Trophy, Smartphone, UserCircle,
  BarChart3, Video, MessageSquare, Clock
} from "lucide-react";
import { useThemeStore } from "@/lib/store";
import { cn } from "@/lib/utils";

interface ProfileBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  userImage?: string | null;
  userName?: string | null;
  userId?: string;
}

export function ProfileBottomSheet({ isOpen, onClose, userImage, userName }: ProfileBottomSheetProps) {
  const { theme, setTheme } = useThemeStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!mounted) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm"
          />

          {/* Bottom Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 z-[201] flex flex-col rounded-t-[32px] bg-card border-t border-border shadow-2xl overflow-hidden max-h-[90vh]"
          >
            {/* Drag Handle */}
            <div className="w-full flex justify-center pt-4 pb-2" onClick={onClose}>
              <div className="w-12 h-1.5 rounded-full bg-muted-foreground/30" />
            </div>

            <div className="px-6 py-2 flex items-center justify-between">
              <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground">Account</h2>
              <button onClick={onClose} className="p-2 rounded-full bg-muted/50 hover:bg-muted text-foreground transition-all">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 pb-8 custom-scrollbar">
              
              {/* Profile Card */}
              <div className="mt-4 mb-6 flex items-center gap-4 p-4 rounded-[24px] bg-muted/30 border border-border">
                <div className="h-16 w-16 rounded-full overflow-hidden bg-primary/10 border-2 border-primary/20 shrink-0">
                  {userImage ? (
                    <img src={userImage} alt={userName || "User"} className="h-full w-full object-cover" />
                  ) : (
                    <UserCircle className="h-full w-full text-primary p-2" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-black truncate text-foreground">{userName || "Student"}</h3>
                  <p className="text-xs font-medium text-muted-foreground truncate">MedOneX Member</p>
                </div>
              </div>

              {/* Theme Segmented Control */}
              <div className="mb-8 bg-muted/30 p-1.5 rounded-2xl flex items-center border border-border">
                <button
                  onClick={() => setTheme("light")}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all",
                    theme === "light" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                  )}
                >
                  <Sun className="h-4 w-4" /> Light
                </button>
                <button
                  onClick={() => setTheme("system")}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all",
                    theme === "system" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                  )}
                >
                  <Monitor className="h-4 w-4" /> Auto
                </button>
                <button
                  onClick={() => setTheme("dark")}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all",
                    theme === "dark" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                  )}
                >
                  <Moon className="h-4 w-4" /> Dark
                </button>
              </div>

              {/* Navigation Links */}
              <div className="space-y-1 mb-8">
                <MenuLink href="/modules" icon={BookOpen} label="My Library" onClick={onClose} />
                <MenuLink href="/study-tools" icon={BarChart3} label="Study Tools" onClick={onClose} />
                <MenuLink href="/videos" icon={Video} label="OneX Videos" onClick={onClose} />
                <MenuLink href="/taskat" icon={Clock} label="Taskat (Schedule)" onClick={onClose} />
                <MenuLink href="/social" icon={MessageSquare} label="Community" onClick={onClose} />
                <MenuLink href="/leaderboard" icon={Trophy} label="Leaderboard" onClick={onClose} />
                <MenuLink href="/notifications" icon={Bell} label="Notifications" onClick={onClose} />
                <MenuLink href="/settings" icon={Settings} label="Settings" onClick={onClose} />
                <MenuLink href="/mobile-app" icon={Smartphone} label="Download App" onClick={onClose} />
              </div>

              {/* Actions */}
              <div className="pt-6 border-t border-border">
                <button 
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-red-500/10 text-red-500 font-bold text-sm hover:bg-red-500/20 transition-all active:scale-95"
                >
                  <LogOut className="h-4 w-4" /> Sign Out
                </button>
              </div>

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function MenuLink({ href, icon: Icon, label, onClick }: { href: string; icon: any; label: string; onClick: () => void }) {
  return (
    <Link 
      href={href}
      onClick={onClick}
      className="flex items-center gap-4 p-4 rounded-2xl hover:bg-muted/50 active:bg-muted transition-all active:scale-[0.98]"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <span className="font-bold text-sm text-foreground">{label}</span>
    </Link>
  );
}
