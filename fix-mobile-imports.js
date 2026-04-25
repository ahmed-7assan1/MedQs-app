const fs = require('fs');
const path = require('path');

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
    } else if (entry.name === 'route.ts') {
      let content = fs.readFileSync(full, 'utf8');
      const updated = content
        .replace(/import \{ db \} from '@\/lib\/db';/g, "import { prisma } from '@/lib/prisma';")
        .replace(/\bdb\./g, 'prisma.');
      if (updated !== content) {
        fs.writeFileSync(full, updated, 'utf8');
        console.log('Fixed:', full);
      }
    }
  }
}

walk(path.join(__dirname, 'src', 'app', 'api', 'mobile'));
console.log('All done.');
