const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, '..', 'assets');
const files = fs.readdirSync(assetsDir).filter(f => /\.(png|jpg)$/i.test(f));

Promise.all(files.map(async (file) => {
  const input = path.join(assetsDir, file);
  const output = path.join(assetsDir, file.replace(/\.(png|jpg)$/i, '.webp'));
  const stat = fs.statSync(input);
  const originalSize = stat.size;

  try {
    await sharp(input)
      .webp({ quality: 80, effort: 6 })
      .toFile(output);

    const newStat = fs.statSync(output);
    const saved = ((1 - newStat.size / originalSize) * 100).toFixed(1);
    console.log(`${file}: ${(originalSize/1024).toFixed(1)}KB → ${(newStat.size/1024).toFixed(1)}KB (${saved}% smaller)`);
  } catch (err) {
    console.error(`Failed ${file}:`, err.message);
  }
})).then(() => console.log('\nDone. Replace PNGs with WebP in code for even smaller APK.'));
