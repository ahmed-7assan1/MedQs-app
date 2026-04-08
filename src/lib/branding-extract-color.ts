/**
 * Browser-only: sample average opaque color from an image file (for primary brand color).
 */
export async function extractApproximatePrimaryHex(file: File): Promise<string | null> {
  if (typeof window === "undefined") return null;
  let bmp: ImageBitmap | null = null;
  try {
    bmp = await createImageBitmap(file);
  } catch {
    return null;
  }
  const canvas = document.createElement("canvas");
  const w = Math.min(96, bmp.width);
  const h = Math.min(96, bmp.height);
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bmp.close?.();
    return null;
  }
  ctx.drawImage(bmp, 0, 0, w, h);
  bmp.close?.();
  const { data } = ctx.getImageData(0, 0, w, h);
  let r = 0;
  let g = 0;
  let b = 0;
  let n = 0;
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3];
    if (a < 48) continue;
    r += data[i];
    g += data[i + 1];
    b += data[i + 2];
    n++;
  }
  if (!n) return null;
  r = Math.round(r / n);
  g = Math.round(g / n);
  b = Math.round(b / n);
  const hex = (x: number) => x.toString(16).padStart(2, "0");
  return `#${hex(r)}${hex(g)}${hex(b)}`;
}
