"use client";

import { useState, useRef, useEffect } from "react";
import { 
  Microphone, 
  X, 
  Check, 
  Trash, 
  StopCircle,
  Record,
  Sparkle
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
  const durationRef = useRef(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    let isActive = true;

    const startRecording = async () => {
      try {
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
        if (!isActive) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        streamRef.current = stream;
        const recorder = new MediaRecorder(stream);
        mediaRecorderRef.current = recorder;
        audioChunksRef.current = [];

        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 64;
        source.connect(analyser);
        analyserRef.current = analyser;

        const updateVisualizer = () => {
          if (!analyserRef.current) return;
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(dataArray);
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
          onStop(audioBlob, durationRef.current);
          stream.getTracks().forEach(track => track.stop());
        };

        recorder.start();
        setIsRecording(true);
        durationRef.current = 0;
        setDuration(0);
        
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
          durationRef.current += 1;
          setDuration(durationRef.current);
        }, 1000);

      } catch (err) {
        console.error("Microphone access denied", err);
        onCancel();
      }
    };

    startRecording();

    return () => {
      isActive = false;
      stopRecording();
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    };
  }, [isEnhanced]);

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
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
    <div className="flex items-center gap-4 p-4 rounded-[28px] bg-primary/5 dark:bg-primary/10 border border-primary/20 backdrop-blur-2xl w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="relative flex items-center justify-center h-10 w-10">
          <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1.5 }} className="absolute inset-0 rounded-full bg-red-500/20" />
          <Record size={24} weight="fill" className="text-red-500 relative z-10" />
      </div>

      <div className="flex-1 flex flex-col gap-1">
        <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-primary uppercase tracking-widest animate-pulse">Recording...</span>
            <span className="text-sm font-black text-slate-800 dark:text-white tabular-nums">{formatTime(duration)}</span>
        </div>
        <div className="flex items-center gap-[2px] h-8">
            {visualizerData.map((v, i) => (
                <div key={i} className="flex-1 bg-primary/40 rounded-full transition-all duration-75" style={{ height: `${v}%` }} />
            ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
          <button onClick={() => setIsEnhanced(!isEnhanced)} className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border", isEnhanced ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-white/5 text-slate-400 border-transparent")}>
            <Sparkle size={14} weight={isEnhanced ? "fill" : "bold"} />
            {isEnhanced ? "Clean" : "Raw"}
          </button>
          <button onClick={onCancel} className="h-10 w-10 flex items-center justify-center rounded-full bg-slate-100 dark:bg-white/5 text-slate-400 hover:text-red-500 transition-all">
            <Trash size={20} weight="bold" />
          </button>
          <button onClick={stopRecording} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-full text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
            <Check size={18} weight="bold" />
            Finish
          </button>
      </div>
    </div>
  );
}
