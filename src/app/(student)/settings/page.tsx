import Link from "next/link";
import { 
  Bell, 
  UserCircle2, 
  GraduationCap, 
  ChevronRight, 
  Send, 
  ShieldCheck, 
  Palette,
  Sparkles,
  Smartphone
} from "lucide-react";
import { StudentPageShell } from "@/components/layout/StudentPageShell";
import { cn } from "@/lib/utils";

const SETTINGS_GROUPS = [
  {
    title: "Personalization",
    items: [
      {
        id: "identity",
        title: "Profile & Identity",
        desc: "Manage your name, handle, avatar, and bio.",
        icon: UserCircle2,
        color: "bg-blue-500",
        href: "/profile/edit?tab=identity",
      },
      {
        id: "branding",
        title: "Avatar & Brand",
        desc: "Customize your visual presence on the platform.",
        icon: Sparkles,
        color: "bg-purple-500",
        href: "/profile/edit?tab=branding",
      },
    ],
  },
  {
    title: "Academic & Access",
    items: [
      {
        id: "academic",
        title: "University Context",
        desc: "Align your semester, faculty, and academic year.",
        icon: GraduationCap,
        color: "bg-emerald-500",
        href: "/profile/edit?tab=academic",
      },
      {
        id: "telegram",
        title: "Telegram Hub",
        desc: "Link your account to @MedOneX_bot for AI tutoring.",
        icon: Send,
        color: "bg-sky-500",
        href: "/profile/edit?tab=telegram",
      },
    ],
  },
  {
    title: "System & Privacy",
    items: [
      {
        id: "privacy",
        title: "Privacy & Visibility",
        desc: "Ghost mode, contact visibility, and profile privacy.",
        icon: ShieldCheck,
        color: "bg-orange-500",
        href: "/profile/edit?tab=privacy",
      },
      {
        id: "notifications",
        title: "Notifications",
        desc: "Forum activity, broadcast alerts, and system pings.",
        icon: Bell,
        color: "bg-rose-500",
        href: "/notifications/settings",
      },
      {
        id: "appearance",
        title: "Display & Theme",
        desc: "Switch between Light, Dark, and System modes.",
        icon: Palette,
        color: "bg-indigo-500",
        href: "/profile/edit?tab=appearance",
      },
    ],
  },
];

export default function SettingsPage() {
  return (
    <StudentPageShell
      maxWidthClass="max-w-4xl"
      eyebrow="Preferences Hub"
      title="Settings Center"
      subtitle="Configure your clinical workspace, sync integrations, and manage your digital privacy with surgical precision."
    >
      <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {SETTINGS_GROUPS.map((group) => (
          <div key={group.title} className="space-y-4">
            <h2 className="px-4 text-[11px] font-black uppercase tracking-[0.3em] dark:text-white/30 text-slate-400">
              {group.title}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {group.items.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className="group relative flex items-center gap-4 rounded-[2rem] border dark:border-white/5 border-slate-200 dark:bg-[#131220]/50 bg-white p-5 transition-all hover:scale-[1.02] hover:shadow-2xl hover:shadow-primary/5 active:scale-[0.98]"
                >
                  <div className={cn(
                    "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg transition-transform group-hover:rotate-6",
                    item.color
                  )}>
                    <item.icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <h3 className="text-sm font-black dark:text-white text-slate-800 truncate">
                      {item.title}
                    </h3>
                    <p className="text-[11px] font-bold dark:text-white/40 text-slate-400 line-clamp-1">
                      {item.desc}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 dark:text-white/20 text-slate-300 transition-transform group-hover:translate-x-1" />
                </Link>
              ))}
            </div>
          </div>
        ))}

        {/* Device Sync Info */}
        <div className="rounded-[2.5rem] border border-dashed dark:border-white/10 border-slate-200 p-8 text-center bg-slate-50/50 dark:bg-transparent">
           <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-white/5 mb-4">
              <Smartphone className="h-6 w-6 dark:text-white/30 text-slate-400" />
           </div>
           <h3 className="text-sm font-black dark:text-white text-slate-800">Cross-Device Sync</h3>
           <p className="mt-1 text-xs font-medium dark:text-white/40 text-slate-400 max-w-sm mx-auto">
             Your preferences are synced across Web, Mobile, and Desktop sessions via your MedOneX Identity.
           </p>
        </div>
      </div>
    </StudentPageShell>
  );
}
