const fs = require('fs');
const file = 'src/components/social/OneXCommunity.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  'import YouTubePlayer from "./YouTubePlayer";',
  'import YouTubePlayer from "./YouTubePlayer";\nimport { PostCard } from "./PostCard";\nimport { PostDetailModal } from "@/components/forum/PostDetailModal";'
);

const startIdx = content.indexOf('function PostCard({ post');
const endMarker = '// ─── Notification Panel';
const endIdx = content.indexOf(endMarker);

if (startIdx !== -1 && endIdx !== -1) {
  content = content.substring(0, startIdx) + content.substring(endIdx);
}

content = content.replace(/<PostCard post=\{post\} onOpen=\{\(p\) => setModalPost\(p\)\} onReact=\{handleReact\} onLike=\{handleLike\} onSave=\{handleSave\} currentUserId=\{currentUserId\} currentUserRole=\{currentUserRole\} currentUserUniversityId=\{currentUserUniversityId\} \/>/g, '<PostCard post={post} currentUserId={currentUserId} currentUserRole={currentUserRole} currentUserUniversityId={currentUserUniversityId} />');

content = content.replace(/<PostModal/g, '<PostDetailModal');

fs.writeFileSync(file, content, 'utf8');
console.log('Done!');
