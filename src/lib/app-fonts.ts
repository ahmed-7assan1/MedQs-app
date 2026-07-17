import { Cairo, Nunito, Syne, Vazirmatn, Plus_Jakarta_Sans, Inter, IBM_Plex_Mono } from "next/font/google";

/**
 * UI pair: **Nunito** (English / UI) + **Cairo** (Arabic).
 * Variables on `<html>`: `--font-nunito`, `--font-cairo`.
 */
export const fontEnglish = Nunito({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-nunito",
  display: "swap",
});

export const fontArabic = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-cairo",
  display: "swap",
});

export const fontVazirmatn = Vazirmatn({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-vazirmatn",
  display: "swap",
});

export const fontSyne = Syne({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-syne",
  display: "swap",
});

export const fontPlusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

export const fontInter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

export const fontIbmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-ibm-plex-mono",
  display: "swap",
});

export const appFontVariableClassName = `${fontEnglish.variable} ${fontArabic.variable} ${fontVazirmatn.variable} ${fontSyne.variable} ${fontPlusJakarta.variable} ${fontInter.variable} ${fontIbmPlexMono.variable}`.trim();
