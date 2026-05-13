import { Loader2, ShieldCheck, Activity } from "lucide-react";

export default function AdminLoading() {
  return (
    <div className="flex h-[80vh] w-full flex-col items-center justify-center space-y-6">
      {/* Dynamic Pulse Ring */}
      <div className="relative flex items-center justify-center">
        {/* Outer subtle glow */}
        <div className="absolute h-32 w-32 animate-pulse rounded-full bg-blue-500/10 blur-xl"></div>
        
        {/* Rotating dash ring */}
        <div className="absolute h-24 w-24 animate-[spin_3s_linear_infinite] rounded-full border border-dashed border-blue-500/30"></div>
        
        {/* Inner solid ring */}
        <div className="absolute h-16 w-16 animate-[spin_2s_linear_infinite_reverse] rounded-full border-2 border-t-blue-500 border-r-transparent border-b-indigo-500 border-l-transparent"></div>
        
        {/* Center Icon */}
        <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-background border border-white/[0.05] shadow-lg shadow-blue-500/10">
          <ShieldCheck className="h-5 w-5 text-blue-500 animate-pulse" />
        </div>
      </div>

      <div className="text-center space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <h3 className="font-display text-lg font-bold tracking-tight">Authenticating Context</h3>
        <div className="flex items-center justify-center gap-2">
          <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/80">
            Establishing Secure Connection
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 opacity-50">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-500" style={{ animationDelay: "0ms" }} />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-500" style={{ animationDelay: "150ms" }} />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-500" style={{ animationDelay: "300ms" }} />
      </div>
    </div>
  );
}
