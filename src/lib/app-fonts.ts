import { Plus_Jakarta_Sans, Tajawal, DM_Sans, Syne } from "next/font/google";

/**
 * UI pair: **Plus Jakarta Sans** (Latin / UI) + **Tajawal** (Arabic).
 * Variables on `<html>`: `--font-jakarta`, `--font-tajawal`.
 * For RTL use `font-arabic` or `dir="rtl"` / `:lang(ar)` (globals.css).
 */
export const fontJakarta = Plus_Jakarta_Sans({
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
  adjustFontFallback: false,
});

export const fontTajawal = Tajawal({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "700", "800"],
  variable: "--font-tajawal",
  display: "swap",
});

export const fontDMSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const fontSyne = Syne({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-syne",
  display: "swap",
});

export const appFontVariableClassName = `${fontJakarta.variable} ${fontTajawal.variable} ${fontDMSans.variable} ${fontSyne.variable}`.trim();
