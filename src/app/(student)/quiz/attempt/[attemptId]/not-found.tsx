import Link from "next/link";
import { FileQuestion } from "lucide-react";

export default function AttemptNotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 text-center">
      <FileQuestion className="mb-4 h-14 w-14 text-muted-foreground opacity-40" />
      <h2 className="font-display text-2xl font-bold">Attempt not found</h2>
      <p className="mt-2 text-muted-foreground">This quiz attempt doesn't exist or you don't have access.</p>
      <Link
        href="/past-papers"
        className="mt-6 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        Back to Past Papers
      </Link>
    </div>
  );
}
