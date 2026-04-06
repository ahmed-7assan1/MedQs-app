import { Skeleton } from "@/components/ui/skeleton";

export default function AiChatLoading() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-4xl flex-col px-4 py-8 md:px-6">
      <Skeleton className="mb-3 h-9 w-64" />
      <Skeleton className="mb-8 h-4 w-full max-w-xl" />
      <div className="flex min-h-[480px] flex-1 flex-col rounded-2xl border border-border bg-card p-4">
        <div className="mb-4 flex gap-2 border-b border-border pb-3">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <Skeleton className="h-10 flex-1 rounded-lg" />
          <Skeleton className="h-10 w-24 rounded-lg" />
        </div>
        <div className="flex flex-1 flex-col justify-end gap-3">
          <Skeleton className="ml-auto h-16 w-[70%] rounded-2xl" />
          <Skeleton className="h-20 w-[85%] rounded-2xl" />
        </div>
        <div className="mt-4 flex gap-2 border-t border-border pt-3">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <Skeleton className="h-10 flex-1 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
