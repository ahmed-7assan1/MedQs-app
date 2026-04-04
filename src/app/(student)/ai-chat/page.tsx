import { AIAssistantPanel } from "@/components/ai/AIAssistant";

export default function AIChatPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:px-6">
      <div className="mb-5">
        <h1 className="font-display text-3xl font-bold">Study with Dr. Q</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Ask medical questions, upload your doubts, and get instant step-by-step explanations.
        </p>
      </div>
      <AIAssistantPanel embedded />
    </div>
  );
}
