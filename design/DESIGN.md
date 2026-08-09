---
name: venkateshgardas.com
version: v2 glass, 2026-08-08. v1 (2px ink grid on paper) lives in git history
direction: Floating rounded canvas, dark teal ground, glassmorphism cards, coral accent, living hero scene. After Arounda's port-automation concept
colors:
  backdrop: "#DFE5E8"
  deep: "#173238"
  deep2: "#0F2227"
  text: "#EDF2F0"
  muted: "#9DB4AF"
  coral: "#E8482B"
  coral_soft: "#FF7D5C  # use for small accent text on dark, plain coral fails contrast there"
  gold: "#E0A81C"
  sand: "#EDE6DA"
  ink: "#1C2B30"
structure:
  canvas: "the site floats: body padding, 22px radius, shadow, nothing touches the browser edge"
  radius: "18px cards, 999px pills"
  glass: "rgba(255,255,255,.06) fill, rgba(255,255,255,.14) line, blur(16px) only over imagery"
  pad_x: 1.5rem
  measure_prose: 68ch
type:
  display: "Syne 700/800, headings only. Stand-in for the deco display face Venky liked; swap via --font-display when he names it"
  body: Inter Tight 400/500/600
  utility: Space Mono, uppercase, letterspaced
a11y:
  contrast_min: "4.5:1 body, 3:1 large. text on deep is 11:1, muted on deep 5.5:1. Small coral text on dark must use coral_soft"
  focus_ring: 3px coral outline, never removed
  reduced_motion: kills all animation including the hero scene
  skip_link: first focusable element on every page
motion:
  hero: "Ken Burns zoom, lift raising the car, tow truck crossing, pulsing hotspots, cards revealing on a loop"
  elsewhere: "hover translateY on cards. No scroll reveals"
---

## Rationale

Eleven plain HTML files and one stylesheet. No framework, no build step. That
survives every redesign.

The hero is a scene, not a block: an illustrated garage where things happen.
Content overlays it as glass. Everything below sits on the dark teal ground as
glass cards separated by gaps, not borders.

Fonts are self-hosted woff2 in /fonts. No third-party requests anywhere.

No em dashes or double hyphens in copy, alt text or meta. American spelling.

Email links stay wrapped in Cloudflare email_off comments. The stylesheet is
versioned by query string: bump ?v= on every CSS change.

Product accent mapping: PitStop coral, Saathi gold, Roko green, editorial
panels sand. The wm client chips keep their real brand colors.

Photos ship as WebP with JPEG fallback, 900px and 1600px variants, width and
height always set, rounded 14px in the gallery.
