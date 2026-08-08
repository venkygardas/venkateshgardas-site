# BUILD_BRIEF.md

Handoff spec for `venkateshgardas.com`. Written so a fresh Claude Code session can pick this up with no prior context.

---

## 1. What this is

A one-page personal site for **Venkatesh Gardas**, a product manager. Live at `venkateshgardas.com`, deployed on Cloudflare Pages.

`index.html` in the repo root is the current working version. It is a single self-contained file: no build step, no framework, no dependencies except Google Fonts. **Keep it that way unless there is a concrete reason not to.** See section 8.

---

## 2. Who reads it and what they should do

**Primary audience:** recruiters and hiring managers for product roles in India, the Gulf (Dubai, Riyadh) and the US. They arrive from a LinkedIn profile or an email signature, and they spend under two minutes.

**The page has two jobs, in this order:**

1. Establish that Venkatesh is a credible PM, and get the CV downloaded
2. Show that he has independently shipped four things, which is the actual differentiator

**Secondary audience:** anyone curious about the ventures, particularly PitStop and Saathi.

**Design decisions get judged against those jobs.** If an addition does not help a recruiter decide to email him or download the CV, it does not go in.

---

## 3. Design direction

The reference is the **C40 Cities** site, specifically its layout logic rather than its brand.

What we took:

- **Every element lives in a boxed cell.** One continuous 1px hairline grid in near-black. Nothing floats, nothing is a card with a drop shadow.
- **Flat saturated colour panels carry the page.** No photography, no gradients, no shadows, no border radius anywhere.
- **A utility strip is part of the grid**, not chrome bolted on top. Ours is the CV/email/LinkedIn row.
- **Neutral grotesque type, sentence case.** The layout does the work.

What we deliberately did not take: their sky blue (too close to their brand and generic on its own), and their commissioned illustration (copyrighted, credited to Laure Rees-Smith). 2026-08-08: the cool panel colour moved from green #2E6B58 to a saturated process blue #0E639C at Venkatesh's request, closer to the reference's energy but still clearly not C40's sky blue.

**The signature element** is the spec plate in the right half of the hero: mono label/value rows in a bordered cell giving status, role, domains, markets and current projects. It is honest content presented as instrumentation, not decoration. Do not remove it or turn it into a graphic.

---

## 4. Design tokens

Defined as CSS custom properties on `:root`. **Derive every colour and size from these. Do not introduce ad-hoc hex values.**

```css
--paper : #EFEDE4   /* page background, warm off-white */
--white : #FBFAF6   /* cell background, slightly brighter */
--ink   : #15140F   /* text and all hairline rules */
--blue  : #0E639C   /* saturated cool panel: hero, 5-12 Mart */
--ochre : #E3A83C   /* saturated warm panel: PitStop, contact */
--sand  : #DCD3C2   /* quiet neutral panel: plate header, strip */
--dim   : #5E5A4E   /* secondary text */
```

Text on `--blue` is `--paper`. Text on `--ochre` and `--sand` is `--ink`.

**Typography, three roles:**

| Role | Family | Usage |
|---|---|---|
| Display | Archivo 700/800 | Name, section headings, venture and job titles. Tight negative tracking, roughly `-0.02em` to `-0.04em`, tighter as size increases. |
| Body | Instrument Sans 400/500 | All running prose. |
| Utility | Space Mono 400/700 | Labels, tags, buttons, eyebrows, footer. Always uppercase, `letter-spacing: .14em` to `.16em`, around `.68rem`. |

The `.mono` class carries the utility treatment. Reuse it rather than restyling per component.

---

## 5. Grid mechanics

The hairline grid is built with a deliberately simple rule. **Understand this before editing layout, it is easy to break.**

- `.frame` has `border: 1px solid var(--ink)` and is the outer container
- `.row` has `border-bottom`, except `:last-child`
- `.cell` has `border-right`, except `:last-child`

This yields a clean single-pixel grid with no doubled lines. If you add a section, it must be a `.row` containing `.cell` children, or the grid will break.

Column counts come from utility classes on the row: `.grid2`, `.grid3`, `.hero`, `.strip`, `.shead`, `.foot`.

**At 820px and below** everything collapses to one column. Cells swap `border-right` for `border-bottom`, and the frame goes full-bleed with no side borders. That breakpoint logic lives in one media query. Keep it there.

---

## 6. Page structure

Sections in order. Numbered eyebrows on section headers reflect real sequence, so if you reorder sections, renumber them.

