import localFont from "next/font/local";
import { Tajawal, DM_Sans, Syne } from "next/font/google";

/**
 * UI pair: **Geist** (Latin / UI) + **Tajawal** (Arabic).
 * Variables on `<html>`: `--font-geist-sans`, `--font-tajawal`.
 * For RTL use `font-arabic` or `dir="rtl"` / `:lang(ar)` (globals.css).
 */
export const fontGeist = localFont({
  src: [
    {
      path: "../../node_modules/geist/dist/fonts/geist-sans/Geist-Variable.woff2",
      weight: "100 900",
    },
  ],
  variable: "--font-geist-sans",
  display: "swap",
});

export const fontArabic = Tajawal({
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

export const appFontVariableClassName = `${fontGeist.variable} ${fontArabic.variable} ${fontDMSans.variable} ${fontSyne.variable}`.trim();
