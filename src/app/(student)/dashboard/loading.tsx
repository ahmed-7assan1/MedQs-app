import { DashboardDesktopSkeleton } from "@/components/dashboard/DashboardDesktopSkeleton";
import { DashboardMobileSkeleton } from "@/components/dashboard/DashboardMobileSkeleton";

export default function Loading() {
  return (
    <>
      <div className="hidden md:block">
        <DashboardDesktopSkeleton />
      </div>
      <div className="block md:hidden">
        <DashboardMobileSkeleton />
      </div>
    </>
  );
}
