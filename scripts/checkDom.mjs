#!/usr/bin/env node
/**
 * DOM inspector - opens app at http://127.0.0.1:3005/, logs in, extracts property name element info
 */
import { chromium } from 'playwright';

const BASE = process.env.BASE_URL || 'http://127.0.0.1:3005/';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(2000);

    const pinInput = page.locator('#pin-input, input[type="password"]').first();
    if (await pinInput.isVisible().catch(() => false)) {
      await page.locator('#employee-id-input, input[autocomplete="username"]').first().fill('GM001');
      await pinInput.fill('1234');
      await page.locator('#sign-in-button, button:has-text("Access System")').first().click({ timeout: 5000 });
      await page.waitForTimeout(5000);
    }

    const propertySpan = page.locator('span:has-text("Property:")').first();
    const count = await propertySpan.count();
    const report = { url: BASE, found: count, elements: [] };

    for (let i = 0; i < count; i++) {
      const el = page.locator('span:has-text("Property:")').nth(i);
      report.elements.push({
        text: await el.textContent().then(t => t?.trim()),
        title: await el.getAttribute('title'),
        box: await el.boundingBox(),
        styles: await el.evaluate((e) => {
          const s = getComputedStyle(e);
          return { overflow: s.overflow, minWidth: s.minWidth, width: s.width, whiteSpace: s.whiteSpace };
        })
      });
    }

    console.log(JSON.stringify(report, null, 2));
    await page.screenshot({ path: 'scripts/dom-check.png' });
    console.log('\nScreenshot saved to scripts/dom-check.png');

  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

main();
