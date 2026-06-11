const fs = require('fs');
const file = 'src/components/social/OneXCommunity.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  'import { getYouTubeId, getYouTubeThumbnail, getYouTubeEmbedUrl } from "@/lib/video-utils";',
  'import { getYouTubeId, getYouTubeThumbnail } from "@/lib/video-utils";\nimport YouTubePlayer from "./YouTubePlayer";'
);

// We want to replace the iframe and the two overlay divs with <YouTubePlayer videoId={ytId} />
const pattern = /<iframe src=\{getYouTubeEmbedUrl\(ytId\)\} title="YouTube" style=\{\{ width: "100%", height: "100%", border: "none" \}\} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen \/>\s*<div style=\{\{ position: "absolute", top: 0, left: 0, width: "60%", height: 55, zIndex: 10, cursor: "default" \}\} \/>\s*<div style=\{\{ position: "absolute", bottom: 0, right: 0, width: 60, height: 55, zIndex: 10, cursor: "default" \}\} \/>/g;

content = content.replace(pattern, '<YouTubePlayer videoId={ytId} />');

fs.writeFileSync(file, content, 'utf8');
console.log('Patched!');
