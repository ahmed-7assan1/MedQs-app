"use client";

import Link from "next/link";

const footerGroups = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "/features" },
      { label: "AI Assistant", href: "/ai-chat" },
      { label: "Download", href: "/download" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "AI Assistant", href: "/ai-chat" },
      { label: "Community", href: "/social" },
      { label: "Blog", href: "/blog" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Careers", href: "/careers" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
      { label: "FAQ", href: "/faq" },
    ],
  },
];

export function DashboardFooter() {
  return (
    <div className="pt-24 pb-0">
      <div className="h-px bg-border/10 mb-16" />

      <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">
        <div className="lg:w-[300px] shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-7 w-7 bg-foreground [mask-image:url(/medonex-logo.svg)] [mask-size:contain] [mask-repeat:no-repeat]" />
            <span className="text-sm font-bold">MedOneX</span>
          </div>
          <p className="text-xs text-muted-foreground mt-3 leading-relaxed max-w-xs">
            AI-powered medical education platform. Learn smarter, not harder.
          </p>
        </div>

        <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-8">
          {footerGroups.map((group) => (
            <div key={group.title}>
              <p className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground mb-4">
                {group.title}
              </p>
              <ul className="space-y-2.5">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="h-px bg-border/10 my-8" />

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-[10px] text-muted-foreground">
          &copy; 2026 MedOneX. All rights reserved.
        </p>
        <div className="flex items-center gap-3">
          <Link
            href="/privacy"
            className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
          >
            Privacy
          </Link>
          <span className="text-muted-foreground/50">/</span>
          <Link
            href="/terms"
            className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
          >
            Terms
          </Link>
        </div>
      </div>
    </div>
  );
}
