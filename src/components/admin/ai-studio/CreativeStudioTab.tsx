"use client";
import { useState, useEffect, useCallback } from "react";
import {
  Image as ImageIcon, Type, Loader2, Download, RefreshCw,
  Sparkles, Wand2, Sliders, Lock, Settings, X, Plus, Trash2, ExternalLink,
  Layers, LayoutGrid, Square, Monitor, Smartphone, Maximize,
  Volume2, Eye, Upload, Play, EyeOff
} from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { MedqsSelect } from "@/components/ui/MedqsSelect";

type Tab = "image" | "text" | "vision";

interface GeneratedImage {
  url: string;
  prompt: string;
  model: string;
  seed: number;
  w: number;
  h: number;
}

const ART_STYLES = [
  { id: "none", name: "No Style", prompt: "" },
  { id: "cinematic", name: "Cinematic", prompt: "cinematic lighting, highly detailed, professional photography, 8k, masterpiece" },
  { id: "anime", name: "Anime/Manga", prompt: "anime style, vibrant colors, expressive lines, high quality digital art" },
  { id: "cyberpunk", name: "Cyberpunk", prompt: "cyberpunk aesthetic, neon lights, futuristic, rainy city, glowing accents" },
  { id: "3d-render", name: "3D Render", prompt: "octane render, unreal engine 5, 3d model, highly detailed, realistic textures" },
  { id: "sketch", name: "Hand Drawn/Sketch", prompt: "pencil sketch, hand drawn, artistic, rough lines, charcoal style" },
  { id: "pixel-art", name: "Pixel Art", prompt: "pixel art, 8-bit style, retro gaming, clean pixels" },
  { id: "oil-painting", name: "Oil Painting", prompt: "oil painting style, thick brush strokes, canvas texture, classical art" },
];

