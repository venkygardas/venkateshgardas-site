---
name: venkateshgardas.com
direction: Boxed hairline grid, flat saturated panels, paper ground. C40 layout logic
colors:
  white: "#FFFFFF"
  paper: "#F7F5F0"
  ink: "#121212"
  blue: "#0DAEE9"
  yellow: "#FFC845"
  green: "#1F7A49"
  pink: "#F2CCC0"
  dim: "#5A5A55"
structure:
  line: "2px solid ink, everywhere. The grid is the identity"
  pad_x: "1.5rem on every structural cell, no exceptions"
  measure_prose: 68ch
  measure_card: 50ch
type:
  display: Archivo 700/800, tight negative tracking
  body: Instrument Sans 400/500
  utility: Space Mono, uppercase, letterspaced, .68rem
a11y:
  contrast_min: "4.5:1 body, 3:1 large. Green is #1F7A49 for this reason, do not lighten"
  focus_ring: 3px blue outline, never removed
  reduced_motion: kills all animation and transitions
  skip_link: first focusable element on every page
motion:
  ceiling: three scroll reveals on the homepage, zero on other pages, one blinking dot
---

## Rationale

Ten plain HTML files and one stylesheet. No framework, no build step, no
bundler. If a change seems to need one, it does not.

Flat is the design: no drop shadows, no gradients, no border radius. Every
element lives in a boxed cell drawn by the 2px ink grid. Nothing floats.

Colour arrives as whole panels, never as tints. Text on blue, yellow and
pink is ink. Text on green is paper.

No em dashes or double hyphens anywhere in copy, including alt text and
meta descriptions. American spelling.

The audience is a recruiter with two minutes. The page's jobs, in order:
establish credibility, get the CV downloaded, show the shipped products.
Anything that does not serve those jobs stays out.

Email links are wrapped in Cloudflare email_off comments so the address
stays copyable. Keep that on any new mailto.

The stylesheet is versioned by query string. Bump ?v= on every CSS change
or browsers will serve the old file.

Photos ship as WebP with JPEG fallback in a picture element, width and
height always set.
