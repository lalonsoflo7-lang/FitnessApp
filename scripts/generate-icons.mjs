// Renders the PWA PNG icons from an inline SVG using the local Chromium (Playwright).
// Usage: node scripts/generate-icons.mjs
import { chromium } from '@playwright/test';
import { writeFileSync } from 'node:fs';

const mark = (scale) => `
  <g transform="translate(256 256) scale(${scale}) translate(-256 -256)">
    <g fill="#4be3a3">
      <rect x="96" y="316" width="72" height="100" rx="16"/>
      <rect x="220" y="236" width="72" height="180" rx="16"/>
      <rect x="344" y="140" width="72" height="276" rx="16"/>
    </g>
    <path d="M110 250 L250 150 L330 190 L410 96" fill="none" stroke="#eef1f5" stroke-width="26" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M356 92 L414 92 L414 150" fill="none" stroke="#eef1f5" stroke-width="26" stroke-linecap="round" stroke-linejoin="round"/>
  </g>`;

const svg = ({ rounded, scale }) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
    <rect width="512" height="512" ${rounded ? 'rx="112"' : ''} fill="#0e1116"/>${mark(scale)}</svg>`;

const targets = [
  { file: 'public/pwa-192x192.png', size: 192, rounded: true, scale: 1 },
  { file: 'public/pwa-512x512.png', size: 512, rounded: true, scale: 1 },
  // Maskable: full-bleed background, artwork inside the 80% safe zone.
  { file: 'public/maskable-icon-512x512.png', size: 512, rounded: false, scale: 0.72 },
  // iOS applies its own mask; keep it full-bleed.
  { file: 'public/apple-touch-icon.png', size: 180, rounded: false, scale: 0.86 },
];

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
});
const page = await browser.newPage();
for (const t of targets) {
  await page.setViewportSize({ width: t.size, height: t.size });
  await page.setContent(
    `<html><body style="margin:0;background:transparent">${svg(t).replace(
      'width="512" height="512"',
      `width="${t.size}" height="${t.size}"`,
    )}</body></html>`,
  );
  const buf = await page.screenshot({
    omitBackground: true,
    clip: { x: 0, y: 0, width: t.size, height: t.size },
  });
  writeFileSync(t.file, buf);
  console.log('wrote', t.file);
}
await browser.close();
