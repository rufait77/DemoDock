// Capture this project's own UI for README and social-preview assets.
// Start `npm run preview` before running this script.
import { chromium } from '@playwright/test';
import { mkdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { root } from './scaffold.mjs';
const base = process.env.DEMODOCK_URL || 'http://127.0.0.1:4173';
const output = join(root, 'docs/assets');
await mkdir(output, { recursive: true });
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 }, deviceScaleFactor: 1 });
  await page.goto(`${base}/demo`);
  await page.getByRole('button', { name: 'Open Brand website', exact: true }).waitFor();
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: join(output, 'playground.png') });
  await page.goto(base);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: join(output, 'homepage.png'), fullPage: true });
  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await mobile.goto(`${base}/demo`);
  await mobile.getByRole('button', { name: 'Open Brand website', exact: true }).waitFor();
  await mobile.evaluate(() => document.fonts.ready);
  await mobile.screenshot({ path: join(output, 'mobile.png'), fullPage: true });
  const social = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  const preview = (await readFile(join(output, 'playground.png'))).toString('base64');
  await social.setContent(`<!doctype html><html><head><style>
    *{box-sizing:border-box}body{margin:0;background:#f7f7ef;color:#223b2e;font-family:Arial,sans-serif;width:1200px;height:630px;overflow:hidden}.brand{position:absolute;left:62px;top:46px;font-size:28px;font-weight:700;letter-spacing:-1px}.logo{display:inline-flex;border-radius:11px;background:#243e30;color:#dbf69f;width:38px;height:38px;align-items:center;justify-content:center;margin-right:12px}main{position:absolute;left:62px;top:157px;width:560px}h1{font-size:72px;line-height:1.03;letter-spacing:-4px;margin:0 0 27px}h1 span{color:#70814c}p{font-size:22px;line-height:1.5;max-width:420px;color:#687365}.tag{display:inline-block;background:#d9edb6;padding:12px 17px;border-radius:8px;font-weight:600;font-size:15px;margin-top:14px}.preview{position:absolute;top:140px;left:650px;width:820px;height:546px;transform:rotate(-5deg);border:8px solid white;border-radius:20px;box-shadow:0 20px 70px #253e3029;overflow:hidden}.preview img{width:100%}footer{position:absolute;bottom:42px;left:62px;font-size:16px;color:#687365}
  </style></head><body><div class="brand"><span class="logo">d.</span>DemoDock</div><main><h1>Your app.<br><span>Their playground.</span></h1><p>Resettable product demos.<br>Made for people to try.</p><div class="tag">Open source · TypeScript · MIT</div></main><div class="preview"><img src="data:image/png;base64,${preview}"/></div><footer>demodock.rufaitlabs.cloud</footer></body></html>`);
  await social.screenshot({ path: join(root, 'apps/web/public/social-card.png') });
  console.log('Captured desktop, mobile, homepage, and social preview assets.');
} finally { await browser.close(); }
