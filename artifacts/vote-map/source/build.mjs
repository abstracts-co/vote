import { readFileSync, writeFileSync } from 'node:fs';
import { build } from 'esbuild';
const here = (f) => new URL(f, import.meta.url).pathname;
const DATA = JSON.parse(readFileSync(here('data.json'), 'utf8')), SHAPES = JSON.parse(readFileSync(here('states.json'), 'utf8'));
writeFileSync(here('../data.js'), `window.ELECTION=${JSON.stringify({ DATA, SHAPES }).replace(/</g, '\\u003c')};`);
await build({ entryPoints: [here('scene.js')], bundle: true, minify: true, format: 'iife', globalName: 'MapScene', outfile: here('../map.js'), logLevel: 'warning' });
const name = Object.fromEntries(SHAPES.map((s) => [s.abbr, s.name]));
const STATUS = { filed: 'Filed', considering: 'Considering', ruled_out: 'Said no', unstated: "Hasn't said" };
const out = [`# American politics map`, ``, `Who is in office, who is taking office, who is running, what they stand for and how far left or right they lean. Updated ${DATA.updated}. Election Day is ${DATA.facts[0].value}.`, ``];
const P = DATA.now?.power;
if (P) out.push(`## Who holds power`, ``, `Senate: ${P.senate.now.join('-')} now, ${P.senate.next.join('-')} in January (Democrats first, unofficial). House: ${P.house.now.join('-')} now, ${P.house.next.join('-')} in January. Governors: ${P.governors.now.join('-')} now, ${P.governors.next.join('-')} in January.`, ``);
out.push(`## President`, ``);
for (const p of [...DATA.people].sort((a, b) => a.name.split(' ').at(-1).localeCompare(b.name.split(' ').at(-1)))) {
  out.push(`### ${p.name}`, ``, `${p.role}. ${STATUS[p.status] ?? ''}.`, ``);
  if (p.why?.text) out.push(p.why.text, ``);
  for (const v of Object.values(p.issues ?? {})) if (v?.text) out.push(`- ${v.text}`);
  out.push(``);
}
out.push(`## States`, ``);
for (const a of Object.keys(DATA.offices ?? {}).sort((x, y) => name[x].localeCompare(name[y]))) {
  const o = DATA.offices[a], st = DATA.story?.[a], who = (l) => (l ?? []).filter((x) => x.g === 'top').map((x) => DATA.officials[x.id]?.name).filter(Boolean).join(', ') || 'None found';
  out.push(`### ${name[a]}`, ``);
  if (st?.summary) out.push(st.summary, ``);
  out.push(`In office: ${who(o.in_office)}.`, `Taking office: ${who(o.taking_office)}.`, `Running: ${who(o.running)}.`, ``);
}
writeFileSync(here('../content.md'), `${out.join('\n')}\n`);
console.log('built');
