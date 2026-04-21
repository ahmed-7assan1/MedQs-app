// Dynamic import to avoid edge runtime issues. Hidden from webpack to prevent transpile errors.
async function extractPdfText(buffer: ArrayBuffer): Promise<string> {
  const pdfjsLib = await Function('return import("pdfjs-dist/legacy/build/pdf.mjs")')();
  const data = new Uint8Array(buffer);
  const doc = await pdfjsLib.getDocument({ data }).promise;

  let fullText = "";
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    for (const item of content.items) {
      if ("str" in item) {
        fullText += item.str + " ";
      }
    }
    fullText += "\n";
  }
  return fullText;
}

export async function scrapeUrlContent(url: string): Promise<string | null> {
  console.log(`[MANUS Fetcher] Attempting to fetch: ${url}`);
  try {
    let targetUrl = url;

    // Handle Google Drive Links
    // e.g. https://drive.google.com/file/d/1XyZ.../view
    // or https://drive.google.com/open?id=...
    const gdMatch = targetUrl.match(/drive\.google\.com\/(?:file\/d\/|open\?id=)([^/&]+)/);
    if (gdMatch) {
      targetUrl = `https://drive.google.com/uc?export=download&id=${gdMatch[1]}`;
      console.log(`[MANUS Fetcher] Detected Google Drive, redirected to: ${targetUrl}`);
    }

    const res = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    if (!res.ok) {
      console.error(`[MANUS Fetcher] HTTP Error: ${res.status} ${res.statusText} for URL: ${targetUrl}`);
      return null;
    }

    const contentType = res.headers.get("content-type") || "";
    console.log(`[MANUS Fetcher] Received Content-Type: ${contentType}`);

    if (contentType.includes("application/pdf") || url.toLowerCase().split("?")[0].endsWith(".pdf")) {
      console.log(`[MANUS Fetcher] Processing as PDF...`);
      const buffer = await res.arrayBuffer();
      const text = await extractPdfText(buffer);
      if (!text || text.trim().length === 0) {
        console.warn(`[MANUS Fetcher] PDF extraction returned NO text for: ${url}`);
      }
      return text;
    }

    // Default: Return text format
    const textData = await res.text();
    
    // Check for common error pages that return 200 OK (e.g. Google Drive Login/Access Denied)
    if (textData.includes("Google Drive") && (textData.includes("Sign in") || textData.includes("Access denied"))) {
      console.error(`[MANUS Fetcher] Google Drive Access Denied or Login Required for: ${url}`);
      return null;
    }

    // Very basic HTML stripping if the text contains HTML
    if (textData.trim().startsWith("<") || contentType.includes("text/html")) {
      console.log(`[MANUS Fetcher] Stripping HTML tags from response...`);
      return textData.replace(/<style[^>]*>.*<\/style>/gm, "")
                     .replace(/<script[^>]*>.*<\/script>/gm, "")
                     .replace(/<[^>]+>/g, " ")
                     .replace(/\s+/g, " ")
                     .trim();
    }

    return textData;
  } catch (error) {
    console.error(`[MANUS Fetcher] CRITICAL ERROR reading URL ${url}:`, error);
    return null;
  }
}

export async function fileToText(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const name = (file.name || "").toLowerCase();

  if (name.endsWith(".pdf") || file.type === "application/pdf") {
    return extractPdfText(buffer);
  }
  
  return Buffer.from(buffer).toString("utf-8");
}
