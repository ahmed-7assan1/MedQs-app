import { Sparkle } from "@phosphor-icons/react/dist/ssr";

export default function AILoading() {
  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#121212] relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-emerald-500/5" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-emerald-500/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: "1s" }} />

      <div className="relative flex flex-col items-center gap-6">
        <div className="relative">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-indigo-500 to-emerald-500 flex items-center justify-center shadow-2xl shadow-indigo-500/25">
            <Sparkle size={32} weight="fill" className="text-white" />
          </div>
          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 animate-ping" />
        </div>

        <div className="flex flex-col items-center gap-2">
          <h1 className="text-xl font-bold text-white/90">MedOneX Expert</h1>
          <p className="text-sm text-gray-500 font-medium">Loading your AI assistant...</p>
        </div>

        <div className="flex items-center gap-2 mt-4">
          <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: "0s" }} />
          <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "0.2s" }} />
          <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: "0.4s" }} />
        </div>
      </div>
    </div>
  );
}
