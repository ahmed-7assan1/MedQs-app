import { Skeleton } from "@/components/ui/skeleton";

export default function MessagesThreadLoading() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col px-4 py-6" aria-busy="true" aria-label="Loading conversation">
      <div className="mb-4 flex items-center gap-3 border-b border-border pb-4">
        <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-3 py-4">
        <Skeleton className="ml-auto h-11 w-[72%] rounded-2xl rounded-br-md" />
        <Skeleton className="h-12 w-[68%] rounded-2xl rounded-bl-md" />
        <Skeleton className="ml-auto h-10 w-[52%] rounded-2xl rounded-br-md" />
        <Skeleton className="h-9 w-[58%] rounded-2xl rounded-bl-md" />
      </div>
    </div>
  );
}
