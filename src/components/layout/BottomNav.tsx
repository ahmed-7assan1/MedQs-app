"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BookOpen, Video, HelpCircle, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/lib/store";

export function BottomNav() {
  const pathname = usePathname();
  const { toggle } = useSidebarStore();

  const NAV_ITEMS = [
    { href: "/dashboard-app", label: "Home", icon: Home },
    { href: "/modules", label: "Lectures", icon: BookOpen },
    { href: "/videos", label: "Videos", icon: Video },
    { href: "/past-papers", label: "Quizzes", icon: HelpCircle },
  ];

  const isActive = (href: string) =>
    href === "/dashboard-app"
      ? pathname === href || pathname === "/dashboard"
      : pathname?.startsWith(href);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-20 items-center border-t border-white/5 bg-background/80 backdrop-blur-xl md:hidden">
      <div className="flex w-full items-center justify-between px-2">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1 py-1 transition-all duration-200 active:scale-90",
                active ? "text-primary scale-110" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl transition-colors",
                active && "bg-primary/10"
              )}>
                <Icon className={cn("h-6 w-6 transition-all", active ? "stroke-[2.5px]" : "stroke-[2px]")} />
              </div>
              <span className={cn("text-[10px] font-bold tracking-tight", active ? "text-primary opacity-100" : "opacity-60")}>
                {label}
              </span>
            </Link>
          );
        })}

        {/* "More" button triggers the sidebar drawer */}
        <button
          onClick={toggle}
          className="flex flex-1 flex-col items-center justify-center gap-1 py-1 text-muted-foreground transition-all duration-200 hover:text-foreground active:scale-95"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl">
             <Menu className="h-6 w-6 stroke-[2px]" />
          </div>
          <span className="text-[10px] font-bold tracking-tight opacity-60">More</span>
        </button>
      </div>
    </nav>
  );
}
