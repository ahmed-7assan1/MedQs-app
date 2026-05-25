import { OpenLibraryReader } from "@/components/library/OpenLibraryReader";
import type { Metadata } from "next";

interface Props {
  params: { id: string };
  searchParams: { ia?: string; title?: string };
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const title = searchParams.title || "Book Reader";
  return {
    title: `${title} | Medical Books`,
    description: `Reading ${title} online`,
    robots: { index: false, follow: false },
  };
}

export default function ReaderPage({ params, searchParams }: Props) {
  const bookKey = "/works/" + params.id.replace(/^works_/, "").replace(/_/g, "/");
  const iaId = searchParams.ia || "";
  const title = searchParams.title || "Book Reader";

  if (!iaId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="text-center max-w-md px-4">
          <p className="text-lg font-bold mb-2">Book not available for reading</p>
          <p className="text-sm text-muted-foreground mb-6">
            This book does not have a digitized version available.
          </p>
          <a
            href={`https://openlibrary.org${bookKey}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 h-10 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90"
          >
            View on Open Library
          </a>
        </div>
      </div>
    );
  }

  return <OpenLibraryReader iaId={iaId} bookKey={bookKey} title={title} />;
}
