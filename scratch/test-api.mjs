import fs from 'fs';
fetch("http://localhost:3000/api/v1/ai/chat", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ message: "hello", preferredProvider: "puter" })
}).then(r => r.text().then(d => {
  fs.writeFileSync('scratch/error.html', d);
  console.log('Saved error HTML to scratch/error.html. Status:', r.status);
})).catch(console.error);
