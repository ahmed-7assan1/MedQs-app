import { cn } from "@/lib/utils";

interface StudentPageShellProps {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  maxWidthClass?: string;
}

/** Consistent inner layout for student-facing pages (medical / academic tone). */
export function StudentPageShell({
  eyebrow = "",
  title,
  subtitle,
  children,
  className,
  maxWidthClass = "max-w-6xl",
  noTopPaddingMobile = false,
}: StudentPageShellProps & { noTopPaddingMobile?: boolean }) {
  return (
    <div className={cn(
      "relative mx-auto w-full px-4 py-8 md:px-8 md:py-10",
      noTopPaddingMobile && "pt-0 md:pt-8",
      maxWidthClass, 
      className
    )}>
      {title || eyebrow ? (
        <header className="mb-8 md:mb-10">
          {eyebrow ? (
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">{eyebrow}</p>
          ) : null}
          {title ? (
            <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-foreground md:text-[2.15rem] md:leading-tight">
              {title}
            </h1>
          ) : null}
          {subtitle ? (
            <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">{subtitle}</p>
          ) : null}
          <div
            className="mt-6 h-px w-full max-w-lg bg-gradient-to-r from-primary/45 via-border/80 to-transparent"
            aria-hidden
          />
        </header>
      ) : null}
      {children}
    </div>
  );
}
