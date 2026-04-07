import Link from "next/link";

/**
 * Legal + trust links on every student-facing page (inside main shell).
 */
export function SiteFooter({ siteName = "MedQs" }: { siteName?: string }) {
  const year = new Date().getFullYear();
  return (
    <footer
      className="mt-auto hidden border-t border-border/80 bg-muted/20 px-4 py-8 md:block md:px-8"
      role="contentinfo"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-foreground">{siteName}</p>
          <p className="mt-1 max-w-md text-xs leading-relaxed text-muted-foreground">
            Medical education platform for students and doctors. AI answers are for study only — not a substitute for
            your course doctors or clinical supervision.
          </p>
        </div>
        <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm" aria-label="Legal">
          <Link href="/privacy" className="text-muted-foreground transition-colors hover:text-primary">
            Privacy
          </Link>
          <Link href="/terms" className="text-muted-foreground transition-colors hover:text-primary">
            Terms
          </Link>
          <Link href="/dashboard-app" className="text-muted-foreground transition-colors hover:text-primary">
            Dashboard
          </Link>
          <Link href="/study-tools" className="text-muted-foreground transition-colors hover:text-primary">
            Study tools
          </Link>
        </nav>
      </div>
      <p className="mx-auto mt-6 max-w-6xl text-center text-[11px] text-muted-foreground/80 sm:text-left">
        © {year} {siteName}. All rights reserved.
      </p>
    </footer>
  );
}
