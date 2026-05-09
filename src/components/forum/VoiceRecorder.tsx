"use client";

import { useState, useRef, useEffect } from "react";
import { 
  Microphone, 
  X, 
  Check, 
  Trash, 
  StopCircle,
  Record,
  Sparkle,
  ShieldCheck
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  onStop: (blob: Blob, duration: number) => void;
  onCancel: () => void;
}

export function VoiceRecorder({ onStop, onCancel }: Props) {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [visualizerData, setVisualizerData] = useState<number[]>(new Array(30).fill(10));
  const [isEnhanced, setIsEnhanced] = useState(true);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    startRecording();
    return () => {
      stopRecording();
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    };
  }, [isEnhanced]); // Restart if enhancement toggle changes

  const startRecording = async () => {
    try {
      // Clean up previous stream if any
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          noiseSuppression: isEnhanced,
          echoCancellation: isEnhanced,
          autoGainControl: isEnhanced,
          channelCount: 1,
          sampleRate: 44100
        } 
      });
      streamRef.current = stream;
      
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      // Visualizer & Audio Processing setup
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioContext.createMediaStreamSource(stream);
      
      // Optional: Add a subtle dynamics compressor for "Purification"
      const compressor = audioContext.createDynamicsCompressor();
      compressor.threshold.setValueAtTime(-24, audioContext.currentTime);
      compressor.knee.setValueAtTime(40, audioContext.currentTime);
      compressor.ratio.setValueAtTime(12, audioContext.currentTime);
      compressor.attack.setValueAtTime(0, audioContext.currentTime);
      compressor.release.setValueAtTime(0.25, audioContext.currentTime);

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 64;
      
      source.connect(compressor);
      compressor.connect(analyser);
      analyserRef.current = analyser;

      const updateVisualizer = () => {
        if (!analyserRef.current) return;
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        
        // Map frequency data to visualizer bars
        const scaledData = Array.from(dataArray).slice(0, 30).map(v => Math.max(4, v / 4));
        setVisualizerData(scaledData);
        animationFrameRef.current = requestAnimationFrame(updateVisualizer);
      };
      updateVisualizer();

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        onStop(audioBlob, duration);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setIsRecording(true);
      
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error("Microphone access denied", err);
      onCancel();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex items-center gap-4 p-4 rounded-[28px] bg-[#534AB7]/10 border border-[#534AB7]/20 backdrop-blur-2xl w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="relative flex items-center justify-center h-10 w-10">
          <motion.div 
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="absolute inset-0 rounded-full bg-red-500/20"
          />
          <Record size={24} weight="fill" className="text-red-500 relative z-10" />
      </div>

      <div className="flex-1 flex flex-col gap-1">
        <div className="flex items-center justify-between">
            <span className="text-xs font-black text-[#AFA9EC] uppercase tracking-widest animate-pulse">Recording...</span>
            <span className="text-sm font-black text-white tabular-nums">{formatTime(duration)}</span>
        </div>

        {/* Real-time Visualizer */}
        <div className="flex items-center gap-[2px] h-8">
            {visualizerData.map((v, i) => (
                <div 
                    key={i}
                    className="flex-1 bg-[#534AB7] rounded-full transition-all duration-75"
                    style={{ height: `${v}%` }}
                />
            ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsEnhanced(!isEnhanced)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
              isEnhanced 
                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/20 shadow-lg shadow-emerald-500/10" 
                : "bg-white/5 text-white/30 border-white/5"
            )}
            title="Purification Filter"
          >
            <Sparkle size={14} weight={isEnhanced ? "fill" : "bold"} />
            {isEnhanced ? "Clean" : "Raw"}
          </button>

          <button 
            onClick={onCancel}
            className="h-10 w-10 flex items-center justify-center rounded-full bg-white/5 text-white/40 hover:bg-red-500/10 hover:text-red-400 transition-all"
            title="Cancel"
          >
            <Trash size={20} weight="bold" />
          </button>
          
          <button 
            onClick={stopRecording}
            className="flex items-center gap-2 px-4 py-2 bg-[#534AB7] text-white rounded-full text-xs font-black uppercase tracking-widest shadow-lg shadow-[#534AB7]/40 hover:scale-105 active:scale-95 transition-all"
          >
            <Check size={18} weight="bold" />
            Finish
          </button>
      </div>
    </div>
  );
}
