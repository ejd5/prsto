const { chromium } = require('playwright-core');

(async () => {
  const browser = await chromium.launch({ executablePath: '/home/z/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome', args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  const errors = [];
  const consoleMessages = [];

  page.on('console', msg => consoleMessages.push('[' + msg.type() + '] ' + msg.text()));
  page.on('pageerror', err => errors.push(err.message));
  page.on('requestfailed', req => errors.push('FAILED: ' + req.url() + ' - ' + req.failure().errorText));

  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(5000);

  console.log('=== ERRORS ===');
  errors.forEach(e => console.log(e));
  console.log('=== CONSOLE (errors only) ===');
  consoleMessages.filter(m => m.includes('[error]')).forEach(m => console.log(m));

  const bodyText = await page.evaluate(() => document.body.innerText.slice(0, 200));
  console.log('=== BODY TEXT ===');
  console.log(bodyText);

  await page.screenshot({ path: '/home/z/my-project/check-errors.png' });
  await browser.close();
})();
