"use client";
import Link from "next/link";
import { useSiteConfig } from "@/contexts/SiteConfigContext";
import { Facebook, Twitter, Youtube, Instagram, Send, Phone, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Legal + trust links on every student-facing page (inside main shell).
 * Redesigned for a professional, immersive, single-row experience.
 */
export function SiteFooter() {
  const { siteName = "MedOneX", facebookUrl, twitterUrl, youtubeUrl, instagramUrl, telegramUrl, whatsappUrl, hulkLogoUrl } = useSiteConfig();
  const year = new Date().getFullYear();

  return (
    <footer
      className="mt-auto hidden md:block border-t border-white/[0.05] bg-background/50 backdrop-blur-md w-full py-4 px-6 md:px-12"
      role="contentinfo"
    >
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-[11px] font-bold uppercase tracking-widest">
        
        {/* Left: Branding & Rights */}
        <div className="flex items-center gap-6 text-muted-foreground/60">
           <span className="text-foreground font-black italic">{siteName}</span>
           <span className="opacity-40">&copy; {year} ALL RIGHTS RESERVED.</span>
           <div className="hidden lg:flex items-center gap-4 border-l border-white/[0.05] pl-6">
              <Link href="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-primary transition-colors">Terms</Link>
           </div>
        </div>

        {/* Center: Creator Branding */}
        <div className="flex items-center gap-3 order-3 md:order-2">
           <span className="text-muted-foreground/40 text-[9px] font-black">Powered by</span>
           <div className="flex items-center gap-2 px-3 py-1 bg-muted/40 rounded-lg border border-white/[0.05] hover:border-primary/20 transition-all cursor-default group">
              <span className="group-hover:text-primary transition-colors font-bold">MedOneX Team</span>
              {hulkLogoUrl && (
                <img src={hulkLogoUrl} alt="MedOneX Team" className="w-4 h-4 object-contain brightness-90 grayscale group-hover:grayscale-0 group-hover:brightness-100 transition-all" />
              )}
           </div>
        </div>

        {/* Right: Social & Navigation */}
        <div className="flex items-center gap-6 order-2 md:order-3">
          <div className="flex items-center gap-4 text-muted-foreground/60">
            {facebookUrl && <a href={facebookUrl} target="_blank" rel="noreferrer" className="hover:text-primary transition-all"><Facebook className="w-3.5 h-3.5" /></a>}
            {twitterUrl && <a href={twitterUrl} target="_blank" rel="noreferrer" className="hover:text-primary transition-all"><Twitter className="w-3.5 h-3.5" /></a>}
            {instagramUrl && <a href={instagramUrl} target="_blank" rel="noreferrer" className="hover:text-primary transition-all"><Instagram className="w-3.5 h-3.5" /></a>}
            {youtubeUrl && <a href={youtubeUrl} target="_blank" rel="noreferrer" className="hover:text-primary transition-all"><Youtube className="w-3.5 h-3.5" /></a>}
            {telegramUrl && <a href={telegramUrl} target="_blank" rel="noreferrer" className="hover:text-primary transition-all"><Send className="w-3.5 h-3.5" /></a>}
            {whatsappUrl && <a href={whatsappUrl} target="_blank" rel="noreferrer" className="hover:text-primary transition-all"><Phone className="w-3.5 h-3.5" /></a>}
          </div>
          
          <Link 
            href="/help"
            className="flex items-center gap-2 px-4 py-1.5 bg-primary/10 text-primary rounded-full hover:bg-primary hover:text-white transition-all border border-primary/20 animate-pulse duration-[3s]"
          >
             <ShieldCheck className="w-3 h-3" /> Support
          </Link>
        </div>

      </div>
    </footer>
  );
}
