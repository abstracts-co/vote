import { createServer } from 'node:http';
import { existsSync, readFileSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import puppeteer from 'puppeteer-core';

const root = new URL('..', import.meta.url).pathname;
const chrome = [process.env.CHROME_BIN, '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find((p) => p && existsSync(p));
if (!chrome) { console.log('No Chrome found. Run npx @puppeteer/browsers install chrome-headless-shell@stable, then set CHROME_BIN to it.'); process.exit(2); }
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.webp': 'image/webp', '.md': 'text/plain' };
const server = createServer((req, res) => {
  const file = join(root, normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)));
  if (!file.startsWith(root) || !existsSync(file)) { res.statusCode = 404; return res.end(); }
  res.setHeader('Content-Type', TYPES[extname(file)] ?? 'application/octet-stream');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.end(readFileSync(file));
});
await new Promise((done) => server.listen(0, '127.0.0.1', done));
const base = `http://127.0.0.1:${server.address().port}`;
const b = await puppeteer.launch({ executablePath: chrome, headless: 'shell', args: ['--enable-webgl', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader', ...(process.getuid?.() === 0 ? ['--no-sandbox'] : []), ...(process.env.CHROME_FLAGS?.split(' ') ?? [])] });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
let failed = 0;
const check = (ok, label, extra = '') => { if (!ok) failed += 1; console.log(`${ok ? 'PASS' : 'FAIL'} ${label}${extra ? ` (${String(extra).slice(0, 140)})` : ''}`); };
const title = (f) => f.$eval('.win h2', (e) => e.textContent).catch(() => null);
const spot = (p, a) => p.evaluate((a) => { const s = window.ELECTION.SHAPES.find((x) => x.abbr === a), m = scene.project(s.cx, s.cy, scene.topOf(a)), c = document.querySelector('canvas.gl').getBoundingClientRect(); return { x: c.left + m.x, y: c.top + m.y }; }, a);

for (const [name, width, height, touch] of [['full screen', 1280, 800, false], ['column', 618, 900, false], ['phone', 390, 844, true]]) {
  const p = await b.newPage(), errors = [];
  p.on('pageerror', (e) => errors.push(e.message));
  await p.setViewport({ width, height, hasTouch: touch, isMobile: touch });
  await p.goto(`${base}/index.html`); await wait(1500);
  check(await p.evaluate(() => typeof scene !== 'undefined' && !!scene), `${name}: the 3D map started`);
  check(!!(await p.$('.intro')), `${name}: the opener shows first`);
  await p.click('[data-intro-page="1"]'); await wait(500);
  check(!!(await p.$('.mm')) && await p.$eval('.itop h2', (e) => e.textContent) === 'Senate', `${name}: a card opens its screen`);
  await p.click('.seg [data-when="next"]'); await wait(900);
  check(await p.$eval('[data-num="senate:0"]', (e) => e.textContent) === String(await p.evaluate(() => window.ELECTION.DATA.now.power.senate.next[0])), `${name}: January changes the numbers`);
  await p.click('.iclose'); await wait(500);
  check(!(await p.$('.intro')), `${name}: the opener closes`);
  for (const tab of (await p.$$eval('[data-tab]', (l) => l.map((e) => e.dataset.tab))).filter((t) => t !== 'now')) {
    await p.click(`[data-tab="${tab}"]`); await wait(250);
    check((await p.$eval('.win .winbody', (e) => e.innerText.length).catch(() => 0)) > 0, `${name}: the ${tab} tab shows its panel`);
  }
  await p.click('[data-tab="now"]'); await wait(400);
  check(!!(await p.$('.intro')), `${name}: Now opens the opener again`);
  await p.click('.iclose'); await wait(500);
  const at = await spot(p, 'KS');
  if (touch) await p.touchscreen.tap(at.x, at.y); else { await p.mouse.move(at.x, at.y); await wait(200); await p.mouse.move(at.x + 1, at.y); await wait(400); check(await p.$eval('.card', (e) => e.classList.contains('on')), `${name}: hover shows a card`); await p.mouse.click(at.x, at.y); }
  await wait(1800);
  check(await title(p) === 'Kansas', `${name}: a press on a state opens it`, await title(p));
  check(await p.evaluate(() => !!window.COUNTYGEO?.KS), `${name}: counties load`);
  const groups = await p.$$eval('.win h3.group', (l) => l.map((e) => e.textContent));
  check(['In office', 'Taking office', 'Running'].every((g) => groups.includes(g)), `${name}: the three groups show`);
  await p.evaluate(() => document.querySelector('.win [data-open-official], .win [data-open-person]').click()); await wait(400);
  check(await title(p) !== 'Kansas' && (await p.$eval('.win .winbody', (e) => e.innerText.length)) > 20, `${name}: a person page opens`, await title(p));
  await p.click('.reset'); await wait(1400);
  check(await p.$eval('.reset', (e) => e.hidden), `${name}: reset goes back to the whole map`);
  if (!touch) {
    const before = await p.evaluate(() => scene.project(487, 300, 0).x), from = await spot(p, 'KS');
    await p.mouse.move(from.x, from.y); await p.mouse.down(); await p.mouse.move(from.x + 50, from.y + 20, { steps: 5 }); await p.mouse.up(); await wait(300);
    check(Math.abs(await p.evaluate(() => scene.project(487, 300, 0).x) - before) > 20, `${name}: holding the mouse pans`);
    await p.click('.reset'); await wait(1000);
  }
  if (width < 760) check(await p.evaluate(() => document.querySelector('.win').getBoundingClientRect().top >= document.querySelector('.stage').getBoundingClientRect().bottom - 1), `${name}: the panel sits under the map`);
  check(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${name}: no sideways scroll`);
  check(!errors.length, `${name}: no page errors`, errors[0]);
  await p.close();
}

const s = await b.newPage(), sandboxErrors = [];
s.on('pageerror', (e) => sandboxErrors.push(e.message));
await s.setViewport({ width: 700, height: 900 });
await s.goto(`${base}/source/preview.html`); await wait(2500);
const frameHeight = await s.$eval('iframe', (f) => f.getBoundingClientRect().height);
check(frameHeight > 400 && frameHeight <= 6000, 'sandbox: the page reports its height, within the 6000px cap', frameHeight);
check(!sandboxErrors.length, 'sandbox: no storage or origin errors', sandboxErrors[0]);
const manifest = JSON.parse(readFileSync(join(root, 'artifact.json'), 'utf8'));
check(!manifest.display, 'artifact.json does not choose how it opens');
await b.close(); server.close();
console.log(failed ? `${failed} failed` : 'smoke passed');
process.exit(failed ? 1 : 0);
