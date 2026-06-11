const fs = require('fs');
const file = 'src/components/social/OneXCommunity.tsx';
let content = fs.readFileSync(file, 'utf8');

// The iframe starts with <iframe src={getYouTubeEmbedUrl(ytId)}
// and ends with />
// The two overlay divs start with <div style={{ position: "absolute", top: 0
// We can just use a simple while loop with indexOf to find and replace them exactly.

let count = 0;
while (true) {
  const startIdx = content.indexOf('<iframe src={getYouTubeEmbedUrl(ytId)}');
  if (startIdx === -1) break;

  // Find the end of the iframe
  const iframeEndIdx = content.indexOf('/>', startIdx) + 2;

  // Now, if there are two absolute divs right after, we want to remove them too.
  let endIdx = iframeEndIdx;
  
  // Find the next two divs. They look like:
  // <div style={{ position: "absolute", top: 0, left: 0, width: "60%", height: 55, zIndex: 10, cursor: "default" }} />
  // <div style={{ position: "absolute", bottom: 0, right: 0, width: 60, height: 55, zIndex: 10, cursor: "default" }} />
  
  const nextText = content.substring(iframeEndIdx, iframeEndIdx + 500);
  const divMatch = nextText.match(/^\s*<div style=\{\{\s*position:\s*"absolute"[^\>]*\/>\s*<div style=\{\{\s*position:\s*"absolute"[^\>]*\/>/);
  
  if (divMatch) {
    endIdx = iframeEndIdx + divMatch[0].length;
  }

  content = content.substring(0, startIdx) + '<YouTubePlayer videoId={ytId} />' + content.substring(endIdx);
  count++;
}

fs.writeFileSync(file, content, 'utf8');
console.log('Replaced', count, 'iframes');
