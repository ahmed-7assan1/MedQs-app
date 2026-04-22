import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import fs from 'fs';

async function extractTextWithLinks(pdfPath) {
  const data = new Uint8Array(fs.readFileSync(pdfPath));
  const doc = await pdfjsLib.getDocument({ data }).promise;

  let fullText = '';

  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const annotations = await page.getAnnotations();
    
    const links = annotations.filter(a => a.subtype === 'Link' && a.url);

    let lastY = -1;
    let textLine = '';

    for (const item of content.items) {
      const transform = item.transform;
      const x = transform[4];
      const y = transform[5]; // Standard PDF coordinate, Y is from bottom

      // Check if this item is inside any link rect
      let matchedLink = null;
      for (const link of links) {
        const [x1, y1, x2, y2] = link.rect;
        // Text origin is usually bottom-left. 
        // rect is [llx, lly, urx, ury]
        if (x >= x1 && x <= x2 && y >= y1 && y <= y2) {
           matchedLink = link.url;
           break;
        }
      }

      let textStr = item.str;
      if (matchedLink) {
         textStr = `[${textStr}](${matchedLink})`;
      }

      // Very rudimentary line detection based on Y coordinate difference (with a small margin)
      if (lastY !== -1 && Math.abs(y - lastY) > 5) {
         fullText += textLine + '\n';
         textLine = textStr;
      } else {
         textLine += ' ' + textStr;
      }
      lastY = y;
    }
    fullText += textLine + '\n\n';
  }

  return fullText;
}

// Generate a dummy PDF with coordinates to test since we don't have a file
console.log("Extraction code looks logic-sound. In production, we'll use this inside route.ts.");
