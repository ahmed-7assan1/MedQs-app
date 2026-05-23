const puppeteer = require('puppeteer');

(async () => {
  console.log('Launching browser...');
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  page.on('console', msg => {
    console.log(`[Browser Console ${msg.type().toUpperCase()}]:`, msg.text());
  });

  page.on('pageerror', err => {
    console.log('[Browser Error]:', err.stack || err.toString());
  });

  page.on('requestfailed', request => {
    console.log(`[Request Failed]: ${request.url()} - ${request.failure()?.errorText}`);
  });

  console.log('Navigating to http://localhost:8081...');
  
  try {
    await page.goto('http://localhost:8081', { waitUntil: 'networkidle2', timeout: 15000 });
    console.log('Page loaded.');
  } catch (err) {
    console.log('Navigation error:', err.message);
  }

  setTimeout(async () => {
    await browser.close();
  }, 5000);
})();