1. **Masthead** — `VG` mark cell + nav (Building / Work / Contact)
2. **Hero** — blue panel with name and one-line positioning, plus the spec plate
3. **Action strip** — sand background, Download CV / Email me / LinkedIn
4. **01 Things I am building** — 2x2 venture grid: PitStop (ochre), Saathi (white, links to heysaathi.vercel.app), Roko (white), 5-12 Mart (blue)
5. **02 Work** — two job cells: KPMG (present), Expenzing (earlier)
6. **03 How I work** — three notes: Start at the counter, Ship the boring part first, Adoption is the metric
7. **Contact** — full-width ochre panel, large email link
8. **Footer** — name and LinkedIn

---

## 7. Open TODOs

**Blocking, must be done before or immediately after first deploy:**

- [ ] Replace `YOUR-HANDLE` with the real LinkedIn handle. **Two occurrences**: action strip and footer.
- [ ] Add `venkatesh-gardas-cv.pdf` to the repo root. The Download CV button points at `/venkatesh-gardas-cv.pdf` and currently 404s.

**Content, needs Venkatesh's own words:**

- [ ] Rewrite the KPMG paragraph. Current copy is inferred, not verified. Recruiters read this block most closely.
- [ ] Rewrite the Expenzing paragraph. Same reason.
- [ ] Confirm the Saathi status tag. Currently reads "Live beta". Verify that is accurate.
- [ ] Confirm the PitStop status tag reads "Building" accurately at time of deploy.

**Nice to have, in rough priority order:**

- [ ] `favicon.ico` and `apple-touch-icon.png`. Suggest a solid `--blue` square with the `VG` mark in Archivo 800.
- [ ] Open Graph image at 1200x630. Should use the same grid language: blue panel, name in Archivo, hairline border.
- [ ] `robots.txt` and `sitemap.xml`
- [ ] JSON-LD `Person` schema in `<head>` for search and AI crawlers. Cloudflare's AI crawler settings for this zone are set to allow, deliberately, so the structured data is worth having.

---

## 8. Constraints

**Do not:**

- Add a framework, bundler or package manager. This is one HTML file and it should stay that way until there is a second page.
- Use `localStorage` or `sessionStorage`.
- Add drop shadows, gradients or border radius. The flatness is the design.
- Add scroll-jacking, a loading sequence, cursor effects or parallax. The audience is recruiters who want information quickly, not designers judging craft. The one animation on the page is a fade-up on scroll plus the pulsing status dot, and that is the ceiling.
- Introduce colours outside the token set.
- Reproduce anything from the reference sites. Layout logic is fair game, specific assets and brand colours are not.

**Do maintain:**

- Responsive down to 360px
- Visible keyboard focus on every interactive element (currently a 3px `--blue` outline)
- `prefers-reduced-motion` respected, which currently kills all animation and transitions
- Semantic HTML. Real `<header>`, `<section>`, `<footer>`, `<dl>` for the spec plate.
- Total page weight under 100KB excluding fonts

---

## 9. Deployment

Currently **Cloudflare Pages**, direct upload. Moving to git-connected deploys is the reason this is becoming a repo.

Target setup:

1. Repo pushed to GitHub, e.g. `venkateshgardas-site`
2. Cloudflare Pages project connected to that repo
3. Build command: none. Build output directory: `/` (repo root)
4. Production branch: `main`, so pushes to `main` deploy automatically
5. Custom domains `venkateshgardas.com` and `www.venkateshgardas.com` already attached to the project

DNS is on Cloudflare for this zone. **Do not touch the MX, SPF, DKIM, DMARC or `zoho-verification` TXT records.** Email runs through Zoho Mail and those records are verified and scoring 10/10 on mail-tester. Breaking them breaks the address on the CV.

---

## 10. Context on Venkatesh

Useful for writing or editing copy in his voice.

Product manager, currently at KPMG on an AI risk analytics platform. Previously Expenzing, on procure-to-pay and loan origination workflows. Based in Fairfax, Virginia. Looking at product roles across India, the Gulf and the US.

Runs several things in parallel: PitStop (garage management SaaS for Indian workshops, multi-tenant Postgres, GST invoicing, job card lifecycle), Saathi (voice-first AI companion for elderly Indian users, heavy accessibility focus), Roko (Tuya-based home security hardware sourced from Chinese suppliers), and 5-12 Mart (a convenience store in Fredericksburg, Virginia).

**Voice for copy:** plain, direct, slightly dry. Concrete over abstract. No startup jargon, no "passionate about", no "leveraging". Short sentences are fine. Occasional specificity that only someone who did the work would write, for instance "a service advisor with oily hands and a queue at the counter".

**Formatting rule he cares about: no em dashes or double dashes anywhere.** Use periods, commas or line breaks instead. This applies to site copy and to anything written for him.
