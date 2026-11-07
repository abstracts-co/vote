---
name: edit-vote-map
description: Change the a/vote politics map on Abstracts (its data, its 3D map or its windows) while keeping its sourcing, neutrality and UI standards. Use when a member wants to update who's in office or running, add a person, state or issue, fix a fact, or build on the map.
---

# Edit the vote map

The map is a neutral place to see the state of American politics: who is in office, who is taking office, who is running, what they stand for and how far left or right they lean. It never tells anyone who to support.

## The files

The artifact lives in `artifacts/vote-map/`.

| File | What it is | Edit it? |
|---|---|---|
| `index.html` | Windows, cards, tabs and styles | Yes |
| `source/scene.js` | The three.js map | Yes, then build |
| `source/data.json` | Every fact on the map | Yes, then build |
| `source/states.json` | State shapes | Rarely |
| `data.js`, `map.js`, `content.md` | Built from `source/` | Never by hand |
| `counties/*.js`, `faces.webp` | County shapes, photo sheet | Rarely |
| `preview.webp` | Card image | When the look changes |

## Workflow

1. Read the community first with `get_community`, and follow the [Abstracts kit](https://abstracts.co/kit/abstracts/SKILL.md).
2. Make the change.
3. In `source/`, run `npm install`, `npm run build` and `npm run check`. The check must pass.
4. In the artifact folder, run `npx --yes http-server -p 8000 --cors` and open `http://localhost:8000/source/preview.html`, which runs the page in the same sandbox as Abstracts. Check it at 580px and 390px wide and full screen. Hover and click a state, a county and a person, drag the map and reset it, in light and dark.
5. Show the member the running page and wait for them to accept that version. Publish only what they accepted, only with their own account, and only when they asked. A changed copy goes up as a new artifact based on this one (`based_on: "vote-map"`). Moderators decide whether to merge it.

## Facts

- Every claim gets its own `source`: a page you read and that supports the claim. Search snippets don't count. Use `https` links only.
- Prefer government records and the person's own site, then major and strong local news. Don't cite Wikipedia, fandom wikis, content farms or partisan aggregators.
- Never fill a gap from memory. Leave a field empty rather than guess. "Not found" is an honest answer.
- Use the newest data available, and say which race or year it comes from. Election results stay marked unofficial until certified.
- Write finished public sentences. No notes about the research, such as "not confirmed".
- Prediction markets aren't sources. Polymarket odds stay in their own labelled blocks with a link and a time, are read live with a saved copy as fallback, use only markets with real bids and asks, and never back up a claim.

## Neutrality

- Treat every person and party the same way, with the same fields and the same rigor. Sort people by last name.
- Never recommend anyone, rank people as better or worse, or write a takeaway that takes a side. A takeaway states what the numbers show.
- Describe what people did. Use their own framing for their goals, and keep any quote under 15 words and exact.
- Criticism names who makes it, comes from a major outlet or official record, and covers documented disputes over conduct or record. Include the person's response when there is one. Never state an unproven allegation as fact.
- Running status has four values, based only on what the person said: `filed`, `considering`, `ruled_out`, `unstated`. Filing alone proves little, since hundreds of people file.

## Lean

- `score` is measured: DW-NOMINATE from [Voteview](https://voteview.com), for members of Congress. Recompute it from Voteview's files. Never type a score by hand.
- `est` is only for people with no voting record to measure: governors, candidates and new members. Rate the same five issues for everyone, from -1 to +1 with one scale in both directions: taxes and spending, health, immigration, abortion and guns. Each score needs a source and one line of evidence, and bipartisan service bills (veterans, farm aid, disaster aid) don't set a score.
- `lean` is the plain average of the scored issues, in steps of 0.25. With fewer than three issues, leave it empty and show no bar. Never apply a curve or correction to one side, and never use party, tone or conduct. Show estimates in words ("Leans left", "Leans right", "Near center"), labelled as estimates, and never beside a measured score.
- Lean bars run left for negative and right for positive, and stay visible on every person row and page.

## Faces

A wrong face is the worst mistake on the map. Confirm identity from a page that names the person. Prefer public-domain Congress portraits, then openly licensed images, and record the credit. If you can't confirm it, leave initials.

## UI standards

- **The map is the page.** Everything else opens from it: hover shows a card, a click opens a window and zooms into counties, holding the mouse pans, and a reset button appears once the camera has moved. It sits in place on the About page under the community header, like any artifact, and goes full screen only when someone presses Full screen. Never make it open itself, and don't add a page of text.
- **Quick glance first.** Each section is a one-line takeaway, then a visual, with detail folded under `details`. No dense paragraphs in the first view. Only the one sentence per tab explains a view; add no other taglines, hint lines or secondary labels.
- **Three groups in every state:** In office, Taking office, Running. Show all three, with "None found yet" when one is empty. Don't place presidential candidates on the map by home state.
- **Every person** has a face, a lean bar and a page, and every name opens that page.
- **Sources are one click away,** a small ↗ beside each claim.
- **Color:** use the CSS variables in `index.html`, never raw colors in markup. Blue is Democratic, red is Republican, amber is independent; darker means a wider margin. Use one hue for single-series bars and keep labels in text colors. Charts need a legend when they have two or more series.
- **Accessibility:** text contrast of at least 4.5:1, focus states, tap targets of at least 44px on phones, and labels on icon-only buttons. Don't rely on hover alone: everything must work by tap and keyboard.
- **Motion:** animate `transform` and `opacity` for UI, 300ms or less, and respect `prefers-reduced-motion`. Keep hover smooth: update a card only when its subject changes, and redraw shadows only when heights change.
- **Phones first.** Below 760px the window sits under the map. Check 360px wide.

## Sandbox limits

The page runs in a sandboxed frame with no storage and no top-level navigation, so links open in a new tab with `target="_blank" rel="noopener"`. Keep libraries in the folder. Answer the host's `abstractsLayout` messages as `index.html` already does. Uploads are limited to 5 MB per file and 10 MB and 100 files in total; `npm run check` enforces this.
