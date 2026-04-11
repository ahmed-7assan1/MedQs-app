/**
 * OCR utilities: PDF text + image OCR (English + Arabic) for admin extract & study schedule upload.
 */
import pdfParse from "pdf-parse";
import { createWorker } from "tesseract.js";

/**
 * Extract text from a file buffer based on mimeType (legacy helper).
 */
export async function extractText(buffer: Buffer, mimeType: string): Promise<string | null> {
  try {
    if (mimeType === "application/pdf") {
      const data = await pdfParse(buffer);
      return data.text;
    }
    if (mimeType.startsWith("image/")) {
      return ocrImageBuffer(buffer);
    }
    return null;
  } catch (error) {
    console.error("OCR extraction failed:", error);
    return null;
  }
}

/**
 * Tesseract OCR for screenshots / photos of timetables (English + Arabic).
 */
export async function ocrImageBuffer(buffer: Buffer): Promise<string | null> {
  async function runLang(lang: string): Promise<string | null> {
    const worker = await createWorker(lang);
    try {
      const {
        data: { text },
      } = await worker.recognize(buffer);
      return text?.trim() || null;
    } finally {
      await worker.terminate().catch(() => {});
    }
  }
  try {
    const a = await runLang("eng+ara");
    if (a) return a;
  } catch (e) {
    console.warn("[ocr] eng+ara:", e);
  }
  try {
    return await runLang("eng");
  } catch (error) {
    console.error("[ocr] ocrImageBuffer:", error);
    return null;
  }
}
