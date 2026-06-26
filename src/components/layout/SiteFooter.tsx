"use client";
import Link from "next/link";
import { useSiteConfig } from "@/contexts/SiteConfigContext";
import { Facebook, Twitter, Youtube, Instagram, Send, Phone, ShieldCheck, Linkedin } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Legal + trust links on every student-facing page (inside main shell).
 * Redesigned for a professional, immersive, single-row experience.
 */
export function SiteFooter() {
  const { siteName = "MedOneX", logoUrl, facebookUrl, twitterUrl, youtubeUrl, instagramUrl, telegramUrl, whatsappUrl, linkedinUrl, tiktokUrl, hulkLogoUrl } = useSiteConfig();
  const year = new Date().getFullYear();

  return (
    <footer
      className="mt-auto hidden md:block border-t border-white/[0.05] bg-background/50 backdrop-blur-md w-full py-4 px-6 md:px-12"
      role="contentinfo"
    >
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-[11px] font-bold uppercase tracking-widest">
        
        {/* Left: Branding & Rights + Legal + Team */}
        <div className="flex items-center gap-8 text-muted-foreground/60">
            <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
              <Link href="/dashboard-app" className="flex items-center gap-3">
                {logoUrl && <img src={logoUrl} alt={siteName} className="h-6 w-6 object-contain" />}
                <span className="text-foreground font-black italic tracking-tighter text-sm">{siteName}</span>
              </Link>
              <span className="opacity-40 text-[9px] hidden lg:inline">&copy; {year} ALL RIGHTS RESERVED.</span>
            </div>

            <div className="flex items-center gap-6 border-l border-white/[0.1] pl-8">
               <div className="flex items-center gap-4">
                  <Link href="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
                  <Link href="/terms" className="hover:text-primary transition-colors">Terms</Link>
               </div>
               
               <div className="flex items-center gap-3 border-l border-white/[0.1] pl-6 group cursor-default">
                  <span className="text-muted-foreground/30 text-[9px]">Powered by</span>
                  <div className="flex items-center gap-2">
                     <Link href="/founders" className="group-hover:text-primary transition-colors">MedOneX Team</Link>
                     {hulkLogoUrl && (
                       <img src={hulkLogoUrl} alt="MedOneX Team" className="w-4 h-4 object-contain brightness-90 grayscale group-hover:grayscale-0 group-hover:brightness-100 transition-all" />
                     )}
                  </div>
               </div>
            </div>
        </div>

        {/* Right: Social & Navigation */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4 text-muted-foreground/40">
            {facebookUrl && <a href={facebookUrl} target="_blank" rel="noreferrer" className="hover:text-primary transition-all"><Facebook className="w-3.5 h-3.5" /></a>}
            {twitterUrl && <a href={twitterUrl} target="_blank" rel="noreferrer" className="hover:text-primary transition-all"><Twitter className="w-3.5 h-3.5" /></a>}
            {instagramUrl && <a href={instagramUrl} target="_blank" rel="noreferrer" className="hover:text-primary transition-all"><Instagram className="w-3.5 h-3.5" /></a>}
            {youtubeUrl && <a href={youtubeUrl} target="_blank" rel="noreferrer" className="hover:text-primary transition-all"><Youtube className="w-3.5 h-3.5" /></a>}
            {telegramUrl && <a href={telegramUrl} target="_blank" rel="noreferrer" className="hover:text-primary transition-all"><Send className="w-3.5 h-3.5" /></a>}
            {whatsappUrl && <a href={whatsappUrl} target="_blank" rel="noreferrer" className="hover:text-primary transition-all"><Phone className="w-3.5 h-3.5" /></a>}
            {linkedinUrl && <a href={linkedinUrl} target="_blank" rel="noreferrer" className="hover:text-primary transition-all"><Linkedin className="w-3.5 h-3.5" /></a>}
            {tiktokUrl && <a href={tiktokUrl} target="_blank" rel="noreferrer" aria-label="TikTok" className="hover:text-primary transition-all"><svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" /></svg></a>}
          </div>
          
          <Link 
            href="/help"
            className="flex items-center gap-2 px-5 py-2 bg-primary/10 text-primary rounded-xl hover:bg-primary hover:text-white transition-all border border-primary/20"
          >
             <ShieldCheck className="w-3.5 h-3.5" /> Support
          </Link>
        </div>

      </div>
    </footer>
  );
}
