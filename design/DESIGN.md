---
name: venkateshgardas.com
version: v3 earthy fintech, 2026-08-09. v2 glass and v1 ink grid live in git history
direction: Light greige ground, white cards with hairlines and corner registration dots, bold grotesque plus italic serif headline pairs, olive primary. After Mehmet Ozsoy's AI fintech concept
colors:
  backdrop: "#D9DAD5"
  canvas: "#F2F1EE"
  card: "#FBFAF8 and #FFFFFF"
  ink: "#15120A"
  muted: "#5B666D"
  gray: "#A6A6A5"
  olive: "#6E7B45  # primary CTA, active nav, accents"
  olive_deep: "#5C6839"
  steel: "#375A74  # links, secondary accent, focus ring"
  tan: "#A68B74"
  mauve: "#886F66"
  brown: "#553519"
type:
  headline_pair: "Inter Tight 700 first line, Instrument Serif italic second line. This pair IS the brand"
  body: Inter Tight 400/500/600
  utility: Space Mono, uppercase, .72rem floor
  faces: exactly three. Inter Tight for everything, Instrument Serif italic for pair lines, Space Mono for micro labels. Poiret and Syne are deleted. Headings are Title Case, pair lines lowercase italic
structure:
  canvas: full-bleed light page, rows self-constrain to 1240px (1040px on reading pages)
  cards: contiguous white cells sharing single 1px hairlines inside grid rows, corner registration dots at intersections, radius 2px outside grids and 0 inside. No tints anywhere; olive only on interaction
  nav: white full pill with VG avatar and name left, links center with olive active, olive Contact button right
build:
  guards: "Four, and each catches a class the others cannot see. `python3 check.py` is static. The other three need `python3 -m http.server 8190 &` and a real browser: `node scripts/collapse-check.mjs 8190` (zero-width boxes, parsed-rule floor), `node scripts/chart-check.mjs` (nav fits on one row, bars paint their declared widths, reading frame invariant), `node scripts/contrast-check.mjs 8190` (painted contrast, both themes). puppeteer-core is not committed: `npm install --no-save puppeteer-core` first."
  rule: "Run `python3 check.py` before every push. It exists because a regex that deleted @keyframes stopped at the first closing brace, leaving orphan fragments whose stray braces made the CSS parser swallow the next rule. .vhead and .btn vanished, the hero lost its centring and every button lost its shape, and nothing in the repo complained. The check proves braces balance, no keyframe body is loose at the top level, the load-bearing rules exist, every page agrees on the stylesheet version, and no page references a missing asset."
cache:
  edge_race: "An edge can cache STALE content under a NEW ?v= key if it fetches mid-deploy. After every push, assert a sentinel from the new CSS via its versioned URL; if stale, re-key and push again"
  rule: "Any same-URL asset edit MUST bump ?r= in HTML. CSS busts via ?v=, currently v20. Run scripts-verify-live.sh after every push"
a11y:
  contrast_min: "4.5:1 body. Ink on canvas 13:1. Olive on white passes large only, use olive for text at 700 weight 18px+ or on white chips"
  focus_ring: 3px steel, white on olive surfaces
  reduced_motion: kills all animation including pseudo-elements
motion:
  hero: Ken Burns scene, lift, truck, olive pulse rings
  elsewhere: hover lifts only
---

## Rationale

Third design system, chosen from Mehmet Ozsoy's fintech concept. What
carries over from v1 and v2: the layout logic, the reading frame on
detail pages, the accessibility floor, the cache discipline, and the
verify-at-zoom habit. What is new: light ground, earthy accent set,
corner-dotted cards, and the roman-plus-italic-serif headline voice.

The garage scene is Ozsoy-style line art: ink outlines, white fills,
olive accents, text never overlaps the illustration. Phase 2: replace the VG monogram in
the nav with a real headshot when Venky provides one.

## Pinned decisions

These are chosen, not accidental. Do not "fix" them, and do not let a
detector or a future audit talk you out of them.

- **Mono kicker labels above headings.** Part of the Ozsoy editorial
  language. Impeccable's craft floor calls this a hard ban; its own
  operating guidance says a pinned brief wins. The brief wins.
  Confirmed by Venky, 2026-08-09.
- **Numbered section ordinals (01, 02, ...).** Same reason, same date.
- **Italic serif subline paired with a bold grotesque heading.** The
  signature of the whole system.
- **Eyebrow + ordinal + pair line are waived in `.impeccable/config.json`**
  so detector runs stay honest about everything else.
- **Reading pages hold a measure, not a screen width.** `.frame.reading`
  is 780px, not 1040px. At 1040 the prose ran 157 characters a line.
  When the measure is wrong, bring the FRAME in so the cards come with
  it. Never cap the paragraph inside a wide card: that is the one thing
  Venky has rejected three times, and it is what makes a block look
  stranded. The test is `prose left == card left` and
  `prose right == card right`, both exactly zero.
