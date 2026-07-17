const fs = require('fs');
const path = require('path');
const src = path.join(__dirname, '..', 'book.png');
const dst = path.join(__dirname, '..', 'public', 'book.png');
fs.copyFileSync(src, dst);
console.log('Copied to public/book.png');