export function CreativeStudioTab() {
  const [activeTab, setActiveTab] = useState<Tab>("image");
  const [loading, setLoading] = useState(true);
  const [studioEnabled, setStudioEnabled] = useState(false);

  // Image Gen State
  const [imgPrompt, setImgPrompt] = useState("");
  const [imgModel, setImgModel] = useState("flux");
  const [selectedStyle, setSelectedStyle] = useState("none");
  const [batchCount, setBatchCount] = useState(1);
  const [resolution, setResolution] = useState({ w: 1024, h: 1024, name: "Square 1:1" });
  const [seed, setSeed] = useState(-1);
  const [noLogo, setNoLogo] = useState(true);
  const [motionMode, setMotionMode] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [currentImgs, setCurrentImgs] = useState<GeneratedImage[]>([]);
  const [gallery, setGallery] = useState<GeneratedImage[]>([]);

  // Text Gen State
  const [textPrompt, setTextPrompt] = useState("");
  const [textModel, setTextModel] = useState("openai");
  const [systemPrompt, setSystemPrompt] = useState("You are a helpful assistant.");
  const [textSeed, setTextSeed] = useState(-1);
  const [textResult, setTextResult] = useState("");
  const [textLoading, setTextLoading] = useState(false);

  // Vision State
  const [visionImgUrl, setVisionImgUrl] = useState("");
  const [visionLoading, setVisionLoading] = useState(false);
  const [visionResult, setVisionResult] = useState("");

  const handleSpeak = (text: string) => {
    if (!text) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    // Prefer professional voices
    const arabicVoice = voices.find(v => v.lang.includes("ar"));
    const englishVoice = voices.find(v => v.lang.includes("en-US") || v.lang.includes("en-GB"));
    
    // Auto detect language (simple check)
    const isArabic = /[\u0600-\u06FF]/.test(text);
    if (isArabic && arabicVoice) utterance.voice = arabicVoice;
    else if (englishVoice) utterance.voice = englishVoice;
    
    utterance.pitch = 1;
    utterance.rate = 1;
    window.speechSynthesis.speak(utterance);
    toast.success("Speaking...");
  };

  async function handleVisionAnalyze() {
    if (!visionImgUrl.trim()) return toast.error("Paste an image URL first");
    setVisionLoading(true);
    setVisionResult("");
    try {
      const url = new URL("/api/v1/admin/creative-studio/proxy", window.location.origin);
      url.searchParams.set("type", "text");
      url.searchParams.set("prompt", `Analyze this image URL and describe it in detail, or write a creative story about it: ${visionImgUrl}`);
      url.searchParams.set("model", "openai");
      url.searchParams.set("system", "You are an expert image analyst and creative writer.");

      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Vision analysis failed");
      const text = await res.text();
      setVisionResult(text);
      toast.success("Analysis complete!");
    } catch (err) {
      toast.error("Failed to analyze image");
    } finally { setVisionLoading(false); }
  }

  useEffect(() => {
    async function init() {
      try {
        const ctrl = new AbortController();
        const timeout = setTimeout(() => ctrl.abort(), 4000);
        const res = await fetch("/api/v1/auth/me", { signal: ctrl.signal });
        clearTimeout(timeout);
        if (res.ok) {
           const me = await res.json();
           setStudioEnabled(me?.role === "SUPER_ADMIN" || true); // Allow for now but check role
        } else setStudioEnabled(true);
      } catch (err) {
        setStudioEnabled(true);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const randomSeed = () => Math.floor(Math.random() * 1000000000);

  const buildImageUrl = useCallback((prompt: string, model: string, w: number, h: number, s: number, styleId: string): string => {
    const actualSeed = s < 0 ? randomSeed() : s;
    let finalPrompt = prompt.trim();
    
    // Extreme Realism & Precision Injection
    finalPrompt = `${finalPrompt}, ultra-realistic, highly detailed, photorealistic, octane render, unreal engine 5, ray tracing, 8k uhd, cinematic lighting, sharp edges, professional medical photography, anatomically perfect, masterpiece, highly intricate details, no noise, high contrast`;
    
    const styleObj = ART_STYLES.find(s => s.id === styleId);
    if (styleObj && styleObj.prompt) {
      finalPrompt = `${finalPrompt}, ${styleObj.prompt}`;
    }

    if (motionMode) {
      finalPrompt = `${finalPrompt}, slow motion, cinematic zoom, parallax effect, high quality gif aesthetic`;
    }
    
    const url = new URL("/api/v1/admin/creative-studio/proxy", window.location.origin);
    url.searchParams.set("prompt", finalPrompt);
    url.searchParams.set("model", model || "flux");
    url.searchParams.set("seed", actualSeed.toString());
    url.searchParams.set("width", w.toString());
    url.searchParams.set("height", h.toString());
    url.searchParams.set("nologo", noLogo ? "true" : "false");
    
    return url.toString();
  }, [noLogo, motionMode]);

  async function handleEnhancePrompt() {
    if (!imgPrompt.trim()) return toast.error("Enter a basic prompt first");
    setEnhancing(true);
    try {
      const url = new URL("/api/v1/admin/creative-studio/proxy", window.location.origin);
      url.searchParams.set("type", "text");
      url.searchParams.set("prompt", `Enhance this image generation prompt to be more descriptive and professional for an AI artist. Add lighting, mood, and quality details. Prompt: "${imgPrompt}". Return ONLY the enhanced prompt string.`);
      url.searchParams.set("model", "openai");
      url.searchParams.set("system", "You are an expert prompt engineer.");

      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Enhancement failed");
      const enhanced = await res.text();
      setImgPrompt(enhanced.replace(/^"|"$/g, "").trim());
      toast.success("Prompt enhanced! ✨");
    } catch (err) {
      toast.error("Failed to enhance prompt");
    } finally {
      setEnhancing(false);
    }
  }

  async function handleGenerateImage() {
    if (!imgPrompt.trim()) return toast.error("Enter a prompt first");
    setGenerating(true);
    setCurrentImgs([]);
    
    const newImgs: GeneratedImage[] = [];
    const count = batchCount;
    
    try {
      for (let i = 0; i < count; i++) {
        const actualSeed = i === 0 && seed > -1 ? seed : randomSeed();
        const url = buildImageUrl(imgPrompt, imgModel, resolution.w, resolution.h, actualSeed, selectedStyle);
        
        const gen: GeneratedImage = {
          url,
          prompt: imgPrompt,
          model: imgModel,
          seed: actualSeed,
          w: resolution.w,
          h: resolution.h
        };
        newImgs.push(gen);
        setCurrentImgs(prev => [...prev, gen]);
        setGallery(prev => [gen, ...prev].slice(0, 50));
      }
      toast.success(count > 1 ? `Generated ${count} images!` : "Image generated!");
    } catch (err) {
      toast.error("One or more images failed.");
    } finally {
      setGenerating(false);
    }
  }

  async function handleGenerateText() {
    if (!textPrompt.trim()) return toast.error("Enter a prompt first");
    setTextLoading(true);
    setTextResult("");
    try {
      const actualSeed = textSeed < 0 ? randomSeed() : textSeed;
      const url = new URL("/api/v1/admin/creative-studio/proxy", window.location.origin);
      url.searchParams.set("type", "text");
      url.searchParams.set("prompt", textPrompt.trim());
      url.searchParams.set("model", textModel);
      url.searchParams.set("system", systemPrompt);
      url.searchParams.set("seed", actualSeed.toString());

      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Text gen failed");
      const text = await res.text();
      setTextResult(text);
      toast.success("Text generated!");
    } catch (err) {
      toast.error("Network error — check your internet connection");
    } finally { setTextLoading(false); }
  }

  function downloadImage(img: GeneratedImage) {
    const a = document.createElement("a");
    a.href = img.url;
    a.download = `medqs_ai_${img.seed}.jpg`;
    a.target = "_blank";
    a.click();
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#050505]">
        <Loader2 className="h-12 w-12 animate-spin text-violet-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 md:p-8 selection:bg-violet-500/30">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/40">Creative Studio</h1>
            <p className="text-muted-foreground text-sm flex items-center gap-2">
              Professional AI tools powered by <span className="text-violet-400 font-bold">MedQs Intelligence</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
             <div className="px-4 py-2 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-2">
               <Sparkles className="h-4 w-4 text-amber-400" />
               <span className="text-xs font-bold text-white/80 tracking-widest uppercase">Premium Access</span>
             </div>
          </div>
        </header>

        {/* Tab Switcher */}
        <div className="flex p-1 rounded-2xl bg-white/5 border border-white/5 w-fit">
          <button
            onClick={() => setActiveTab("image")}
            className={cn(
              "flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all font-bold text-sm",
              activeTab === "image" ? "bg-gradient-to-r from-violet-600 to-pink-600 text-white shadow-lg" : "text-muted-foreground hover:text-white"
            )}
          >
            <ImageIcon className="h-4 w-4" />
            Image Generation
          </button>
          <button
            onClick={() => setActiveTab("text")}
            className={cn(
              "flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all font-bold text-sm",
              activeTab === "text" ? "bg-gradient-to-r from-violet-600 to-pink-600 text-white shadow-lg" : "text-muted-foreground hover:text-white"
            )}
          >
            <Type className="h-4 w-4" />
            Text Intelligence
          </button>
          <button
            onClick={() => setActiveTab("vision")}
            className={cn(
              "flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all font-bold text-sm",
              activeTab === "vision" ? "bg-gradient-to-r from-violet-600 to-pink-600 text-white shadow-lg" : "text-muted-foreground hover:text-white"
            )}
          >
            <Eye className="h-4 w-4" />
            Vision Analysis
          </button>
        </div>

        {activeTab === "image" ? (
          <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-8">
            
            {/* Controls */}
            <div className="space-y-6">
              <div className="p-6 rounded-[32px] border border-white/5 bg-white/5 backdrop-blur-3xl space-y-6 sticky top-8">
                <div className="flex items-center justify-between pb-2">
                  <div className="flex items-center gap-2">
                    <Sliders className="h-4 w-4 text-violet-500" />
                    <h2 className="text-xs font-black uppercase tracking-widest text-white/60">Generator</h2>
                  </div>
                </div>

                {/* Prompt */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Visual Prompt</label>
                    <button 
                      onClick={handleEnhancePrompt}
                      disabled={enhancing || !imgPrompt.trim()}
                      className="text-[10px] font-bold uppercase tracking-widest text-violet-400 hover:text-violet-300 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {enhancing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                      Enhance
                    </button>
                  </div>
                  <textarea
                    value={imgPrompt}
                    onChange={(e) => setImgPrompt(e.target.value)}
                    placeholder="E.g. A futuristic medical lab, glowing equipment, ultra realistic..."
                    className="w-full h-32 p-4 rounded-2xl bg-black/40 border border-white/5 focus:border-violet-500/50 outline-none resize-none text-sm transition-all placeholder:text-white/20"
                  />
                </div>

                {/* Style & Batch */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Style</label>
                    <MedqsSelect
                      value={selectedStyle}
                      onChange={(e) => setSelectedStyle(e.target.value)}
                      className="w-full h-11 rounded-xl"
                    >
                      {ART_STYLES.map(s => <option key={s.id} value={s.id} className="bg-[#111]">{s.name}</option>)}
                    </MedqsSelect>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Batch</label>
                    <MedqsSelect
                      value={batchCount.toString()}
                      onChange={(e) => setBatchCount(Number(e.target.value))}
                      className="w-full h-11 rounded-xl"
                    >
                      <option value="1" className="bg-[#111]">1 Image</option>
                      <option value="2" className="bg-[#111]">2 Images</option>
                      <option value="4" className="bg-[#111]">4 Images (Batch)</option>
                    </MedqsSelect>
                  </div>
                </div>

                {/* Model */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">AI Model</label>
                  <MedqsSelect
                    value={imgModel}
                    onChange={(e) => setImgModel(e.target.value)}
                    className="w-full h-11 rounded-xl"
                  >
                    <option value="flux" className="bg-[#111]">Flux.1 Pro (Masterpiece)</option>
                    <option value="flux-realism" className="bg-[#111]">Flux Realism (Hyper-Real)</option>
                    <option value="flux-anime" className="bg-[#111]">Flux Anime (Stylized)</option>
                    <option value="flux-3d" className="bg-[#111]">Flux 3D (CGI Look)</option>
                    <option value="any-dark" className="bg-[#111]">Any Dark (Mysterious)</option>
                    <option value="turbo" className="bg-[#111]">Turbo (Instant Speed)</option>
                    <option value="sana" className="bg-[#111]">Sana (Artistic Focus)</option>
                  </MedqsSelect>
                </div>

                {/* Aspect Ratio */}
                <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Aspect Ratio</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { w: 1024, h: 1024, name: "1:1", icon: Square },
                      { w: 768, h: 1024, name: "3:4", icon: Smartphone },
                      { w: 1024, h: 768, name: "4:3", icon: Monitor },
                      { w: 1280, h: 720, name: "16:9", icon: Maximize }
                    ].map((res) => (
                      <button
                        key={res.name}
                        onClick={() => setResolution({ w: res.w, h: res.h, name: res.name })}
                        className={cn(
                          "flex flex-col items-center justify-center gap-1.5 py-2.5 rounded-xl border transition-all",
                          resolution.name === res.name ? "bg-violet-600 border-violet-500 text-white" : "bg-white/5 border-white/5 text-muted-foreground hover:bg-white/10"
                        )}
                      >
                        <res.icon className="h-3.5 w-3.5" />
                        <span className="text-[10px] font-bold">{res.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => setNoLogo(!noLogo)} 
                      className={cn(
                        "h-10 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all",
                        noLogo ? "bg-violet-500/20 border-violet-500/50 text-violet-400" : "bg-white/5 border-white/5 text-muted-foreground"
                      )}
                    >
                      No Logo
                    </button>
                    <button 
                      onClick={() => setMotionMode(!motionMode)} 
                      className={cn(
                        "h-10 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all flex items-center justify-center gap-2",
                        motionMode ? "bg-amber-500/20 border-amber-500/50 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]" : "bg-white/5 border-white/5 text-muted-foreground"
                      )}
                    >
                      <Play className={cn("h-3 w-3", motionMode && "animate-pulse")} />
                      Magic Motion (GIF)
                    </button>
                  </div>

                <button
                  onClick={handleGenerateImage}
                  disabled={generating || !imgPrompt.trim()}
                  className="w-full h-14 rounded-2xl bg-gradient-to-r from-violet-600 via-pink-600 to-violet-600 bg-[length:200%_auto] hover:bg-right transition-all duration-500 text-sm font-black text-white shadow-xl shadow-violet-500/20 disabled:opacity-50 flex items-center justify-center gap-3"
                >
                  {generating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Wand2 className="h-5 w-5" />}
                  {generating ? "PROCESSING..." : "GENERATE MASTERPIECE"}
                </button>
              </div>
            </div>

            {/* Main Area */}
            <div className="space-y-8">
              {/* Active Preview */}
              <div className="relative group min-h-[500px]">
                <div className="absolute -inset-2 bg-gradient-to-r from-violet-600 to-pink-600 rounded-[40px] blur-2xl opacity-10 group-hover:opacity-20 transition duration-1000"></div>
                <div className="relative h-full min-h-[500px] rounded-[36px] border border-white/10 bg-black/40 backdrop-blur-xl flex items-center justify-center p-6">
                  {currentImgs.length > 0 ? (
                    <div className={cn(
                      "grid gap-4 w-full",
                      currentImgs.length === 1 ? "grid-cols-1" : currentImgs.length === 2 ? "grid-cols-2" : "grid-cols-2"
                    )}>
                      {currentImgs.map((img, i) => (
                        <div key={i} className="relative group/img rounded-2xl overflow-hidden border border-white/10 bg-white/5 aspect-square">
                          <img
                            src={img.url}
                            alt=""
                            className={cn(
                              "w-full h-full object-cover transition-transform ease-in-out brightness-[1.05] contrast-[1.05]",
                              motionMode && "scale-150 translate-x-4 -translate-y-4"
                            )}
                            style={{ transitionDuration: "20000ms", filter: 'contrast(1.1) brightness(1.05) saturate(1.1) sharp(1px)' }}
                          />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-3">
                            <button onClick={() => downloadImage(img)} className="p-3 rounded-full bg-card text-foreground hover:scale-110 transition-transform shadow-xl">
                              <Download className="h-5 w-5" />
                            </button>
                            <button onClick={() => window.open(img.url, "_blank")} className="p-3 rounded-full bg-violet-600 text-white hover:scale-110 transition-transform shadow-xl">
                              <ExternalLink className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : generating ? (
                    <div className={cn(
                      "grid gap-6 w-full",
                      batchCount === 1 ? "grid-cols-1 max-w-2xl" : batchCount === 2 ? "grid-cols-2" : "grid-cols-2"
                    )}>
                      {Array.from({ length: batchCount }).map((_, i) => (
                        <div key={i} className="relative aspect-square rounded-[32px] overflow-hidden border border-white/5 bg-white/5 backdrop-blur-md flex flex-col items-center justify-center gap-4 group">
                          <div className="absolute inset-0 bg-gradient-to-br from-violet-600/10 via-transparent to-pink-600/10 animate-pulse" />
                          <div className="relative">
                            <div className="h-16 w-16 rounded-full border-t-2 border-r-2 border-violet-500 animate-spin" />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <ImageIcon className="h-6 w-6 text-violet-400 animate-pulse" />
                            </div>
                          </div>
                          <div className="space-y-1 text-center relative">
                            <p className="text-[10px] font-black tracking-[0.2em] text-white/40 uppercase">AI Artist {i + 1}</p>
                            <p className="text-[8px] font-bold text-violet-400/40 uppercase animate-pulse">Painting details...</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center space-y-6 max-w-sm">
                      <div className="mx-auto w-24 h-24 rounded-3xl bg-white/5 border border-white/5 flex items-center justify-center">
                        <ImageIcon className="h-10 w-10 text-white/10" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-xl font-bold text-white/80">Start Your Creative Journey</h3>
                        <p className="text-sm text-white/40 leading-relaxed">Enter a description on the left to generate unique AI artwork instantly.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Session Gallery */}
              {gallery.length > 0 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <div className="flex items-center justify-between border-b border-white/5 pb-4">
                    <div className="flex items-center gap-3">
                       <LayoutGrid className="h-5 w-5 text-violet-500" />
                       <h2 className="text-lg font-black uppercase tracking-tighter">Session History</h2>
                    </div>
                    <div className="flex gap-3">
                       <button onClick={() => {
                         gallery.forEach((img, i) => setTimeout(() => downloadImage(img), i * 300));
                       }} className="px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-[10px] font-bold uppercase tracking-widest hover:bg-violet-600 transition-all flex items-center gap-2">
                         <Download className="h-3 w-3" /> Save All
                       </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {gallery.map((img, i) => (
                      <div key={i} className="relative aspect-square rounded-2xl overflow-hidden border border-white/5 bg-white/5 group/gal hover:border-violet-500/50 transition-all">
                        <img src={img.url} alt="" className="w-full h-full object-cover opacity-80 group-hover/gal:opacity-100 transition-opacity" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/gal:opacity-100 transition-opacity flex items-center justify-center">
                           <button onClick={() => setCurrentImgs([img])} className="p-2 rounded-lg bg-white/10 backdrop-blur-md border border-white/10 hover:bg-violet-600 transition-all">
                              <Maximize className="h-4 w-4" />
                           </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : activeTab === "text" ? (
          /* Text Intelligence Tab */
          <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-8 animate-in fade-in duration-500">
            <div className="space-y-6">
              <div className="p-6 rounded-[32px] border border-white/5 bg-white/5 backdrop-blur-3xl space-y-6">
                <div className="flex items-center gap-2 pb-2">
                  <Type className="h-4 w-4 text-violet-500" />
                  <h2 className="text-xs font-black uppercase tracking-widest text-white/60">Brain Settings</h2>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Model</label>
                  <MedqsSelect
                    value={textModel}
                    onChange={(e) => setTextModel(e.target.value)}
                    className="w-full h-11 rounded-xl"
                  >
                    <option value="openai" className="bg-[#111]">OpenAI GPT-4o (Smart)</option>
                    <option value="mistral" className="bg-[#111]">Mistral (Reasoning)</option>
                    <option value="llama" className="bg-[#111]">Llama 3.1 (Fast)</option>
                  </MedqsSelect>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">System Instructions</label>
                  <textarea
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                    className="w-full h-24 p-4 rounded-xl bg-black/40 border border-white/5 focus:border-violet-500/50 outline-none text-xs resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={handleGenerateText}
                    disabled={textLoading || !textPrompt.trim()}
                    className="h-14 rounded-2xl bg-gradient-to-r from-violet-600 to-pink-600 text-sm font-black text-white shadow-xl shadow-violet-500/20 disabled:opacity-50 flex items-center justify-center gap-3"
                  >
                    {textLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
                    {textLoading ? "THINKING..." : "GENERATE TEXT"}
                  </button>
                  <button
                    onClick={() => handleSpeak(textPrompt)}
                    disabled={!textPrompt.trim()}
                    className="h-14 rounded-2xl bg-white/5 border border-white/10 text-sm font-black text-amber-400 hover:bg-white/10 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                  >
                    <Volume2 className="h-5 w-5" />
                    READ ALOUD
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Your Query</label>
                <textarea
                  value={textPrompt}
                  onChange={(e) => setTextPrompt(e.target.value)}
                  placeholder="Ask anything or request creative writing..."
                  className="w-full h-40 p-6 rounded-[36px] bg-white/5 border border-white/10 focus:border-violet-500/50 outline-none resize-none text-base transition-all"
                />
              </div>

              {textResult && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-violet-500 ml-1">AI Intelligence</label>
                    <div className="flex gap-4">
                      <button 
                        onClick={() => handleSpeak(textResult)} 
                        className="text-[10px] font-bold uppercase tracking-widest text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-2"
                      >
                        <Volume2 className="h-3 w-3" /> Speak
                      </button>
                      <button 
                        onClick={() => { navigator.clipboard.writeText(textResult); toast.success("Copied!"); }} 
                        className="text-[10px] font-bold uppercase tracking-widest text-white/40 hover:text-white transition-colors"
                      >
                        Copy Result
                      </button>
                    </div>
                  </div>
                  <div className="p-8 rounded-[36px] bg-white/5 border border-white/5 text-base leading-relaxed whitespace-pre-wrap text-white/90 shadow-2xl">
                    {textResult}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Vision Intelligence Tab */
          <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-8 animate-in fade-in duration-500">
            <div className="space-y-6">
              <div className="p-8 rounded-[36px] border border-white/5 bg-white/5 backdrop-blur-3xl space-y-6">
                <div className="flex items-center gap-3 pb-2">
                   <div className="p-2 rounded-xl bg-violet-500/20 text-violet-400">
                      <Eye className="h-4 w-4" />
                   </div>
                   <h2 className="text-sm font-black uppercase tracking-widest text-white/80">Vision Engine</h2>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Image Source (URL)</label>
                  <div className="relative group">
                    <input
                      type="text"
                      value={visionImgUrl}
                      onChange={(e) => setVisionImgUrl(e.target.value)}
                      placeholder="Paste image link here..."
                      className="w-full h-12 px-4 pr-12 rounded-xl bg-black/40 border border-white/5 focus:border-violet-500/50 outline-none text-xs transition-all"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20">
                      <Upload className="h-4 w-4" />
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleVisionAnalyze}
                  disabled={visionLoading || !visionImgUrl.trim()}
                  className="w-full h-14 rounded-2xl bg-gradient-to-r from-violet-600 to-pink-600 text-sm font-black text-white shadow-xl shadow-violet-500/20 disabled:opacity-50 flex items-center justify-center gap-3"
                >
                  {visionLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
                  {visionLoading ? "ANALYZING..." : "ANALYZE IMAGE"}
                </button>

                {visionImgUrl && (
                  <div className="rounded-2xl overflow-hidden border border-white/10 aspect-video bg-black/40">
                     <img src={visionImgUrl} alt="Preview" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
               <div className="min-h-[400px] rounded-[40px] border border-white/10 bg-white/5 backdrop-blur-xl p-8 relative flex flex-col">
                  {!visionResult && !visionLoading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 space-y-4">
                       <div className="h-20 w-20 rounded-full bg-white/5 flex items-center justify-center text-white/10">
                          <EyeOff className="h-10 w-10" />
                       </div>
                       <div>
                          <h3 className="text-xl font-bold text-white/60">Vision Intelligence</h3>
                          <p className="text-sm text-white/30 max-w-xs mt-2">Paste an image URL to describe its content, extract text, or generate creative stories.</p>
                       </div>
                    </div>
                  )}

                  {visionLoading && (
                    <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                       <Loader2 className="h-12 w-12 animate-spin text-violet-500" />
                       <p className="text-sm font-bold tracking-widest text-white/40 uppercase animate-pulse">Processing Image Data...</p>
                    </div>
                  )}

                  {visionResult && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                       <div className="flex items-center justify-between border-b border-white/5 pb-4">
                          <span className="text-xs font-bold uppercase tracking-widest text-violet-400">Analysis Result</span>
                          <button onClick={() => handleSpeak(visionResult)} className="flex items-center gap-2 text-xs font-bold text-amber-400 hover:text-amber-300">
                             <Volume2 className="h-4 w-4" /> Listen
                          </button>
                       </div>
                       <div className="text-base leading-relaxed text-white/90 whitespace-pre-wrap">
                          {visionResult}
                       </div>
                    </div>
                  )}
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
