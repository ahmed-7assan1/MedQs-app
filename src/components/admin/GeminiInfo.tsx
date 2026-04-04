import { Sparkles, ExternalLink } from "lucide-react";

export function GeminiBanner() {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20 px-4 py-3 mb-6">
      <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
          Powered by Google Gemini 2.0 Flash — Free
        </p>
        <p className="mt-0.5 text-xs text-blue-700 dark:text-blue-400">
          1,500 requests/day · 1M tokens/day · No billing required.
          Rate limits: 20 suggestions/hour, 5 PDF extractions/hour per admin.
        </p>
      </div>
      <a
        href="https://aistudio.google.com/app/apikey"
        target="_blank"
        rel="noopener noreferrer"
        className="flex-shrink-0 flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
      >
        Get key <ExternalLink className="h-3 w-3" />
      </a>
    </div>
  );
}
