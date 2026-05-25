import { BookOpen } from "lucide-react";
import { OpenLibrarySearch } from "@/components/library/OpenLibrarySearch";

export default function MedicalBooksPage() {
  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-500 selection:bg-primary/30">
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-0 left-0 w-[50%] h-[50%] bg-primary/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 right-0 w-[40%] h-[40%] bg-accent/5 blur-[100px] rounded-full" />
      </div>

      <div className="relative mx-auto max-w-5xl px-4 py-8 md:py-16 md:px-6">
        <div className="flex items-center gap-4 mb-8 md:mb-12">
          <div className="p-3 rounded-2xl bg-primary/10 text-primary">
            <BookOpen size={28} />
          </div>
          <div>
            <h1 className="text-2xl md:text-4xl font-black tracking-tighter">
              Medical Books
            </h1>
            <p className="mt-1 text-sm text-muted-foreground font-medium">
              Search thousands of free medical textbooks from Open Library
            </p>
          </div>
        </div>

        <OpenLibrarySearch />
      </div>
    </div>
  );
}