- **Justification is gated on measure, by container query, not by a
  component list.** `.frame p` is left-aligned; `@container (min-width:26rem)`
  turns on justify. Below roughly 65 characters justification stops
  tidying the right edge and opens rivers between words, which is what
  the 3-up flow cards did the moment the frame narrowed. The threshold
  sits in a real gap in the data: measured across the site, justified
  paragraphs land either under 343px or over 485px and nothing is in
  between, so no paragraph is a borderline case. Any new component that
  holds paragraphs needs `container-type:inline-size` on the column, or
  it will inherit the wrong container's width and justify when it should
  not. Opt-out lists fail silently here; the container query cannot.
- **Only put `container-type` on an element whose width comes from
  OUTSIDE it.** Inline-size containment stops an element contributing its
  own content to its own width, so anything sized BY its content
  collapses to zero and prints on top of its neighbour. This shipped:
  `.lbl` sits in the `auto` track of `.now` and `.strip`, and seven
  labels across three pages went to 0px, putting "NEW" over the first
  word of the paragraph beside it; the customer-approval mock became a
  2px empty sliver because `margin:0 auto` had made it fit-content, while
  still setting the row height so the two panels next to it carried 110px
  of dead space. Nothing caught it, because a collapsed element causes no
  overflow, no horizontal scroll and nothing offscreen: every check
  running at the time passed. Run `node scripts/collapse-check.mjs`
  before adding anything to that rule.
- **Two easing curves, and they are tokens.** `--ease-out` for anything
  entering or leaving, `--ease-in-out` for anything moving on screen.
  Never `ease-in` on UI: it starts slow, at exactly the moment being
  watched. The site had grown three hand-rolled beziers all trying to
  be the same curve; do not add a fourth. Values come from Emil
  Kowalski's animation standards, not from taste.
- **The thread carries a marker, and it stays with the reader.** The
  line is drawn to a point at 55% of the viewport, the marker sits on
  that point, milestones behind it fill and the ones ahead stay open.
  It is derived from the path's own geometry, NOT from a scrollbar
  fraction: length along a curve and height down a page are different
  measures, and deriving one from the other left the marker drifting
  below the fold on long pages.
- **Reduced motion means gentler, not dead.** Transforms go, a short
  fade stays. The blanket `transition:none!important` that used to be
  here also killed hover and focus feedback, which is a usability loss
  for exactly the people who asked for the setting.
- **The rupee sign is the one glyph allowed to fall back.** No shipped
  face carries U+20B9, and it appears only inside the PitStop product
  mocks, where rupee amounts are the point. Every other exotic glyph
  was removed or drawn in CSS: the arrows in link labels, the back
  chevron, the hero star, and the Greek alpha in the camera name, so
  the rest of the site renders in exactly three typefaces. Verified
  with CSS.getPlatformFontsForNode.

- **Charts are HTML and CSS, not SVG.** A bar chart is a list of labelled
  numbers, so it is a list: it reflows at any width, it reads correctly to a
  screen reader without the parallel text description `.cgraph` needs, and it
  themes from the same tokens as everything else. The fill width is `--v`, a
  percentage of the largest value in the set, worked out when the page is
  written. Nothing measures anything at runtime, so there is no layout read to
  go wrong and no second source of truth to drift from the numbers in the
  caption. `scripts/chart-check.mjs` asserts the painted width matches the
  declared one.
- **A bar track cannot use `--deep2` on a card.** In dark they are the same
  value, so the unfilled part of the track vanishes and the bars read as
  floating segments with no scale behind them. Tracks mix from the ink
  instead: `color-mix(in srgb, var(--ink) 14%, transparent)` is visible on
  white and on the dark card without adding a token.
- **Adding one nav item moves two breakpoints, and only measurement finds
  them.** The AI link made nine. The pill then overflowed from 960px down to
  890px, and there was a separate four pixel window at 352px where four links
  no longer fit but Photos had not yet been dropped. Both were invisible in the
  source and neither produced horizontal scroll. The `.m-hide-sm` step went
  from 800 to 980 and the Photos step from 350 to 380, each set above the last
  width that measured clean rather than at it. Sweep with `chart-check` before
  touching the nav.
- **A contrast probe must composite alpha.** A `color-mix(... 8%, transparent)`
  background computes to the full strength ink with an alpha. Drop the alpha
  and the probe concludes near-black text on a near-black fill and fails
  something that is fine: the inline version of this check reported `code` at
  1.12:1 when it is comfortably over the floor. `scripts/contrast-check.mjs`
  walks the ancestor chain compositing src-over until it reaches an opaque
  layer.
