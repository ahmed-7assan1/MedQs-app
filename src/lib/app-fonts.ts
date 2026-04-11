import { Poppins, Tajawal } from "next/font/google";

/**
 * Official UI pair: **Poppins** (Latin) + **Tajawal** (Arabic).
 * Loaded via next/font on `<html>` as CSS variables `--font-poppins` / `--font-tajawal`.
 * Default stack: Poppins → Tajawal (Arabic letters fall through to Tajawal).
 * For RTL blocks use `font-arabic` or `dir="rtl"` / `:lang(ar)` (see globals.css).
 * Do not replace with a single DB font — it breaks Arabic shaping.
 */
export const fontPoppins = Poppins({
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-poppins",
  display: "swap",
  /** Next’s size-adjusted fallback can cover Arabic before Tajawal is used — keep Latin-only. */
  adjustFontFallback: false,
});

export const fontTajawal = Tajawal({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "700", "800"],
  variable: "--font-tajawal",
  display: "swap",
});

export const appFontVariableClassName = `${fontPoppins.variable} ${fontTajawal.variable}`.trim();
