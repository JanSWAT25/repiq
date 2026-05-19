// Script to generate PWA icons
// Run: node scripts/generate-icons.mjs
import { createCanvas } from 'canvas';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function generateIcon(size, maskable = false) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const padding = maskable ? size * 0.1 : 0;
  const innerSize = size - padding * 2;

  // Background
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(0, 0, size, size);

  // Red circle
  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, (innerSize / 2) * 0.85, 0, Math.PI * 2);
  ctx.fill();

  // "R" letter
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${Math.round(innerSize * 0.5)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('R', size / 2, size / 2);

  return canvas.toBuffer('image/png');
}

const iconsDir = join(__dirname, '../public/icons');
mkdirSync(iconsDir, { recursive: true });

writeFileSync(join(iconsDir, 'icon-192.png'), generateIcon(192));
writeFileSync(join(iconsDir, 'icon-512.png'), generateIcon(512));
writeFileSync(join(iconsDir, 'icon-512-maskable.png'), generateIcon(512, true));

console.log('Icons generated in public/icons/');
