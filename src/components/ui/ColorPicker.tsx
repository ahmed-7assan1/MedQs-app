"use client";
import React, { useCallback, useMemo, useState, useRef, useEffect } from "react";

interface ColorPickerProps {
  value: string;
  onChange: (hex: string) => void;
  label?: string;
}

function hexToHsl(hex: string): [number, number, number] {
  let r = parseInt(hex.slice(1, 3), 16) / 255;
  let g = parseInt(hex.slice(3, 5), 16) / 255;
  let b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) * 60; break;
      case g: h = ((b - r) / d + 2) * 60; break;
      case b: h = ((r - g) / d + 4) * 60; break;
    }
  }
  return [Math.round(h), Math.round(s * 100), Math.round(l * 100)];
}

function hslToHex(h: number, s: number, l: number): string {
  const sat = s / 100;
  const light = l / 100;
  const a = sat * Math.min(light, 1 - light);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = light - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(255 * color).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

export default function ColorPicker({ value, onChange, label }: ColorPickerProps) {
  const [h, setH] = useState(() => hexToHsl(value)[0]);
  const [s, setS] = useState(() => hexToHsl(value)[1]);
  const [l, setL] = useState(() => hexToHsl(value)[2]);
  const [hexInput, setHexInput] = useState(value);
  const [showSliders, setShowSliders] = useState(false);

  useEffect(() => {
    const [nh, ns, nl] = hexToHsl(value);
    setH(nh); setS(ns); setL(nl);
    setHexInput(value);
  }, [value]);

  const updateFromHsl = useCallback((nh: number, ns: number, nl: number) => {
    setH(nh); setS(ns); setL(nl);
    const hex = hslToHex(nh, ns, nl);
    setHexInput(hex);
    onChange(hex);
  }, [onChange]);

  const handleHexSubmit = useCallback(() => {
    let hex = hexInput.trim();
    if (!hex.startsWith("#")) hex = "#" + hex;
    if (/^#[0-9a-fA-F]{6}$/.test(hex)) {
      onChange(hex);
      const [nh, ns, nl] = hexToHsl(hex);
      setH(nh); setS(ns); setL(nl);
    } else {
      setHexInput(value);
    }
  }, [hexInput, onChange, value]);

  const hueTrack = useMemo(() => (
    "linear-gradient(to right, #ff0000,#ff8800,#ffff00,#00ff00,#0088ff,#0000ff,#8800ff,#ff00ff,#ff0000)"
  ), []);

  const satTrack = useMemo(() => (
    `linear-gradient(to right, ${hslToHex(h, 0, l)}, ${hslToHex(h, 100, l)})`
  ), [h, l]);

  const lightTrack = useMemo(() => (
    `linear-gradient(to right, #000, ${hslToHex(h, s, 50)}, #fff)`
  ), [h, s]);

  return (
    <div className="space-y-1.5">
      {label && (
        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{label}</label>
      )}
      <div className="rounded-xl bg-muted/20 border border-border overflow-hidden">
        <button
          type="button"
          onClick={() => setShowSliders(!showSliders)}
          className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted/30 transition-all"
        >
          <div
            className="h-8 w-8 rounded-lg border-2 border-white/20 shrink-0 shadow-inner transition-all duration-200"
            style={{ backgroundColor: value }}
          />
          <span className="text-xs font-mono font-bold text-foreground flex-1 text-left">{value}</span>
          <svg
            className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${showSliders ? "rotate-180" : ""}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showSliders && (
          <div className="px-3 pb-3 space-y-3 border-t border-border pt-3">
            <div className="flex items-center gap-2.5">
              <span className="text-[9px] font-bold text-muted-foreground w-6 shrink-0">H</span>
              <input
                type="range" min={0} max={360} value={h}
                onChange={(e) => updateFromHsl(Number(e.target.value), s, l)}
                className="color-slider w-full h-2 rounded-full appearance-none cursor-pointer"
                style={{ background: hueTrack }}
              />
              <span className="text-[9px] font-mono font-bold text-muted-foreground w-8 text-right">{h}°</span>
            </div>

            <div className="flex items-center gap-2.5">
              <span className="text-[9px] font-bold text-muted-foreground w-6 shrink-0">S</span>
              <input
                type="range" min={0} max={100} value={s}
                onChange={(e) => updateFromHsl(h, Number(e.target.value), l)}
                className="color-slider w-full h-2 rounded-full appearance-none cursor-pointer"
                style={{ background: satTrack }}
              />
              <span className="text-[9px] font-mono font-bold text-muted-foreground w-8 text-right">{s}%</span>
            </div>

            <div className="flex items-center gap-2.5">
              <span className="text-[9px] font-bold text-muted-foreground w-6 shrink-0">L</span>
              <input
                type="range" min={0} max={100} value={l}
                onChange={(e) => updateFromHsl(h, s, Number(e.target.value))}
                className="color-slider w-full h-2 rounded-full appearance-none cursor-pointer"
                style={{ background: lightTrack }}
              />
              <span className="text-[9px] font-mono font-bold text-muted-foreground w-8 text-right">{l}%</span>
            </div>

            <div className="flex items-center gap-2 pt-0.5">
              <span className="text-[9px] font-bold text-muted-foreground">#</span>
              <input
                value={hexInput.replace("#", "")}
                onChange={(e) => setHexInput("#" + e.target.value)}
                onBlur={handleHexSubmit}
                onKeyDown={(e) => { if (e.key === "Enter") handleHexSubmit(); }}
                className="flex-1 rounded-lg bg-background border border-border px-2 py-1 text-[10px] font-mono font-bold text-foreground focus:outline-none focus:border-primary/50 uppercase"
                maxLength={6}
              />
              <div
                className="h-5 w-5 rounded border border-white/20 shrink-0"
                style={{ backgroundColor: value }}
              />
            </div>
          </div>
        )}
      </div>
      <style>{`
        .color-slider::-webkit-slider-thumb {
          -webkit-appearance: none; width: 18px; height: 18px; border-radius: 50%;
          background: white; border: 2px solid rgba(255,255,255,0.8);
          box-shadow: 0 2px 8px rgba(0,0,0,0.35), 0 0 0 1px rgba(0,0,0,0.08);
          cursor: pointer; transition: transform 0.15s, box-shadow 0.15s;
        }
        .color-slider::-webkit-slider-thumb:hover { transform: scale(1.15); box-shadow: 0 3px 12px rgba(0,0,0,0.4); }
        .color-slider::-moz-range-thumb {
          width: 18px; height: 18px; border-radius: 50%;
          background: white; border: 2px solid rgba(255,255,255,0.8);
          box-shadow: 0 2px 8px rgba(0,0,0,0.35); cursor: pointer;
        }
      `}</style>
    </div>
  );
}
