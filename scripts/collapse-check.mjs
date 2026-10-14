/* Finds elements that have collapsed to a zero-width box while still holding
   text, i.e. text that is now printing on top of whatever sits beside it.

   Exists because `container-type: inline-size` stops an element contributing
   its own content to its own width. Put it on an element that is sized BY its
   content and the element becomes 0px wide, its text spills out, and nothing in
   the repo complains: the page still has no horizontal scroll, no element is
   offscreen, and every automated check that was running at the time passed.
   Seven labels across three pages shipped like that, printing "NEW" over the
   first word of the paragraph next to it, plus the whole customer-approval mock
   as a 2px empty sliver.

   Run it before adding ANY element to the container-type rule in styles.css.

       python3 -m http.server 8190 &
       node scripts/collapse-check.mjs 8190
*/
import p from 'puppeteer-core';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PAGES = ['404', 'ai', 'colophon', 'cv', 'expenzing', 'kpmg', 'now', 'pitstop', 'roko',
  'saathi', 'index', 'photos', 'notes/index', 'notes/pitstop-realtime',
  'notes/three-design-systems'];
const WIDTHS = [1440, 1180, 1024, 881, 375];
const port = process.argv[2] || 8190;

/* A floor, not a target. Deleting rules with a line regex once dropped the
   sheet from 456 parsed rules to 359 while braces still balanced and every
   other check passed: the only thing that noticed was counting what the browser
   actually parsed. Raise this when the sheet genuinely grows. */
const MIN_RULES = 400;

const browser = await p.launch({ executablePath: CHROME, headless: 'new' });
const page = await browser.newPage();
const bad = [];

for (const width of WIDTHS) {
  await page.setViewport({ width, height: 900 });
  for (const f of PAGES) {
    await page.goto(`http://localhost:${port}/${f}.html`, { waitUntil: 'networkidle2' });
    const parsed = await page.evaluate(() => {
      const sheet = [...document.styleSheets].find(s => (s.href || '').includes('styles.css'));
      try { return sheet.cssRules.length; } catch (e) { return -1; }
    });
    if (parsed < MIN_RULES) {
      bad.push(`${width} ${f}: only ${parsed} CSS rules parse, expected at least ${MIN_RULES}`);
    }

    const found = await page.evaluate(() => {
      const out = [];
      document.querySelectorAll('.frame *').forEach(el => {
        const box = el.getBoundingClientRect();
        if (box.width > 3) return;
        if (!(el.textContent || '').trim()) return;
        if (el.scrollWidth <= 4) return;
        // hidden on purpose: the sr-only pattern clips to a 1px box, and so does
        // any visually-hidden accessible twin (e.g. .cg-mobile above 880px)
        if (el.closest('.sr-only')) return;
        const cs = getComputedStyle(el);
        const clipped = el.closest ? (() => {
          let n = el;
          while (n && n !== document.body) {
            const s2 = getComputedStyle(n);
            if (s2.clip === 'rect(0px, 0px, 0px, 0px)' || s2.clipPath === 'inset(50%)') return true;
            n = n.parentElement;
          }
          return false;
        })() : false;
        if (clipped) return;
        if (cs.display === 'none') return;
        out.push({
          cls: (el.className || el.tagName).toString().slice(0, 34),
          w: Math.round(box.width),
          sw: el.scrollWidth,
          txt: el.textContent.trim().slice(0, 24),
        });
      });
      return out;
    });
    found.forEach(x =>
      bad.push(`${width} ${f}: <${x.cls}> box ${x.w}px around ${x.sw}px of text  "${x.txt}"`));
  }
}

await browser.close();

if (bad.length) {
  console.log(`COLLAPSED (${bad.length}):`);
  bad.forEach(b => console.log('  -', b));
  process.exit(1);
}
console.log('OK: no element has a zero-width box around real content, '
  + `${PAGES.length} pages x ${WIDTHS.length} widths`);
