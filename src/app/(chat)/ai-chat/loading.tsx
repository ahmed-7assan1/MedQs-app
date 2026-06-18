"use client";
import { MedOneXLogoMark } from "@/components/branding/MedQsLogo";

export default function AIChatLoading() {
  return (
    <div className="flex-1 flex flex-col w-full overflow-hidden">
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-fade-in">
          <MedOneXLogoMark className="h-16 w-16" />
        </div>
      </div>
    </div>
  );
}
