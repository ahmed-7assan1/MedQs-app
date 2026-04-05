import { AIAssistantPanel } from "@/components/ai/AIAssistant";

export default function AIChatPage() {
  return (
    <div className="flex min-h-[calc(100dvh-3.5rem-1rem)] flex-col px-4 pb-6 pt-2 md:px-6">
      <div className="mb-3 shrink-0 md:mb-4">
        <h1 className="font-display text-2xl font-bold md:text-3xl">Study with Dr. Q</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Ask medical questions, attach slides or notes, and browse past topics — stored on this device only.
        </p>
      </div>
      <div className="flex min-h-[520px] flex-1 flex-col md:min-h-[640px]">
        <AIAssistantPanel embedded fullPage />
      </div>
    </div>
  );
}
