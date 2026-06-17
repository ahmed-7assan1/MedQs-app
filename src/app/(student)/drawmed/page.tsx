import dynamic from "next/dynamic";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "DrawMed — Medical Drawing Tool",
  description: "Practice medical drawing and anatomy sketching with DrawMed. An interactive tool for medical students to learn anatomy through drawing.",
};

const DrawMedClient = dynamic(
  () => import("@/components/drawmed/DrawMedClient").then((m) => m.DrawMedClient),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-[80dvh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <svg
            className="h-8 w-8 animate-spin text-primary"
            viewBox="0 0 40 40"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="20" cy="20" r="12" />
            <path d="M12 20h16M20 12v16" />
          </svg>
          <p className="text-xs font-medium text-muted-foreground animate-pulse">
            Loading DrawMed…
          </p>
        </div>
      </div>
    ),
  }
);

export default function DrawMedPage() {
  return (
    <div className="h-[calc(100dvh-4rem)] w-full">
      <DrawMedClient />
    </div>
  );
}
