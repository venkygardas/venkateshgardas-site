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
- **The rupee sign is the one glyph allowed to fall back.** No shipped
  face carries U+20B9, and it appears only inside the PitStop product
  mocks, where rupee amounts are the point. Every other exotic glyph
  was removed or drawn in CSS: the arrows in link labels, the back
  chevron, the hero star, and the Greek alpha in the camera name, so
  the rest of the site renders in exactly three typefaces. Verified
  with CSS.getPlatformFontsForNode.
