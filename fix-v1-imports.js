const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
            results.push(file);
        }
    });
    return results;
}

const targetDir = path.join(process.cwd(), 'src/app/api/v1/mobile');
if (fs.existsSync(targetDir)) {
    const files = walk(targetDir);
    files.forEach(file => {
        let content = fs.readFileSync(file, 'utf8');
        if (content.includes('@/lib/db')) {
            console.log('Fixing:', file);
            content = content.replace(/@\/lib\/db/g, '@/lib/prisma');
            content = content.replace(/import { db }/g, 'import { prisma }');
            content = content.replace(/db\./g, 'prisma.');
            fs.writeFileSync(file, content);
        }
    });
} else {
    console.log('Directory not found:', targetDir);
}
