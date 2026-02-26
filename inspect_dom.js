import puppeteer from 'puppeteer';

(async () => {
    try {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();

        await page.goto('http://localhost:3002', { waitUntil: 'networkidle0', timeout: 30000 });

        console.log("=== ERROR OVERLAY (vite-error-overlay) ===");
        const errorText = await page.evaluate(() => {
             const viteOverlay = document.querySelector('vite-error-overlay');
             return viteOverlay ? viteOverlay.shadowRoot?.textContent || 'Found overlay but could not extract text' : 'No Vite error overlay found';
        });
        console.log(errorText);
        
        console.log("=== CONSOLE ERRORS ===");
        page.on('console', msg => {
            if (msg.type() === 'error') {
                 console.log(msg.text());
            }
        });

        console.log("=== DOM BODY TEXT ===");
        const bodyText = await page.evaluate(() => document.body.innerText);
        console.log(bodyText ? bodyText.substring(0, 500) + '...' : 'Body is empty');

        await browser.close();
    } catch (error) {
        console.error("Puppeteer encountered an error:", error);
    }
})();
