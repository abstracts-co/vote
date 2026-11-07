import { readFileSync } from 'node:fs';
const here = (f) => new URL(f, import.meta.url).pathname;
const D = JSON.parse(readFileSync(here('data.json'), 'utf8')), S = JSON.parse(readFileSync(here('states.json'), 'utf8'));
const args = process.argv.slice(2);
if (!args.length) { console.log('npm run find -- <text>   every place a name, id or phrase appears in data.json\nnpm run find -- --gaps   what is still missing'); process.exit(0); }
if (args[0] === '--gaps') {
  const A = Object.values(D.officials), show = (label, list) => console.log(`\n${label} (${list.length})\n${list.slice(0, 60).join('; ')}${list.length > 60 ? '; ...' : ''}`);
  show('No stances', A.filter((o) => !o.stances?.length && !o.person).map((o) => o.id));
  show('No lean: governors and senators', A.filter((o) => !o.score && !o.est && o.titles?.some((t) => /^(Governor|Senator)/.test(t))).map((o) => o.id));
  show('No lean: everyone else', A.filter((o) => !o.score && !o.est && !o.titles?.some((t) => /^(Governor|Senator)/.test(t))).map((o) => o.id));
  show('No face', A.filter((o) => !D.faces?.map?.[o.id]).map((o) => o.id));
  show('Presidential names with no lean', D.people.filter((p) => !p.score && !p.est).map((p) => p.name));
  show('States with nobody under Running', S.filter((s) => !D.offices?.[s.abbr]?.running?.length).map((s) => s.abbr));
  show('States with no map shape', S.filter((s) => !s.polys.length).map((s) => s.abbr));
  process.exit(0);
}
const term = args.join(' ').toLowerCase(), hits = [];
const walk = (v, path) => {
  if (Array.isArray(v)) return v.forEach((x, i) => walk(x, `${path}[${i}]`));
  if (v && typeof v === 'object') {
    for (const [k, x] of Object.entries(v)) {
      const at = /^[A-Za-z_]\w*$/.test(k) ? `${path}.${k}` : `${path}[${JSON.stringify(k)}]`;
      if (k.toLowerCase().includes(term)) hits.push(`${at}  (key)`);
      walk(x, at);
    }
    return;
  }
  if (typeof v === 'string' && v.toLowerCase().includes(term)) hits.push(`${path}  ${v.length > 110 ? `${v.slice(0, 110)}...` : v}`);
};
walk(D, 'DATA');
console.log(hits.slice(0, 80).join('\n') || 'Nothing found');
if (hits.length > 80) console.log(`...and ${hits.length - 80} more. Narrow the search.`);
