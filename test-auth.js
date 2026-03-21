const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 300 });
  const page = await browser.newPage();

  // Capture console errors
  page.on('console', msg => {
    if (msg.type() === 'error') console.log('[console error]', msg.text());
  });
  page.on('pageerror', err => console.log('[page error]', err.message));

  console.log('→ Opening app...');
  await page.goto('http://localhost:3000');
  await page.waitForTimeout(2000);

  const url1 = page.url();
  const title = await page.title();
  console.log('URL:', url1, '| Title:', title);

  // Screenshot of initial state
  await page.screenshot({ path: '/tmp/auth-1-initial.png', fullPage: true });

  // Try to find the auth form
  const emailInput = await page.locator('input[type="email"]').first();
  if (await emailInput.isVisible()) {
    console.log('→ Auth form visible, trying login with test credentials...');
    await emailInput.fill('test@test.com');
    await page.locator('input[type="password"]').fill('password123');
    await page.screenshot({ path: '/tmp/auth-2-filled.png' });

    // Click the submit button
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(3000);

    const url2 = page.url();
    console.log('After login URL:', url2);
    await page.screenshot({ path: '/tmp/auth-3-after-login.png', fullPage: true });

    // Check what's on screen
    const bodyText = await page.locator('body').innerText();
    console.log('Body text (first 300):', bodyText.slice(0, 300));
  } else {
    console.log('→ No auth form found, already logged in or different state');
    const bodyText = await page.locator('body').innerText();
    console.log('Body text (first 300):', bodyText.slice(0, 300));
  }

  await page.screenshot({ path: '/tmp/auth-final.png', fullPage: true });
  console.log('Screenshots saved to /tmp/auth-*.png');

  await browser.close();
})();
