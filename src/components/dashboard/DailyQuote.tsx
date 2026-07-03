import { Quote } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { getDailyQuote } from "@/components/dashboard/shared/quotes";

export const DailyQuote = () => {
  const quote = getDailyQuote();

  return (
    <Card>
      <CardContent className="p-4">
      <div className="flex items-start gap-3">
        <Quote size={16} className="text-primary shrink-0 mt-0.5" />
        <p className="text-xs leading-relaxed text-foreground/70 italic">&ldquo;{quote.text}&rdquo;</p>
      </div>
      <p className="mt-2 text-[10px] font-bold text-foreground/40 text-right tracking-wider">&mdash; {quote.author}</p>
      </CardContent>
    </Card>
  );
};