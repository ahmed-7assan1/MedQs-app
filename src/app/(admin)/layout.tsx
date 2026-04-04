import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard, BookOpen, HelpCircle, Layers, Zap,
  MessageSquare, Users, Settings, ChevronRight,
  Megaphone, Video, FileText,
} from "lucide-react";

const adminLinks = [
  { href: "/admin/dashboard",    label: "Overview",     icon: LayoutDashboard },
  { href: "/admin/content",      label: "Structure",    icon: BookOpen },
  { href: "/admin/lectures",     label: "Lectures",     icon: Video },
  { href: "/admin/past-papers",  label: "Past Papers",  icon: FileText },
  { href: "/admin/questions",    label: "Questions",    icon: HelpCircle },
  { href: "/admin/quiz-creator", label: "Quiz Creator",  icon: Layers },
  { href: "/admin/ai-tools",     label: "AI Tools",     icon: Zap },
  { href: "/admin/forum",        label: "Forum",        icon: MessageSquare },
  { href: "/admin/users",        label: "Users",        icon: Users },
  { href: "/admin/ads",          label: "Ads",          icon: Megaphone },
  { href: "/admin/settings",     label: "Settings",     icon: Settings },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (role !== "ADMIN" && role !== "SUPER_ADMIN") redirect("/dashboard");

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-56 flex-shrink-0 border-r border-border bg-card md:flex md:flex-col">
        {/* Logo */}
        <div className="flex h-14 items-center gap-2 border-b border-border px-4">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
            <span className="font-display text-xs font-bold text-primary-foreground">M</span>
          </div>
          <span className="font-display text-base font-bold">MedQs</span>
          <span className="ml-auto rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
            Admin
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Management
          </p>
          {adminLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>

        {/* Back to student view */}
        <div className="border-t border-border p-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 rounded-lg px-2 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronRight className="h-3.5 w-3.5" />
            Student view
          </Link>
        </div>
      </aside>

      <div className="flex-1 overflow-auto">
        <main>{children}</main>
      </div>
    </div>
  );
}
