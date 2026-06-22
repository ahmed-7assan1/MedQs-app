import { EDGE_TTS_ARABIC_VOICES, EDGE_TTS_ENGLISH_VOICES, type EdgeTTSVoice } from "@/components/ai/edgeTTSVoices";
import { stripMarkdown } from "./stripMarkdown";

class EdgeTTSManager {
  private currentAudio: HTMLAudioElement | null = null;
  private _voices: EdgeTTSVoice[] | null = null;
  private onInterrupt: (() => void) | null = null;
  lastSpokenText: string = "";
  onStateChange: ((playing: boolean) => void) | null = null;

  set interruptHandler(fn: (() => void) | null) {
    this.onInterrupt = fn;
  }

  get voices(): EdgeTTSVoice[] {
    if (!this._voices) {
      this._voices = [...EDGE_TTS_ARABIC_VOICES, ...EDGE_TTS_ENGLISH_VOICES];
    }
    return this._voices;
  }

  get arabicVoices(): EdgeTTSVoice[] {
    return EDGE_TTS_ARABIC_VOICES;
  }

  async speak(text: string, voiceId: string, options?: { rate?: string; pitch?: string }): Promise<void> {
    this.stop();
    const clean = stripMarkdown(text);
    if (!clean) return;
    this.lastSpokenText = clean;

    const params = new URLSearchParams({
      text: clean,
      voice: voiceId,
      rate: options?.rate || "+0%",
      pitch: options?.pitch || "+0Hz",
    });

    try {
      const res = await fetch(`/api/tts?${params}`);
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "TTS request failed");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      this.currentAudio = audio;

      return new Promise((resolve, reject) => {
        audio.onended = () => { URL.revokeObjectURL(url); this.onStateChange?.(false); resolve(); };
        audio.onerror = () => { URL.revokeObjectURL(url); this.onStateChange?.(false); reject(new Error("Audio playback failed")); };
        audio.play().then(() => this.onStateChange?.(true)).catch(reject);
      });
    } catch (err) {
      console.error("Edge TTS speak error:", err);
      throw err;
    }
  }

  stop(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }
    this.onStateChange?.(false);
    if (this.onInterrupt) this.onInterrupt();
  }

  get isPlaying(): boolean {
    return this.currentAudio !== null && !this.currentAudio.paused;
  }
}

export const edgeTTS = new EdgeTTSManager();
