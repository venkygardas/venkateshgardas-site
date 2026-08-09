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
  benched: Poiret One and Syne files remain in /fonts, unused
structure:
  canvas: floating light canvas, 22px radius, soft shadow
  cards: white, 1px hairline #DBD9D2, corner registration dots (the Ozsoy signature)
  nav: white full pill with VG avatar and name left, links center with olive active, olive Contact button right
cache:
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

The garage scene survives in the earthy palette. Phase 2 candidates:
redraw the scene as Ozsoy-style line art, replace the VG monogram in
the nav with a real headshot when Venky provides one.
