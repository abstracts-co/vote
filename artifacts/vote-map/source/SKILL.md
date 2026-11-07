---
name: edit-vote-map
description: Change the a/vote American politics map on Abstracts, including its facts, people, 3D map, counties, tabs, windows, odds and lean bars. Use whenever a member wants to update who's in office or running, add or correct a person, stance, photo or result, add a tab or panel, change how the map looks or moves, or build their own version of the map, even if they only say "the vote map" or "a/vote".
---

# Edit the vote map

The map is a neutral place to see the state of American politics: who is in office, who is taking office, who is running, what they stand for and how far left or right they lean. It never tells anyone who to support.

Use the feature map below to go straight to the right code. `index.html` has very long lines, so search it with `grep -n "const statePage" index.html | cut -c1-120`, and never print the file whole.

## Quick start

The artifact is `artifacts/vote-map/`. Read the community first with `get_community`, and follow the [Abstracts kit](https://abstracts.co/kit/abstracts/SKILL.md).

```sh
cd artifacts/vote-map/source
npm install
npm run find -- "Talarico"     # every place a name, id or phrase appears in the data
npm run find -- --gaps         # what's still missing, a good place to contribute
# make the change
npm run build                  # regenerates ../data.js, ../map.js and ../content.md
npm run check                  # data, sources and upload limits
npm run smoke                  # real clicks in headless Chrome at 3 widths
rm -rf node_modules package-lock.json   # before uploading: uploads are limited to 100 files
```

To look at it, run `npx --yes http-server -p 8000 --cors` in the artifact folder. `/source/preview.html` is the sandboxed About column, as Abstracts shows it. `/index.html` opened directly is the full-screen layout.

## The files

| File | What it is | Edit it? |
|---|---|---|
| `index.html` | All CSS, windows, cards, tabs and page logic | Yes, directly. No build step |
| `source/scene.js` | The three.js map | Yes, then build |
| `source/data.json` | Every fact on the map | Yes, then build |
| `source/states.json` | State shapes | Rarely |
| `data.js`, `map.js`, `content.md` | Built from `source/` | Never by hand; a build overwrites them |
| `counties/XX.js` | County shapes per state, loaded when a state opens | Rarely |
| `faces.webp` | Photo sheet: 32 columns of 96px cells | Only with `npm run face` |
| `preview.webp` | Card image | When the look changes |
| `artifact.json` | Title and entry | Rarely, and never add `display` |

## Feature map

Names are functions in `index.html` unless marked `scene`. Data paths are under `DATA` in `source/data.json`.

| What people see | Where it's drawn | Data it reads |
|---|---|---|
| Opener window: headline, Today and January, Senate, House, Governors | `openIntro`, `closeIntro`, `introPage`, `introWhen`, `introSync`, `overviewHtml`, `detailHtml`, `leadHtml` | `now.power`, `now.as_of` |
| Half-circle seat charts | `makeArc`, `seatLayout`, `tweenNum` | `now.power.XX.now`, `.next` |
| Opener state maps and who changes party | `SEATS`, `mapSvg`, `mapFill`, `mapKey`, `mapUpdate`, `mapTip`, `flipsHtml` | `offices`, `midterm`, `now.power.XX.uncalled_states` |
| Tabs | `render`, `TABS`, `moveThumb`, `setTab` | |
| State colors | `tone`, then `paintScene`, `scene.style` | `colors`, `senate`, `governors`, `calendar` |
| State heights | `rise` | `electoral`, `senate`, `governors`, `calendar` |
| Names and dates on the map, by width | `labelsFor`, `stateLabel`, `tagMode`, `buildTags`, `moveTags`, `OFFSHORE` | `senate`, `governors`, `calendar` |
| Hover card | `hoverCard`, `hoverAt`, `placeCard`, `followCard` | `offices`, `colors` |
| Click a state | canvas `click` listener, `show`, `syncScene`, `scene.open` | |
| Pan, zoom and reset, by mouse, touch or buttons | canvas `pointer*`, `touch*` and `wheel` listeners, `syncReset`, `scene.pan`, `scene.zoomAt`, `scene.resetPan` | |
| Today, January, 2026 vote, 2028 control on the map | `WHENS`, `ui.when`, `setWhen`, `syncCtl`, `tone`, `controlOf`, `controlTone`, `raisedNow`, `scene.raise` | `offices`, `midterm`, `colors` |
| State search, including DC | `setFinder`, `finderRows` | |
| Key under the map | `keyHtml` | |
| President map colors | `tone`, `oddsOf` | `markets.states`, `markets.events` |
| Link to a state | `hashState`, the link in `windowHtml` | |
| County view | `syncScene`, `loadCounties`, `countyResult`, `scene.counties`, `scene.pickCounty` | `county`, `pop`, `counties/XX.js` |
| Panel for each tab | `listPage` | |
| Panel under the Now map: counter, rings, dot grid, big pair, bars, timeline | `nowPage`, `ring`, `pict`, `pairBig`, `seatDots`, `hbar` | `now`, `timeline`, `facts` |
| Numbers box at the bottom left, opens the opener | `powerHtml` | `now.power` |
| President tab: wall of faces, or rows when an issue is picked | `listPage`, `personCell`, `personRow`, `pollChart`, `hbar` | `people`, `polls`, `national`, `third`, `thirdTerm` |
| Primaries tab: two timelines side by side | `listPage`, `tile` | `calendar` |
| Senate and Governor tabs | `listPage`, `pairBig`, `seatDots` | `senate`, `governors` |
| State page | `statePage`, `raceTile`, `tile`, `stat`, `officeSec` | `offices`, `midterm`, `story`, `voter`, `redistricting` |
| In office, Taking office, Running | `officeSec`, `officialRow`, `shortTitle` | `offices.XX.in_office`, `.taking_office`, `.running` |
| Person page, presidential | `personPage`, and the `pro*` helpers | `people[]`, `people[].bio`, `officials[].stances` |
| Person page, everyone else | `officialPage`, `stanceBlocks`, and the `pro*` helpers | `officials["XX\|Name"]`, `.bio` |
| Profile parts: head, stats, committees, background, offices, links | `proHead`, `proStats`, `proCommittees`, `proFacts`, `proTimeline`, `proLinks`, `winTile` | `.bio` |
| Lean strip: this person among everyone in their chamber | `leanStrip`, `leanWord` | `.score`, `.est` |
| Lean, a dot on a left-right line, hollow when estimated | `leanOf`, `leanV`, `leanHero`, `leanBlock` | `.score`, `.est` |
| Faces | `face`, `initials`, `photoCredit` | `faces.map`, `faces.credit`, `faces.webp` |
| Polymarket odds | `pm*`: `pmFetch`, `pmRows`, `pmState`, `pmPerson`, `pmPresident`, `pmCongress`, with slugs in `pmSlugs` | `markets` as the fallback |
| Window frame and back button | `windowHtml`, `refreshWindow` | |
| Layout at each width | `phone`, the `max-width: 759px` CSS, `w < 760` in `scene.js` | |
| Column or full screen | `setLayout`, `postHeight`, the `abstractsLayout` listener | |
| Colors and theme | `:root` variables at the top of `index.html` | |
| Lights, tilt, camera, motion | `scene.js`: `place`, `fit`, `aim`, `step` | |

### How the page fits together

- **Opener:** `intro` holds `on`, `page` (0 overview, then the entries of `BODIES`) and `when` (`now` or `next`). While it's open `rise` keeps the map flat, so closing it raises the states. Now, and the numbers box, open it again. The headline uses the data date, `now.as_of`, not the visitor's clock, so stale data can't claim to be today.
- **State:** `ui` holds `tab`, `when`, `stack`, `party`, `issue`, `hover` and `finder`. `ui.when` is `now`, `next`, `vote` or `2028`, and `WHENS` says which ones each tab offers. `ui.stack` is the window history, with entries `{kind:'list'}`, `{kind:'state',id}`, `{kind:'person',id}` and `{kind:'official',id}`.
- **Drawing:** `render()` redraws the bar and window, and calls `syncScene()` to move the map. `refreshWindow()` redraws the window but keeps scroll and open sections; use it after fetched data arrives.
- **Clicks:** one listener on `#app` routes by attribute: `data-tab`, `data-open-state`, `data-open-official`, `data-open-person`, `data-back`, `data-close`, `data-list`, `data-reset`, and for the opener `data-intro`, `data-intro-close`, `data-intro-page`, `data-when`, `data-go-state`, `data-go-official`. Add an attribute and a line there instead of a new listener, because `render()` replaces the markup and would drop one.
- **Two page types:** an official with `person` set opens the presidential `personPage`. Presidential entries are keyed by name; officials are keyed by `XX|Name`, or `US|Name` for national office.
- **The scene:** `MapScene.create(canvas, SHAPES, moveTags)` is stored in the global `scene`. It draws only on demand, so call `wake()` after any change inside `scene.js`. `view.x` eases toward `view.gx` in `step()`, so set the goal, unless it must follow the pointer exactly as `pan` does. Shadows redraw only when `shadowMap.needsUpdate` is set.
- **Coordinates:** shapes, `scene.project(x, y, z)` and `cx`, `cy` use the 975×610 Albers map, not screen pixels.

### Data shapes

```
officials[id].bio  sourced facts, all optional: { born | born_year, birthplace, education: [], work: [], since, termEnd, terms, offices: [{ office, years }],
                     committees: [{ name, role }], website, social: { x, facebook, youtube, instagram } | x, wikipedia, ballotpedia, bioguide, sources: [] }
                   people[].bio is the same record for presidential names who also hold office
officials["TX|Jane Doe"]  { id, name, state, party: "D"|"R"|"I", titles: [], sources: [], leaving, person,
                            stances: [{ issue, text, source }], score, est: { lean, basis } }
offices.TX                { in_office, taking_office, running: [{ g: "top"|"house"|"state", id }], legislature }
people[]                  { name, role, state, party, status, status_quote, status_date, status_source, why, background,
                            issues: { economy_taxes, health_care, immigration, foreign_policy, signature: { text, source } },
                            record, criticism: [{ text, who, source }], offices, signals, labels, caucuses, links, score, est }
senate[]                  { state, holder, party, special, source, plans, plans_source, declared }
governors[]               { state, incumbent, party, source, term_status, status_source, declared }
colors.TX                 { winner, margin_pct }
midterm.TX                { house: { D, R, uncalled }, senate, governor: { winner, party, margin_pct, source }, source, note }
county.TX                 { race, year, source, as_of, counties: { "<FIPS>": [D, R, total, nonParty?] } }
story.TX                  { summary, source, role, role_source, issues: [{ issue, text, source }], measures: [] }
voter.TX                  { mail, mail_source, vote_gov, election_office, same_day, same_day_source, changes }
faces                     { cols, map: { id: [column, row] }, credit: { id: { source, license, author } } }
markets                   { as_of, states: { TX: slug }, events: { slug: { rows: [{ name, p }] } } }
```

## Recipes

**Correct a fact.** Run `npm run find -- "the old text"`, edit that line in `data.json`, and update its `source`. Change `updated` at the top of the file too, because `content.md` shows it.

**Add a person to a state.** Add the record to `officials` with the id `XX|Name`, then add `{ "g": "top", "id": "XX|Name" }` to the right group in `offices.XX`. Use `g: "house"` or `g: "state"` for the folded sections. A record with no entry in `offices` never shows on the map. Presidential names stay out of state Running lists.

**Someone took office or lost.** Move their entry between `in_office`, `taking_office` and `running`, set `leaving` and update `titles`. Update the related `senate`, `governors`, `colors` and `midterm` entries, since the map reads those separately.

**Add a photo.** Confirm who it shows first (see Faces), then run `npm run face -- "XX|Name" photo.jpg "<source url>" "<license>" "<author>"`.

**Add a tab.** Add it to `TABS`, then add a branch in `tone`, `rise`, `labelsFor` and `listPage`. `tone` and `rise` fall through to the Primaries logic, so a tab with no branch gets its colors silently. Fetch any odds from `render()`.

**Add a section to a state or person page.** Add a `<div class="block">` in `statePage` or `personPage`. Lead with a one-line takeaway in `<p class="lead">` or `<h3 class="group">`, put a visual after it, and fold detail in `<details>`. Reuse `meter`, `seatRow`, `hbar`, `compactRes` and `.chip` before writing new markup.

**Add a Polymarket block.** Check the market on `https://gamma-api.polymarket.com/events?slug=<slug>`. Add it to `pmSlugs` or `markets.states`, draw it with `pmParty` or `pmBars`, and request it from `render()` with `pmFetch`.

**Change how the map moves.** Work in `step()` for easing and in `place()` for the camera. Add methods to the `api` object and call them from `index.html`. If you keep a new goal value, add its name to the key list in `step()`.

## Facts

- Every claim gets its own `source`: a page you read and that supports the claim. Search snippets don't count. Use `https` links only.
- Prefer government records and the person's own site, then major and strong local news. Don't cite Wikipedia, fandom wikis, content farms or partisan aggregators.
- Never fill a gap from memory. Leave a field empty rather than guess. "Not found" is an honest answer.
- Use the newest data available, and say which race or year it comes from. Election results stay marked unofficial until certified.
- Write finished public sentences. No notes about the research, such as "not confirmed"; `npm run check` catches common ones.
- Many first views show only the first sentence, through `first()`, so make the first sentence stand alone. `first()` already handles "Sen." and "U.S.".
- Prediction markets aren't sources. Polymarket odds stay in their own labelled blocks with a link and a time, are read live with a saved copy as fallback, use only markets with real bids and asks, and never back up a claim.

## Neutrality

- Treat every person and party the same way, with the same fields and the same rigor. Sort people by last name.
- Never recommend anyone, rank people as better or worse, or write a takeaway that takes a side. A takeaway states what the numbers show.
- Describe what people did. Use their own framing for their goals, and keep any quote under 15 words and exact.
- Criticism names who makes it, comes from a major outlet or official record, and covers documented disputes over conduct or record. Include the person's response when there is one. Never state an unproven allegation as fact.
- Running status has four values, based only on what the person said: `filed`, `considering`, `ruled_out`, `unstated`. Filing alone proves little, since hundreds of people file.

## Lean

- `score` is measured: DW-NOMINATE from [Voteview](https://voteview.com), for members of Congress. Recompute it from Voteview's files, and never type a score by hand. Match on state, district and last name, because surnames collide: new members have wrongly inherited a score this way.
- `est` is only for people with no voting record to measure: governors, candidates and new members. Rate the same five issues for everyone, from -1 to +1 with one scale in both directions: taxes and spending, health, immigration, abortion and guns. Each score needs a source and one line of evidence, and bipartisan service bills (veterans, farm aid, disaster aid) don't set a score.
- `lean` is the plain average of the scored issues, in steps of 0.25. With fewer than three issues, leave it empty and show no bar. Never apply a curve or correction to one side, and never use party, tone or conduct. Show estimates in words ("Leans left", "Leans right", "Near center"), labelled as estimates, and never beside a measured score.
- Lean bars run left for negative and right for positive, and stay visible on every person row and page.

## Faces

A wrong face is the worst mistake on the map. Confirm identity from a page that names the person. Prefer public-domain Congress portraits, then openly licensed images, and record the credit. If you can't confirm it, leave initials.

## UI standards

- **The map is the page.** Everything else opens from it: hover shows a card, a click opens a window and zooms into counties, holding the mouse pans, and a reset button appears once the camera has moved. It sits in place on the About page under the community header, like any artifact, and goes full screen only when someone presses Full screen. Never make it open itself, and don't add a page of text.
- **Vary the form, keep the family.** Pick the form that fits the number: `tile` for a result, `pairBig` for two sides, `seatDots` for seats, `ring` for a share of everyone, `pict` for a split out of 20, `hbar` for a ranking, `.tl` for dates, `.cells` for a group of people. Use the same type sizes, party colors and rounded tiles, and no dividers.
- **Quick glance first.** Each section is a one-line takeaway, then a visual, with detail folded under `details`. No dense paragraphs in the first view. The opener's headline and the few words under each opener title, in `BODIES[].about`, are the only text that explains anything; add no other taglines, hint lines or secondary labels.
- **Write margins in words.** "Won by 5.7% of the vote", through `wonBy`, never "D+5.7". Lean is words and a dot, never a raw score, outside "How lean is measured".
- **Glow and motion.** The map never glows; only data does: the seats and number of the side with the majority, by the numbers, never a preference. Each state is one flat color, never split: a state with one of each party, or a tied delegation, uses `--both`. Motion uses `--out`, only `transform` and `opacity` where possible, and turns off under `prefers-reduced-motion`.
- **Now map color.** Today and January color each state by whoever holds at least two of its three statewide offices: two Senate seats and the governor. All three is dark, two is light, and no majority among called races is gray. Don't color it by House seats; that made states look held by a party that lost statewide. The opener's House screen is the place for seats.
- **Calls change in one place.** When a race is called, update `now.power` and remove the state from `uncalled_states`, or the opener's map and numbers disagree. A House call also moves one seat in `midterm.XX.house`. `npm run check` compares them.
- **Three groups in every state:** In office, Taking office, Running. Show all three, with "None found yet" when one is empty. Don't place presidential candidates on the map by home state.
- **Every person** has a page and a face, or initials if no photo is confirmed. Add a lean bar only when there's a score or a sourced estimate. Every name opens that page.
- **Sources are one click away,** a small ↗ beside each claim, drawn with `src()`.
- **Color:** use the CSS variables in `index.html`, never raw colors in markup. Blue is Democratic, red is Republican, amber is independent; darker means a wider margin. Use one hue for single-series bars and keep labels in text colors. Charts need a legend when they have two or more series.
- **Accessibility:** text contrast of at least 4.5:1, focus states, tap targets of at least 44px on phones, and labels on icon-only buttons. Don't rely on hover alone: everything must work by tap and keyboard.
- **Motion:** animate `transform` and `opacity` for UI, 300ms or less, and respect `prefers-reduced-motion`. Keep hover smooth: update a card only when its subject changes, and redraw shadows only when heights change.
- **Three layouts.** Below 760px the window sits under the map, which covers the About column (about 618px) and phones. `phone()` means that layout, not a phone: a mouse in the column still gets hover cards, so test touch with `(hover: none)` instead.

## Sandbox limits

The page runs in a sandboxed frame with no storage and no top-level navigation, so links open in a new tab with `target="_blank" rel="noopener"`. Keep libraries in the folder. Answer the host's `abstractsLayout` messages as `index.html` already does. Reported height is capped at 6000px. Uploads are limited to 5 MB per file and 10 MB and 100 files in total; `npm run check` enforces this.

## Troubleshooting

| What you see | Likely cause | Fix |
|---|---|---|
| A data edit doesn't show | `data.js` wasn't rebuilt | `npm run build`; `npm run check` also catches this |
| A scene edit doesn't show | `map.js` wasn't rebuilt, or nothing called `wake()` | Build, and call `wake()` after the change |
| A hand edit to `data.js` or `map.js` vanished | Those are built files | Edit `source/` instead |
| A new person is missing from their state | No entry in `offices.XX` | Add `{ g, id }` to a group |
| Their name shows but the page is empty | `id` doesn't match the `officials` key | `npm run check` names it |
| A click on a new button does nothing | It has no route in the `#app` click listener, or the listener was on replaced markup | Add a `data-*` route there |
| A new control is hidden or shows by mistake | `.icon` sets `display`, which beats `[hidden]` | Add a `.your-class[hidden] { display: none; }` rule |
| A hover or card is missing in the column | Guarded with `phone()` | Guard with `(hover: none)` |
| The map is blank in a test browser | No WebGL, so `scene` is null and the list shows alone | Pass `--enable-webgl --ignore-gpu-blocklist --enable-unsafe-swiftshader`, or use `npm run smoke` |
| Chrome won't start inside a locked-down agent sandbox | The sandbox blocks Chrome's own | `CHROME_FLAGS="--no-sandbox --single-process --in-process-gpu" npm run smoke` |
| `npm i` can't write its cache | Home isn't writable in the sandbox | `npm i --cache .npm-cache`, then delete `.npm-cache` |
| A click test lands on the opener instead of the map | The opener is open on load, and Now reopens it | Press `.iclose` first |
| The window's glass stops blurring the map | A parent has `opacity`, `filter` or a held animation, which cuts `backdrop-filter` off | Use `backwards`, not `both`, on animations around it |
| Colors look washed out or side walls have stripes | Tone mapping or lit side walls came back | Keep `NoToneMapping` and `MeshBasicMaterial` for sides |
| Shadows look stale | `shadowMap.autoUpdate` is off on purpose | Set `shadowOnce = true` after changing shapes |
| Odds say a date instead of Live | The live read failed, so the saved copy shows | Check the slug on the Gamma API, and check your network |
| A test passes but a real click fails, or the reverse | Clicking `#keys` buttons or the canvas center isn't a real click on a state | Use `scene.project` to aim a real mouse, as `smoke.mjs` does |
| `npm run check` says too many files | `node_modules` or stray files are in the upload | Remove them; `check` skips `node_modules`, the upload won't |
| esbuild fails after `npm install --ignore-scripts` | Its binary didn't install | `node node_modules/esbuild/install.js` |

## Known gaps

- **DC has no shape on the map,** so a mouse or touch can't reach its page; only the hidden keyboard list can. A visible list of states would fix this.
- `npm run find -- --gaps` lists people with no stances, lean or face. Many are hard to source, so empty is a fair result.
- County results use the newest statewide race in each state, and `county.XX.race` names it. Alaska reports votes by House district, not borough. Published borough tables are estimates, so Alaska stays without colors unless someone finds real counts.
- `faces.webp`, `counties/` and `states.json` have no source images or shape files in this repo. Faces can be added with `npm run face`; shapes would need the [us-atlas](https://github.com/topojson/us-atlas) Albers files.

## Before you share it

Run `npm run check` and `npm run smoke`, and read the running page at 618px, at 390px and full screen, in light and dark. Show the member the running page and wait for them to accept that version. Publish only what they accepted, only with their own account, and only when they asked. A changed copy goes up as a new artifact based on this one (`based_on: "vote-map"`). Moderators decide whether to merge it.
