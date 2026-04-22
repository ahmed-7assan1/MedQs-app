import Link from "next/link";
import { Bell, UserCircle2, GraduationCap, ChevronRight } from "lucide-react";
import { StudentPageShell } from "@/components/layout/StudentPageShell";

export default function SettingsPage() {
  return (
    <StudentPageShell
      maxWidthClass="max-w-3xl"
      eyebrow="Preferences"
      title="Settings"
      subtitle="Configure how you study, how you appear to peers, and how MedQs notifies you."
    >
      <div className="grid gap-3">
        <Link
          href="/profile/edit"
          className="group flex items-center justify-between rounded-2xl border border-white/[0.03] bg-card/80 px-5 py-4 shadow-sm ring-1 ring-black/5 transition-all hover:border-primary/25 hover:bg-card hover:shadow-md dark:ring-white/5"
        >
          <div className="flex items-center gap-3">
            <UserCircle2 className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-semibold">Profile & Account</p>
              <p className="text-xs text-muted-foreground">
                Name, username, photo, bio, and social links
              </p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground opacity-60 transition-transform group-hover:translate-x-0.5" />
        </Link>

        <Link
          href="/profile/edit#academic"
          className="group flex items-center justify-between rounded-2xl border border-white/[0.03] bg-card/80 px-5 py-4 shadow-sm ring-1 ring-black/5 transition-all hover:border-primary/25 hover:bg-card hover:shadow-md dark:ring-white/5"
        >
          <div className="flex items-center gap-3">
            <GraduationCap className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-semibold">University & semester</p>
              <p className="text-xs text-muted-foreground">
                Align lectures, papers, and forums with your academic year
              </p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground opacity-60 transition-transform group-hover:translate-x-0.5" />
        </Link>

        <Link
          href="/notifications/settings"
          className="group flex items-center justify-between rounded-2xl border border-white/[0.03] bg-card/80 px-5 py-4 shadow-sm ring-1 ring-black/5 transition-all hover:border-primary/25 hover:bg-card hover:shadow-md dark:ring-white/5"
        >
          <div className="flex items-center gap-3">
            <Bell className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-semibold">Notifications</p>
              <p className="text-xs text-muted-foreground">
                Forum, system, and broadcast preferences
              </p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground opacity-60 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </StudentPageShell>
  );
}
