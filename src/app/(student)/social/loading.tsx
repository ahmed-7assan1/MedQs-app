export default function Loading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-slate-100/50 dark:bg-grid-white/[0.02] bg-[length:32px_32px]" />
      
      <div className="relative z-10 flex flex-col items-center gap-6">
        <div className="relative">
          <div className="h-20 w-20 rounded-full border-4 border-slate-200/50 dark:border-white/5 flex items-center justify-center backdrop-blur-md">
            <div className="h-12 w-12 rounded-full border-t-4 border-primary animate-spin" />
          </div>
          <div className="absolute inset-0 bg-primary/20 blur-[30px] rounded-full animate-pulse" />
        </div>
        
        <div className="text-center space-y-2">
          <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-widest uppercase">Connecting</h2>
          <p className="text-xs font-bold text-slate-500 dark:text-white/40 tracking-widest uppercase animate-pulse">Syncing Social Ecosystem...</p>
        </div>
      </div>
    </div>
  );
}
