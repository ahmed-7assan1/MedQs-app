import { StudentShellHeaderSkeleton, ModuleListSkeleton } from "@/components/ui/skeleton";

export default function ModulesLoading() {
  return (
    <div className="relative mx-auto w-full max-w-7xl px-4 py-8 md:px-8 md:py-10">
      <StudentShellHeaderSkeleton />
      <ModuleListSkeleton count={5} />
    </div>
  );
}
