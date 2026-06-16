#!/usr/bin/env node
/**
 * generates src/styles/themes.css from medonex-themes hex values
 * maps --color-* naming → app HSL variable names
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const THEMES_DIR = path.join(ROOT, "medonex-themes", "medonex-themes");
const OUT_PATH = path.join(ROOT, "src", "styles", "themes.css");

function hexToHSL(hex) {
  hex = hex.replace("#", "").trim();
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function parseThemeCSS(filePath) {
  const content = fs.readFileSync(filePath, "utf-8");
  const vars = { light: {}, dark: {} };
  let mode = null;
  for (const line of content.split("\n")) {
    const t = line.trim();
    if (t === ":root {") { mode = "light"; continue; }
    if (t === ".dark {") { mode = "dark"; continue; }
    if (t === "}") { mode = null; continue; }
    if (!mode) continue;
    const m = t.match(/--color-([a-z0-9-]+):\s*#([0-9a-fA-F]{3,6})\s*;/);
    if (m) vars[mode][m[1]] = "#" + m[2].toLowerCase();
  }
  return vars;
}

// --color-* → app CSS variable name
const COLOR_MAP = [
  ["bg", "background"],
  ["surface", "card"],
  ["surface-dim", "muted"],
  ["border", "border"],
  ["border-str", "border-str"],
  ["text-1", "foreground"],
  ["text-2", "secondary-foreground"],
  ["text-3", "muted-foreground"],
  ["text-dis", "text-dis"],
  ["primary", "primary"],
  ["primary-pr", "primary-pr"],
  ["primary-bg", "primary-bg"],
  ["primary-txt", "primary-foreground"],
  ["gold", "gold"],
  ["gold-bg", "gold-bg"],
  ["success", "success"],
  ["danger", "destructive"],
  ["warning", "warning"],
  ["navbar", "navbar"],
];

// Static variables per mode
const LIGHT_STATIC = [
  ["input", "var(--border)"],
  ["ring", "var(--primary)"],
  ["popover", "var(--card)"],
  ["popover-foreground", "var(--foreground)"],
  ["card-foreground", "var(--foreground)"],
  ["accent", "0 0% 0% / 0.04"],
  ["accent-foreground", "var(--foreground)"],
  ["secondary", "0 0% 0% / 0.04"],
  ["destructive-foreground", "0 0% 100%"],
  ["success-foreground", "0 0% 100%"],
  ["warning-foreground", "0 0% 100%"],
  ["shadow-clr", "rgba(0, 0, 0, 0.05)"],
  ["radius", "12px"],
];

const DARK_STATIC = [
  ["input", "var(--border)"],
  ["ring", "var(--primary)"],
  ["popover", "var(--card)"],
  ["popover-foreground", "var(--foreground)"],
  ["card-foreground", "var(--foreground)"],
  ["accent", "0 0% 100% / 0.04"],
  ["accent-foreground", "var(--foreground)"],
  ["secondary", "0 0% 100% / 0.03"],
  ["destructive-foreground", "0 0% 100%"],
  ["success-foreground", "0 0% 100%"],
  ["warning-foreground", "0 0% 100%"],
  ["shadow-clr", "rgba(0, 0, 0, 0.5)"],
  ["radius", "12px"],
];

const THEMES = [
  { file: "theme-01-medonex-purple.css", id: "medonex-purple", label: "MedOneX Purple" },
  { file: "theme-02-ocean-teal.css",     id: "ocean-teal",     label: "Ocean Teal" },
  { file: "theme-03-rose-gold.css",      id: "rose-gold",      label: "Rose Gold" },
  { file: "theme-04-forest-green.css",   id: "forest-green",   label: "Forest Green" },
  { file: "theme-05-midnight-blue.css",  id: "midnight-blue",  label: "Midnight Blue" },
  { file: "theme-06-amber-noir.css",     id: "amber-noir",     label: "Amber Noir" },
  { file: "theme-07-cyber-purple.css",   id: "cyber-purple",   label: "Cyber Purple" },
  { file: "theme-08-arctic-gray.css",    id: "arctic-gray",    label: "Arctic Gray" },
  { file: "theme-09-sakura-mint.css",    id: "sakura-mint",    label: "Sakura Mint" },
  { file: "theme-10-ruby-red.css",       id: "ruby-red",       label: "Ruby Red" },
  { file: "theme-11-emerald-night.css",  id: "emerald-night",  label: "Emerald Night" },
  { file: "theme-12-solar-gold.css",     id: "solar-gold",     label: "Solar Gold" },
  { file: "theme-13-nordic-slate.css",   id: "nordic-slate",   label: "Nordic Slate" },
  { file: "theme-14-neon-indigo.css",    id: "neon-indigo",    label: "Neon Indigo" },
  { file: "theme-15-espresso.css",       id: "espresso",       label: "Espresso" },
  { file: "theme-16-mono.css",           id: "mono",           label: "Mono" },
];

function generate() {
  let css = `/* ══════════════════════════════════════════════════════════
   🎨 MedOneX — 16 Theme Variants
   Auto-generated from medonex-themes/
   Each theme overrides CSS variables under [data-theme-variant]
══════════════════════════════════════════════════════════ */

`;

  for (const { file, id, label } of THEMES) {
    const fp = path.join(THEMES_DIR, file);
    if (!fs.existsSync(fp)) { console.warn("Missing:", fp); continue; }
    const vars = parseThemeCSS(fp);

    // Light
    css += `/* ── ${label} ── */\n`;
    css += `[data-theme-variant="${id}"] {\n`;
    for (const [colorKey, appKey] of COLOR_MAP) {
      if (vars.light[colorKey]) {
        css += `  --${appKey}: ${hexToHSL(vars.light[colorKey])};\n`;
      }
    }
    for (const [key, val] of LIGHT_STATIC) {
      css += `  --${key}: ${val};\n`;
    }
    css += `}\n\n`;

    // Dark
    css += `.dark[data-theme-variant="${id}"] {\n`;
    for (const [colorKey, appKey] of COLOR_MAP) {
      if (vars.dark[colorKey]) {
        css += `  --${appKey}: ${hexToHSL(vars.dark[colorKey])};\n`;
      }
    }
    for (const [key, val] of DARK_STATIC) {
      css += `  --${key}: ${val};\n`;
    }
    css += `}\n\n`;
  }

  fs.writeFileSync(OUT_PATH, css, "utf-8");
  console.log(`✅ Generated: ${OUT_PATH}`);
}

generate();
