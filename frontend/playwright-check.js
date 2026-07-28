const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const urls = ['http://localhost:3002/login','http://localhost:3002/register','http://localhost:3002/dashboard','http://localhost:3002/admin'];
  const results = [];
  for (const url of urls) {
    const r = { url };
    try {
      const resp = await page.goto(url, { waitUntil: 'networkidle' });
      r.status = resp.status();
      r.title = await page.title();
      r.console = [];
      page.on('console', msg => r.console.push({type: msg.type(), text: msg.text()}));
      r.html = await page.content();
      r.scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      r.clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      r.horizontalScroll = r.scrollWidth > r.clientWidth;
    } catch (err) {
      r.error = err.message;
    }
    results.push(r);
  }
  console.log(JSON.stringify(results, null, 2));
  await browser.close();
})();
