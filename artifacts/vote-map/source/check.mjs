import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
const here = (f) => new URL(f, import.meta.url).pathname, root = here('..');
const D = JSON.parse(readFileSync(here('data.json'), 'utf8')), S = JSON.parse(readFileSync(here('states.json'), 'utf8'));
const fail = [], warn = [];
const NOTE = /\b(not confirmed|was confirmed|were confirmed|fetched|search snippet|research pass|first pass|Frontloading|this source)\b/i;
const url = (u, where) => { for (const x of [u].flat()) if (x != null && !/^https:\/\//.test(x)) fail.push(`${where}: source is not https: ${x}`); };
const text = (t, where) => { if (t && NOTE.test(t)) fail.push(`${where}: research note in public text: ${String(t).slice(0, 80)}`); };
for (const s of S) {
  const a = s.abbr, o = D.offices?.[a];
  if (!D.electoral?.[a]) fail.push(`${a}: no electoral votes`);
  if (!o) { fail.push(`${a}: no office groups`); continue; }
  if (!o.in_office?.length) fail.push(`${a}: nobody in office`);
  if (!D.story?.[a]?.summary) warn.push(`${a}: no summary`);
  if (!D.voter?.[a]?.vote_gov) warn.push(`${a}: no register link`);
  if (a !== 'DC' && !D.colors?.[a]) fail.push(`${a}: no map color`);
  for (const g of ['in_office', 'taking_office', 'running']) for (const x of o[g] ?? []) if (!D.officials?.[x.id]) fail.push(`${a}: ${x.id} has no page`);
}
for (const o of Object.values(D.officials ?? {})) {
  for (const s of o.stances ?? []) { if (!s.source) fail.push(`${o.id}: stance has no source`); url(s.source, o.id); text(s.text, o.id); }
  if (o.est && (Math.abs(o.est.lean) > 1 || !o.est.basis)) fail.push(`${o.id}: bad lean estimate`);
}
for (const p of D.people ?? []) {
  if (!['filed', 'considering', 'ruled_out', 'unstated'].includes(p.status)) fail.push(`${p.name}: bad status`);
  for (const v of Object.values(p.issues ?? {})) if (v?.text) { if (!v.source) fail.push(`${p.name}: issue has no source`); url(v.source, p.name); text(v.text, p.name); }
  for (const c of p.criticism ?? []) { if (!c.who || !c.source) fail.push(`${p.name}: criticism needs who and source`); text(c.text, p.name); }
  text(p.why?.text, p.name);
}
const walk = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.name === 'node_modules' ? [] : e.isDirectory() ? walk(join(d, e.name)) : [join(d, e.name)]));
const files = walk(root), total = files.reduce((t, f) => t + statSync(f).size, 0);
for (const f of files) if (statSync(f).size > 5 * 1024 * 1024) fail.push(`${f}: over 5 MB`);
if (files.length > 100) fail.push(`${files.length} files, over 100`);
if (total > 10 * 1024 * 1024) fail.push(`${(total / 1048576).toFixed(1)} MB, over 10 MB`);
const html = readFileSync(join(root, 'index.html'), 'utf8');
if (/transition:\s*all/.test(html)) fail.push('index.html uses transition: all');
const A = Object.values(D.officials ?? {}), pct = (n) => `${n} of ${A.length}`;
console.log(`people ${A.length}; stances ${pct(A.filter((o) => o.stances?.length).length)}; lean ${pct(A.filter((o) => o.score || o.est).length)}; faces ${pct(A.filter((o) => D.faces?.map?.[o.id]).length)}`);
console.log(`states with someone running ${S.filter((s) => D.offices?.[s.abbr]?.running?.length).length} of ${S.length}; files ${files.length}; ${(total / 1048576).toFixed(1)} MB`);
warn.slice(0, 20).forEach((w) => console.log('warn', w));
if (fail.length) { fail.slice(0, 40).forEach((f) => console.log('FAIL', f)); console.log(`${fail.length} failures`); process.exit(1); }
console.log('check passed');
