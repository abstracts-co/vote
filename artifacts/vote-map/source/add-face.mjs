import { readFileSync, renameSync, writeFileSync } from 'node:fs';
import sharp from 'sharp';
const here = (f) => new URL(f, import.meta.url).pathname;
const [id, image, source, license, author] = process.argv.slice(2);
if (!id || !image || !source || !license) { console.log('npm run face -- "<official id or presidential name>" <image file> "<source url>" "<license>" ["<author>"]'); process.exit(1); }
if (!/^https:\/\//.test(source)) { console.log('The source must be an https link.'); process.exit(1); }
const file = here('data.json'), sheet = here('../faces.webp'), D = JSON.parse(readFileSync(file, 'utf8')), F = D.faces;
if (!D.officials?.[id] && !D.people?.some((p) => p.name === id)) { console.log(`No official or presidential name matches ${id}.`); process.exit(1); }
const CELL = 96, COLS = F.cols, used = new Set(Object.values(F.map).map(([x, y]) => `${x},${y}`));
let at = F.map[id];
for (let i = 0; !at; i++) { const cell = [i % COLS, Math.floor(i / COLS)]; if (!used.has(cell.join())) at = cell; }
const old = await sharp(sheet).metadata(), height = Math.max(old.height, (at[1] + 1) * CELL);
const face = await sharp(image).resize(CELL, CELL, { fit: 'cover', position: 'top' }).jpeg({ quality: 82 }).toBuffer();
const base = await sharp(sheet).extend({ bottom: height - old.height, background: '#888888' }).png().toBuffer();
await sharp(base).composite([{ input: face, left: at[0] * CELL, top: at[1] * CELL }]).webp({ quality: 72 }).toFile(`${sheet}.tmp`);
renameSync(`${sheet}.tmp`, sheet);
F.map[id] = at; F.credit[id] = { source, license, author: author ?? null };
writeFileSync(file, JSON.stringify(D, null, 1));
console.log(`${id} is in cell ${at.join(', ')}. Check the photo on their page, then run npm run build.`);
