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
  maxWidthClass = "max-w-7xl",
  noTopPaddingMobile = false,
}: StudentPageShellProps & { noTopPaddingMobile?: boolean }) {
  return (
    <div className={cn(
      "relative mx-auto w-full px-4 sm:px-6 lg:px-8 pb-8 pt-20 md:pt-32", // Increased from pt-6 to pt-20 for mobile
      noTopPaddingMobile && "pt-20 md:pt-32",
      maxWidthClass, 
      className
    )}>
      {title || eyebrow ? (
        <header className="mb-8 md:mb-12">
          {eyebrow ? (
            <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] text-primary mb-2">{eyebrow}</p>
          ) : null}
          {title ? (
            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-foreground leading-tight">
              {title}
            </h1>
          ) : null}
          {subtitle ? (
            <p className="mt-4 max-w-3xl text-sm sm:text-base leading-relaxed text-muted-foreground/80">{subtitle}</p>
          ) : null}
          <div
            className="mt-8 h-1 w-20 rounded-full bg-primary/20"
            aria-hidden
          />
        </header>
      ) : null}
      <div className="w-full">
        {children}
      </div>
    </div>
  );
}
