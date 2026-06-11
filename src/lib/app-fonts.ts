import { Cairo, Nunito, Syne } from "next/font/google";

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

export const fontSyne = Syne({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-syne",
  display: "swap",
});

export const appFontVariableClassName = `${fontEnglish.variable} ${fontArabic.variable} ${fontSyne.variable}`.trim();
